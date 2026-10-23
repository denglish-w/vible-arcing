import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BOOKS } from "../lib/books.ts";
import { DatabaseMissingError, type AppDb, type CorpusDb } from "./client.ts";
import { openApp } from "./client.ts";
import { migrateApp } from "./migrate.ts";
import { books, chapters, words } from "./schema/corpus.ts";
import { seedCorpus } from "./seed.ts";
import { createTestAppDb, createTestCorpusDb } from "./testing.ts";
import {
  MAX_DOC_BYTES,
  MAX_TITLE_LENGTH,
  createAnalysis,
  createDiagram,
  deleteWork,
  getWork,
  listWork,
  passageLabel,
  saveAnalysis,
  saveDiagram,
  type WorkDeps,
} from "./work.ts";

// A stand-in analysis shape: the real one comes from the analysis model, which
// work.ts reaches only through `analysisWordIds`.
type FakeAnalysis = { words: string[]; note?: string };
const analysisWordIds = (doc: unknown) => {
  const ids = (doc as FakeAnalysis | null)?.words;
  return Array.isArray(ids) && ids.every((id) => typeof id === "string")
    ? ids
    : null;
};

// Philippians 1:3, 1:4 and 2:1, and Matthew 1:1.
const WORDS = [
  ["PHP", 1, 3, "n50001003001"],
  ["PHP", 1, 3, "n50001003002"],
  ["PHP", 1, 4, "n50001004001"],
  ["PHP", 2, 1, "n50002001001"],
  ["MAT", 1, 1, "n40001001001"],
] as const;

function fixtureCorpus(): CorpusDb {
  const db = createTestCorpusDb();
  const seqs: Record<string, number> = {};
  db.insert(books)
    .values(
      BOOKS.map((b, i) => ({
        code: b.code,
        seq: i + 1,
        chapterCount: b.chapters,
      })),
    )
    .run();
  db.insert(chapters)
    .values([
      { book: "PHP", chapter: 1, wordCount: 3 },
      { book: "PHP", chapter: 2, wordCount: 1 },
      { book: "MAT", chapter: 1, wordCount: 1 },
    ])
    .run();
  db.insert(words)
    .values(
      // seq restarts in each book, as in the real store.
      WORDS.map(([book, chapter, verse, id]) => ({
        id,
        book,
        chapter,
        verse,
        seq: (seqs[book] = (seqs[book] ?? 0) + 1),
        text: "λόγος",
        after: " ",
        lemma: "λόγος",
        pos: "noun",
      })),
    )
    .run();
  return db;
}

let app: AppDb;
let deps: WorkDeps;
let clock: number;

beforeEach(() => {
  app = createTestAppDb();
  const corpus = fixtureCorpus();
  clock = Date.UTC(2026, 9, 23);
  deps = {
    app,
    corpus: () => corpus,
    analysisWordIds,
    now: () => new Date((clock += 1000)),
  };
});

const analysis = (words: string[], note?: string) => ({
  title: "Thanksgiving",
  docVersion: 1,
  doc: { words, note } satisfies FakeAnalysis,
});

function created(result: ReturnType<typeof createAnalysis>) {
  if (!result.ok) throw new Error(`create refused: ${result.reason}`);
  return result;
}

describe("saving analyses", () => {
  it("stores against the current revision and increments it", () => {
    const { id } = created(createAnalysis(deps, analysis(["n50001003001"])));
    expect(
      saveAnalysis(deps, id, 1, analysis(["n50001003001"], "edited")),
    ).toEqual({ ok: true, revision: 2 });
    const stored = getWork(app, "analysis", id);
    expect(stored?.revision).toBe(2);
    expect(JSON.parse(stored!.doc).note).toBe("edited");
  });

  it("refuses a stale save and leaves the stored copy unchanged", () => {
    const { id } = created(createAnalysis(deps, analysis(["n50001003001"])));
    saveAnalysis(deps, id, 1, analysis(["n50001003001"], "first tab"));
    const before = getWork(app, "analysis", id);

    const stale = saveAnalysis(
      deps,
      id,
      1,
      analysis(["n50001003001"], "second tab"),
    );
    expect(stale).toEqual({
      ok: false,
      reason: "conflict",
      current: { revision: 2, updatedAt: before!.updatedAt },
    });
    expect(getWork(app, "analysis", id)).toEqual(before);

    // Overwriting means saving again against the revision the conflict reported.
    expect(
      saveAnalysis(deps, id, 2, analysis(["n50001003001"], "second tab")),
    ).toEqual({ ok: true, revision: 3 });
    expect(JSON.parse(getWork(app, "analysis", id)!.doc).note).toBe(
      "second tab",
    );
  });

  it("reports a save to a deleted record as not found", () => {
    const { id } = created(createAnalysis(deps, analysis(["n50001003001"])));
    expect(deleteWork(app, "analysis", id)).toEqual({ ok: true });
    expect(getWork(app, "analysis", id)).toBeUndefined();
    expect(saveAnalysis(deps, id, 1, analysis(["n50001003001"]))).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(deleteWork(app, "analysis", id)).toEqual({
      ok: false,
      reason: "not-found",
    });
  });

  it("refuses unknown word ids, naming them, and changes nothing", () => {
    const { id } = created(createAnalysis(deps, analysis(["n50001003001"])));
    const before = getWork(app, "analysis", id);
    expect(
      saveAnalysis(deps, id, 1, analysis(["n50001003001", "n59999999999"])),
    ).toEqual({ ok: false, reason: "unknown-word", wordIds: ["n59999999999"] });
    expect(getWork(app, "analysis", id)).toEqual(before);
    expect(createAnalysis(deps, analysis(["n59999999999"]))).toMatchObject({
      ok: false,
      reason: "unknown-word",
    });
    expect(listWork(app)).toHaveLength(1);
  });

  it("takes the passage from the words in the document", () => {
    const request = {
      ...analysis(["n50001004001", "n50001003002"]),
      // Not part of the input type; a request may still carry it.
      book: "MAT",
      passageLabel: "Matthew 1:1",
    };
    const { id } = created(createAnalysis(deps, request));
    expect(getWork(app, "analysis", id)).toMatchObject({
      book: "PHP",
      startWordId: "n50001003002",
      endWordId: "n50001004001",
      passageLabel: "Philippians 1:3–4",
      edition: "SBLGNT",
    });
    saveAnalysis(deps, id, 1, analysis(["n50001003001", "n50002001001"]));
    expect(getWork(app, "analysis", id)?.passageLabel).toBe(
      "Philippians 1:3–2:1",
    );
  });

  it("refuses documents that are malformed, empty or span two books", () => {
    for (const doc of [null, { words: "n50001003001" }, { words: [1] }])
      expect(
        createAnalysis(deps, { title: "x", docVersion: 1, doc }),
      ).toMatchObject({ ok: false, reason: "invalid" });
    expect(createAnalysis(deps, analysis([]))).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(
      createAnalysis(deps, analysis(["n50001003001", "n40001001001"])),
    ).toMatchObject({ ok: false, reason: "invalid" });
    // Matthew's word sorts between the first and last Philippians words.
    expect(
      createAnalysis(
        deps,
        analysis(["n50001003001", "n40001001001", "n50002001001"]),
      ),
    ).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("refuses over-long titles and documents that cannot be serialised", () => {
    expect(
      createAnalysis(deps, {
        ...analysis(["n50001003001"]),
        title: "t".repeat(MAX_TITLE_LENGTH + 1),
      }),
    ).toMatchObject({ ok: false, reason: "invalid" });
    const cyclic: Record<string, unknown> = { words: ["n50001003001"] };
    cyclic.self = cyclic;
    expect(
      createAnalysis(deps, { title: "x", docVersion: 1, doc: cyclic }),
    ).toMatchObject({ ok: false, reason: "invalid" });
    expect(listWork(app)).toEqual([]);
  });

  it("refuses oversized and unknown-version documents", () => {
    const { id } = created(createAnalysis(deps, analysis(["n50001003001"])));
    const before = getWork(app, "analysis", id);
    const big = analysis(["n50001003001"], "x".repeat(MAX_DOC_BYTES));
    expect(saveAnalysis(deps, id, 1, big)).toMatchObject({
      ok: false,
      reason: "too-large",
    });
    expect(
      saveAnalysis(deps, id, 1, {
        ...analysis(["n50001003001"]),
        docVersion: 2,
      }),
    ).toEqual({ ok: false, reason: "unknown-version", docVersion: 2 });
    expect(getWork(app, "analysis", id)).toEqual(before);
  });

  it("counts the size limit in bytes, not characters", () => {
    // Each Greek letter is two bytes in UTF-8.
    const note = "λ".repeat(MAX_DOC_BYTES / 2);
    expect(
      createAnalysis(deps, analysis(["n50001003001"], note)),
    ).toMatchObject({ ok: false, reason: "too-large" });
  });

  it("reports a corpus that was never built", () => {
    const missing: WorkDeps = {
      ...deps,
      corpus: () => {
        throw new DatabaseMissingError("corpus", "/nowhere/corpus.sqlite");
      },
    };
    expect(createAnalysis(missing, analysis(["n50001003001"]))).toEqual({
      ok: false,
      reason: "corpus-missing",
    });
  });
});

describe("diagrams", () => {
  const diagram = (startWordId: string, endWordId: string) => ({
    title: "Sentence",
    docVersion: 1,
    doc: { anything: true },
    startWordId,
    endWordId,
  });

  it("checks the passage range from the envelope", () => {
    const result = createDiagram(deps, diagram("n50001003001", "n50001004001"));
    if (!result.ok) throw new Error(result.reason);
    expect(getWork(app, "diagram", result.id)).toMatchObject({
      book: "PHP",
      passageLabel: "Philippians 1:3–4",
    });
    expect(
      saveDiagram(deps, result.id, 1, diagram("n50001003001", "n59999999999")),
    ).toEqual({ ok: false, reason: "unknown-word", wordIds: ["n59999999999"] });
    expect(
      createDiagram(deps, diagram("n50001004001", "n50001003001")),
    ).toMatchObject({ ok: false, reason: "invalid" });
    expect(
      createDiagram(deps, diagram("n50001003001", "n50001003001")),
    ).toMatchObject({ ok: true });
  });

  it("never crosses with analyses", () => {
    const a = created(createAnalysis(deps, analysis(["n50001003001"])));
    const d = createDiagram(deps, diagram("n50001003001", "n50001003001"));
    if (!d.ok) throw new Error(d.reason);
    expect(getWork(app, "diagram", a.id)).toBeUndefined();
    expect(getWork(app, "analysis", d.id)).toBeUndefined();
    expect(
      saveDiagram(deps, a.id, 1, diagram("n50001003001", "n50001003001")),
    ).toEqual({ ok: false, reason: "not-found" });
    expect(deleteWork(app, "diagram", a.id)).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(getWork(app, "analysis", a.id)).toBeDefined();
  });
});

describe("listing", () => {
  it("lists both kinds, most recently changed first", () => {
    const first = created(createAnalysis(deps, analysis(["n50001003001"])));
    const d = createDiagram(deps, {
      title: "Sentence",
      docVersion: 1,
      doc: {},
      startWordId: "n50001003001",
      endWordId: "n50001003001",
    });
    if (!d.ok) throw new Error(d.reason);
    saveAnalysis(deps, first.id, 1, analysis(["n50001003001"], "touched"));
    expect(listWork(app).map((w) => [w.kind, w.id])).toEqual([
      ["analysis", first.id],
      ["diagram", d.id],
    ]);
  });
});

describe("passageLabel", () => {
  const at = (chapter: number, verse: number) => ({
    book: "PHP",
    chapter,
    verse,
    seq: 0,
  });
  it("names the book and gives the shortest range", () => {
    expect(passageLabel(at(1, 3), at(1, 3))).toBe("Philippians 1:3");
    expect(passageLabel(at(1, 3), at(1, 11))).toBe("Philippians 1:3–11");
    expect(passageLabel(at(1, 27), at(2, 4))).toBe("Philippians 1:27–2:4");
  });
});

describe("corpus rebuilds", () => {
  let tmp: string;
  afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  it("leave app.sqlite byte-identical", () => {
    const repoRoot = path.resolve(import.meta.dirname, "../..");
    tmp = mkdtempSync(path.join(tmpdir(), "vible-work-"));
    const dataDir = path.join(tmp, "data");
    const seed = () =>
      seedCorpus({
        dataDir,
        corpusDir: path.join(repoRoot, "corpus", "v1"),
        migrationsFolder: path.join(repoRoot, "drizzle", "corpus"),
      });
    seed();
    migrateApp({
      dataDir,
      migrationsFolder: path.join(repoRoot, "drizzle", "app"),
    });
    const appFile = path.join(dataDir, "app.sqlite");
    const fileApp = openApp(appFile);
    const result = createAnalysis(
      { ...deps, app: fileApp },
      analysis(["n50001003001"]),
    );
    expect(result.ok).toBe(true);
    // Flush the WAL into the main file so the hash covers everything.
    fileApp.$client.pragma("wal_checkpoint(TRUNCATE)");
    fileApp.$client.close();

    const hash = () =>
      createHash("sha256").update(readFileSync(appFile)).digest("hex");
    const before = hash();
    const corpusFile = path.join(dataDir, "corpus.sqlite");
    const oldCorpus = statSync(corpusFile).ino;
    seed();
    // The corpus really was replaced, and saved work was not touched.
    expect(statSync(corpusFile).ino).not.toBe(oldCorpus);
    expect(hash()).toBe(before);
  });
});
