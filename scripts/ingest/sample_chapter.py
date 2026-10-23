"""Emit one chapter of MACULA Greek (SBLGNT lowfat) in corpus format v1.

Run with the standard library only, in isolated mode:

    python3 -I scripts/ingest/sample_chapter.py \
        --xml <path to 11-philippians.xml> --commit <MACULA commit SHA> \
        --chapter 1 --out corpus/v1

It writes <out>/<BOOK>/<chapter>.json and <out>/attribution.json. Fields are
copied from an explicit whitelist, so Louw-Nida and UBS semantic-domain
attributes (`ln`, `domain`) and anything else MACULA adds never reach the
output. The full ingest extends this script rather than replacing it.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

FORMAT = 1
EDITION = "SBLGNT"
DATASET = "macula-greek"
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"

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


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--xml", type=Path, required=True, help="MACULA SBLGNT lowfat book file")
    parser.add_argument("--commit", required=True, help="MACULA Greek commit SHA the file came from")
    parser.add_argument("--chapter", type=int, required=True)
    parser.add_argument("--out", type=Path, required=True, help="output root, e.g. corpus/v1")
    args = parser.parse_args(argv)

    if not COMMIT.fullmatch(args.commit):
        parser.error("--commit must be a full 40-character lower-case SHA")
    if args.chapter < 1:
        parser.error("--chapter must be 1 or more")

    try:
        root = parse_book(args.xml)
        book = root.get("id", "")
        if root.tag != "book" or not BOOK_CODE.fullmatch(book):
            raise IngestError(f"{args.xml} is not a MACULA lowfat book file")
        words = chapter_words(root, book, args.chapter)
    except (IngestError, ET.ParseError, OSError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    chapter = {
        "format": FORMAT,
        "edition": EDITION,
        "source": {"dataset": DATASET, "commit": args.commit},
        "book": book,
        "chapter": args.chapter,
        "words": words,
    }
    write_json(args.out / book / f"{args.chapter}.json", chapter)
    write_json(args.out / "attribution.json", {"format": FORMAT, "datasets": ATTRIBUTION})
    print(f"wrote {book} {args.chapter}: {len(words)} words")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
