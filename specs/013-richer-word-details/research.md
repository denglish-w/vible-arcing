# Research: Richer Word Details

Findings checked on 2026-11-16 against:

- the 27 MACULA Greek `SBLGNT/lowfat` files at the pinned commit `8423afe47b9e8f24b7772e808af45c7159a6fe7e` (137,741 words);
- the Dodson lexicon at `biblicalhumanities/Dodson-Greek-Lexicon` commit `74f70358d4acfaf2f980bf2feb58ab7115cbbcbc` (2018-01-11, the repository's last commit);
- a copy of the local `data/corpus.sqlite`;
- the reader code (`src/components/reading/word-detail.tsx`, `greek-text.tsx`, `src/app/globals.css`), the seed (`src/db/seed.ts`) and the ingest (`scripts/ingest/ingest.py`).

Source files were downloaded outside the repository, and measurement scripts were run with `python3 -I`.

## R1. Is the Dodson lexicon usable? (FR-019, constitution Licensing)

- **Finding**: Dodson released the lexicon into the public domain himself. `README-ulrikp.txt` in the pinned repository carries his note verbatim: "Copyright © 2010 by John Jeffrey Dodson … The lexicon is hereby released by the copyright holder into the public domain. As such, it may be used for personal, academic, non-commercial, and/or commercial purposes."
  - The repository's own README says "This lexicon, in all of its forms, is in the public domain", and its `LICENSE` file is CC0 1.0.
  - The CrossWire SWORD module "Dodson" (v1.0, 2012) lists its licence as Public Domain.
  - The three sources agree. Dodson's original page (greeklexicon.org) can no longer be reached, so the pinned repository file is the citable statement.
- **Decision**: Use Dodson. Record its status in `docs/reference/data-sources.md` with a verdict line, citing the pinned `README-ulrikp.txt` and `LICENSE` URLs. This entry is the first implementation task, and nothing else ships before it.
  - Once that entry is merged, the constitution's "Dodson … MUST NOT ship until" line is satisfied. Amending the constitution to drop the line is a separate PATCH change, outside this plan.
- **Rationale**: FR-019 and the constitution need the status verified and recorded before shipping. The statement comes from the copyright holder, and no source contradicts it.
- **Alternatives considered**:
  - Abbott-Smith (1922) is public domain, but has no maintained machine-readable edition keyed by Strong's number.
  - Thayer has public-domain editions, but its entries run very long and are dated.
  - MACULA's `sources/MARBLE/SDBG` holds UBS data and is barred by FR-020.

## R2. Lexicon source format and what is kept (FR-002, FR-020)

- **Finding**: `dodson.xml` is TEI-style XML in Unicode Greek with 5,410 entries. Each entry is `<entry n="λέγω | 3004"><orth>λέγω</orth><def role="brief">…</def><def role="full">…</def></entry>`.
  - Keys are plain Strong's numbers, zero-padded, with no duplicates.
  - `dodson.csv` gives the Greek in Beta Code and adds Goodrick-Kohlenberger numbers.
  - Full definitions are short: median 36 characters, longest 307 (καταπέτασμα).
  - No full definition contains Greek script.
- **Decision**: Read `dodson.xml` only. Keep the key (as an integer), `orth` as the headword (NFC) and `def[@role="full"]` as the definition, with whitespace runs collapsed to single spaces.
  - Drop the brief definition. It overlaps with the gloss already shown, and the spec asks for the complete definition.
  - Drop Goodrick-Kohlenberger numbers and everything else.
- **Rationale**: The XML is the only file with Unicode Greek. Keeping three fields meets FR-020 by construction.
- **Download**: `scripts/ingest/fetch.sh` also downloads `dodson.xml` from `raw.githubusercontent.com/biblicalhumanities/Dodson-Greek-Lexicon/<pinned commit>/dodson.xml`. Its sha256 is added to `scripts/ingest/SHA256SUMS`, as the MACULA files are.

## R3. Strong's numbers in MACULA (FR-001, edge cases)

- **Finding**: `@strong` is present on every word. Its values are:
  - plain digits with no leading zeros and no letter suffixes, 5,440 distinct values;
  - three compound values: `1537+4053`, `5228+1537+4053` and `1417+3461`;
  - `0` on two words (Ἀρνί, ἄμωμον).
- **Decision**: The ingest keeps `strong` on each word as a normalised string:
  - digits with leading zeros stripped;
  - compound parts joined by `+`, in source order;
  - a part of `0`, or anything that is not digits, is dropped;
  - if no part survives, the field is omitted.

  The UI shows numbers as `G3004`, and a compound as `G1537 + G4053`.
- **Rationale**: Keeping the source's compound as one value lets the correspondence decide the compound as a whole, as the spec's edge case requires. The `G` prefix is the common convention for Greek Strong's numbers and tells them apart from other numbers in the panel.
- **Alternatives considered**: An integer array per word. That is more awkward to key the correspondence on and loses the source's grouping.

## R4. Matching numbers to lexicon entries (FR-003, FR-004, SC-003)

- **Finding**: Matching a word's number directly to a Dodson key covers 127,943 words (92.89%).
  - 75 distinct values miss: 71 single numbers, the 3 compounds and `0`.
  - Most of the 71 are numbers Strong's gave to individual forms, which Dodson files under the lemma. The largest are 2036 εἶπον → λέγω (922 words), 2076 ἐστί → εἰμί (896), 5213 ὑμῖν → σύ (607), 3450 μου → ἐγώ (564) and 848 αὑτοῦ (493).
  - For 58 of them, the lemmas MACULA gives those words match exactly one Dodson headword. That makes a good proposal for review, but proposals are not decisions.
  - 445 direct matches have a headword spelled differently from MACULA's lemma (1,971 words). These are almost all variant spellings of names (Ζαρά / Ζάρα, Ἐλιακείμ / Ἐλιακίμ), and the entry is the right one.
- **Decision**: Resolve each word's entry by number, in this order:
  1. A source value that is a Dodson key uses that entry ("direct").
  2. Otherwise, the reviewed correspondence `scripts/ingest/strongs-correspondence.json` must name either an entry key or `null` (no entry). Every row carries a short reviewer note.
  3. The ingest **fails** if any value in the text is neither a key nor in the correspondence. A MACULA bump that brings new numbers therefore forces a review instead of silently showing "no entry".

  A helper, `scripts/ingest/propose_correspondence.py`, prints proposed rows for the unresolved values. The proposals use exact NFC lemma-to-headword matches and list the lemmas and word counts behind each value. The maintainer reviews them and writes the file by hand. The ingest never reads the proposals.

  Direct matches are not overridden. The spelling differences are reported in the proposal output for information only.

  **Rule for each row (decided 2026-11-16: follow Dodson).** A row points to the Dodson entry under which Dodson files the lemma MACULA gives those words. For example, 2036 εἶπον, the suppletive aorist, points to λέγω (3004), as Dodson does.
  - When Dodson has no entry for that lemma, the row is `null`.
  - When the words with that number carry lemmas that map to different Dodson entries, the row is also `null`.
  - The project makes no lexical judgement of its own. Review only confirms that the proposed entry is the one Dodson uses.
  - A row that departs from this rule needs a note explaining why. The 58 single-match proposals are expected to pass review unchanged.
- **Rationale**: FR-003 requires a reviewed correspondence held as data and forbids deciding at display time. Failing on undecided numbers makes "reviewed" checkable. A lemma match at display time would be an unreviewed guess, which the spec forbids.
- **Expected coverage**: once the 71 single numbers are reviewed, roughly 50 words remain without an entry (πώς, περισσοτέρως, ἱνατί and similar), about 0.04% of the text. SC-003's 99% floor is met with wide margin. The ingest prints the final share, and a test asserts it is at least 99%.
- **Not copied**: the design prototype's 75-row crosswalk (`docs/design/base44-prototype/src/lib/strongCrosswalk.js`) is not used as input. The correspondence is built from the proposals above and reviewed in our own work (spec Assumptions).

## R5. Counting by lemma (FR-006, FR-007, SC-002; spec 014 FR-023)

- **Finding**: MACULA writes 50 lemmas in two Unicode forms: an acute accent as tonos (U+03AC…) or as oxia (U+1F71…). For example, δέ appears 2,766 times plus 11, καί 8,973 plus 11, and λέγω 2,335 plus 7.
  - Counting raw strings would show different counts for the same word, which breaks FR-007.
  - NFC normalisation folds oxia into tonos (canonical equivalence), giving 5,468 lemmas.
- **Decision**: The ingest NFC-normalises `lemma` for every word. Surface `text` is left as the source has it.
- **Rationale**: The two forms are the same text by Unicode's definition. Normalising does not merge any lemmas the source distinguishes, so counting "the lemma as the source gives it" still holds.
- **Effect on siblings**: spec 014 matches occurrences by "identical lemma string". After this change, its matching and its total agree with 013's count by construction. The 014 plan should note that lemmas are NFC.
- **Effect on saved work**: none. Saved analyses refer to word ids, and nothing in `app.sqlite` stores a lemma (FR-022).

## R6. Where counts come from

- **Finding**: on the full store, counting the 337 distinct lemmas of Matthew 26 with `GROUP BY` took 152 ms without an index and 7 ms with an index on `words(lemma)`. Building a per-lemma table from `words` took 15 ms.
- **Decision**: The seed adds an index on `words(lemma)`. In the same transaction, it builds a `lemmas` table (`lemma`, `occurrences`) from the words it has just loaded. Chapter reads join to it.
- **Rationale**:
  - The count is derived from the installed text, so it cannot drift from it (SC-002), and every form of a lemma reads the same row (FR-007).
  - The index also serves spec 014's stepping queries.
  - Storing counts in the committed corpus was rejected: they would be a second source of truth that could disagree with the words.

## R7. Getting the facts to the panel without a loading step (FR-011, SC-005, spec 010)

- **Finding**: the reading page sends every word's facts in the server-component payload, and the panel renders from it synchronously.
  - Spec 010's plan sends a lean chapter (`id`, `v`, `text`, `after` only) in Learning mode, decided on the server.
  - A chapter has at most a few hundred distinct lemmas, and definitions are short (R2). Matthew 26, the longest chapter, would carry 337 definitions of about 40 characters on average.
- **Decision**: The Reading-mode chapter payload gains:
  - a `strong` and an `entry` field per word;
  - one `lexicon` map from entry key to headword and definition, holding only the entries the chapter uses;
  - one `occurrences` map from lemma to count.

  Spec 010's lean Learning payload carries none of them, so FR-016 and SC-009 hold by construction.
- **Rationale**:
  - No request is made when a word is selected, so the panel is complete on open (SC-005).
  - Deduplicating by entry and lemma keeps the payload small.
  - The quickstart measures the payload growth on Matthew 26.
- **Alternatives considered**: fetching on selection through a server action. It is fast locally, but it adds a loading state and an error path to every open, against FR-011 and the project's SPA-speed rule.

## R8. A store built before this feature (FR-021)

- **Finding**: `scripts/seed-if-stale.ts` rebuilds the store when `ingest_hash` changes. The Docker entrypoint runs it, but `npm start` does not seed, so an older store can still be open.
- **Decision**:
  - When the store connection opens, `src/db/corpus.ts` checks once for the `lexicon_entries` and `lemmas` tables (`sqlite_master`) and for the `words.strong` column (`PRAGMA table_info(words)`). An older store lacks all three. Its chapter query must name none of them, or SQLite raises "no such column".
  - If they are missing, chapter reads return the spec 002 facts only, with the new fields absent. Absent is not the same as `entry: null`: the panel omits the new facts and does not claim "no entry".
  - `ingestHash` gains `lexicon.json` and the correspondence file as inputs, and `SEED_VERSION` goes to 2, so stale stores are rebuilt wherever the seed runs.
- **Rationale**: Absent ("unknown") and `null` ("no entry") stay separate, which is exactly the distinction FR-021 draws.

## R9. Panel layout, phone sheet and accessibility (FR-012 to FR-015, SC-006, SC-007)

- **Finding**:
  - The panel is a Radix popover (`word-detail.tsx`). On wide screens it is capped at 60vh and scrolls.
  - At phone width it becomes a fixed bottom sheet up to 85vh (`globals.css`). That can cover the line the word is on, against Story 1 scenario 5.
- **Decision**:
  - The new facts go after the existing morphology list:
    - a "Strong's number" row and an "Occurrences in the New Testament" row in the same `dl`;
    - then a "Lexicon" section with the headword (`lang="grc"`) and the definition (`lang="en"`).
  - When the entry's key is not one of the word's own numbers, the entry's number appears next to the headword (FR-004), for example "λέγω (G3004)".
  - With no entry, the section holds one sentence: "The Dodson lexicon has no entry for this word."
  - The count reads "once" or "N times", with thousands separated, and the Strong's number reads "G3004" (wording decided by the user on 2026-11-16).
  - At phone width the sheet is capped at 50dvh, and on open the selected word is scrolled into view above it. This applies to every word's details, not only the new facts (decided by the user on 2026-11-16).
  - The sheet and the wide panel keep their own scrolling. Focus stays inside the panel, on the close button, so the arrow keys and Page Down scroll it.
- **Rationale**:
  - Text labels and position carry every distinction (FR-014).
  - Definitions are short (R2), so 50dvh is enough while the Greek line stays visible.
  - Existing open and close behaviour is unchanged (FR-013).
- **Wording**: the labels and the "no entry" sentence are our own wording, not taken from any other product.

## R10. Credits (FR-018, SC-008)

- **Decision**: Add a Dodson record to the ingest's `ATTRIBUTION` list, so it flows to `corpus/v1/attribution.json`, the store and the credits page with no hand edit there (Story 5 scenario 2). Its fields:
  - name "A Greek-English Lexicon of the New Testament";
  - creator "John Jeffrey Dodson";
  - licence "Public domain";
  - licence URL: the pinned `README-ulrikp.txt`;
  - a statement crediting the digital edition by Ulrik Sandborg-Petersen and biblicalhumanities;
  - modified = yes ("headwords and full definitions only, normalised to Unicode NFC; reached through Strong's numbers with a reviewed correspondence");
  - URL: the repository.

  The seed's check that SBLGNT and MACULA are credited under CC BY 4.0 is unchanged. Its test, which pins the list to three entries, becomes four.
