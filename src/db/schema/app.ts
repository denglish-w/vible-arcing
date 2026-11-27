// Tables in app.sqlite: users' saved work. Changed only through migrations
// (scripts/migrate-app.ts) and server actions.
// Shared with scripts (see src/db/README.md).
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Analyses and diagrams have the same shape but are separate tables on purpose:
// a diagram is never stored as, or converted into, an analysis (saved-work spec).
function savedWorkTable<N extends string>(name: N) {
  return sqliteTable(name, {
    id: text().primaryKey(),
    title: text().notNull(),
    // Filled by the server from the document (analyses) or the checked envelope
    // (diagrams), never taken from the request as-is.
    book: text().notNull(),
    startWordId: text("start_word_id").notNull(),
    endWordId: text("end_word_id").notNull(),
    passageLabel: text("passage_label").notNull(),
    edition: text().notNull(),
    docVersion: integer("doc_version").notNull(),
    /** The whole document as JSON text; `jsonb` once on Postgres. */
    doc: text().notNull(),
    /** Optimistic-concurrency counter, incremented on every save. */
    revision: integer().notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  });
}

export const analyses = savedWorkTable("analyses");
export const diagrams = savedWorkTable("diagrams");

// Parsing practice (spec 010): one row per check, append-only. The word's place
// and text are kept with the attempt, so it still exports meaningfully if a
// re-ingest drops the word (FR-027). `source` and `comparisons` are computed by
// the server; they are never sent to a page before a new check (FR-026).
export const parseAttempts = sqliteTable(
  "parse_attempts",
  {
    /** Client-generated UUID; insert-or-ignore makes retries idempotent. */
    id: text().primaryKey(),
    wordId: text("word_id").notNull(),
    book: text().notNull(),
    chapter: integer().notNull(),
    verse: integer().notNull(),
    surface: text().notNull(),
    edition: text().notNull(),
    /** JSON: the validated answer `{ lemma, pos, fields }`. */
    answer: text().notNull(),
    /** JSON: the source parsing at record time. */
    source: text().notNull(),
    /** JSON: the field comparisons at record time. */
    comparisons: text().notNull(),
    allAgreed: integer("all_agreed", { mode: "boolean" }).notNull(),
    checkedAt: integer("checked_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("parse_attempts_word_checked").on(t.wordId, t.checkedAt)],
);
