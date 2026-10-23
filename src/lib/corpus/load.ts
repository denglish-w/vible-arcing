import { getBook, nextChapter, prevChapter } from "../books.ts";
import { parseChapter } from "./parse.ts";
import type { CorpusChapter } from "./types.ts";
export type ChapterResult =
  | { status: "available"; chapter: CorpusChapter }
  | { status: "unavailable"; reason: "not-found" | "network" | "invalid-data" }
  | { status: "unavailable"; reason: "http"; httpStatus: number };
const cache = new Map<string, Promise<ChapterResult>>();
function fetchChapter(book: string, chapter: number): Promise<ChapterResult> {
  const key = `${book}/${chapter}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const request = (async (): Promise<ChapterResult> => {
    let response: Response;
    try {
      response = await fetch(
        `/corpus/v1/${book.toUpperCase()}/${chapter}.json`,
      );
    } catch {
      return { status: "unavailable", reason: "network" };
    }
    if (response.status === 404)
      return { status: "unavailable", reason: "not-found" };
    if (!response.ok) {
      console.error(
        `Could not load corpus chapter ${key}`,
        new Error(`HTTP ${response.status}`),
      );
      return {
        status: "unavailable",
        reason: "http",
        httpStatus: response.status,
      };
    }
    try {
      const parsed = parseChapter(await response.json());
      if (parsed.book !== book.toUpperCase() || parsed.chapter !== chapter)
        throw new Error(
          `Expected ${book.toUpperCase()} ${chapter}, received ${parsed.book} ${parsed.chapter}`,
        );
      return { status: "available", chapter: parsed };
    } catch (cause) {
      console.error(`Invalid corpus chapter ${key}`, cause);
      return { status: "unavailable", reason: "invalid-data" };
    }
  })();
  cache.set(key, request);
  void request.then((result) => {
    if (
      result.status === "unavailable" &&
      (result.reason === "network" ||
        (result.reason === "http" && result.httpStatus >= 500)) &&
      cache.get(key) === request
    )
      cache.delete(key);
  });
  return request;
}
export function loadChapter(
  book: string,
  chapter: number,
): Promise<ChapterResult> {
  const metadata = getBook(book);
  if (
    !metadata ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > metadata.chapters
  )
    return Promise.resolve({ status: "unavailable", reason: "not-found" });
  const result = fetchChapter(book, chapter);
  for (const neighbor of [
    prevChapter(book, chapter),
    nextChapter(book, chapter),
  ]) {
    if (neighbor) void fetchChapter(neighbor.book.code, neighbor.chapter);
  }
  return result;
}
