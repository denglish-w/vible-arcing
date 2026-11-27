import { describe, expect, it } from "vitest";
import { FIELD_VALUES, VOICES, corpusPosToForm, fieldsFor } from "./fields.ts";

describe("fieldsFor (SC-004)", () => {
  it("asks tense, voice and mood for a verb with no mood yet", () => {
    expect(fieldsFor("verb")).toEqual(["tense", "voice", "mood"]);
  });

  it.each(["indicative", "subjunctive", "optative", "imperative"])(
    "adds person and number for a %s verb",
    (mood) => {
      expect(fieldsFor("verb", mood)).toEqual([
        "tense",
        "voice",
        "mood",
        "person",
        "number",
      ]);
    },
  );

  it("adds case, number and gender for a verb in the participle mood", () => {
    expect(fieldsFor("verb", "participle")).toEqual([
      "tense",
      "voice",
      "mood",
      "case",
      "number",
      "gender",
    ]);
  });

  it("asks only tense, voice and mood for an infinitive", () => {
    expect(fieldsFor("verb", "infinitive")).toEqual(["tense", "voice", "mood"]);
  });

  it("asks a participle for tense, voice, case, number and gender", () => {
    expect(fieldsFor("participle")).toEqual([
      "tense",
      "voice",
      "case",
      "number",
      "gender",
    ]);
  });

  it.each(["noun", "adjective", "article", "numeral"] as const)(
    "asks case, number and gender for %s",
    (pos) => {
      expect(fieldsFor(pos)).toEqual(["case", "number", "gender"]);
    },
  );

  it("adds person for a pronoun", () => {
    expect(fieldsFor("pronoun")).toEqual([
      "case",
      "number",
      "gender",
      "person",
    ]);
  });

  it.each([
    "adverb",
    "preposition",
    "conjunction",
    "particle",
    "interjection",
    "",
  ] as const)("asks nothing more for %j", (pos) => {
    expect(fieldsFor(pos)).toEqual([]);
  });
});

describe("corpusPosToForm", () => {
  it.each([
    ["det", "article"],
    ["conj", "conjunction"],
    ["pron", "pronoun"],
    ["prep", "preposition"],
    ["adj", "adjective"],
    ["adv", "adverb"],
    ["ptcl", "particle"],
    ["num", "numeral"],
    ["intj", "interjection"],
    ["noun", "noun"],
    ["verb", "verb"],
  ])("maps %s to %s", (corpus, form) => {
    expect(corpusPosToForm(corpus)).toBe(form);
  });

  it("returns null for a value the form does not offer", () => {
    expect(corpusPosToForm("x")).toBeNull();
    expect(corpusPosToForm("toString")).toBeNull();
  });
});

describe("closed lists", () => {
  it("offers middle or passive as a voice (FR-016a)", () => {
    expect(VOICES).toContain("middle or passive");
  });

  it("offers not applicable for person, gender and case only", () => {
    expect(FIELD_VALUES.person).toContain("n/a");
    expect(FIELD_VALUES.gender).toContain("n/a");
    expect(FIELD_VALUES.case).toContain("n/a");
    expect(FIELD_VALUES.number).not.toContain("n/a");
    expect(FIELD_VALUES.tense).not.toContain("n/a");
  });
});
