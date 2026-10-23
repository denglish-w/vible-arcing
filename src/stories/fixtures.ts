import php1 from "../../public/corpus/v1/PHP/1.json";
import { parseChapter } from "@/lib/corpus/parse";
import type { CorpusWord } from "@/lib/corpus/types";

/** The committed Philippians 1 sample, so no story fetches. */
export const philippians1 = parseChapter(php1);

export function fixtureWord(id: string): CorpusWord {
  const word = philippians1.words.find((candidate) => candidate.id === id);
  if (!word) throw new Error(`No word ${id} in the Philippians 1 fixture`);
  return word;
}
