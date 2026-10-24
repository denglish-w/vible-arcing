import php1 from "../../corpus/v1/PHP/1.json";
import { parseChapter, type CorpusWord } from "@/lib/corpus/format";

/** The committed Philippians 1 sample, so no story needs the database. */
export const philippians1 = parseChapter(php1, "corpus/v1/PHP/1.json");

export function fixtureWord(id: string): CorpusWord {
  const word = philippians1.words.find((candidate) => candidate.id === id);
  if (!word) throw new Error(`No word ${id} in the Philippians 1 fixture`);
  return word;
}
