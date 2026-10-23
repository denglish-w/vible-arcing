import { describe, expect, it } from "vitest";
import { createTestAppDb, createTestCorpusDb } from "./testing.ts";

function tables(db: {
  $client: { prepare(sql: string): { pluck(): { all(): unknown[] } } };
}) {
  return db.$client
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations' ORDER BY name",
    )
    .pluck()
    .all();
}

describe("test databases", () => {
  it("builds the corpus tables like the real store", () => {
    const db = createTestCorpusDb();
    expect(db.$client.pragma("trusted_schema", { simple: true })).toBe(0);
    expect(tables(db)).toEqual([
      "attribution",
      "books",
      "build",
      "chapters",
      "words",
    ]);
  });

  it("builds the saved-work tables with the app pragmas", () => {
    const db = createTestAppDb();
    expect(tables(db)).toEqual(["analyses", "diagrams"]);
    expect(db.$client.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(db.$client.pragma("trusted_schema", { simple: true })).toBe(0);
  });

  it("gives each call its own database", () => {
    const a = createTestAppDb();
    const b = createTestAppDb();
    a.$client.exec(
      `INSERT INTO analyses (id, title, book, start_word_id, end_word_id, passage_label,
         edition, doc_version, doc, created_at, updated_at)
       VALUES ('x', 't', 'PHP', 'a', 'b', 'l', 'SBLGNT', 1, '{}', 0, 0)`,
    );
    expect(
      b.$client.prepare("SELECT count(*) FROM analyses").pluck().get(),
    ).toBe(0);
  });
});
