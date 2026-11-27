// A corpus holding two words of Philippians 1:3, for parsing-practice tests.
// Follows the script import rules (src/db/README.md).
import { BOOKS } from "../lib/books.ts";
import type { CorpusDb } from "./client.ts";
import { books, chapters, words } from "./schema/corpus.ts";
import { createTestCorpusDb } from "./testing.ts";

export const LEARNING_VERB = "n50001003001";
export const LEARNING_NOUN = "n50001003002";

export function learningCorpus(): CorpusDb {
  const corpus = createTestCorpusDb();
  corpus
    .insert(books)
    .values(
      BOOKS.map((b, i) => ({
        code: b.code,
        seq: i + 1,
        chapterCount: b.chapters,
      })),
    )
    .run();
  corpus
    .insert(chapters)
    .values([{ book: "PHP", chapter: 1, wordCount: 2 }])
    .run();
  corpus
    .insert(words)
    .values([
      {
        id: LEARNING_VERB,
        book: "PHP",
        chapter: 1,
        verse: 3,
        seq: 1,
        text: "Εὐχαριστῶ",
        after: " ",
        lemma: "εὐχαριστέω",
        gloss: "I thank",
        pos: "verb",
        tense: "present",
        voice: "active",
        mood: "indicative",
        person: "first",
        number: "singular",
      },
      {
        id: LEARNING_NOUN,
        book: "PHP",
        chapter: 1,
        verse: 3,
        seq: 2,
        text: "θεῷ",
        after: " ",
        lemma: "θεός",
        pos: "noun",
        case: "dative",
        number: "singular",
        gender: "masculine",
      },
    ])
    .run();
  return corpus;
}
