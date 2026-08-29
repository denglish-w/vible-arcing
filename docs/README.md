# Documentation

Research and reference material gathered while designing this project — a free and
open-source web app for Bible arcing, bracketing, and grammatical diagramming.

## Reference

| Document | What it covers |
|---|---|
| [`reference/logical-relationships.md`](./reference/logical-relationships.md) | The canonical 18 logical relationships (+4 extended), with definitions, abbreviations, and categories |
| [`reference/greek-conjunctions.md`](./reference/greek-conjunctions.md) | 64 Greek conjunctions → 105 relationship associations, with scripture examples, plus an inverted index |
| [`reference/data-sources.md`](./reference/data-sources.md) | Verified licensing for every candidate Greek/Hebrew/English text and linguistic dataset |
| [`reference/model-notes.md`](./reference/model-notes.md) | Research findings that constrain the data model — read before designing schemas |

## Machine-readable data

| File | Contents |
|---|---|
| [`data/greek-conjunctions.json`](./data/greek-conjunctions.json) | The conjunction→relationship table, structured |

## Archived sources

`source-pdfs/` holds primary sources, retained so claims can be re-verified without
re-fetching:

- `the-18-logical-relationships.pdf` — the canonical relationship taxonomy sheet
- `the-18-logical-relationships.extracted.txt` — raw text extraction (Hebrew glyphs mangled; verify against the PDF)
- `greek-conjunctions-bracketing-sheet.pdf` — the Greek conjunctions sheet

Both PDFs are published by Biblearc. They are archived here for reference during
development, not redistributed as part of the application.

---

## Orientation: the three findings that shape everything

1. **Arcing and bracketing are one data model, two renderings.** Biblearc's own material:
   they "differ only in how they display the text graphically." Never build them as two features.

2. **Grammatical diagramming is a genuinely separate model.** Schreiner treats "Tracing the
   Argument" and "Diagramming and Conducting a Grammatical Analysis" as distinct chapters.
   Discourse analysis links *propositions* by logical relationship; grammatical diagramming
   links *words* by syntactic role.

3. **The licensing is clear and the data is richer than expected.** SBLGNT is CC BY 4.0.
   MACULA Greek (CC BY 4.0) adds morphology *and* syntax trees with explicit clause nodes
   over that same text. Hebrew is equally viable via OSHB and MACULA Hebrew. The one trap is
   Westminster morphology direct from the Groves Center (CC BY-NC-ND — unusable); see
   `data-sources.md`.

## Attribution

Source texts and linguistic datasets carry CC BY 4.0 attribution requirements. The exact
required strings are listed in [`reference/data-sources.md`](./reference/data-sources.md)
and must appear in a `NOTICE`/`CREDITS` file and in the shipped application.
