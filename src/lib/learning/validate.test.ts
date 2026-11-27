import { describe, expect, it } from "vitest";
import { attemptInput, parsingAnswer } from "./validate.ts";

const WORD = "n50001003001";
const ID = "3f2b8c1e-4d5a-4b6c-9d7e-8f9a0b1c2d3e";
const verb = {
  wordId: WORD,
  lemma: "ευχαριστεω",
  pos: "verb",
  fields: {
    tense: "present",
    voice: "active",
    mood: "indicative",
    person: "first",
    number: "singular",
  },
};

describe("parsingAnswer", () => {
  it("accepts a full verb answer", () => {
    expect(parsingAnswer.safeParse(verb).success).toBe(true);
  });

  it("accepts middle or passive as a voice", () => {
    const answer = {
      ...verb,
      fields: { ...verb.fields, voice: "middle or passive" },
    };
    expect(parsingAnswer.safeParse(answer).success).toBe(true);
  });

  it("refuses a field that does not apply", () => {
    const answer = { ...verb, fields: { ...verb.fields, case: "nominative" } };
    expect(parsingAnswer.safeParse(answer).success).toBe(false);
  });

  it("refuses person on an infinitive", () => {
    const answer = {
      ...verb,
      fields: { tense: "present", mood: "infinitive", person: "first" },
    };
    expect(parsingAnswer.safeParse(answer).success).toBe(false);
  });

  it("refuses a value outside its list", () => {
    const answer = { ...verb, fields: { ...verb.fields, tense: "perfective" } };
    expect(parsingAnswer.safeParse(answer).success).toBe(false);
  });

  it("refuses an unknown field name", () => {
    const answer = {
      ...verb,
      fields: { ...verb.fields, degree: "comparative" },
    };
    expect(parsingAnswer.safeParse(answer).success).toBe(false);
  });

  it("refuses a lemma longer than 200 characters", () => {
    expect(
      parsingAnswer.safeParse({ ...verb, lemma: "α".repeat(201) }).success,
    ).toBe(false);
    expect(
      parsingAnswer.safeParse({ ...verb, lemma: "α".repeat(200) }).success,
    ).toBe(true);
  });

  it("accepts an empty part of speech with no fields", () => {
    expect(
      parsingAnswer.safeParse({ wordId: WORD, lemma: "", pos: "", fields: {} })
        .success,
    ).toBe(true);
  });

  it("refuses a word id that is not a MACULA id", () => {
    expect(parsingAnswer.safeParse({ ...verb, wordId: "12" }).success).toBe(
      false,
    );
    expect(
      parsingAnswer.safeParse({ ...verb, wordId: "n5000100300" }).success,
    ).toBe(false);
  });
});

describe("attemptInput", () => {
  it("refuses an id that is not a UUID", () => {
    expect(attemptInput.safeParse({ id: "x", answer: verb }).success).toBe(
      false,
    );
  });

  it("strips source, comparisons and allAgreed sent by the client", () => {
    const parsed = attemptInput.parse({
      id: ID,
      answer: verb,
      source: { lemma: "x" },
      comparisons: [],
      allAgreed: true,
    });
    expect(parsed).toEqual({ id: ID, answer: verb });
  });
});
