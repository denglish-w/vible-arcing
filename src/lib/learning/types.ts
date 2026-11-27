// Shapes that move between the reading page, the parsing form and the
// Learning-mode actions (spec 010 data-model). Types only; script-safe.
import type { FieldName } from "./fields.ts";

export type { AttemptInput, ParsingAnswer } from "./validate.ts";
import type { ParsingAnswer } from "./validate.ts";

/** A Learning-mode word: its text and id only, never the answers (FR-020). */
export type LeanWord = { id: string; v: number; text: string; after: string };

export type LeanChapter = { book: string; chapter: number; words: LeanWord[] };

/** The last attempt at a word, without the source values (FR-026). */
export type AttemptSummary = {
  answer: ParsingAnswer;
  /** ISO 8601. */
  checkedAt: string;
  allAgreed: boolean;
  /** How many fields differed or were unanswered; no source values. */
  differCount: number;
};

/** The source's parsing of a word, returned only by a check. */
export type SourceParsing = {
  lemma: string;
  /** The form's part of speech, or the corpus's own value when it has none. */
  pos: string;
  gloss?: string;
} & Partial<Record<FieldName | "degree", string>>;

export type ComparedField = "lemma" | "pos" | FieldName;

export type FieldComparison = {
  field: ComparedField;
  /** null when unanswered. */
  answer: string | null;
  /** null when the source leaves it blank. */
  source: string | null;
  outcome: "agrees" | "differs" | "unanswered";
};

export type Grade = {
  comparisons: FieldComparison[];
  allAgreed: boolean;
  differCount: number;
};

export type CheckRefusal = {
  ok: false;
  reason: "invalid" | "unknown-word" | "corpus-missing";
};

export type CheckResult =
  ({ ok: true; source: SourceParsing } & Grade) | CheckRefusal;

/** What recording an attempt can refuse; `store-unavailable` is permanent until saved work is repaired. */
export type RecordRefusal = {
  ok: false;
  reason: CheckRefusal["reason"] | "store-unavailable";
};

/**
 * The Learning-mode server actions, passed down from the page as props so no
 * client module imports server code (and stories can pass fakes).
 */
export type LearningActions = {
  setReadingMode: (mode: "reading" | "learning") => Promise<{ ok: boolean }>;
  checkParse: (answer: ParsingAnswer) => Promise<CheckResult>;
  recordAttempt: (attempt: {
    id: string;
    answer: ParsingAnswer;
  }) => Promise<{ ok: true } | RecordRefusal>;
};
