# Sample corpus ingest

`sample_chapter.py` is the standard-library-only seed of the full corpus ingest. It extracts Philippians 1 from MACULA Greek `SBLGNT/lowfat`, preserving MACULA word ids, surface text and following punctuation. Lowfat tree traversal is not text order: the extractor sorts by the verse and word positions in `@ref`, without using those positions as identity.

The source is pinned to MACULA commit `8423afe47b9e8f24b7772e808af45c7159a6fe7e`. The script checks the downloaded book's SHA-256 (`59d5843599152524b66b43ece2364b91b8155c92fadd832860086e71066f5daa`) before writing data, so a different source cannot silently inherit that provenance.

From the repository root, with the project's Python virtual environment available as `.venv/`:

```sh
curl -fL https://raw.githubusercontent.com/Clear-Bible/macula-greek/8423afe47b9e8f24b7772e808af45c7159a6fe7e/SBLGNT/lowfat/11-philippians.xml -o /tmp/macula-philippians.xml
.venv/bin/python -I scripts/ingest/sample_chapter.py /tmp/macula-philippians.xml
.venv/bin/python -I -B -m unittest discover -s scripts/ingest -p 'test_*.py'
```

Outputs are `public/corpus/v1/PHP/1.json` (501 words, 30 verses) and `public/corpus/v1/attribution.json`. Use `--output <directory>` for a reproducibility check in a scratch directory. Keep downloaded XML outside the repository. In a worktree, use the primary checkout's `.venv/bin/python` if the worktree has no virtual environment.

Only explicitly listed reader fields and applicable morphology are emitted. UBS `ln` and `domain`, syntax roles, and other source attributes are omitted. Attribution retains the SBLGNT copyright and MACULA notice from their upstream licences, identifies the Berean Interlinear source of `@gloss`, and discloses the conversion. `@english` (Cherith glosses) is not incorporated.

The source omits `@gloss` for Philippians 1:24's `ἐν` (`n50001024004`); the output preserves that absence as an empty gloss rather than inventing one or substituting `@english`.

The foundation change's full ingest extends this script to the remaining books and chapters and adds its required clause and conjunction data; it retains this versioned, per-chapter reader contract.
