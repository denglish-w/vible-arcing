// The 27 New Testament books in canonical order, with MACULA's book codes and
// SBLGNT chapter counts (both read from MACULA Greek's SBLGNT lowfat files at the
// commit pinned in scripts/ingest/README.md). The corpus store loads this list,
// so it can tell a chapter that does not exist from one not yet ingested.
// Shared with scripts (see src/db/README.md).

export type BookCode = (typeof BOOKS)[number]["code"];

export type Book = {
  /** MACULA's upper-case code, as used in corpus files and the store. */
  code: string;
  chapters: number;
};

export const BOOKS = [
  { code: "MAT", chapters: 28 },
  { code: "MRK", chapters: 16 },
  { code: "LUK", chapters: 24 },
  { code: "JHN", chapters: 21 },
  { code: "ACT", chapters: 28 },
  { code: "ROM", chapters: 16 },
  { code: "1CO", chapters: 16 },
  { code: "2CO", chapters: 13 },
  { code: "GAL", chapters: 6 },
  { code: "EPH", chapters: 6 },
  { code: "PHP", chapters: 4 },
  { code: "COL", chapters: 4 },
  { code: "1TH", chapters: 5 },
  { code: "2TH", chapters: 3 },
  { code: "1TI", chapters: 6 },
  { code: "2TI", chapters: 4 },
  { code: "TIT", chapters: 3 },
  { code: "PHM", chapters: 1 },
  { code: "HEB", chapters: 13 },
  { code: "JAS", chapters: 5 },
  { code: "1PE", chapters: 5 },
  { code: "2PE", chapters: 3 },
  { code: "1JN", chapters: 5 },
  { code: "2JN", chapters: 1 },
  { code: "3JN", chapters: 1 },
  { code: "JUD", chapters: 1 },
  { code: "REV", chapters: 22 },
] as const satisfies readonly Book[];

const byCode = new Map<string, Book>(BOOKS.map((book) => [book.code, book]));

export function isBookCode(code: string): code is BookCode {
  return byCode.has(code);
}

export function getBook(code: string): Book | undefined {
  return byCode.get(code);
}

/** True if the book is in the New Testament and has that chapter. */
export function chapterExists(code: string, chapter: number): boolean {
  const book = byCode.get(code);
  return (
    book !== undefined &&
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= book.chapters
  );
}
