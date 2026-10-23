import { getBook } from "../books";
import {
  MORPHOLOGY_FIELDS,
  type CorpusChapter,
  type CorpusWord,
  type Morphology,
} from "./types";
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
function string(value: unknown): value is string {
  return typeof value === "string";
}
function nonempty(value: unknown): value is string {
  return string(value) && value.trim().length > 0;
}
export function parseChapter(input: unknown): CorpusChapter {
  if (
    !record(input) ||
    input.format !== 1 ||
    !nonempty(input.edition) ||
    !record(input.source) ||
    !nonempty(input.source.dataset) ||
    !nonempty(input.source.commit) ||
    !nonempty(input.book) ||
    !positiveInteger(input.chapter) ||
    !Array.isArray(input.words) ||
    input.words.length === 0
  )
    throw new Error("Invalid corpus chapter");
  const book = getBook(input.book.toLowerCase());
  if (
    !book ||
    input.book !== book.code.toUpperCase() ||
    input.chapter > book.chapters
  )
    throw new Error("Invalid corpus passage");
  const ids = new Set<string>();
  let previousVerse = 0;
  const words = input.words.map((word: unknown): CorpusWord => {
    if (
      !record(word) ||
      !nonempty(word.id) ||
      !/^n\d{11}$/.test(word.id) ||
      ids.has(word.id) ||
      !positiveInteger(word.v) ||
      word.v < previousVerse ||
      !nonempty(word.text) ||
      !string(word.after) ||
      !nonempty(word.lemma) ||
      !string(word.gloss) ||
      !nonempty(word.pos) ||
      !record(word.m)
    )
      throw new Error("Invalid corpus word");
    ids.add(word.id);
    previousVerse = word.v;
    const m: Morphology = {};
    for (const field of MORPHOLOGY_FIELDS) {
      if (word.m[field] !== undefined) {
        if (!nonempty(word.m[field])) throw new Error("Invalid morphology");
        m[field] = word.m[field];
      }
    }
    return {
      id: word.id,
      v: word.v,
      text: word.text,
      after: word.after,
      lemma: word.lemma,
      gloss: word.gloss,
      pos: word.pos,
      m,
    };
  });
  return {
    format: 1,
    edition: input.edition,
    source: { dataset: input.source.dataset, commit: input.source.commit },
    book: input.book,
    chapter: input.chapter,
    words,
  };
}
