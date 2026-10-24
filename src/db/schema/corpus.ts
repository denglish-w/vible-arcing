// Tables in corpus.sqlite: the Greek text and its linguistic data, rebuilt from
// ingest output by scripts/seed-corpus.ts and read-only at run time.
// Shared with scripts (see src/db/README.md).
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** The 27 New Testament books in canonical order, ingested or not. */
export const books = sqliteTable("books", {
  code: text().primaryKey(),
  seq: integer().notNull().unique(),
  chapterCount: integer("chapter_count").notNull(),
});

/** One row per ingested chapter. A missing row means "not ingested". */
export const chapters = sqliteTable(
  "chapters",
  {
    book: text()
      .notNull()
      .references(() => books.code),
    chapter: integer().notNull(),
    wordCount: integer("word_count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.book, t.chapter] })],
);

export const words = sqliteTable(
  "words",
  {
    /** MACULA xml:id, the only word identity. */
    id: text().primaryKey(),
    book: text().notNull(),
    chapter: integer().notNull(),
    verse: integer().notNull(),
    /** Canonical order within the book: chapter order, then position in the chapter. */
    seq: integer().notNull(),
    text: text().notNull(),
    /** Following punctuation and space, verbatim. */
    after: text().notNull(),
    lemma: text().notNull(),
    /** Absent when MACULA has no gloss for the word. */
    gloss: text(),
    pos: text().notNull(),
    person: text(),
    number: text(),
    gender: text(),
    case: text(),
    tense: text(),
    voice: text(),
    mood: text(),
    degree: text(),
  },
  (t) => [
    index("words_book_chapter_seq").on(t.book, t.chapter, t.seq),
    // seq is book-wide; a collision is a seed bug and must fail the build.
    uniqueIndex("words_book_seq").on(t.book, t.seq),
  ],
);

/** One row per dataset, in the order ingest lists them. */
export const attribution = sqliteTable("attribution", {
  seq: integer().primaryKey(),
  name: text().notNull(),
  creator: text().notNull(),
  license: text().notNull(),
  licenseUrl: text("license_url").notNull(),
  statement: text().notNull(),
  modified: integer({ mode: "boolean" }).notNull(),
  /** What was changed, shown on the credits page. */
  modifications: text().notNull(),
  url: text().notNull(),
});

/** A single row describing the build. No timestamp, so rebuilds are identical. */
export const build = sqliteTable(
  "build",
  {
    id: integer().primaryKey(),
    format: integer().notNull(),
    edition: text().notNull(),
    maculaCommit: text("macula_commit").notNull(),
    ingestHash: text("ingest_hash").notNull(),
  },
  (t) => [check("build_single_row", sql`${t.id} = 1`)],
);
