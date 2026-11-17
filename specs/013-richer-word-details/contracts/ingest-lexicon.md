# Contract: Lexicon Download, Correspondence and Ingest

This contract covers the maintainer-facing commands. It extends `specs/009-full-new-testament-text/contracts/ingest-cli.md`, and everything not mentioned here stays as that contract says.

## `scripts/ingest/fetch.sh <dir>`

- It also downloads `dodson.xml` from `biblicalhumanities/Dodson-Greek-Lexicon` at the pinned commit `74f70358d4acfaf2f980bf2feb58ab7115cbbcbc` into `<dir>`.
- It checks the file against its line in `scripts/ingest/SHA256SUMS` and exits 1 on a mismatch.
- It prints both pinned commits.

## `python3 -I scripts/ingest/propose_correspondence.py --source <dir> --lexicon <dir>/dodson.xml [--correspondence scripts/ingest/strongs-correspondence.json]`

- This is read-only and writes nothing to the repository.
- It reuses `ingest.py`'s parsing functions by loading that file by explicit path with `importlib.util.spec_from_file_location`, because `python3 -I` does not put the script's directory on the import path. It does not add that directory to `sys.path`.
- For every normalised `@strong` value that is neither a Dodson key nor already in the correspondence, it prints one proposed row to stdout as JSON. Each row has:
  - `strong`;
  - `entry`: the single Dodson key whose NFC headword equals one of the lemmas MACULA gives those words, or `null` when there are none or several;
  - a `note` that lists the lemmas and their word counts.
- On stderr it prints an informational list of direct matches whose headword is spelled differently from MACULA's lemma.
- Exit 0.
- The proposals are input to human review only. The ingest never reads them.

## `python3 -I scripts/ingest/ingest.py --source <dir> --commit <sha> --lexicon <file> --lexicon-commit <sha> --out <dir>`

| Argument | Rule |
|---|---|
| `--lexicon` | **New, required.** Path to `dodson.xml`. |
| `--lexicon-commit` | **New, required.** The 40-character lower-case SHA, written to `lexicon.json`. |
| `--correspondence` | **New, optional.** Defaults to `scripts/ingest/strongs-correspondence.json`. |

**On success** the existing outputs are written, plus `<out>/lexicon.json` ([data-model.md](../data-model.md)). The summary line also reports:

- the number of lexicon entries;
- the number of distinct Strong's values;
- the number and share of words with an entry, for example `with entry: 137,691 of 137,741 (99.96%)`.

Two runs with the same inputs produce byte-identical files.

**New failures** (exit 1, `<out>` untouched):

- the lexicon file has a DTD or entities, is not UTF-8, or has an entry with no key, headword or full definition, or a duplicate key;
- a normalised Strong's value in the text is neither a Dodson key nor a correspondence row (the message lists every such value);
- the correspondence has a row for a value that is a key, for a value absent from the text, an unknown entry key, a missing note, or duplicate or unsorted rows;
- the share of words with an entry is below 99% (SC-003).

## `npm run db:seed`

- It loads `lexicon.json` into `lexicon_entries` and `strong_numbers`, `words.strong` from the chapter files, and builds `lemmas`, all in the existing single load transaction and temporary-file swap.
- It refuses the build on any check listed in [data-model.md](../data-model.md).
- Its report adds the entry count and the lemma count.
