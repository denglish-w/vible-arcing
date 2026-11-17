# Quickstart: Richer Word Details

This guide shows how to regenerate the data and prove the feature works. The commands follow [contracts/ingest-lexicon.md](contracts/ingest-lexicon.md), and the panel follows [contracts/word-details.md](contracts/word-details.md).

## Prerequisites

- `fnm use` (Node 26), `npm install`, `python3` and `curl`.
- A scratch directory outside the repository, for example `SRC=$(mktemp -d)`.
- The Dodson entry is recorded in `docs/reference/data-sources.md` (FR-019). Do not ship without it.

## 1. Download and review the correspondence

```sh
sh scripts/ingest/fetch.sh "$SRC"     # 27 MACULA files + dodson.xml, checksums verified
python3 -I scripts/ingest/propose_correspondence.py --source "$SRC" --lexicon "$SRC/dodson.xml" > "$SRC/proposals.json"
```

Review every proposed row: confirm or change the entry and write a note. Then save the reviewed rows to `scripts/ingest/strongs-correspondence.json`. Expect about 71 rows for single numbers, 3 for compounds, and none for `0`, which is dropped during normalisation.

## 2. Ingest (SC-003, determinism)

```sh
python3 -I scripts/ingest/ingest.py --source "$SRC" \
  --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e \
  --lexicon "$SRC/dodson.xml" --lexicon-commit 74f70358d4acfaf2f980bf2feb58ab7115cbbcbc \
  --out corpus/v1
```

- **Expected**: the summary reports 27 books, 260 chapters and 137,741 words, about 5,410 lexicon entries, and a share of words with an entry of at least 99%.
- **Determinism**: run it again, then check that `git status --porcelain corpus/v1` shows no further change.
- **Failure check**: delete one row from the correspondence and rerun. The ingest must exit 1, name the value, and leave `corpus/v1` unchanged.

## 3. Build the store and run the tests (SC-001 to SC-004, SC-007, SC-008)

```sh
npm run db:generate && git status --porcelain drizzle/corpus   # one new migration, committed
npm run db:seed
npm test -- --project unit
npm test                                                        # Storybook stories with axe
```

The unit tests must include:

- **SC-001**: every word's `strong` equals its source value.
- **SC-002**: a count per lemma computed independently from the committed chapter JSON equals the `lemmas` table, for every lemma.
- **SC-003**: every word's entry resolves under the direct-then-correspondence rule, and the share is at least 99%.
- **Whitelist**: the updated whitelist test still has no `ln` or `domain` keys or columns.
- **Credits**: the pinned credits list has four entries.

## 4. Check in the browser (Stories 1 to 3 and 5, SC-005, SC-006)

```sh
npm run build && npm start
```

- **εἶπεν in Matthew 2:8**: select it. You should see Strong's G2036, the λέγω entry shown as "λέγω (G3004)", the full definition and the count, with no loading flash.
- **Shared lemma**: select λέγει somewhere else. The headword, definition and count are the same as for εἶπεν.
- **Single occurrence**: select a word whose lemma occurs once. It reads "once".
- **No entry**: select a word whose number the correspondence maps to `null`. You should see the "no entry" sentence and every other fact.
- **No number**: select Ἀρνί in Luke 3:33 (source number `0`). There is no Strong's row, the "no entry" sentence shows, and the count still shows.
- **Compound number**: select ὑπερεκπερισσοῦ in Ephesians 3:20 (`5228+1537+4053`). You should see "G5228 + G1537 + G4053" and the lexicon area the correspondence decides.
- **Phone width**: at 320px, select a word in Mark 15:38 (καταπέτασμα, the longest definition). The sheet must rise no higher than half the screen, the word's line must stay visible, and the definition must scroll to its end by touch and by keyboard.
- **Themes and keyboard**: in light, dark and sepia, reach every new fact by keyboard. A screen reader announces "Strong's number", "Occurrences in the New Testament" and "Lexicon".
- **Credits**: open the credits page. Dodson must be listed with "Public domain", its link, attribution and modification note.
- **Payload size**: note the Matthew 26 page's transfer size before and after this change. Record the growth in the PR; it is expected to be in the low tens of kilobytes.

## 5. Older store (FR-021)

Point the app at a `corpus.sqlite` built before this change (keep a copy from before step 3). Open a chapter and select a word. The spec 002 facts must show, with no Strong's row, no count, no lexicon section, no "no entry" sentence and no error. Then run `npm run db:seed` and confirm the new facts appear.

## 6. Learning mode (once spec 010 exists; SC-009)

Switch to Learning mode and view the page source. It must contain no `strong`, `lexicon`, `occurrences` or definition text. Selecting a word opens the parsing form, not the panel.
