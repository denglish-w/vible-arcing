import { describe, expect, it } from "vitest";
import { BOOKS, chapterExists, getBook, isBookCode } from "./books.ts";

describe("BOOKS", () => {
  it("lists the 27 books once each, Matthew to Revelation", () => {
    expect(BOOKS).toHaveLength(27);
    expect(new Set(BOOKS.map((b) => b.code)).size).toBe(27);
    expect(BOOKS[0].code).toBe("MAT");
    expect(BOOKS.at(-1)?.code).toBe("REV");
  });

  it("uses MACULA's codes in canonical order", () => {
    expect(BOOKS.map((b) => b.code).join(" ")).toBe(
      "MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV",
    );
  });

  it("has the right chapter counts", () => {
    const counts = Object.fromEntries(BOOKS.map((b) => [b.code, b.chapters]));
    expect(counts).toMatchObject({
      MRK: 16,
      ROM: 16,
      PHP: 4,
      "3JN": 1,
      REV: 22,
    });
  });

  it("has the 260 chapters of the New Testament", () => {
    expect(BOOKS.reduce((n, b) => n + b.chapters, 0)).toBe(260);
  });
});

describe("chapterExists", () => {
  it("accepts every chapter of a book and nothing past it", () => {
    expect(chapterExists("PHP", 1)).toBe(true);
    expect(chapterExists("PHP", 4)).toBe(true);
    expect(chapterExists("PHP", 5)).toBe(false);
    expect(chapterExists("PHP", 0)).toBe(false);
    expect(chapterExists("PHP", 1.5)).toBe(false);
  });

  it("rejects books outside the New Testament and other spellings", () => {
    expect(chapterExists("GEN", 1)).toBe(false);
    expect(chapterExists("php", 1)).toBe(false);
    expect(getBook("__proto__")).toBeUndefined();
    expect(getBook("constructor")).toBeUndefined();
    expect(isBookCode("PHP")).toBe(true);
    expect(isBookCode("toString")).toBe(false);
  });
});
