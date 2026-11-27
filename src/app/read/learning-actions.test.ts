import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppDb, CorpusDb } from "../../db/client.ts";
import { DatabaseMissingError } from "../../db/client.ts";
import { listAttempts } from "../../db/attempts.ts";
import {
  LEARNING_VERB as VERB,
  learningCorpus,
} from "../../db/attempts.fixtures.ts";
import { createTestAppDb } from "../../db/testing.ts";
import { HostNotAllowedError } from "../../lib/host.ts";
import type { ParsingAnswer } from "../../lib/learning/types.ts";

// Next-only module: stub the guard module, request headers and cookies, the
// cache, and give it in-memory databases (as src/app/(work)/actions.test.ts).
vi.mock("server-only", () => ({}));
const request = vi.hoisted(() => ({
  headers: new Headers(),
  set: vi.fn<(name: string, value: string, options: object) => void>(),
}));
vi.mock("next/headers", () => ({
  headers: async () => request.headers,
  cookies: async () => ({ set: request.set }),
}));
const refresh = vi.hoisted(() => vi.fn<() => void>());
vi.mock("next/cache", () => ({ refresh }));
const db = vi.hoisted(() => ({
  app: null as AppDb | null,
  corpus: null as CorpusDb | null,
  corpusMissing: false,
}));
vi.mock("../../db/client.ts", async (original) => ({
  ...(await original<typeof import("../../db/client.ts")>()),
  getAppDb: () => db.app,
  getCorpusDb: () => {
    if (db.corpusMissing) throw new DatabaseMissingError("corpus", "/x");
    return db.corpus;
  },
}));

const actions = await import("./learning-actions.ts");

const ID = "3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e";
const answer = (tense = "present"): ParsingAnswer => ({
  wordId: VERB,
  lemma: "ευχαριστεω",
  pos: "verb",
  fields: {
    tense,
    voice: "active",
    mood: "indicative",
    person: "first",
    number: "singular",
  },
});

beforeEach(() => {
  db.app = createTestAppDb();
  db.corpus = learningCorpus();
  db.corpusMissing = false;
  request.headers = new Headers({ host: "127.0.0.1:3000" });
  vi.clearAllMocks();
});

describe("setReadingMode", () => {
  it("refuses a request for another host", async () => {
    request.headers = new Headers({ host: "evil.example" });
    await expect(actions.setReadingMode("learning")).rejects.toThrow(
      HostNotAllowedError,
    );
    expect(request.set).not.toHaveBeenCalled();
  });

  it("refuses an unknown mode", async () => {
    expect(
      await actions.setReadingMode("other" as unknown as "reading"),
    ).toEqual({ ok: false, reason: "invalid" });
    expect(request.set).not.toHaveBeenCalled();
  });

  it("sets the cookie for Learning without refreshing", async () => {
    expect(await actions.setReadingMode("learning")).toEqual({
      ok: true,
      mode: "learning",
    });
    expect(request.set).toHaveBeenCalledWith("vible.mode", "learning", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("sets the cookie for Reading and refreshes", async () => {
    await actions.setReadingMode("reading");
    expect(request.set).toHaveBeenCalledWith(
      "vible.mode",
      "reading",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe("checkParse", () => {
  it("refuses a request for another host", async () => {
    request.headers = new Headers({ host: "evil.example" });
    await expect(actions.checkParse(answer())).rejects.toThrow(
      HostNotAllowedError,
    );
  });

  it("refuses invalid input and unknown words", async () => {
    expect(
      await actions.checkParse({ ...answer(), pos: "x" as "verb" }),
    ).toEqual({ ok: false, reason: "invalid" });
    expect(
      await actions.checkParse({ ...answer(), wordId: "n59999999999" }),
    ).toEqual({ ok: false, reason: "unknown-word" });
  });

  it("reports a missing corpus", async () => {
    db.corpusMissing = true;
    expect(await actions.checkParse(answer())).toEqual({
      ok: false,
      reason: "corpus-missing",
    });
  });

  it("returns the source with a correct parse", async () => {
    expect(await actions.checkParse(answer())).toMatchObject({
      ok: true,
      allAgreed: true,
      differCount: 0,
      source: { lemma: "εὐχαριστέω", tense: "present" },
    });
  });

  it("marks exactly one difference for a wrong tense", async () => {
    const result = await actions.checkParse(answer("aorist"));
    if (!result.ok) throw new Error("refused");
    expect(result.comparisons.filter((c) => c.outcome !== "agrees")).toEqual([
      {
        field: "tense",
        answer: "aorist",
        source: "present",
        outcome: "differs",
      },
    ]);
  });
});

describe("recordAttempt", () => {
  it("is idempotent on a repeated id", async () => {
    expect(await actions.recordAttempt({ id: ID, answer: answer() })).toEqual({
      ok: true,
    });
    expect(await actions.recordAttempt({ id: ID, answer: answer() })).toEqual({
      ok: true,
    });
    expect(listAttempts(db.app!)).toHaveLength(1);
  });

  it("stores the server's outcome, not the client's", async () => {
    await actions.recordAttempt({
      id: ID,
      answer: answer("aorist"),
      allAgreed: true,
    } as never);
    expect(listAttempts(db.app!)[0].allAgreed).toBe(false);
  });

  it("returns typed refusals", async () => {
    expect(await actions.recordAttempt({ id: "x", answer: answer() })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(
      await actions.recordAttempt({
        id: ID,
        answer: { ...answer(), wordId: "n59999999999" },
      }),
    ).toEqual({ ok: false, reason: "unknown-word" });
    db.corpusMissing = true;
    expect(await actions.recordAttempt({ id: ID, answer: answer() })).toEqual({
      ok: false,
      reason: "corpus-missing",
    });
  });

  it("refuses a request for another host", async () => {
    request.headers = new Headers({ host: "evil.example" });
    await expect(
      actions.recordAttempt({ id: ID, answer: answer() }),
    ).rejects.toThrow(HostNotAllowedError);
  });
});
