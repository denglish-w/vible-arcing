export const GROUPS = ["Gospels and Acts", "Letters", "Revelation"] as const;
export type BookGroup = (typeof GROUPS)[number];
export interface Book {
  code: string;
  name: string;
  greek: string;
  chapters: number;
  group: BookGroup;
}

const entries: [string, string, string, number][] = [
  ["mat", "Matthew", "κατα μαθθαιον", 28],
  ["mrk", "Mark", "κατα μαρκον", 16],
  ["luk", "Luke", "κατα λουκαν", 24],
  ["jhn", "John", "κατα ιωαννην", 21],
  ["act", "Acts", "πραξεις αποστολων", 28],
  ["rom", "Romans", "προς ρωμαιους", 16],
  ["1co", "1 Corinthians", "προς κορινθιους α", 16],
  ["2co", "2 Corinthians", "προς κορινθιους β", 13],
  ["gal", "Galatians", "προς γαλατας", 6],
  ["eph", "Ephesians", "προς εφεσιους", 6],
  ["php", "Philippians", "προς φιλιππησιους", 4],
  ["col", "Colossians", "προς κολοσσαεις", 4],
  ["1th", "1 Thessalonians", "προς θεσσαλονικεις α", 5],
  ["2th", "2 Thessalonians", "προς θεσσαλονικεις β", 3],
  ["1ti", "1 Timothy", "προς τιμοθεον α", 6],
  ["2ti", "2 Timothy", "προς τιμοθεον β", 4],
  ["tit", "Titus", "προς τιτον", 3],
  ["phm", "Philemon", "προς φιλημονα", 1],
  ["heb", "Hebrews", "προς εβραιους", 13],
  ["jas", "James", "ιακωβου", 5],
  ["1pe", "1 Peter", "πετρου α", 5],
  ["2pe", "2 Peter", "πετρου β", 3],
  ["1jn", "1 John", "ιωαννου α", 5],
  ["2jn", "2 John", "ιωαννου β", 1],
  ["3jn", "3 John", "ιωαννου γ", 1],
  ["jud", "Jude", "ιουδα", 1],
  ["rev", "Revelation", "αποκαλυψις ιωαννου", 22],
];

export const BOOKS: readonly Book[] = entries.map(
  ([code, name, greek, chapters], index) => ({
    code,
    name,
    greek,
    chapters,
    group: GROUPS[index < 5 ? 0 : index < 26 ? 1 : 2],
  }),
);
export function getBook(code: string) {
  return BOOKS.find((book) => book.code === code);
}
export function booksInGroup(group: BookGroup) {
  return BOOKS.filter((book) => book.group === group);
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
  const index = BOOKS.findIndex((book) => book.code === code);
  const book = BOOKS[index];
  if (
    !book ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > book.chapters
  )
    return null;
  const adjacent = chapter + offset;
  if (adjacent >= 1 && adjacent <= book.chapters)
    return { book, chapter: adjacent };
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
