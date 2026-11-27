// Parsing-practice attempts (spec 010 FR-023 to FR-028; data-model "Attempt").
// Checking is read-only; recording re-validates and re-grades on the server,
// so a stored outcome never comes from the client (research R3). Every function
// takes its connections, so tests pass in-memory ones; Next code reaches these
// through src/db/server.ts and src/app/read/learning-actions.ts.
// Shared with scripts and tests (see src/db/README.md).
import { asc, desc, inArray } from "drizzle-orm";
import { corpusPosToForm } from "../lib/learning/fields.ts";
import { grade } from "../lib/learning/grade.ts";
import type {
  AttemptSummary,
  FieldComparison,
  Grade,
  SourceParsing,
} from "../lib/learning/types.ts";
import {
  attemptInput,
  parsingAnswer,
  type ParsingAnswer,
} from "../lib/learning/validate.ts";
import { DatabaseMissingError, type AppDb, type CorpusDb } from "./client.ts";
import { getWord, locateWords, type Word } from "./corpus.ts";
import { parseAttempts } from "./schema/app.ts";

export const ATTEMPT_EDITION = "SBLGNT";

export type AttemptRefusal = {
  ok: false;
  reason: "invalid" | "unknown-word" | "corpus-missing";
};

export type Checked = { ok: true; source: SourceParsing } & Grade;

export type AttemptDeps = {
  app: AppDb;
  /** Opens the corpus store; throws `DatabaseMissingError` if it was never built. */
  corpus: () => CorpusDb;
  now?: () => Date;
};

/**
 * The source's parsing of a word. A part of speech the form does not offer is
 * kept as the corpus gives it, so any answer differs from it (spec edge case).
 */
export function sourceParsing(word: Word): SourceParsing {
  return {
    lemma: word.lemma,
    pos: corpusPosToForm(word.pos) ?? word.pos,
    ...word.morphology,
    ...(word.gloss ? { gloss: word.gloss } : {}),
  };
}

function loadWord(
  corpus: () => CorpusDb,
  wordId: string,
): Word | AttemptRefusal {
  let db: CorpusDb;
  try {
    db = corpus();
  } catch (error) {
    if (error instanceof DatabaseMissingError)
      return { ok: false, reason: "corpus-missing" };
    throw error;
  }
  return getWord(db, wordId) ?? { ok: false, reason: "unknown-word" };
}

const isRefusal = (value: object): value is AttemptRefusal =>
  (value as { ok?: unknown }).ok === false;

/** Grades `input` against the source; returns the source with the result. */
export function checkAnswer(
  corpus: () => CorpusDb,
  input: unknown,
): Checked | AttemptRefusal {
  const parsed = parsingAnswer.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const word = loadWord(corpus, parsed.data.wordId);
  if (isRefusal(word)) return word;
  const source = sourceParsing(word);
  return { ok: true, ...grade(parsed.data as ParsingAnswer, source), source };
}

/** Stores one checked attempt; repeating an id stores nothing more. */
export function recordAttempt(
  deps: AttemptDeps,
  input: unknown,
): { ok: true } | AttemptRefusal {
  const parsed = attemptInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const answer = parsed.data.answer as ParsingAnswer;
  const word = loadWord(deps.corpus, answer.wordId);
  if (isRefusal(word)) return word;
  const source = sourceParsing(word);
  const result = grade(answer, source);
  const location = locateWords(deps.corpus(), [word.id]).get(word.id);
  deps.app
    .insert(parseAttempts)
    .values({
      id: parsed.data.id,
      wordId: word.id,
      book: location?.book ?? "",
      chapter: location?.chapter ?? 0,
      verse: word.verse,
      surface: word.text,
      edition: ATTEMPT_EDITION,
      answer: JSON.stringify({
        lemma: answer.lemma,
        pos: answer.pos,
        fields: answer.fields,
      }),
      source: JSON.stringify(source),
      comparisons: JSON.stringify(result.comparisons),
      allAgreed: result.allAgreed,
      checkedAt: (deps.now ?? (() => new Date()))(),
    })
    .onConflictDoNothing({ target: parseAttempts.id })
    .run();
  return { ok: true };
}

// Kept below SQLite's bound-parameter limit.
const LOOKUP_BATCH = 900;

/** The newest attempt per word, without source values (FR-026). */
export function latestAttempts(
  app: AppDb,
  wordIds: readonly string[],
): Map<string, AttemptSummary> {
  const latest = new Map<string, AttemptSummary>();
  const wanted = [...new Set(wordIds)];
  for (let i = 0; i < wanted.length; i += LOOKUP_BATCH) {
    const rows = app
      .select({
        wordId: parseAttempts.wordId,
        answer: parseAttempts.answer,
        allAgreed: parseAttempts.allAgreed,
        comparisons: parseAttempts.comparisons,
        checkedAt: parseAttempts.checkedAt,
      })
      .from(parseAttempts)
      .where(inArray(parseAttempts.wordId, wanted.slice(i, i + LOOKUP_BATCH)))
      .orderBy(desc(parseAttempts.checkedAt), desc(parseAttempts.id))
      .all();
    for (const row of rows) {
      if (latest.has(row.wordId)) continue;
      const stored = JSON.parse(row.answer) as Omit<ParsingAnswer, "wordId">;
      latest.set(row.wordId, {
        answer: { wordId: row.wordId, ...stored },
        checkedAt: row.checkedAt.toISOString(),
        allAgreed: row.allAgreed,
        differCount: (JSON.parse(row.comparisons) as FieldComparison[]).filter(
          (c) => c.outcome !== "agrees",
        ).length,
      });
    }
  }
  return latest;
}

export type StoredAttempt = {
  id: string;
  wordId: string;
  book: string;
  chapter: number;
  verse: number;
  surface: string;
  edition: string;
  answer: Omit<ParsingAnswer, "wordId">;
  source: SourceParsing;
  comparisons: FieldComparison[];
  allAgreed: boolean;
  checkedAt: Date;
};

/** Every attempt, oldest first, for export (FR-028). */
export function listAttempts(app: AppDb): StoredAttempt[] {
  return app
    .select()
    .from(parseAttempts)
    .orderBy(asc(parseAttempts.checkedAt), asc(parseAttempts.id))
    .all()
    .map((row) => ({
      ...row,
      answer: JSON.parse(row.answer),
      source: JSON.parse(row.source),
      comparisons: JSON.parse(row.comparisons),
    }));
}
