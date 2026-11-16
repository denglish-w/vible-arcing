# Quickstart: Full New Testament Text

How to regenerate the corpus and prove the feature works. Commands follow [contracts/ingest-cli.md](contracts/ingest-cli.md).

## Prerequisites

- `fnm use` (Node 26), `npm install`, `python3`, `curl`.
- A scratch directory outside the repo, e.g. `SRC=$(mktemp -d)`.

## 1. Regenerate the corpus

```sh
sh scripts/ingest/fetch.sh "$SRC"
python3 -I scripts/ingest/ingest.py --source "$SRC" \
  --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e --out corpus/v1
```

Expected: a summary of 27 books, 260 chapters, 137,741 words.

## 2. Check reproducibility and Philippians 1 (SC-005, SC-006)

```sh
git diff --stat corpus/v1/PHP/1.json corpus/v1/attribution.json   # no changes
python3 -I scripts/ingest/ingest.py --source "$SRC" \
  --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e --out corpus/v1
git status --porcelain corpus/v1                                   # nothing new after the second run
```

## 3. Check failure leaves the corpus alone (FR-010)

Copy the source to a second scratch directory, delete one book file, and run the ingest against it. Expected: exit 1, an error naming the missing file, and `git status --porcelain corpus/v1` unchanged.

## 4. Build the store and run the tests (SC-001, SC-002, SC-004, SC-007)

```sh
npm run db:seed          # reports 260 chapters, 137,741 words
npm test -- --project unit
npm test                 # includes Storybook axe checks
```

## 5. Check in the browser (SC-001, SC-003)

```sh
npm run build && npm start
```

- Open Matthew 1, Matthew 26, Luke 1, Acts 28, Philemon 1 and Revelation 22: each shows Greek text with verse numbers and no unavailable message. Matthew 26 opens in under a second with part-of-speech colours on.
- Select a word in several books: lemma, part of speech and morphology shown; gloss when present.
- Follow next from Matthew 28 to Mark 1, and previous from Mark 1 to Matthew 28.
- Open the credits: SBLGNT, MACULA and Berean entries unchanged.
- Open saved work created against Philippians 1 before the change: it still opens.
- `node scripts/qa/reader.cjs` passes.

## 6. Upgrading an existing install

An existing `data/corpus.sqlite` holding only Philippians 1 is rebuilt by `npm run db:seed`, or automatically by the Docker entrypoint because its build hash no longer matches.
