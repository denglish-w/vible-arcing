// Builds corpus.sqlite from corpus format v1 (design decision 4): a fresh temp
// file, then an atomic swap. Used by scripts/seed-corpus.ts, so shared with
// scripts (see src/db/README.md).
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { BOOKS } from "../lib/books.ts";
import {
  type CorpusAttribution,
  type CorpusChapter,
  CORPUS_FORMAT,
  InvalidCorpusError,
  parseAttribution,
  parseChapter,
} from "../lib/corpus/format.ts";
import { dataPaths } from "./paths.ts";
import * as corpusSchema from "./schema/corpus.ts";

const REQUIRED_CREDITS = [
  "SBL Greek New Testament",
  "MACULA Greek Linguistic Datasets",
];

// Rows per INSERT; well under SQLite's bound-parameter limit at 19 columns.
const INSERT_BATCH = 500;

export type SeedOptions = {
  dataDir: string;
  /** The ingest output, e.g. `<repo>/corpus/v1`. */
  corpusDir: string;
  migrationsFolder: string;
};

export type SeedResult = {
  chapters: number;
  words: number;
  ingestHash: string;
};

type IngestOutput = {
  chapters: CorpusChapter[];
  attribution: CorpusAttribution;
  hash: string;
};

/** The chapter files under `corpusDir`, as sorted `<BOOK>/<n>.json` paths. */
function chapterFiles(corpusDir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(corpusDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(path.join(corpusDir, entry.name))) {
      if (file.endsWith(".json")) files.push(`${entry.name}/${file}`);
    }
  }
  return files.sort();
}

// Bump when the seed's own logic changes what it writes.
const SEED_VERSION = 1;

/**
 * A hash of everything a build depends on: the ingest output's paths and bytes,
 * the corpus migrations, the canonical book list and the seed version. The
 * Docker entrypoint compares it with the store's `build` row to decide whether
 * to rebuild, so a schema or book-list change also triggers one.
 */
export function ingestHash(
  corpusDir: string,
  migrationsFolder: string,
): string {
  const hash = createHash("sha256");
  const add = (label: string, bytes: Buffer | string) => {
    hash.update(`${label}\0`);
    hash.update(bytes);
    hash.update("\0");
  };
  add("seed", String(SEED_VERSION));
  add("books", JSON.stringify(BOOKS));
  for (const file of ["attribution.json", ...chapterFiles(corpusDir)]) {
    add(`corpus/${file}`, readFileSync(path.join(corpusDir, file)));
  }
  const migrations = readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of [...migrations, "meta/_journal.json"]) {
    add(`migrations/${file}`, readFileSync(path.join(migrationsFolder, file)));
  }
  return hash.digest("hex");
}

function readJson(corpusDir: string, file: string): unknown {
  try {
    return JSON.parse(readFileSync(path.join(corpusDir, file), "utf8"));
  } catch (error) {
    throw new InvalidCorpusError(
      file,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/** Reads and checks all of the ingest output before anything is written. */
function readIngest(corpusDir: string, migrationsFolder: string): IngestOutput {
  const attribution = parseAttribution(
    readJson(corpusDir, "attribution.json"),
    "attribution.json",
  );
  const chapters = chapterFiles(corpusDir).map((file) => {
    const chapter = parseChapter(readJson(corpusDir, file), file);
    if (file !== `${chapter.book}/${chapter.chapter}.json`) {
      throw new InvalidCorpusError(
        file,
        `it holds ${chapter.book} ${chapter.chapter}`,
      );
    }
    return chapter;
  });
  // CC BY 4.0 obliges a credit for both works the corpus is built from.
  for (const name of REQUIRED_CREDITS) {
    const credit = attribution.datasets.find((d) => d.name === name);
    if (!credit || credit.license !== "CC BY 4.0") {
      throw new InvalidCorpusError(
        "attribution.json",
        `it must credit "${name}" under CC BY 4.0`,
      );
    }
  }
  if (chapters.length === 0) {
    throw new InvalidCorpusError(corpusDir, "it has no chapter files");
  }
  const commits = new Set(chapters.map((c) => c.source.commit));
  if (commits.size !== 1) {
    throw new InvalidCorpusError(
      corpusDir,
      `chapters come from different MACULA commits (${[...commits].join(", ")})`,
    );
  }
  return {
    chapters,
    attribution,
    hash: ingestHash(corpusDir, migrationsFolder),
  };
}

function insertAll<T>(rows: T[], insert: (batch: T[]) => void): void {
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    insert(rows.slice(i, i + INSERT_BATCH));
  }
}

function load(
  db: ReturnType<typeof drizzle<typeof corpusSchema>>,
  ingest: IngestOutput,
) {
  const { books, chapters, words, attribution, build } = corpusSchema;

  db.transaction((tx) => {
    tx.insert(books)
      .values(
        BOOKS.map((b, i) => ({
          code: b.code,
          seq: i + 1,
          chapterCount: b.chapters,
        })),
      )
      .run();
    tx.insert(attribution)
      .values(ingest.attribution.datasets.map((d, i) => ({ seq: i + 1, ...d })))
      .run();
  });

  // One transaction per book; seq runs through the book's ingested chapters in
  // chapter order, then word order.
  const byBook = Map.groupBy(ingest.chapters, (c) => c.book);
  for (const [book, bookChapters] of byBook) {
    db.transaction((tx) => {
      let seq = 0;
      for (const chapter of bookChapters.toSorted(
        (a, b) => a.chapter - b.chapter,
      )) {
        tx.insert(chapters)
          .values({
            book,
            chapter: chapter.chapter,
            wordCount: chapter.words.length,
          })
          .run();
        const rows = chapter.words.map((w) => ({
          id: w.id,
          book,
          chapter: chapter.chapter,
          verse: w.v,
          seq: ++seq,
          text: w.text,
          after: w.after,
          lemma: w.lemma,
          gloss: w.gloss ?? null,
          pos: w.pos,
          ...w.m,
        }));
        insertAll(rows, (batch) => tx.insert(words).values(batch).run());
      }
    });
  }

  db.insert(build)
    .values({
      id: 1,
      format: CORPUS_FORMAT,
      edition: ingest.chapters[0].edition,
      maculaCommit: ingest.chapters[0].source.commit,
      ingestHash: ingest.hash,
    })
    .run();
}

/**
 * Builds the corpus into `corpus.sqlite.tmp` and renames it over
 * `corpus.sqlite` only once it is complete and passes `integrity_check`.
 * On any failure the temp file is removed and the existing store is untouched.
 */
export function seedCorpus({
  dataDir,
  corpusDir,
  migrationsFolder,
}: SeedOptions): SeedResult {
  const ingest = readIngest(corpusDir, migrationsFolder);
  const paths = dataPaths(dataDir);
  mkdirSync(paths.dataDir, { recursive: true, mode: 0o700 });
  const tmp = `${paths.corpus}.tmp`;
  removeDatabase(tmp);

  const sqlite = new Database(tmp);
  let open = true;
  try {
    sqlite.pragma("journal_mode = DELETE");
    const db = drizzle({ client: sqlite, schema: corpusSchema });
    migrate(db, { migrationsFolder });
    load(db, ingest);

    const check = sqlite.pragma("integrity_check", { simple: true });
    if (check !== "ok") {
      throw new Error(`The new corpus failed its integrity check: ${check}`);
    }
    sqlite.close();
    open = false;

    // Stale WAL files beside the new file would be applied to it on open.
    rmSync(`${paths.corpus}-wal`, { force: true });
    rmSync(`${paths.corpus}-shm`, { force: true });
    renameSync(tmp, paths.corpus);
  } catch (error) {
    if (open) sqlite.close();
    removeDatabase(tmp);
    throw error;
  }

  return {
    chapters: ingest.chapters.length,
    words: ingest.chapters.reduce((n, c) => n + c.words.length, 0),
    ingestHash: ingest.hash,
  };
}

// `force` also removes a dangling symlink, which existsSync would report as absent.
function removeDatabase(file: string): void {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(`${file}${suffix}`, { force: true });
  }
}
