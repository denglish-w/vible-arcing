import { beforeEach, describe, expect, it } from "vitest";
import type { ParsingAnswer } from "../lib/learning/types.ts";
import {
  checkAnswer,
  latestAttempts,
  listAttempts,
  recordAttempt,
  type AttemptDeps,
} from "./attempts.ts";
import { DatabaseMissingError, type AppDb, type CorpusDb } from "./client.ts";
import {
  LEARNING_NOUN as NOUN,
  LEARNING_VERB as VERB,
  learningCorpus,
} from "./attempts.fixtures.ts";
import { createTestAppDb, createTestCorpusDb } from "./testing.ts";

const ID1 = "3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e";
const ID2 = "4f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e";

const verbAnswer = (tense = "present"): ParsingAnswer => ({
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

let app: AppDb;
let corpus: CorpusDb;
let clock: number;
let deps: AttemptDeps;

beforeEach(() => {
  app = createTestAppDb();
  corpus = learningCorpus();
  clock = Date.UTC(2026, 10, 16, 10);
  deps = { app, corpus: () => corpus, now: () => new Date(clock++) };
});

describe("checkAnswer", () => {
  it("returns the source and the comparison", () => {
    const result = checkAnswer(deps.corpus, verbAnswer());
    expect(result).toMatchObject({
      ok: true,
      allAgreed: true,
      source: { lemma: "εὐχαριστέω", pos: "verb", gloss: "I thank" },
    });
  });

  it("refuses invalid input, unknown words and a missing corpus", () => {
    expect(checkAnswer(deps.corpus, { wordId: VERB })).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(
      checkAnswer(deps.corpus, { ...verbAnswer(), wordId: "n59999999999" }),
    ).toEqual({ ok: false, reason: "unknown-word" });
    expect(
      checkAnswer(() => {
        throw new DatabaseMissingError("corpus", "/x");
      }, verbAnswer()),
    ).toEqual({ ok: false, reason: "corpus-missing" });
  });
});

describe("recordAttempt", () => {
  it("stores one row for a repeated id", () => {
    expect(recordAttempt(deps, { id: ID1, answer: verbAnswer() })).toEqual({
      ok: true,
    });
    expect(recordAttempt(deps, { id: ID1, answer: verbAnswer() })).toEqual({
      ok: true,
    });
    expect(listAttempts(app)).toHaveLength(1);
  });

  it("stores the place, text and server-computed outcome", () => {
    recordAttempt(deps, {
      id: ID1,
      answer: verbAnswer("aorist"),
      allAgreed: true,
      source: { lemma: "x" },
    });
    const [stored] = listAttempts(app);
    expect(stored).toMatchObject({
      wordId: VERB,
      book: "PHP",
      chapter: 1,
      verse: 3,
      surface: "Εὐχαριστῶ",
      edition: "SBLGNT",
      allAgreed: false,
      source: { lemma: "εὐχαριστέω" },
    });
    expect(stored.comparisons.find((c) => c.field === "tense")?.outcome).toBe(
      "differs",
    );
  });

  it("refuses an unknown word without storing it", () => {
    expect(
      recordAttempt(deps, {
        id: ID1,
        answer: { ...verbAnswer(), wordId: "n59999999999" },
      }),
    ).toEqual({ ok: false, reason: "unknown-word" });
    expect(listAttempts(app)).toEqual([]);
  });
});

describe("latestAttempts", () => {
  it("keeps every attempt and returns the newest per word (FR-025)", () => {
    recordAttempt(deps, { id: ID1, answer: verbAnswer("aorist") });
    recordAttempt(deps, { id: ID2, answer: verbAnswer() });
    expect(listAttempts(app)).toHaveLength(2);
    const latest = latestAttempts(app, [VERB, NOUN]);
    expect([...latest.keys()]).toEqual([VERB]);
    expect(latest.get(VERB)).toEqual({
      answer: verbAnswer(),
      checkedAt: new Date(Date.UTC(2026, 10, 16, 10) + 1).toISOString(),
      allAgreed: true,
      differCount: 0,
    });
  });

  it("never returns source values or comparisons (FR-026)", () => {
    recordAttempt(deps, { id: ID1, answer: verbAnswer() });
    const summary = latestAttempts(app, [VERB]).get(VERB)!;
    expect(Object.keys(summary).sort()).toEqual([
      "allAgreed",
      "answer",
      "checkedAt",
      "differCount",
    ]);
    expect(JSON.stringify(summary)).not.toContain("εὐχαριστέω");
  });

  it("keeps an attempt whose word left the corpus (FR-027)", () => {
    recordAttempt(deps, { id: ID1, answer: verbAnswer() });
    corpus = createTestCorpusDb();
    expect(listAttempts(app)).toHaveLength(1);
    expect(latestAttempts(app, [VERB]).has(VERB)).toBe(true);
  });

  it("survives a rebuilt corpus store (SC-005)", () => {
    recordAttempt(deps, { id: ID1, answer: verbAnswer() });
    corpus = learningCorpus();
    expect(latestAttempts(app, [VERB]).get(VERB)?.answer).toEqual(verbAnswer());
  });
});
