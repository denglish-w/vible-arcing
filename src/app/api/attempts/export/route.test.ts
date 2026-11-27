import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppDb, CorpusDb } from "../../../../db/client.ts";
import {
  DatabaseMissingError,
  DatabaseNeedsMigrationError,
} from "../../../../db/client.ts";
import { recordAttempt } from "../../../../db/attempts.ts";
import {
  LEARNING_VERB as VERB,
  learningCorpus,
} from "../../../../db/attempts.fixtures.ts";
import { createTestAppDb } from "../../../../db/testing.ts";

vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection: async () => {},
}));
const db = vi.hoisted(() => ({
  app: null as AppDb | null,
  corpus: null as CorpusDb | null,
  appMissing: false,
  appStale: false,
}));
vi.mock("../../../../db/client.ts", async (original) => ({
  ...(await original<typeof import("../../../../db/client.ts")>()),
  getAppDb: () => {
    if (db.appMissing) throw new DatabaseMissingError("app", "/x");
    if (db.appStale) throw new DatabaseNeedsMigrationError("/x");
    return db.app;
  },
  getCorpusDb: () => db.corpus,
}));

const { GET } = await import("./route.ts");

const get = (extra: Record<string, string> = {}) =>
  GET(
    new Request("http://127.0.0.1:3000/api/attempts/export", {
      headers: { "sec-fetch-site": "same-origin", ...extra },
    }),
  );

beforeEach(() => {
  db.app = createTestAppDb();
  db.corpus = learningCorpus();
  db.appMissing = false;
  db.appStale = false;
  request.headers = new Headers({ host: "127.0.0.1:3000" });
});

describe("GET /api/attempts/export", () => {
  it("downloads every attempt with its reference", async () => {
    recordAttempt(
      { app: db.app!, corpus: () => db.corpus!, now: () => new Date(0) },
      {
        id: "3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e",
        answer: {
          wordId: VERB,
          lemma: "ευχαριστεω",
          pos: "adverb",
          fields: {},
        },
      },
    );
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="parse-attempts-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    const body = await response.json();
    expect(body).toMatchObject({
      format: "parse-attempts-export",
      formatVersion: 1,
      edition: "SBLGNT",
      attempts: [
        {
          wordId: VERB,
          reference: "Philippians 1:3",
          surface: "Εὐχαριστῶ",
          edition: "SBLGNT",
          checkedAt: "1970-01-01T00:00:00.000Z",
          answer: { lemma: "ευχαριστεω", pos: "adverb", fields: {} },
          source: { lemma: "εὐχαριστέω", pos: "verb" },
          allAgreed: false,
        },
      ],
    });
    expect(typeof body.exportedAt).toBe("string");
  });

  it("refuses another host", async () => {
    request.headers = new Headers({ host: "evil.example" });
    expect((await get()).status).toBe(403);
  });

  it("refuses a cross-origin request", async () => {
    expect((await get({ origin: "http://localhost:5173" })).status).toBe(403);
  });

  it("answers 503 when the store is missing", async () => {
    db.appMissing = true;
    expect((await get()).status).toBe(503);
  });

  it("answers 503 when the store needs migrating", async () => {
    db.appStale = true;
    expect((await get()).status).toBe(503);
  });
});
