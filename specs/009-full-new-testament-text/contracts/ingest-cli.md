# Contract: Download and Ingest Commands

The maintainer-facing interface of this feature. The app's own interfaces (pages, store queries, export) do not change.

## `scripts/ingest/fetch.sh <dir>`

- Downloads the 27 `SBLGNT/lowfat` book files (`01-matthew.xml` … `27-revelation.xml`) at the pinned MACULA commit into `<dir>`, creating it if needed.
- `<dir>` should be outside the repository.
- Exit 0 when all 27 files are downloaded; non-zero, naming the file, on any download failure.
- Prints the pinned commit, so the maintainer can pass it to the ingest.

## `python3 -I scripts/ingest/ingest.py --source <dir> --commit <sha> --out <dir>`

| Argument | Rule |
|---|---|
| `--source` | Directory holding the 27 lowfat book files. |
| `--commit` | Full 40-character lower-case SHA of the MACULA commit the files came from. |
| `--out` | Output root, normally `corpus/v1`. Replaced as a whole on success. |

**On success** (exit 0): `<out>/attribution.json` and `<out>/<BOOK>/<n>.json` for all 260 chapters exist, nothing else, and a summary line reports 27 books, 260 chapters and the word count. Running it twice with the same inputs gives byte-identical files.

**On failure** (exit 1): `error: <message>` on stderr naming the file and problem, and `<out>` is exactly as it was. Failures include:

- a missing, extra or duplicate book file;
- a file that is not plain UTF-8, declares a DTD or entities, or is not a lowfat `book`;
- a word with no id, text, lemma or part of speech, an unrecognised `ref`, or a `ref` naming another book;
- markup characters in text, punctuation, lemma or gloss;
- duplicate references or ids, or chapters that are not contiguous from 1.

**Argument errors** (exit 2): a malformed `--commit`, or a missing argument.

## Output layout

```text
corpus/v1/
├── attribution.json
├── MAT/1.json … MAT/28.json
├── …
└── REV/1.json … REV/22.json
```

File contents follow [data-model.md](../data-model.md).
