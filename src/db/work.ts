// Users' saved work: analyses and diagrams (saved-work spec; design decision 5).
// Every function takes its connections, so tests pass in-memory ones; Next code
// reaches these through src/db/server.ts and the server actions.
// Shared with scripts and tests (see src/db/README.md).
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { ANALYSIS_DOC_VERSION } from "../lib/analysis/model.ts";
import { getBook } from "../lib/books.ts";
import { DatabaseMissingError, type AppDb, type CorpusDb } from "./client.ts";
import { locateWords, type WordLocation } from "./corpus.ts";
import { analyses, diagrams } from "./schema/app.ts";

export type WorkKind = "analysis" | "diagram";

/** Serialised `doc` larger than this is refused. */
export const MAX_DOC_BYTES = 512 * 1024;

/** Titles longer than this are refused; they are not part of the size limit. */
export const MAX_TITLE_LENGTH = 200;

/** Document versions the server can store, per kind. */
export const DOC_VERSIONS: Record<WorkKind, readonly number[]> = {
  analysis: [ANALYSIS_DOC_VERSION],
  diagram: [1],
};

export const EDITION = "SBLGNT";

export type WorkDeps = {
  app: AppDb;
  /** Opens the corpus store; throws `DatabaseMissingError` if it was never built. */
  corpus: () => CorpusDb;
  /**
   * Every MACULA word id an analysis document refers to, or `null` if the
   * document is not a well-formed analysis. Supplied by the analysis model, so
   * this module does not depend on its shape.
   */
  analysisWordIds: (doc: unknown) => readonly string[] | null;
  /**
   * What makes an analysis document structurally invalid, as sentences for the
   * user; empty when it is valid. Supplied by the validation module, which the
   * editor runs too, so the server refuses exactly what the editor would.
   */
  analysisProblems: (doc: unknown) => readonly string[];
  now?: () => Date;
};

export type AnalysisInput = { title: string; docVersion: number; doc: unknown };
export type DiagramInput = AnalysisInput & {
  /** The passage range, checked against the corpus (the doc cannot be yet). */
  startWordId: string;
  endWordId: string;
};

export type Refusal =
  | { ok: false; reason: "invalid"; detail: string }
  | { ok: false; reason: "unknown-word"; wordIds: string[] }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "too-large"; bytes: number }
  | { ok: false; reason: "unknown-version"; docVersion: number }
  | { ok: false; reason: "corpus-missing" };

export type Conflict = {
  ok: false;
  reason: "conflict";
  current: { revision: number; updatedAt: Date };
};

export type Created = { ok: true; id: string; revision: number };
export type Saved = { ok: true; revision: number };

export type WorkSummary = {
  kind: WorkKind;
  id: string;
  title: string;
  passageLabel: string;
  updatedAt: Date;
};

export type WorkRecord = WorkSummary & {
  book: string;
  startWordId: string;
  endWordId: string;
  edition: string;
  docVersion: number;
  /** The document exactly as stored. */
  doc: string;
  revision: number;
  createdAt: Date;
};

type Passage = {
  book: string;
  startWordId: string;
  endWordId: string;
  passageLabel: string;
};

type Checked = { doc: string; docVersion: number; passage: Passage };

function isRefusal(value: object): value is Refusal {
  return (value as { ok?: unknown }).ok === false;
}

const tableFor = (kind: WorkKind) =>
  kind === "analysis" ? analyses : diagrams;

/** "Philippians 1:3–11", "Philippians 1:27–2:4" or "Philippians 1:3". */
export function passageLabel(first: WordLocation, last: WordLocation): string {
  const name = getBook(first.book)?.name ?? first.book;
  const start = `${first.chapter}:${first.verse}`;
  if (first.chapter !== last.chapter)
    return `${name} ${start}–${last.chapter}:${last.verse}`;
  if (first.verse !== last.verse) return `${name} ${start}–${last.verse}`;
  return `${name} ${start}`;
}

function openCorpus(deps: WorkDeps): CorpusDb | Refusal {
  try {
    return deps.corpus();
  } catch (error) {
    if (error instanceof DatabaseMissingError)
      return { ok: false, reason: "corpus-missing" };
    throw error;
  }
}

/**
 * The passage spanned by `ids`, which must all exist and lie in one book. With
 * `asRun`, `ids` must also be a gap-free run of the corpus in reading order.
 */
function passageOf(
  corpus: CorpusDb,
  ids: readonly string[],
  asRun = false,
): Passage | Refusal {
  if (ids.length === 0)
    return {
      ok: false,
      reason: "invalid",
      detail: "The document has no words.",
    };
  const found = locateWords(corpus, ids);
  const missing = [...new Set(ids)].filter((id) => !found.has(id));
  if (missing.length > 0)
    return { ok: false, reason: "unknown-word", wordIds: missing };

  // seq restarts in each book, so the book must be checked for every word.
  const located = [...found];
  const book = located[0][1].book;
  if (located.some(([, word]) => word.book !== book))
    return {
      ok: false,
      reason: "invalid",
      detail: "The words are not all in one book.",
    };
  if (asRun) {
    // seq is consecutive within a book, so a run has no gaps or repeats.
    const seqs = ids.map((id) => found.get(id)!.seq);
    if (seqs.some((seq, i) => i > 0 && seq !== seqs[i - 1] + 1))
      return {
        ok: false,
        reason: "invalid",
        detail: "The words are not a continuous run of the text in order.",
      };
  }
  located.sort(([, a], [, b]) => a.seq - b.seq);
  const [startWordId, first] = located[0];
  const [endWordId, last] = located[located.length - 1];
  return {
    book: first.book,
    startWordId,
    endWordId,
    passageLabel: passageLabel(first, last),
  };
}

/** Size and version limits shared by both kinds (design decision 5). */
function checkEnvelope(
  kind: WorkKind,
  input: AnalysisInput,
): { doc: string } | Refusal {
  if (!DOC_VERSIONS[kind].includes(input.docVersion))
    return {
      ok: false,
      reason: "unknown-version",
      docVersion: input.docVersion,
    };
  if (input.title.length > MAX_TITLE_LENGTH)
    return { ok: false, reason: "invalid", detail: "The title is too long." };
  let doc: string | undefined;
  try {
    doc = JSON.stringify(input.doc);
  } catch {
    // Cycles, BigInts, or nesting deep enough to exhaust the stack.
    return {
      ok: false,
      reason: "invalid",
      detail: "The document cannot be stored.",
    };
  }
  if (doc === undefined)
    return { ok: false, reason: "invalid", detail: "The document is empty." };
  const bytes = Buffer.byteLength(doc, "utf8");
  if (bytes > MAX_DOC_BYTES) return { ok: false, reason: "too-large", bytes };
  return { doc };
}

function checkAnalysis(
  deps: WorkDeps,
  input: AnalysisInput,
): Checked | Refusal {
  const envelope = checkEnvelope("analysis", input);
  if (isRefusal(envelope)) return envelope;
  const problems = deps.analysisProblems(input.doc);
  if (problems.length > 0)
    return { ok: false, reason: "invalid", detail: problems.join(" ") };
  const ids = deps.analysisWordIds(input.doc);
  if (ids === null)
    return {
      ok: false,
      reason: "invalid",
      detail: "The document is not an analysis.",
    };
  const corpus = openCorpus(deps);
  if (isRefusal(corpus)) return corpus;
  // The passage comes from the words in the document, never from the request.
  const passage = passageOf(corpus, ids, true);
  if (isRefusal(passage)) return passage;
  return { doc: envelope.doc, docVersion: input.docVersion, passage };
}

function checkDiagram(deps: WorkDeps, input: DiagramInput): Checked | Refusal {
  const envelope = checkEnvelope("diagram", input);
  if (isRefusal(envelope)) return envelope;
  const corpus = openCorpus(deps);
  if (isRefusal(corpus)) return corpus;
  const passage = passageOf(corpus, [input.startWordId, input.endWordId]);
  if (isRefusal(passage)) return passage;
  if (passage.startWordId !== input.startWordId)
    return {
      ok: false,
      reason: "invalid",
      detail: "The passage range ends before it starts.",
    };
  return { doc: envelope.doc, docVersion: input.docVersion, passage };
}

function check(
  kind: WorkKind,
  deps: WorkDeps,
  input: AnalysisInput | DiagramInput,
): Checked | Refusal {
  return kind === "analysis"
    ? checkAnalysis(deps, input)
    : checkDiagram(deps, input as DiagramInput);
}

function create(
  kind: WorkKind,
  deps: WorkDeps,
  input: AnalysisInput | DiagramInput,
): Created | Refusal {
  const checked = check(kind, deps, input);
  if (isRefusal(checked)) return checked;
  const now = deps.now?.() ?? new Date();
  const id = randomUUID();
  deps.app
    .insert(tableFor(kind))
    .values({
      id,
      title: input.title,
      ...checked.passage,
      edition: EDITION,
      docVersion: checked.docVersion,
      doc: checked.doc,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return { ok: true, id, revision: 1 };
}

/**
 * Stores `input` only if the record is still at `baseRevision`, and increments
 * the revision. A stale save changes nothing and reports the stored revision.
 */
function save(
  kind: WorkKind,
  deps: WorkDeps,
  id: string,
  baseRevision: number,
  input: AnalysisInput | DiagramInput,
): Saved | Conflict | Refusal {
  const table = tableFor(kind);
  // A stale or missing record is reported before content problems, so the
  // editor offers the right recovery. The guarded UPDATE below is the real
  // check; this one only orders the answers.
  const existing = deps.app
    .select({ revision: table.revision, updatedAt: table.updatedAt })
    .from(table)
    .where(eq(table.id, id))
    .get();
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.revision !== baseRevision)
    return { ok: false, reason: "conflict", current: existing };

  const checked = check(kind, deps, input);
  if (isRefusal(checked)) return checked;
  const updated = deps.app
    .update(table)
    .set({
      title: input.title,
      ...checked.passage,
      docVersion: checked.docVersion,
      doc: checked.doc,
      revision: baseRevision + 1,
      updatedAt: deps.now?.() ?? new Date(),
    })
    .where(and(eq(table.id, id), eq(table.revision, baseRevision)))
    .returning({ revision: table.revision })
    .get();
  if (updated) return { ok: true, revision: updated.revision };

  const current = deps.app
    .select({ revision: table.revision, updatedAt: table.updatedAt })
    .from(table)
    .where(eq(table.id, id))
    .get();
  return current
    ? { ok: false, reason: "conflict", current }
    : { ok: false, reason: "not-found" };
}

export function createAnalysis(deps: WorkDeps, input: AnalysisInput) {
  return create("analysis", deps, input);
}
export function saveAnalysis(
  deps: WorkDeps,
  id: string,
  baseRevision: number,
  input: AnalysisInput,
) {
  return save("analysis", deps, id, baseRevision, input);
}
export function createDiagram(deps: WorkDeps, input: DiagramInput) {
  return create("diagram", deps, input);
}
export function saveDiagram(
  deps: WorkDeps,
  id: string,
  baseRevision: number,
  input: DiagramInput,
) {
  return save("diagram", deps, id, baseRevision, input);
}

export function getWork(
  app: AppDb,
  kind: WorkKind,
  id: string,
): WorkRecord | undefined {
  const table = tableFor(kind);
  const row = app.select().from(table).where(eq(table.id, id)).get();
  return row ? { kind, ...row } : undefined;
}

/** Analyses and diagrams together, most recently changed first. */
export function listWork(app: AppDb): WorkSummary[] {
  const summaries = (kind: WorkKind) => {
    const table = tableFor(kind);
    return app
      .select({
        id: table.id,
        title: table.title,
        passageLabel: table.passageLabel,
        updatedAt: table.updatedAt,
      })
      .from(table)
      .all()
      .map((row) => ({ kind, ...row }));
  };
  // Ties broken by id, so the order is stable.
  return [...summaries("analysis"), ...summaries("diagram")].sort(
    (a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id),
  );
}

export function deleteWork(
  app: AppDb,
  kind: WorkKind,
  id: string,
): { ok: true } | { ok: false; reason: "not-found" } {
  const table = tableFor(kind);
  const removed = app
    .delete(table)
    .where(eq(table.id, id))
    .returning({ id: table.id })
    .get();
  return removed ? { ok: true } : { ok: false, reason: "not-found" };
}
