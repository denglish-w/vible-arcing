// Compares a parsing answer with the source (spec 010 FR-014 to FR-019,
// FR-016a; data-model "Grading rules"). Pure and script-safe; runs on the
// server, so the browser never holds the source before a check (research R3).
import {
  MIDDLE_OR_PASSIVE,
  NOT_APPLICABLE,
  SHARED_MIDDLE_PASSIVE_TENSES,
  fieldsFor,
} from "./fields.ts";
import type {
  FieldComparison,
  Grade,
  ParsingAnswer,
  SourceParsing,
} from "./types.ts";

/**
 * Ignores accents, breathings, iota subscript, diaeresis, capitals, final-sigma
 * form, elision marks, other punctuation and whitespace (FR-015; research R5).
 */
export function normaliseLemma(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[’ʼ᾿']/g, "")
    .replace(/[\p{P}\s]/gu, "");
}

const outcome = (agrees: boolean): FieldComparison["outcome"] =>
  agrees ? "agrees" : "differs";

export function grade(answer: ParsingAnswer, source: SourceParsing): Grade {
  const comparisons: FieldComparison[] = [];

  const lemma = answer.lemma.trim();
  comparisons.push({
    field: "lemma",
    answer: lemma || null,
    source: source.lemma,
    outcome: lemma
      ? outcome(normaliseLemma(lemma) === normaliseLemma(source.lemma))
      : "unanswered",
  });

  // "participle" agrees with a verb in the participle mood (FR-016).
  const sourceIsParticiple =
    source.pos === "verb" && source.mood === "participle";
  const pos = answer.pos || null;
  const posAgrees =
    pos === source.pos || (pos === "participle" && sourceIsParticiple);
  comparisons.push({
    field: "pos",
    answer: pos,
    source:
      pos === "participle" && sourceIsParticiple ? "participle" : source.pos,
    outcome: pos ? outcome(posAgrees) : "unanswered",
  });

  for (const field of fieldsFor(answer.pos, answer.fields.mood)) {
    const given = answer.fields[field] || null;
    const actual = source[field] ?? null;
    let agrees: boolean;
    if (given === NOT_APPLICABLE) agrees = actual === null;
    else if (field === "voice" && given === MIDDLE_OR_PASSIVE)
      agrees =
        (actual === "middle" || actual === "passive") &&
        SHARED_MIDDLE_PASSIVE_TENSES.includes(source.tense ?? "");
    else agrees = given === actual;
    comparisons.push({
      field,
      answer: given,
      source: actual,
      outcome: given === null ? "unanswered" : outcome(agrees),
    });
  }

  const differCount = comparisons.filter((c) => c.outcome !== "agrees").length;
  return { comparisons, allAgreed: differCount === 0, differCount };
}
