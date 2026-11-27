import { grade } from "@/lib/learning/grade";
import { corpusPosToForm } from "@/lib/learning/fields";
import type {
  CheckResult,
  LeanChapter,
  LearningActions,
  ParsingAnswer,
  SourceParsing,
} from "@/lib/learning/types";
import { fixtureWord, philippians1 } from "./fixtures";

/** Philippians 1 as a Learning-mode page receives it: text and ids only. */
export const leanPhilippians1: LeanChapter = {
  book: philippians1.book,
  chapter: philippians1.chapter,
  words: philippians1.words.map(({ id, v, text, after }) => ({
    id,
    v,
    text,
    after,
  })),
};

/** εὐχαριστῶ, Philippians 1:3. */
export const EUXARISTW = "n50001003001";

export function fixtureSource(id: string): SourceParsing {
  const word = fixtureWord(id);
  return {
    lemma: word.lemma,
    pos: corpusPosToForm(word.pos) ?? word.pos,
    ...word.m,
    ...(word.gloss ? { gloss: word.gloss } : {}),
  };
}

/** Grades against the fixture, as the server would. */
export function fixtureCheck(answer: ParsingAnswer): CheckResult {
  const source = fixtureSource(answer.wordId);
  return { ok: true, ...grade(answer, source), source };
}

/** Server actions for stories: grading runs on the fixture, saving succeeds. */
export const fakeActions: LearningActions = {
  setReadingMode: async () => ({ ok: true }),
  checkParse: async (answer) => fixtureCheck(answer),
  recordAttempt: async () => ({ ok: true }),
};
