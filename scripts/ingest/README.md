# Corpus ingest

Turns MACULA Greek (`SBLGNT/lowfat` XML) into corpus format v1 under `corpus/v1/`, which `npm run db:seed` loads into `data/corpus.sqlite`. The format is specified in `openspec/specs/text/corpus-store/spec.md` and design decision 4 of `openspec/changes/archive/2026-10-24-app-server-and-sqlite/design.md`.

## Sample chapter

Until the full ingest exists, `corpus/v1/` holds one chapter, Philippians 1, made by `sample_chapter.py`.

- MACULA Greek commit: `8423afe47b9e8f24b7772e808af45c7159a6fe7e` (2026-07-07)
- Source file: `SBLGNT/lowfat/11-philippians.xml` at that commit

Download the source outside the repo, then run the script with the standard library only, in isolated mode:

```sh
curl -sSfL -o /tmp/11-philippians.xml \
  https://raw.githubusercontent.com/Clear-Bible/macula-greek/8423afe47b9e8f24b7772e808af45c7159a6fe7e/SBLGNT/lowfat/11-philippians.xml
python3 -I scripts/ingest/sample_chapter.py \
  --xml /tmp/11-philippians.xml \
  --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e \
  --chapter 1 --out corpus/v1
```

It writes `corpus/v1/PHP/1.json` and `corpus/v1/attribution.json`. Running it again with the same inputs gives identical files.

## What is kept

Each word keeps only its MACULA `xml:id`, verse, text, following punctuation, lemma, gloss (when MACULA has one), part of speech (`class`) and the morphology attributes person, number, gender, case, tense, voice, mood and degree. Every other attribute is dropped, including Louw-Nida `ln` and UBS `domain`, whose redistribution is not permitted (see `docs/reference/data-sources.md`). Words are written in reading order, taken from each word's `ref`, not in the XML's syntax-tree order.

`after` is everything between a word and the next: MACULA's punctuation (including elision marks such as ’) plus the space SBLGNT puts after it. Joining every word's `text + after` reproduces the chapter's text exactly, apart from a trailing space after the last word.

The script accepts only plain UTF-8 input and refuses a file that declares a DTD or entities, and it stops if a word's text, following punctuation, lemma or gloss contains `<`, `>` or `&`.

The full ingest extends this script to every book and adds clause and conjunction data as reference data. That data is never used to split passages or suggest relationships.
