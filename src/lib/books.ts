// The 27 New Testament books in canonical order, with MACULA's book codes and
// SBLGNT chapter counts (both read from MACULA Greek's SBLGNT lowfat files at the
// commit pinned in scripts/ingest/README.md). The corpus store loads this list,
// so it can tell a chapter that does not exist from one not yet ingested; the
// reader uses it for the contents, chapter lists and navigation.
// Shared with scripts (see src/db/README.md).

export const GROUPS = ["Gospels and Acts", "Letters", "Revelation"] as const;
export type BookGroup = (typeof GROUPS)[number];

export type BookCode = (typeof BOOKS)[number]["code"];

export type Book = {
  /** MACULA's upper-case code, as used in corpus files and the store. */
  code: string;
  /** Lower-case code used in URLs, such as `/read/php/1`. */
  slug: string;
  name: string;
  /** Unaccented Greek title, as in the prototype. */
  greek: string;
  chapters: number;
  group: BookGroup;
};

export const BOOKS = [
  book("MAT", "Matthew", "κατα μαθθαιον", 28, 0),
  book("MRK", "Mark", "κατα μαρκον", 16, 0),
  book("LUK", "Luke", "κατα λουκαν", 24, 0),
  book("JHN", "John", "κατα ιωαννην", 21, 0),
  book("ACT", "Acts", "πραξεις αποστολων", 28, 0),
  book("ROM", "Romans", "προς ρωμαιους", 16, 1),
  book("1CO", "1 Corinthians", "προς κορινθιους α", 16, 1),
  book("2CO", "2 Corinthians", "προς κορινθιους β", 13, 1),
  book("GAL", "Galatians", "προς γαλατας", 6, 1),
  book("EPH", "Ephesians", "προς εφεσιους", 6, 1),
  book("PHP", "Philippians", "προς φιλιππησιους", 4, 1),
  book("COL", "Colossians", "προς κολοσσαεις", 4, 1),
  book("1TH", "1 Thessalonians", "προς θεσσαλονικεις α", 5, 1),
  book("2TH", "2 Thessalonians", "προς θεσσαλονικεις β", 3, 1),
  book("1TI", "1 Timothy", "προς τιμοθεον α", 6, 1),
  book("2TI", "2 Timothy", "προς τιμοθεον β", 4, 1),
  book("TIT", "Titus", "προς τιτον", 3, 1),
  book("PHM", "Philemon", "προς φιλημονα", 1, 1),
  book("HEB", "Hebrews", "προς εβραιους", 13, 1),
  book("JAS", "James", "ιακωβου", 5, 1),
  book("1PE", "1 Peter", "πετρου α", 5, 1),
  book("2PE", "2 Peter", "πετρου β", 3, 1),
  book("1JN", "1 John", "ιωαννου α", 5, 1),
  book("2JN", "2 John", "ιωαννου β", 1, 1),
  book("3JN", "3 John", "ιωαννου γ", 1, 1),
  book("JUD", "Jude", "ιουδα", 1, 1),
  book("REV", "Revelation", "αποκαλυψις ιωαννου", 22, 2),
] as const;

function book<const C extends string>(
  code: C,
  name: string,
  greek: string,
  chapters: number,
  group: 0 | 1 | 2,
) {
  return {
    code,
    slug: code.toLowerCase(),
    name,
    greek,
    chapters,
    group: GROUPS[group],
  } satisfies Book;
}

const byCode = new Map<string, Book>(BOOKS.map((b) => [b.code, b]));
const bySlug = new Map<string, Book>(BOOKS.map((b) => [b.slug, b]));

export function isBookCode(code: string): code is BookCode {
  return byCode.has(code);
}

export function getBook(code: string): Book | undefined {
  return byCode.get(code);
}

/** The book for a URL segment such as `php`; upper-case codes do not match. */
export function bookBySlug(slug: string): Book | undefined {
  return bySlug.get(slug);
}

export function booksInGroup(group: BookGroup): Book[] {
  return BOOKS.filter((b) => b.group === group);
}

/** True if the book is in the New Testament and has that chapter. */
export function chapterExists(code: string, chapter: number): boolean {
  const b = byCode.get(code);
  return (
    b !== undefined &&
    Number.isInteger(chapter) &&
    chapter >= 1 &&
    chapter <= b.chapters
  );
}

export interface ChapterLocation {
  book: Book;
  chapter: number;
}

function adjacentChapter(
  code: string,
  chapter: number,
  offset: -1 | 1,
): ChapterLocation | null {
  if (!chapterExists(code, chapter)) return null;
  const index = BOOKS.findIndex((b) => b.code === code);
  const current = BOOKS[index];
  const adjacent = chapter + offset;
  if (adjacent >= 1 && adjacent <= current.chapters)
    return { book: current, chapter: adjacent };
  const neighbor = BOOKS[index + offset];
  return neighbor
    ? { book: neighbor, chapter: offset === 1 ? 1 : neighbor.chapters }
    : null;
}

export function prevChapter(code: string, chapter: number) {
  return adjacentChapter(code, chapter, -1);
}

export function nextChapter(code: string, chapter: number) {
  return adjacentChapter(code, chapter, 1);
}
