// Metadata for the 27 books of the Greek New Testament.
// `code` is the MACULA / BSB book code used to join the data tables.
// Greek titles are rendered lowercase without accents, matching the
// SBLGNT running headers style (e.g. "κατα ιωαννην" for John).
export const BOOKS = [
  { id: "matthew", name: "Matthew", greek: "κατα μαθθαιον", chapters: 28, code: "MAT", group: "GOSPELS AND ACTS" },
  { id: "mark", name: "Mark", greek: "κατα μαρκον", chapters: 16, code: "MRK", group: "GOSPELS AND ACTS" },
  { id: "luke", name: "Luke", greek: "κατα λουκαν", chapters: 24, code: "LUK", group: "GOSPELS AND ACTS" },
  { id: "john", name: "John", greek: "κατα ιωαννην", chapters: 21, code: "JHN", group: "GOSPELS AND ACTS" },
  { id: "acts", name: "Acts", greek: "πραξεις αποστολων", chapters: 28, code: "ACT", group: "GOSPELS AND ACTS" },
  { id: "romans", name: "Romans", greek: "προς ρωμαιους", chapters: 16, code: "ROM", group: "LETTERS" },
  { id: "1corinthians", name: "1 Corinthians", greek: "προς κορινθιους α", chapters: 16, code: "1CO", group: "LETTERS" },
  { id: "2corinthians", name: "2 Corinthians", greek: "προς κορινθιους β", chapters: 13, code: "2CO", group: "LETTERS" },
  { id: "galatians", name: "Galatians", greek: "προς γαλατας", chapters: 6, code: "GAL", group: "LETTERS" },
  { id: "ephesians", name: "Ephesians", greek: "προς εφεσιους", chapters: 6, code: "EPH", group: "LETTERS" },
  { id: "philippians", name: "Philippians", greek: "προς φιλιππησιους", chapters: 4, code: "PHP", group: "LETTERS" },
  { id: "colossians", name: "Colossians", greek: "προς κολοσσαεις", chapters: 4, code: "COL", group: "LETTERS" },
  { id: "1thessalonians", name: "1 Thessalonians", greek: "προς θεσσαλονικεις α", chapters: 5, code: "1TH", group: "LETTERS" },
  { id: "2thessalonians", name: "2 Thessalonians", greek: "προς θεσσαλονικεις β", chapters: 3, code: "2TH", group: "LETTERS" },
  { id: "1timothy", name: "1 Timothy", greek: "προς τιμοθεον α", chapters: 6, code: "1TI", group: "LETTERS" },
  { id: "2timothy", name: "2 Timothy", greek: "προς τιμοθεον β", chapters: 4, code: "2TI", group: "LETTERS" },
  { id: "titus", name: "Titus", greek: "προς τιτον", chapters: 3, code: "TIT", group: "LETTERS" },
  { id: "philemon", name: "Philemon", greek: "προς φιλημονα", chapters: 1, code: "PHM", group: "LETTERS" },
  { id: "hebrews", name: "Hebrews", greek: "προς εβραιους", chapters: 13, code: "HEB", group: "LETTERS" },
  { id: "james", name: "James", greek: "ιακωβου", chapters: 5, code: "JAS", group: "LETTERS" },
  { id: "1peter", name: "1 Peter", greek: "πετρου α", chapters: 5, code: "1PE", group: "LETTERS" },
  { id: "2peter", name: "2 Peter", greek: "πετρου β", chapters: 3, code: "2PE", group: "LETTERS" },
  { id: "1john", name: "1 John", greek: "ιωαννου α", chapters: 5, code: "1JN", group: "LETTERS" },
  { id: "2john", name: "2 John", greek: "ιωαννου β", chapters: 1, code: "2JN", group: "LETTERS" },
  { id: "3john", name: "3 John", greek: "ιωαννου γ", chapters: 1, code: "3JN", group: "LETTERS" },
  { id: "jude", name: "Jude", greek: "ιουδα", chapters: 1, code: "JUD", group: "LETTERS" },
  { id: "revelation", name: "Revelation", greek: "αποκαλυψις ιωαννου", chapters: 22, code: "REV", group: "REVELATION" },
];

export const GROUPS = ["GOSPELS AND ACTS", "LETTERS", "REVELATION"];

export function getBook(id) {
  return BOOKS.find((b) => b.id === id);
}

export function getBookByCode(code) {
  return BOOKS.find((b) => b.code === code);
}

export function booksInGroup(group) {
  return BOOKS.filter((b) => b.group === group);
}