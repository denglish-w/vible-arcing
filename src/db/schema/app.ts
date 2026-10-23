// Tables in app.sqlite: users' saved work. Changed only through migrations
// (scripts/migrate-app.ts) and server actions.
// Shared with scripts (see src/db/README.md).
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
