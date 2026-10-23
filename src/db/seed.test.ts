import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openCorpus } from "./client.ts";
import {
  getAttribution,
  getChapter,
  getWord,
  listBooks,
  missingWords,
  wordsExist,
} from "./corpus.ts";
import { ingestHash, seedCorpus } from "./seed.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const committedCorpus = path.join(repoRoot, "corpus", "v1");
const migrationsFolder = path.join(repoRoot, "drizzle", "corpus");

let tmp: string;
let dataDir: string;
let corpusDir: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "vible-seed-"));
  dataDir = path.join(tmp, "data");
  corpusDir = path.join(tmp, "corpus");
  cpSync(committedCorpus, corpusDir, { recursive: true });
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

const corpusFile = () => path.join(dataDir, "corpus.sqlite");
const seed = () => seedCorpus({ dataDir, corpusDir, migrationsFolder });

function dumpTables(file: string): Record<string, unknown[]> {
  const db = new Database(file, { readonly: true });
  const names = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations' ORDER BY name",
    )
    .pluck()
    .all() as string[];
  const dump = Object.fromEntries(
    names.map((name) => [
      name,
      db.prepare(`SELECT * FROM "${name}" ORDER BY 1, 2`).all(),
    ]),
  );
  db.close();
  return dump;
}

function editChapter(mutate: (json: any) => void) {
  const file = path.join(corpusDir, "PHP", "1.json");
  const json = JSON.parse(readFileSync(file, "utf8"));
  mutate(json);
  writeFileSync(file, JSON.stringify(json));
}

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

describe("committed ingest output", () => {
  it("has no Louw-Nida or UBS keys anywhere", () => {
    const files = jsonFiles(committedCorpus);
    expect(files.length).toBeGreaterThan(1);
    const banned = /"(ln|domain)"\s*:/;
    const offending = files.filter((file) =>
      banned.test(readFileSync(file, "utf8")),
    );
    expect(offending).toEqual([]);
  });
});

describe("seedCorpus", () => {
  it("builds the store from the ingest output", () => {
    const result = seed();
    expect(result).toMatchObject({ chapters: 1, words: 501 });
    expect(result.ingestHash).toBe(ingestHash(corpusDir, migrationsFolder));
    expect(existsSync(`${corpusFile()}.tmp`)).toBe(false);
    const db = new Database(corpusFile(), { readonly: true });
    expect(db.pragma("journal_mode", { simple: true })).toBe("delete");
    db.close();
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      expect(existsSync(`${corpusFile()}${suffix}`)).toBe(false);
    }
  });

  it("changes the build hash when the corpus migrations change", () => {
    const before = ingestHash(corpusDir, migrationsFolder);
    const changed = path.join(tmp, "changed-migrations");
    cpSync(migrationsFolder, changed, { recursive: true });
    const sqlFile = readdirSync(changed).find((f) => f.endsWith(".sql"))!;
    writeFileSync(
      path.join(changed, sqlFile),
      `${readFileSync(path.join(changed, sqlFile), "utf8")}\n-- changed`,
    );
    expect(ingestHash(corpusDir, changed)).not.toBe(before);
  });

  it("orders words across chapters and books by seq", () => {
    // Matthew 2 and 10 (a lexical file sort would put 10 first) and Mark 1.
    rmSync(path.join(corpusDir, "PHP"), { recursive: true });
    const base = JSON.parse(
      readFileSync(path.join(committedCorpus, "PHP", "1.json"), "utf8"),
    );
    const write = (
      book: string,
      bookNo: number,
      chapter: number,
      n: number,
    ) => {
      const words = Array.from({ length: n }, (_, i) => ({
        ...base.words[i],
        id: `n${bookNo}${String(chapter).padStart(3, "0")}001${String(i + 1).padStart(3, "0")}`,
        v: 1,
      }));
      const dir = path.join(corpusDir, book);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        path.join(dir, `${chapter}.json`),
        JSON.stringify({ ...base, book, chapter, words }),
      );
    };
    write("MAT", 40, 10, 2);
    write("MAT", 40, 2, 3);
    write("MRK", 41, 1, 2);

    expect(seed()).toMatchObject({ chapters: 3, words: 7 });
    const db = openCorpus(corpusFile());
    const seqs = (book: string) =>
      db.$client
        .prepare("SELECT chapter, seq FROM words WHERE book = ? ORDER BY seq")
        .all(book);
    expect(seqs("MAT")).toEqual([
      { chapter: 2, seq: 1 },
      { chapter: 2, seq: 2 },
      { chapter: 2, seq: 3 },
      { chapter: 10, seq: 4 },
      { chapter: 10, seq: 5 },
    ]);
    expect(seqs("MRK")).toEqual([
      { chapter: 1, seq: 1 },
      { chapter: 1, seq: 2 },
    ]);
    const mat10 = getChapter(db, "MAT", 10);
    expect(mat10.status === "ok" && mat10.words.map((w) => w.id)).toEqual([
      "n40010001001",
      "n40010001002",
    ]);
    db.$client.close();
  });

  it("gives identical rows in every table when run twice", () => {
    seed();
    const first = dumpTables(corpusFile());
    seed();
    expect(dumpTables(corpusFile())).toEqual(first);
    expect(Object.keys(first)).toEqual([
      "attribution",
      "books",
      "build",
      "chapters",
      "words",
    ]);
  });

  it("refuses an unknown format, naming it, and keeps the old store", () => {
    seed();
    const before = readFileSync(corpusFile());
    editChapter((json) => (json.format = 2));

    expect(seed).toThrow(/corpus format 2/);
    expect(readFileSync(corpusFile()).equals(before)).toBe(true);
    expect(existsSync(`${corpusFile()}.tmp`)).toBe(false);
  });

  it("leaves the old store openable when a build fails partway", () => {
    seed();
    const before = readFileSync(corpusFile());
    // Valid input, but a trigger makes an insert fail partway through the load.
    const broken = path.join(tmp, "broken-migrations");
    cpSync(migrationsFolder, broken, { recursive: true });
    const sqlFile = readdirSync(broken).find((f) => f.endsWith(".sql"))!;
    writeFileSync(
      path.join(broken, sqlFile),
      `${readFileSync(path.join(broken, sqlFile), "utf8")}\n--> statement-breakpoint\nCREATE TRIGGER fail BEFORE INSERT ON words WHEN NEW.seq = 300 BEGIN SELECT RAISE(ABORT, 'boom'); END;`,
    );

    expect(() =>
      seedCorpus({ dataDir, corpusDir, migrationsFolder: broken }),
    ).toThrow(/boom/);
    expect(readFileSync(corpusFile()).equals(before)).toBe(true);
    expect(existsSync(`${corpusFile()}.tmp`)).toBe(false);
    const db = openCorpus(corpusFile());
    expect(getChapter(db, "PHP", 1)).toMatchObject({ status: "ok" });
    db.$client.close();
  });

  it("refuses attribution that drops a required credit", () => {
    const file = path.join(corpusDir, "attribution.json");
    const json = JSON.parse(readFileSync(file, "utf8"));
    json.datasets = json.datasets.slice(1);
    writeFileSync(file, JSON.stringify(json));
    expect(seed).toThrow(/must credit "SBL Greek New Testament"/);
  });

  it("refuses a chapter file stored under the wrong name", () => {
    cpSync(
      path.join(corpusDir, "PHP", "1.json"),
      path.join(corpusDir, "PHP", "2.json"),
    );
    expect(seed).toThrow(/PHP\/2\.json.*holds PHP 1/);
  });

  it("removes stale WAL files beside the store before swapping", () => {
    seed();
    writeFileSync(`${corpusFile()}-wal`, "stale");
    writeFileSync(`${corpusFile()}-shm`, "stale");
    seed();
    expect(existsSync(`${corpusFile()}-wal`)).toBe(false);
    expect(existsSync(`${corpusFile()}-shm`)).toBe(false);
    expect(statSync(corpusFile()).size).toBeGreaterThan(0);
  });
});

describe("corpus store contents", () => {
  let db: ReturnType<typeof openCorpus>;
  beforeEach(() => {
    seed();
    db = openCorpus(corpusFile());
  });
  afterEach(() => db.$client.close());

  it("has no Louw-Nida or UBS columns", () => {
    const columns = db.$client
      .prepare(
        "SELECT p.name FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type = 'table'",
      )
      .pluck()
      .all() as string[];
    expect(columns.length).toBeGreaterThan(10);
    expect(columns.filter((c) => /^(ln|domain)$/i.test(c))).toEqual([]);
  });

  it("credits SBLGNT and MACULA with their licence and modification notes", () => {
    const credits = getAttribution(db);
    expect(credits.map((c) => c.name)).toEqual([
      "SBL Greek New Testament",
      "MACULA Greek Linguistic Datasets",
    ]);
    for (const c of credits) {
      expect(c).toMatchObject({ license: "CC BY 4.0", modified: true });
      expect(c.modifications.length).toBeGreaterThan(0);
    }
  });

  it("returns a chapter's words once each, in reading order", () => {
    const result = getChapter(db, "PHP", 1);
    if (result.status !== "ok") throw new Error(result.status);
    const ids = result.words.map((w) => w.id);
    expect(ids).toHaveLength(501);
    expect(new Set(ids).size).toBe(501);
    expect(ids).toEqual([...ids].sort());
    expect(result.words[0]).toMatchObject({
      id: "n50001001001",
      verse: 1,
      text: "Παῦλος",
      lemma: "Παῦλος",
      morphology: {
        case: "nominative",
        number: "singular",
        gender: "masculine",
      },
    });
  });

  it("tells unavailable chapters from ones that do not exist", () => {
    expect(getChapter(db, "PHP", 2)).toEqual({ status: "unavailable" });
    expect(getChapter(db, "MAT", 1)).toEqual({ status: "unavailable" });
    expect(getChapter(db, "PHP", 5)).toEqual({ status: "does-not-exist" });
    expect(getChapter(db, "PHP", 0)).toEqual({ status: "does-not-exist" });
    expect(getChapter(db, "GEN", 1)).toEqual({ status: "does-not-exist" });
  });

  it("lists every book with its ingested chapters", () => {
    const books = listBooks(db);
    expect(books).toHaveLength(27);
    expect(books[0]).toEqual({ code: "MAT", chapterCount: 28, available: [] });
    expect(books.find((b) => b.code === "PHP")).toEqual({
      code: "PHP",
      chapterCount: 4,
      available: [1],
    });
  });

  it("finds words by id and reports missing ones", () => {
    expect(getWord(db, "n50001003001")).toMatchObject({
      text: "Εὐχαριστῶ",
      morphology: { mood: "indicative", person: "first" },
    });
    expect(getWord(db, "n50001024004")?.gloss).toBeNull();
    expect(getWord(db, "n99999999999")).toBeUndefined();
    expect(wordsExist(db, ["n50001001001", "n50001030013"])).toBe(true);
    expect(missingWords(db, ["n50001001001", "n40001001001"])).toEqual([
      "n40001001001",
    ]);
    const many = Array.from(
      { length: 1000 },
      (_, i) => `n99${String(i).padStart(9, "0")}`,
    );
    expect(missingWords(db, [...many, "n50001001001", "n50001030013"])).toEqual(
      many,
    );
    expect(getWord(db, "n50001001002")).toEqual({
      id: "n50001001002",
      verse: 1,
      text: "καὶ",
      after: " ",
      lemma: "καί",
      gloss: "and",
      pos: "conj",
      morphology: {},
    });
  });

  it("keeps chapters and words in agreement", () => {
    const rows = db.$client
      .prepare(
        `SELECT c.book, c.chapter, c.word_count AS expected, count(w.id) AS actual
         FROM chapters c LEFT JOIN words w ON w.book = c.book AND w.chapter = c.chapter
         GROUP BY c.book, c.chapter`,
      )
      .all() as { expected: number; actual: number }[];
    expect(rows.length).toBe(1);
    for (const r of rows) expect(r.actual).toBe(r.expected);
    const orphans = db.$client
      .prepare(
        `SELECT count(*) FROM words w
         WHERE NOT EXISTS (SELECT 1 FROM chapters c WHERE c.book = w.book AND c.chapter = w.chapter)`,
      )
      .pluck()
      .get();
    expect(orphans).toBe(0);
  });
});
