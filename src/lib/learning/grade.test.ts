import { describe, expect, it } from "vitest";
import { grade, normaliseLemma } from "./grade.ts";
import type { ParsingAnswer, SourceParsing } from "./types.ts";

const WORD = "n50001003001";

// εὐχαριστῶ (Philippians 1:3).
const euxaristw: SourceParsing = {
  lemma: "εὐχαριστέω",
  pos: "verb",
  tense: "present",
  voice: "active",
  mood: "indicative",
  person: "first",
  number: "singular",
  gloss: "I thank",
};

const correct: ParsingAnswer = {
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

const outcomeOf = (
  answer: ParsingAnswer,
  source: SourceParsing,
  field: string,
) => grade(answer, source).comparisons.find((c) => c.field === field)?.outcome;

describe("normaliseLemma", () => {
  it("ignores accents and breathings (SC-006)", () => {
    expect(normaliseLemma("εὐχαριστέω")).toBe(normaliseLemma("ευχαριστεω"));
  });

  it("ignores iota subscript, diaeresis and capitals", () => {
    expect(normaliseLemma("ᾄδω")).toBe(normaliseLemma("αδω"));
    expect(normaliseLemma("Ἠσαΐας")).toBe(normaliseLemma("ησαιας"));
  });

  it("ignores final-sigma form", () => {
    expect(normaliseLemma("λόγος")).toBe(normaliseLemma("λογοσ"));
  });

  it.each(["’", "ʼ", "᾿", "'"])("ignores the elision mark %s", (mark) => {
    expect(normaliseLemma(`ἀλλ${mark}`)).toBe(normaliseLemma("αλλ"));
  });
});

describe("grade", () => {
  it("agrees on every field of a correct parse", () => {
    const result = grade(correct, euxaristw);
    expect(result.allAgreed).toBe(true);
    expect(result.differCount).toBe(0);
    expect(result.comparisons.map((c) => c.field)).toEqual([
      "lemma",
      "pos",
      "tense",
      "voice",
      "mood",
      "person",
      "number",
    ]);
  });

  it("marks only tense when the tense is wrong", () => {
    const result = grade(
      { ...correct, fields: { ...correct.fields, tense: "aorist" } },
      euxaristw,
    );
    expect(result.differCount).toBe(1);
    expect(result.comparisons.filter((c) => c.outcome !== "agrees")).toEqual([
      {
        field: "tense",
        answer: "aorist",
        source: "present",
        outcome: "differs",
      },
    ]);
  });

  it("differs when the inflected form is given as the dictionary form", () => {
    expect(
      outcomeOf({ ...correct, lemma: "ευχαριστω" }, euxaristw, "lemma"),
    ).toBe("differs");
  });

  it("agrees when participle is chosen for a verb in the participle mood", () => {
    const source: SourceParsing = {
      lemma: "λέγω",
      pos: "verb",
      tense: "present",
      voice: "active",
      mood: "participle",
      case: "nominative",
      number: "singular",
      gender: "masculine",
    };
    const result = grade(
      {
        wordId: WORD,
        lemma: "λεγω",
        pos: "participle",
        fields: {
          tense: "present",
          voice: "active",
          case: "nominative",
          number: "singular",
          gender: "masculine",
        },
      },
      source,
    );
    expect(result.allAgreed).toBe(true);
    expect(result.comparisons[1]).toMatchObject({
      field: "pos",
      source: "participle",
    });
  });

  it("agrees n/a with a blank source field and differs from a present one", () => {
    const pronoun: SourceParsing = {
      lemma: "οὗτος",
      pos: "pronoun",
      case: "nominative",
      number: "singular",
      gender: "masculine",
    };
    const answer: ParsingAnswer = {
      wordId: WORD,
      lemma: "ουτος",
      pos: "pronoun",
      fields: {
        case: "n/a",
        number: "singular",
        gender: "masculine",
        person: "n/a",
      },
    };
    expect(outcomeOf(answer, pronoun, "person")).toBe("agrees");
    expect(outcomeOf(answer, pronoun, "case")).toBe("differs");
  });

  it("counts empty fields as unanswered and differing", () => {
    const result = grade(
      { wordId: WORD, lemma: " ", pos: "verb", fields: { mood: "indicative" } },
      euxaristw,
    );
    expect(result.comparisons.map((c) => c.outcome)).toEqual([
      "unanswered",
      "agrees",
      "unanswered",
      "unanswered",
      "agrees",
      "unanswered",
      "unanswered",
    ]);
    expect(result.differCount).toBe(5);
    expect(result.allAgreed).toBe(false);
  });

  it("shows a source part of speech the form lacks as given and differs from any answer", () => {
    const result = grade(
      { wordId: WORD, lemma: "x", pos: "noun", fields: {} },
      { lemma: "x", pos: "x-other" },
    );
    expect(result.comparisons[1]).toEqual({
      field: "pos",
      answer: "noun",
      source: "x-other",
      outcome: "differs",
    });
  });

  it("grades only the fields that apply to the answer", () => {
    const result = grade(
      {
        ...correct,
        fields: { tense: "present", voice: "active", mood: "infinitive" },
      },
      euxaristw,
    );
    expect(result.comparisons.map((c) => c.field)).toEqual([
      "lemma",
      "pos",
      "tense",
      "voice",
      "mood",
    ]);
  });

  describe("middle or passive (FR-016a)", () => {
    const withVoice = (tense: string, voice: string): SourceParsing => ({
      ...euxaristw,
      tense,
      voice,
    });
    const answer = (voice: string): ParsingAnswer => ({
      ...correct,
      fields: { ...correct.fields, voice },
    });

    it.each(["present", "imperfect", "perfect", "pluperfect"])(
      "agrees with middle or passive in the %s",
      (tense) => {
        expect(
          outcomeOf(
            answer("middle or passive"),
            withVoice(tense, "middle"),
            "voice",
          ),
        ).toBe("agrees");
        expect(
          outcomeOf(
            answer("middle or passive"),
            withVoice(tense, "passive"),
            "voice",
          ),
        ).toBe("agrees");
      },
    );

    it.each(["aorist", "future"])("differs in the %s", (tense) => {
      expect(
        outcomeOf(
          answer("middle or passive"),
          withVoice(tense, "middle"),
          "voice",
        ),
      ).toBe("differs");
      expect(
        outcomeOf(
          answer("middle or passive"),
          withVoice(tense, "passive"),
          "voice",
        ),
      ).toBe("differs");
    });

    it("differs from active", () => {
      expect(
        outcomeOf(
          answer("middle or passive"),
          withVoice("present", "active"),
          "voice",
        ),
      ).toBe("differs");
    });

    it("grades middle and passive alone exactly", () => {
      expect(
        outcomeOf(answer("middle"), withVoice("present", "passive"), "voice"),
      ).toBe("differs");
      expect(
        outcomeOf(answer("passive"), withVoice("present", "passive"), "voice"),
      ).toBe("agrees");
    });
  });
});
