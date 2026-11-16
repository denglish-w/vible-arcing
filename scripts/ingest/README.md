# Corpus ingest

Turns MACULA Greek (`SBLGNT/lowfat` XML) into corpus format v1 under `corpus/v1/`, which `npm run db:seed` loads into `data/corpus.sqlite`. The format is specified in `openspec/specs/text/corpus-store/spec.md` and design decision 4 of `openspec/changes/archive/2026-10-24-app-server-and-sqlite/design.md`; the whole-New-Testament ingest is `specs/009-full-new-testament-text/`.

`corpus/v1/` holds all 27 books of the SBL Greek New Testament: 260 chapters, 137,741 words.

## Source

- MACULA Greek commit: `8423afe47b9e8f24b7772e808af45c7159a6fe7e` (2026-07-07)
- Files: the 27 `SBLGNT/lowfat/NN-<book>.xml` files at that commit

Moving to another commit is a deliberate change of its own: word ids could change, and saved work refers to words by id.

## Regenerate

Download the source outside the repo, then run the ingest with the standard library only, in isolated mode:

```sh
SRC=$(mktemp -d)
sh scripts/ingest/fetch.sh "$SRC"
python3 -I scripts/ingest/ingest.py --source "$SRC" \
  --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e --out corpus/v1
```

It prints `wrote 27 books, 260 chapters, 137741 words`. Running it again with the same inputs gives byte-identical files, so `git status corpus/v1` shows nothing after a re-run. Never commit the downloaded XML.

Every book is read and checked before anything is written. The output goes to `corpus/v1.new` and replaces `corpus/v1` in one swap, so a failed run leaves `corpus/v1` exactly as it was. The run stops, naming the file, if a book file is missing, is not plain UTF-8, declares a DTD or entities, is not well-formed, holds another book's words or a gap in its chapters, or has a word without an id, text, lemma or part of speech, a duplicate id, or `<`, `>` or `&` in its text, punctuation, lemma or gloss.

## What is kept

Each word keeps only its MACULA `xml:id`, verse, text, following punctuation, lemma, gloss (when MACULA has one), part of speech (`class`) and the morphology attributes person, number, gender, case, tense, voice, mood and degree. Every other attribute is dropped, including Louw-Nida `ln` and UBS `domain`, whose redistribution is not permitted (see `docs/reference/data-sources.md`). Words are written in reading order, taken from each word's `ref`, not in the XML's syntax-tree order.

MACULA's syntax trees, clause boundaries, sentence-role labels and conjunction nodes are not kept: working out how a sentence is built is the analysis the user does in the diagramming and arcing editors.

`after` is everything between a word and the next: MACULA's punctuation (comma, full stop, ano teleia, the Greek question mark U+037E, and elision marks such as ’) plus the space SBLGNT puts after it. Joining every word's `text + after` reproduces the chapter's text as MACULA records it, apart from a trailing space after the last word.
