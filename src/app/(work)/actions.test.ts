import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppDb, CorpusDb } from "../../db/client.ts";
import { books, chapters, words } from "../../db/schema/corpus.ts";
import { createTestAppDb, createTestCorpusDb } from "../../db/testing.ts";
import { getWork } from "../../db/work.ts";
import { BOOKS } from "../../lib/books.ts";
import { INVALID, VALID, WORDS } from "../../lib/analysis/fixtures.ts";

// These modules use relative imports, since Vitest has no @/ alias.
// The actions, export route and /work page are Next-only: stub the guard
// module, request headers, cache and connection(), and give them in-memory
// databases.
vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));
const revalidatePath = vi.hoisted(() => vi.fn<(path: string) => void>());
vi.mock("next/cache", () => ({ revalidatePath }));
const connection = vi.hoisted(() => vi.fn<() => Promise<void>>(async () => {}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection,
}));
const db = vi.hoisted(() => ({
  app: null as AppDb | null,
  corpus: null as CorpusDb | null,
}));
vi.mock("../../db/client.ts", async (original) => ({
  ...(await original<typeof import("../../db/client.ts")>()),
  getAppDb: () => db.app,
  getCorpusDb: () => db.corpus,
}));

const actions = await import("./actions.ts");
const { GET: exportAnalysis } =
  await import("../api/analyses/[id]/export/route.ts");
const { default: WorkPage } = await import("./work/page.tsx");

/** A corpus holding Philippians 1:3, the words the fixtures use. */
function fixtureCorpus(): CorpusDb {
  const corpus = createTestCorpusDb();
  corpus
    .insert(books)
    .values(
      BOOKS.map((b, i) => ({
        code: b.code,
        seq: i + 1,
        chapterCount: b.chapters,
      })),
    )
    .run();
  corpus
    .insert(chapters)
    .values([{ book: "PHP", chapter: 1, wordCount: WORDS.length }])
    .run();
  corpus
    .insert(words)
    .values(
      WORDS.map((id, i) => ({
        id,
        book: "PHP",
        chapter: 1,
        verse: 3,
        seq: i + 1,
        text: "λόγος",
        after: " ",
        lemma: "λόγος",
        pos: "noun",
      })),
    )
    .run();
  return corpus;
}

beforeEach(() => {
  db.app = createTestAppDb();
  db.corpus = fixtureCorpus();
  request.headers = new Headers({ host: "127.0.0.1:3000" });
  vi.clearAllMocks();
});

const input = (doc: unknown, title = "Thanksgiving") => ({
  title,
  docVersion: 1,
  doc,
});

async function created(doc: unknown = VALID.Ground) {
  const result = await actions.createAnalysis(input(doc));
  if (!result.ok) throw new Error(`create refused: ${result.reason}`);
  return result;
}

describe("saveAnalysis", () => {
  it("stores a valid analysis and revalidates /work", async () => {
    const { id } = await created();
    expect(
      await actions.saveAnalysis(id, 1, input(VALID["Bilateral over groups"])),
    ).toEqual({ ok: true, revision: 2 });
    expect(JSON.parse(getWork(db.app!, "analysis", id)!.doc)).toEqual(
      VALID["Bilateral over groups"],
    );
    expect(revalidatePath).toHaveBeenCalledWith("/work");
  });

  it.each(Object.entries(INVALID))(
    "refuses %s and leaves the stored copy unchanged",
    async (_name, { doc }) => {
      const { id } = await created();
      const before = getWork(db.app!, "analysis", id);
      revalidatePath.mockClear();
      const result = await actions.saveAnalysis(id, 1, input(doc));
      expect(result).toMatchObject({ ok: false, reason: "invalid" });
      expect(getWork(db.app!, "analysis", id)).toEqual(before);
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("names the broken rule", async () => {
    const { id } = await created();
    expect(
      await actions.saveAnalysis(
        id,
        1,
        input(INVALID["Ground over three members"].doc),
      ),
    ).toEqual({
      ok: false,
      reason: "invalid",
      detail: "Ground relates one supporting member to one supported member.",
    });
  });

  it("refuses input of the wrong form before touching the database", async () => {
    const { id } = await created();
    for (const [recordId, revision] of [
      ["not-a-uuid", 1],
      [id, 0],
      [id, 1.5],
    ] as const)
      expect(
        await actions.saveAnalysis(recordId, revision, input(VALID.Ground)),
      ).toMatchObject({ ok: false, reason: "invalid" });
    expect(
      await actions.saveAnalysis(id, 1, {
        title: 7,
        docVersion: 1,
        doc: VALID.Ground,
      } as never),
    ).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("refuses an invalid analysis on create too", async () => {
    expect(
      await actions.createAnalysis(input(INVALID["members out of order"].doc)),
    ).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("refuses a request for another host", async () => {
    const { id } = await created();
    request.headers = new Headers({ host: "evil.example" });
    await expect(
      actions.saveAnalysis(id, 1, input(VALID.Inference)),
    ).rejects.toThrow("only answers requests addressed to this computer");
    await expect(actions.deleteAnalysis(id)).rejects.toThrow(
      "only answers requests addressed to this computer",
    );
    request.headers = new Headers({ host: "localhost" });
    expect(getWork(db.app!, "analysis", id)?.revision).toBe(1);
  });
});

describe("diagrams and deleting", () => {
  it("creates, saves and deletes a diagram, revalidating /work each time", async () => {
    const diagram = {
      title: "Greeting",
      docVersion: 1,
      doc: { lines: [] },
      startWordId: WORDS[0],
      endWordId: WORDS[8],
    };
    const result = await actions.createDiagram(diagram);
    if (!result.ok) throw new Error(result.reason);
    expect(await actions.saveDiagram(result.id, 1, diagram)).toEqual({
      ok: true,
      revision: 2,
    });
    expect(await actions.deleteDiagram(result.id)).toEqual({ ok: true });
    expect(await actions.deleteDiagram(result.id)).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(revalidatePath).toHaveBeenCalledTimes(4);
  });

  it("deletes an analysis", async () => {
    const { id } = await created();
    expect(await actions.deleteAnalysis(id)).toEqual({ ok: true });
    expect(getWork(db.app!, "analysis", id)).toBeUndefined();
  });
});

describe("GET /api/analyses/[id]/export", () => {
  const get = (id: string, headers: Record<string, string> = {}) =>
    exportAnalysis(
      new Request(`http://127.0.0.1:3000/api/analyses/${id}/export`, {
        headers,
      }),
      { params: Promise.resolve({ id }) },
    );

  it("downloads the stored document byte for byte, with its passage and edition", async () => {
    const { id } = await created(VALID["nested to three levels and complete"]);
    const stored = getWork(db.app!, "analysis", id)!;
    const response = await get(id, { "sec-fetch-site": "same-origin" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe(
      `attachment; filename="analysis-${id}.json"`,
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    const body = await response.text();
    expect(body).toContain(`"doc":${stored.doc}}`);
    const file = JSON.parse(body);
    expect(file).toMatchObject({
      kind: "analysis",
      edition: "SBLGNT",
      docVersion: 1,
      passage: {
        book: "PHP",
        label: "Philippians 1:3",
        startWordId: WORDS[0],
        endWordId: WORDS[8],
      },
    });
    expect(JSON.stringify(file.doc)).toBe(stored.doc);
    expect(connection).toHaveBeenCalled();
  });

  it("accepts its own Origin and refuses another or none", async () => {
    const { id } = await created();
    expect((await get(id, { origin: "http://127.0.0.1:3000" })).status).toBe(
      200,
    );
    expect((await get(id, { origin: "http://localhost:5173" })).status).toBe(
      403,
    );
    expect((await get(id, { "sec-fetch-site": "same-site" })).status).toBe(403);
    expect((await get(id)).status).toBe(403);
  });

  it("refuses another host", async () => {
    const { id } = await created();
    request.headers = new Headers({ host: "evil.example" });
    expect((await get(id, { "sec-fetch-site": "none" })).status).toBe(403);
  });

  it("reports an unknown id", async () => {
    expect(
      (await get(crypto.randomUUID(), { "sec-fetch-site": "none" })).status,
    ).toBe(404);
  });
});

describe("/work", () => {
  it("lists work saved after the page module was loaded", async () => {
    const empty = renderToStaticMarkup(await WorkPage());
    expect(empty).toContain("Nothing is saved yet.");
    await created();
    await actions.createDiagram({
      title: "Greeting diagram",
      docVersion: 1,
      doc: {},
      startWordId: WORDS[0],
      endWordId: WORDS[1],
    });
    const html = renderToStaticMarkup(await WorkPage());
    expect(connection).toHaveBeenCalledTimes(2);
    expect(html).toContain("Thanksgiving");
    expect(html).toContain("Greeting diagram");
    expect(html).toContain("Philippians 1:3");
  });
});
