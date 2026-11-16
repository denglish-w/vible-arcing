"""Emit the whole SBL Greek New Testament from MACULA Greek (SBLGNT lowfat) in corpus format v1.

Run with the standard library only, in isolated mode, after downloading the
27 book files with scripts/ingest/fetch.sh:

    python3 -I scripts/ingest/ingest.py \
        --source <dir holding the 27 lowfat book files> \
        --commit <MACULA commit SHA> --out corpus/v1

It writes <out>/<BOOK>/<chapter>.json for all 260 chapters and
<out>/attribution.json. Fields are copied from an explicit whitelist, so
Louw-Nida and UBS semantic-domain attributes (`ln`, `domain`), syntax trees,
clause and role data, and anything else MACULA adds never reach the output.
Every book is read and checked before anything is written, and the new output
replaces <out> in one swap, so a failure leaves <out> as it was.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

FORMAT = 1
EDITION = "SBLGNT"
DATASET = "macula-greek"
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"

# The SBLGNT lowfat book files in canonical order, with the book code each must
# hold and its chapter count (the same as src/lib/books.ts): 27 books, 260 chapters.
BOOKS = (
    ("01-matthew.xml", "MAT", 28), ("02-mark.xml", "MRK", 16), ("03-luke.xml", "LUK", 24),
    ("04-john.xml", "JHN", 21), ("05-acts.xml", "ACT", 28), ("06-romans.xml", "ROM", 16),
    ("07-1corinthians.xml", "1CO", 16), ("08-2corinthians.xml", "2CO", 13),
    ("09-galatians.xml", "GAL", 6), ("10-ephesians.xml", "EPH", 6),
    ("11-philippians.xml", "PHP", 4), ("12-colossians.xml", "COL", 4),
    ("13-1thessalonians.xml", "1TH", 5), ("14-2thessalonians.xml", "2TH", 3),
    ("15-1timothy.xml", "1TI", 6), ("16-2timothy.xml", "2TI", 4), ("17-titus.xml", "TIT", 3),
    ("18-philemon.xml", "PHM", 1), ("19-hebrews.xml", "HEB", 13), ("20-james.xml", "JAS", 5),
    ("21-1peter.xml", "1PE", 5), ("22-2peter.xml", "2PE", 3), ("23-1john.xml", "1JN", 5),
    ("24-2john.xml", "2JN", 1), ("25-3john.xml", "3JN", 1), ("26-jude.xml", "JUD", 1),
    ("27-revelation.xml", "REV", 22),
)

# Morphology attributes kept under "m", in this order, only when present.
MORPHOLOGY = ("person", "number", "gender", "case", "tense", "voice", "mood", "degree")

# Shape checks only (used with fullmatch); src/lib/books.ts holds the 27 codes.
BOOK_CODE = re.compile(r"[1-3]?[A-Z]{2,3}")
REF = re.compile(r"(?P<book>[1-3]?[A-Z]{2,3}) (?P<chapter>\d+):(?P<verse>\d+)!(?P<word>\d+)")
COMMIT = re.compile(r"[0-9a-f]{40}")
# Characters that would be markup if a page ever rendered corpus text as HTML.
MARKUP = re.compile(r"[<>&]")

ATTRIBUTION = [
    {
        "name": "SBL Greek New Testament",
        "creator": "Society of Biblical Literature and Logos Bible Software",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "statement": "Copyright 2010 by the Society of Biblical Literature and Logos Bible Software.",
        "modified": True,
        "modifications": (
            "The text is taken from the MACULA Greek syntax trees and stored as one file "
            "per chapter, with each word kept separately alongside the punctuation and "
            "space that follow it (elision marks are stored with that punctuation). "
            "The wording is not changed."
        ),
        "url": "https://sblgnt.com/",
    },
    {
        "name": "MACULA Greek Linguistic Datasets",
        "creator": "Clear Bible",
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "statement": "MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/",
        "modified": True,
        "modifications": (
            "Converted from the SBLGNT lowfat XML to JSON. Only each word's text, "
            "following punctuation, verse, lemma, gloss, part of speech and morphology "
            "are kept; Louw-Nida and UBS semantic-domain data and the syntax trees are removed."
        ),
        "url": "https://github.com/Clear-Bible/macula-greek/",
    },
    {
        "name": "Berean Interlinear Bible",
        "creator": "Berean Bible",
        "license": "Public domain",
        "licenseUrl": "https://berean.bible/licensing.htm",
        "statement": (
            "English word glosses from the Berean Interlinear Bible, supplied through "
            "MACULA Greek. The Berean Bible texts were placed in the public domain on "
            "April 30, 2023."
        ),
        "modified": True,
        "modifications": "Only the English gloss of each word is kept, stored with the word it glosses.",
        "url": "https://interlinearbible.com/",
    },
]


class IngestError(Exception):
    pass


def parse_book(xml_path: Path) -> ET.Element:
    data = xml_path.read_bytes()
    # The lowfat files are UTF-8 without a BOM and declare no DTD. Requiring that,
    # and checking the decoded text, means no other encoding can hide a DTD.
    # (expat also limits entity expansion and ElementTree never fetches external
    # entities; this check keeps DTDs out entirely.)
    if data.startswith((b"\xef\xbb\xbf", b"\xfe\xff", b"\xff\xfe")) or b"\x00" in data:
        raise IngestError(f"{xml_path} is not plain UTF-8; refusing to parse it")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise IngestError(f"{xml_path} is not valid UTF-8: {error}") from None
    if "<!DOCTYPE" in text.upper() or "<!ENTITY" in text.upper():
        raise IngestError(f"{xml_path} declares a DTD or entities; refusing to parse it")
    return ET.fromstring(data)


def following(w: ET.Element) -> str:
    """Everything between this word and the next, so the words join back into the text.

    MACULA's `after` holds the punctuation alone (",", "·", "’"); SBLGNT puts a
    space after it, so one is added. A plain space stays as it is.
    """
    after = w.get("after", "")
    return after if after == "" or after[-1].isspace() else after + " "


def word_record(w: ET.Element, ref: re.Match[str]) -> dict:
    word_id = w.get(XML_ID)
    if not word_id:
        raise IngestError(f"word {w.get('ref')} has no xml:id")
    text = w.text or ""
    if not text:
        raise IngestError(f"word {word_id} has no text")
    record: dict = {
        "id": word_id,
        "v": int(ref["verse"]),
        "text": text,
        "after": following(w),
        "lemma": w.get("lemma") or "",
    }
    gloss = w.get("gloss")
    if gloss:
        record["gloss"] = gloss
    record["pos"] = w.get("class") or ""
    morphology = {k: w.get(k) for k in MORPHOLOGY if w.get(k)}
    if morphology:
        record["m"] = morphology
    if not record["lemma"] or not record["pos"]:
        raise IngestError(f"word {word_id} is missing a lemma or part of speech")
    for field in ("text", "after", "lemma", "gloss"):
        if field in record and MARKUP.search(record[field]):
            raise IngestError(f"word {word_id} has markup characters in {field}")
    return record


def chapter_words(root: ET.Element, book: str, chapter: int) -> list[dict]:
    found = []
    for w in root.iter("w"):
        ref = REF.fullmatch(w.get("ref", ""))
        if not ref:
            raise IngestError(f"unrecognised word reference {w.get('ref')!r}")
        if ref["book"] != book or int(ref["chapter"]) != chapter:
            continue
        key = (int(ref["verse"]), int(ref["word"]))
        found.append((key, word_record(w, ref)))
    if not found:
        raise IngestError(f"no words found for {book} {chapter}")

    # The XML is in syntax-tree order; reading order comes from the reference.
    found.sort(key=lambda item: item[0])
    keys = [k for k, _ in found]
    if len(set(keys)) != len(keys):
        raise IngestError(f"duplicate word references in {book} {chapter}")
    ids = [r["id"] for _, r in found]
    if len(set(ids)) != len(ids):
        raise IngestError(f"duplicate word ids in {book} {chapter}")
    return [record for _, record in found]


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_book(xml_path: Path) -> tuple[str, dict[int, list[dict]]]:
    """One book file's chapters, each as its words in reading order."""
    try:
        root = parse_book(xml_path)
    except ET.ParseError as error:
        raise IngestError(f"{xml_path} is not well-formed XML: {error}") from None
    book = root.get("id", "")
    if root.tag != "book" or not BOOK_CODE.fullmatch(book):
        raise IngestError(f"{xml_path} is not a MACULA lowfat book file")
    numbers = set()
    for w in root.iter("w"):
        ref = REF.fullmatch(w.get("ref", ""))
        if not ref:
            raise IngestError(f"{xml_path}: unrecognised word reference {w.get('ref')!r}")
        if ref["book"] != book:
            raise IngestError(f"{xml_path}: word {w.get('ref')} is not in {book}")
        numbers.add(int(ref["chapter"]))
    if sorted(numbers) != list(range(1, len(numbers) + 1)):
        raise IngestError(f"{xml_path}: chapters are not contiguous from 1 ({sorted(numbers)})")
    try:
        return book, {n: chapter_words(root, book, n) for n in sorted(numbers)}
    except IngestError as error:
        raise IngestError(f"{xml_path}: {error}") from None


def read_all(source: Path, commit: str) -> list[dict]:
    """Every chapter of the New Testament, checked, before anything is written."""
    chapters: list[dict] = []
    ids: set[str] = set()
    for name, code, expected in BOOKS:
        path = source / name
        if not path.is_file():
            raise IngestError(f"{path} is missing")
        book, by_number = read_book(path)
        if book != code:
            raise IngestError(f"{path} holds {book}, expected {code}")
        if len(by_number) != expected:
            raise IngestError(f"{path} has {len(by_number)} chapters, expected {expected}")
        for number, words in by_number.items():
            for word in words:
                if word["id"] in ids:
                    raise IngestError(f"{path}: word id {word['id']} appears twice")
                ids.add(word["id"])
            chapters.append({
                "format": FORMAT,
                "edition": EDITION,
                "source": {"dataset": DATASET, "commit": commit},
                "book": book,
                "chapter": number,
                "words": words,
            })
    return chapters


def recover(out: Path) -> None:
    """Put back output that an interrupted swap left only in <out>.old.

    Runs before anything else, so a run that then fails on bad input still
    leaves <out> in place rather than missing.
    """
    previous = out.with_name(out.name + ".old")
    if previous.exists() and not out.exists():
        previous.rename(out)


def write_all(out: Path, chapters: list[dict]) -> None:
    """Write into <out>.new, then swap it in place of <out>."""
    staging = out.with_name(out.name + ".new")
    previous = out.with_name(out.name + ".old")
    for leftover in (staging, previous):
        if leftover.exists():
            shutil.rmtree(leftover)
    try:
        for chapter in chapters:
            write_json(staging / chapter["book"] / f"{chapter['chapter']}.json", chapter)
        write_json(staging / "attribution.json", {"format": FORMAT, "datasets": ATTRIBUTION})
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    if out.exists():
        out.rename(previous)
    try:
        staging.rename(out)
    except BaseException:
        if previous.exists() and not out.exists():
            previous.rename(out)
        shutil.rmtree(staging, ignore_errors=True)
        raise
    shutil.rmtree(previous, ignore_errors=True)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, required=True,
                        help="directory holding the 27 SBLGNT lowfat book files")
    parser.add_argument("--commit", required=True, help="MACULA Greek commit SHA the files came from")
    parser.add_argument("--out", type=Path, required=True, help="output root, e.g. corpus/v1")
    args = parser.parse_args(argv)

    if not COMMIT.fullmatch(args.commit):
        parser.error("--commit must be a full 40-character lower-case SHA")

    try:
        recover(args.out)
        chapters = read_all(args.source, args.commit)
        write_all(args.out, chapters)
    except (IngestError, ET.ParseError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    words = sum(len(c["words"]) for c in chapters)
    books = len({c["book"] for c in chapters})
    print(f"wrote {books} books, {len(chapters)} chapters, {words} words")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
