import { describe, expect, it } from "vitest";
import {
  BOOKS,
  GROUPS,
  booksInGroup,
  getBook,
  nextChapter,
  prevChapter,
} from "./books";

describe("New Testament navigation", () => {
  it("lists the complete canonical contents and all 260 chapters", () => {
    expect(BOOKS).toHaveLength(27);
    expect(new Set(BOOKS.map(({ code }) => code)).size).toBe(27);
    expect(BOOKS.reduce((count, book) => count + book.chapters, 0)).toBe(260);
    expect(GROUPS.map((group) => booksInGroup(group).length)).toEqual([
      5, 21, 1,
    ]);
    expect(getBook("php")?.name).toBe("Philippians");
    expect(getBook("unknown")).toBeUndefined();
  });
  it("crosses book boundaries in both directions", () => {
    expect(nextChapter("mat", 28)).toEqual({
      book: getBook("mrk"),
      chapter: 1,
    });
    expect(prevChapter("mrk", 1)).toEqual({
      book: getBook("mat"),
      chapter: 28,
    });
    expect(nextChapter("php", 1)?.chapter).toBe(2);
    expect(prevChapter("php", 2)?.chapter).toBe(1);
  });
  it("omits navigation at the canon edges and rejects invalid passages", () => {
    expect(prevChapter("mat", 1)).toBeNull();
    expect(nextChapter("rev", 22)).toBeNull();
    for (const chapter of [0, -1, 1.5, 29, NaN])
      expect(nextChapter("mat", chapter)).toBeNull();
    expect(prevChapter("nope", 1)).toBeNull();
  });
});
