// Reads from the corpus store (corpus-store spec "Book, chapter and word
// retrieval", "Attribution held with the corpus"). Every function takes the
// connection, so tests pass an in-memory one; Next code uses src/db/server.ts.
// Shared with scripts (see src/db/README.md).
import { asc, and, eq, inArray } from "drizzle-orm";
import type { CorpusDb } from "./client.ts";
import { attribution, books, chapters, words } from "./schema/corpus.ts";

export type Morphology = Partial<
  Record<
    | "person"
    | "number"
    | "gender"
    | "case"
    | "tense"
    | "voice"
    | "mood"
    | "degree",
    string
  >
>;

export type Word = {
  id: string;
  verse: number;
  text: string;
  after: string;
  lemma: string;
  gloss: string | null;
  pos: string;
  morphology: Morphology;
};

export type ChapterResult =
  | { status: "ok"; book: string; chapter: number; words: Word[] }
  | { status: "unavailable" }
  | { status: "does-not-exist" };

export type BookSummary = {
  code: string;
  chapterCount: number;
  /** Chapter numbers that have been ingested, in order. */
  available: number[];
};

const MORPHOLOGY_KEYS = [
  "person",
  "number",
  "gender",
  "case",
  "tense",
  "voice",
  "mood",
  "degree",
] as const;

type WordRow = typeof words.$inferSelect;

function toWord(row: WordRow): Word {
  const morphology: Morphology = {};
  for (const key of MORPHOLOGY_KEYS) {
    const value = row[key];
    if (value !== null) morphology[key] = value;
  }
  return {
    id: row.id,
    verse: row.verse,
    text: row.text,
    after: row.after,
    lemma: row.lemma,
    gloss: row.gloss,
    pos: row.pos,
    morphology,
  };
}

/** Every New Testament book in canonical order, with its ingested chapters. */
export function listBooks(db: CorpusDb): BookSummary[] {
  const ingested = db
    .select({ book: chapters.book, chapter: chapters.chapter })
    .from(chapters)
    .orderBy(asc(chapters.book), asc(chapters.chapter))
    .all();
  const available = Map.groupBy(ingested, (c) => c.book);
  return db
    .select()
    .from(books)
    .orderBy(asc(books.seq))
    .all()
    .map((b) => ({
      code: b.code,
      chapterCount: b.chapterCount,
      available: (available.get(b.code) ?? []).map((c) => c.chapter),
    }));
}

/**
 * A chapter's words in reading order; "unavailable" for a real chapter that is
 * not ingested yet, and "does-not-exist" for anything outside the New Testament.
 */
export function getChapter(
  db: CorpusDb,
  book: string,
  chapter: number,
): ChapterResult {
  const known = db.select().from(books).where(eq(books.code, book)).get();
  if (
    !known ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > known.chapterCount
  ) {
    return { status: "does-not-exist" };
  }
  const ingested = db
    .select()
    .from(chapters)
    .where(and(eq(chapters.book, book), eq(chapters.chapter, chapter)))
    .get();
  if (!ingested) return { status: "unavailable" };

  const rows = db
    .select()
    .from(words)
    .where(and(eq(words.book, book), eq(words.chapter, chapter)))
    .orderBy(asc(words.seq))
    .all();
  return { status: "ok", book, chapter, words: rows.map(toWord) };
}

export function getWord(db: CorpusDb, id: string): Word | undefined {
  const row = db.select().from(words).where(eq(words.id, id)).get();
  return row ? toWord(row) : undefined;
}

// Kept below SQLite's bound-parameter limit.
const LOOKUP_BATCH = 900;

/** The ids from `ids` that are not in the corpus (empty when all exist). */
export function missingWords(db: CorpusDb, ids: Iterable<string>): string[] {
  const wanted = [...new Set(ids)];
  const found = new Set<string>();
  for (let i = 0; i < wanted.length; i += LOOKUP_BATCH) {
    const batch = wanted.slice(i, i + LOOKUP_BATCH);
    for (const row of db
      .select({ id: words.id })
      .from(words)
      .where(inArray(words.id, batch))
      .all()) {
      found.add(row.id);
    }
  }
  return wanted.filter((id) => !found.has(id));
}

export function wordsExist(db: CorpusDb, ids: Iterable<string>): boolean {
  return missingWords(db, ids).length === 0;
}

export type Attribution = typeof attribution.$inferSelect;

/** The datasets to credit, in the order ingest listed them. */
export function getAttribution(db: CorpusDb): Attribution[] {
  return db.select().from(attribution).orderBy(asc(attribution.seq)).all();
}
