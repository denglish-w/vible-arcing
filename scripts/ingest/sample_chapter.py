"""Extract the pinned Philippians 1 reader sample from MACULA lowfat XML."""

import argparse
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

SOURCE_COMMIT = "8423afe47b9e8f24b7772e808af45c7159a6fe7e"
SOURCE_SHA256 = "59d5843599152524b66b43ece2364b91b8155c92fadd832860086e71066f5daa"
MORPHOLOGY_FIELDS = (
    "person", "number", "gender", "case", "tense", "voice", "mood", "degree"
)
XML_ID = "{http://www.w3.org/XML/1998/namespace}id"
WORD_REFERENCE = re.compile(r"([A-Z0-9]+) (\d+):(\d+)!(\d+)")


def extract_chapter(xml: bytes, book: str, chapter: int) -> dict:
    """Whitelist reader fields and restore text order from MACULA references."""
    # ElementTree does not fetch external entities; reject declarations as well
    # so even local, entity-expanding XML is outside this extractor's input.
    if b"<!DOCTYPE" in xml.upper() or b"<!ENTITY" in xml.upper():
        raise ValueError("XML document and entity declarations are not supported")
    root = ET.fromstring(xml)
    if root.tag != "book" or root.get("id") != book or chapter < 1:
        raise ValueError("Expected the requested MACULA book and a positive chapter")
    ordered = []
    ids = set()
    positions = set()
    for element in root.iter("w"):
        reference = WORD_REFERENCE.fullmatch(element.get("ref", ""))
        if reference is None or reference[1] != book:
            raise ValueError("Word has an invalid MACULA reference")
        source_chapter, verse, position = map(int, reference.groups()[1:])
        if source_chapter != chapter:
            continue
        identifier = element.get(XML_ID)
        if not identifier or identifier in ids or (verse, position) in positions:
            raise ValueError("Word identities and positions must be present and unique")
        if verse < 1 or position < 1:
            raise ValueError("Verse and word positions must be positive")
        text = element.text
        if not text or not all(field in element.attrib for field in ("after", "lemma", "class")):
            raise ValueError("Word is missing a required reader field")
        ids.add(identifier)
        positions.add((verse, position))
        word = {
            "id": identifier,
            "v": verse,
            "text": text,
            "after": element.attrib["after"],
            "lemma": element.attrib["lemma"],
            "gloss": element.get("gloss", ""),
            "pos": element.attrib["class"],
            "m": {field: element.attrib[field] for field in MORPHOLOGY_FIELDS if element.get(field)},
        }
        ordered.append(((verse, position), word))
    if not ordered:
        raise ValueError("The requested chapter contains no words")
    ordered.sort(key=lambda entry: entry[0])
    return {
        "format": 1,
        "edition": "SBLGNT",
        "source": {"dataset": "macula-greek", "commit": SOURCE_COMMIT},
        "book": book,
        "chapter": chapter,
        "words": [word for _, word in ordered],
    }


def attribution() -> list[dict]:
    """Publish the notices for every incorporated dataset, including glosses."""
    license_url = "https://creativecommons.org/licenses/by/4.0/"
    return [
        {
            "name": "SBL Greek New Testament",
            "creator": "Society of Biblical Literature and Logos Bible Software",
            "license": "CC BY 4.0",
            "licenseUrl": license_url,
            "statement": "SBL Greek New Testament. Copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Licensed under CC BY 4.0. Modified: extracted chapter text and converted to reader JSON.",
            "modified": True,
            "url": "https://sblgnt.com/",
        },
        {
            "name": "MACULA Greek Linguistic Datasets",
            "creator": "Biblica, Inc.",
            "license": "CC BY 4.0",
            "licenseUrl": license_url,
            "statement": "MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/ © 2022–2024 by Biblica, Inc. Licensed under CC BY 4.0. Modified: selected reader fields, omitted semantic-domain and syntax data, restored canonical word order, and converted to chapter JSON.",
            "modified": True,
            "url": "https://github.com/Clear-Bible/macula-greek/",
        },
        {
            "name": "Berean Interlinear Bible",
            "creator": "Berean Bible",
            "license": "Public domain",
            "licenseUrl": "https://berean.bible/licensing.htm",
            "statement": "English word glosses from the Berean Interlinear Bible, via MACULA Greek. The Berean Bible texts were placed in the public domain on April 30, 2023. Modified: extracted glosses for the sample chapter.",
            "modified": True,
            "url": "https://interlinearbible.com/",
        },
    ]


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Pinned SBLGNT/lowfat/11-philippians.xml")
    parser.add_argument("--output", type=Path, default=Path("public/corpus/v1"))
    args = parser.parse_args()
    xml = args.source.read_bytes()
    if hashlib.sha256(xml).hexdigest() != SOURCE_SHA256:
        parser.error("Source does not match the pinned MACULA Philippians file")
    chapter = extract_chapter(xml, "PHP", 1)
    write_json(args.output / "PHP" / "1.json", chapter)
    write_json(args.output / "attribution.json", attribution())
    print(f"Wrote {len(chapter['words'])} words from MACULA {SOURCE_COMMIT}")


if __name__ == "__main__":
    main()
