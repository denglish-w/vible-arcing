// The closed lists and field rules for parsing practice (spec 010 FR-009 to
// FR-011, FR-016a; data-model "Closed lists" and "fieldsFor"). The one
// definition the parsing form, the grader and the validator share, so they
// cannot drift. Values equal the corpus values (research R4), except the form's
// extra "participle" part of speech and "middle or passive" voice.
// Pure and script-safe: relative `.ts` imports only (src/db/README.md).

export const FORM_POS = [
  "noun",
  "verb",
  "participle",
  "article",
  "pronoun",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "particle",
  "numeral",
  "interjection",
] as const;
export type FormPos = (typeof FORM_POS)[number];

/** "Not applicable": agrees with a field the source leaves blank (FR-017). */
export const NOT_APPLICABLE = "n/a";

/** Agrees with middle or passive where the two forms are the same (FR-016a). */
export const MIDDLE_OR_PASSIVE = "middle or passive";

export const TENSES = [
  "present",
  "imperfect",
  "future",
  "aorist",
  "perfect",
  "pluperfect",
] as const;
export const VOICES = [
  "active",
  "middle",
  "passive",
  MIDDLE_OR_PASSIVE,
] as const;
export const MOODS = [
  "indicative",
  "subjunctive",
  "optative",
  "imperative",
  "participle",
  "infinitive",
] as const;
export const PERSONS = ["first", "second", "third", NOT_APPLICABLE] as const;
export const NUMBERS = ["singular", "plural"] as const;
export const GENDERS = [
  "masculine",
  "feminine",
  "neuter",
  NOT_APPLICABLE,
] as const;
export const CASES = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "vocative",
  NOT_APPLICABLE,
] as const;

/** Tenses whose middle and passive forms are the same (FR-016a). */
export const SHARED_MIDDLE_PASSIVE_TENSES: readonly string[] = [
  "present",
  "imperfect",
  "perfect",
  "pluperfect",
];

export type FieldName =
  "tense" | "voice" | "mood" | "person" | "number" | "gender" | "case";

export const FIELD_VALUES: Record<FieldName, readonly string[]> = {
  tense: TENSES,
  voice: VOICES,
  mood: MOODS,
  person: PERSONS,
  number: NUMBERS,
  gender: GENDERS,
  case: CASES,
};

export const FIELD_LABELS: Record<FieldName, string> = {
  tense: "Tense",
  voice: "Voice",
  mood: "Mood",
  person: "Person",
  number: "Number",
  gender: "Gender",
  case: "Case",
};

const CORPUS_POS: Record<string, FormPos> = {
  noun: "noun",
  verb: "verb",
  det: "article",
  conj: "conjunction",
  pron: "pronoun",
  prep: "preposition",
  adj: "adjective",
  adv: "adverb",
  ptcl: "particle",
  num: "numeral",
  intj: "interjection",
};

/** The form's part of speech for a corpus one, or null when it has none. */
export function corpusPosToForm(pos: string): FormPos | null {
  return Object.hasOwn(CORPUS_POS, pos) ? CORPUS_POS[pos] : null;
}

export function isFormPos(value: string): value is FormPos {
  return (FORM_POS as readonly string[]).includes(value);
}

const FINITE_MOODS = new Set([
  "indicative",
  "subjunctive",
  "optative",
  "imperative",
]);

/** The fields asked for a part of speech (and mood), in display order (FR-010). */
export function fieldsFor(pos: FormPos | "", mood?: string): FieldName[] {
  switch (pos) {
    case "verb":
      if (mood && FINITE_MOODS.has(mood))
        return ["tense", "voice", "mood", "person", "number"];
      if (mood === "participle")
        return ["tense", "voice", "mood", "case", "number", "gender"];
      return ["tense", "voice", "mood"];
    case "participle":
      return ["tense", "voice", "case", "number", "gender"];
    case "noun":
    case "adjective":
    case "article":
    case "numeral":
      return ["case", "number", "gender"];
    case "pronoun":
      return ["case", "number", "gender", "person"];
    default:
      return [];
  }
}
