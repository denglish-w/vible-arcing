import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  InvalidCorpusError,
  parseAttribution,
  parseChapter,
  UnknownFormatError,
} from "./format.ts";

const corpusDir = path.resolve(import.meta.dirname, "../../../corpus/v1");
const readJson = (file: string) =>
  JSON.parse(readFileSync(path.join(corpusDir, file), "utf8"));

const FILE = "PHP/1.json";
const fixture = () => readJson(FILE);
const attributionFixture = () => readJson("attribution.json");

describe("parseChapter", () => {
  it("accepts the committed Philippians 1", () => {
    const chapter = parseChapter(fixture(), FILE);
    expect(chapter.book).toBe("PHP");
    expect(chapter.words).toHaveLength(501);
    expect(chapter.words[0]).toMatchObject({ id: "n50001001001", v: 1 });
    // MACULA has no gloss for one word; the field is simply absent.
    expect(chapter.words.filter((w) => w.gloss === undefined)).toHaveLength(1);
  });

  it("refuses an unknown format version, naming it and the file", () => {
    const json = { ...fixture(), format: 2 };
    expect(() => parseChapter(json, FILE)).toThrow(UnknownFormatError);
    expect(() => parseChapter(json, FILE)).toThrow(
      /PHP\/1\.json is in corpus format 2/,
    );
    expect(() => parseChapter({ words: [] }, FILE)).toThrow(
      /corpus format undefined/,
    );
  });

  it.each([
    ["a word without an id", (j: any) => delete j.words[3].id],
    ["another edition", (j: any) => (j.edition = "NA28")],
    ["a short commit", (j: any) => (j.source.commit = "8423afe")],
    ["no words", (j: any) => (j.words = [])],
    ["verse 0", (j: any) => (j.words[0].v = 0)],
    ["a fractional verse", (j: any) => (j.words[0].v = 1.5)],
    ["an empty text", (j: any) => (j.words[0].text = "")],
  ])("refuses %s", (_name, mutate) => {
    const json = fixture();
    mutate(json);
    expect(() => parseChapter(json, FILE)).toThrow(InvalidCorpusError);
  });

  it("accepts an empty after", () => {
    const json = fixture();
    json.words.at(-1).after = "";
    expect(() => parseChapter(json, FILE)).not.toThrow();
  });

  it("refuses fields outside the whitelist, such as Louw-Nida data", () => {
    const json = fixture();
    json.words[0].ln = "93.294a";
    expect(() => parseChapter(json, FILE)).toThrow(/ln/);
    const morph = fixture();
    morph.words[0].m.domain = "093001";
    expect(() => parseChapter(morph, FILE)).toThrow(/domain/);
  });

  it("refuses books and chapters outside the New Testament", () => {
    expect(() => parseChapter({ ...fixture(), book: "ZZZ" }, FILE)).toThrow(
      /ZZZ 1 is not a New Testament chapter/,
    );
    expect(() => parseChapter({ ...fixture(), chapter: 9 }, FILE)).toThrow(
      /PHP 9 is not a New Testament chapter/,
    );
  });

  it("refuses words from another book or chapter, or the wrong verse", () => {
    const book = fixture();
    book.words[0].id = "n40001001001";
    expect(() => parseChapter(book, FILE)).toThrow(/is not in PHP 1/);
    const chapter = fixture();
    chapter.words[0].id = "n50002001001";
    expect(() => parseChapter(chapter, FILE)).toThrow(/is not in PHP 1/);
    const verse = fixture();
    verse.words[0].v = 2;
    expect(() => parseChapter(verse, FILE)).toThrow(/marked as verse 2/);
  });

  it("refuses duplicate ids and words out of reading order", () => {
    const dup = fixture();
    dup.words[1] = { ...dup.words[0] };
    expect(() => parseChapter(dup, FILE)).toThrow(/out of reading order/);
    const swapped = fixture();
    [swapped.words[0], swapped.words[1]] = [swapped.words[1], swapped.words[0]];
    expect(() => parseChapter(swapped, FILE)).toThrow(/out of reading order/);
  });
});

describe("parseAttribution", () => {
  it("accepts the committed attribution and credits SBLGNT and MACULA", () => {
    const { datasets } = parseAttribution(attributionFixture(), "attribution");
    expect(datasets.map((d) => d.name)).toEqual([
      "SBL Greek New Testament",
      "MACULA Greek Linguistic Datasets",
      "Berean Interlinear Bible",
    ]);
    expect(datasets.slice(0, 2).map((d) => d.license)).toEqual([
      "CC BY 4.0",
      "CC BY 4.0",
    ]);
    for (const d of datasets) {
      expect(d.modified).toBe(true);
      expect(d.modifications.length).toBeGreaterThan(0);
    }
  });

  it("refuses an unknown format version, naming it", () => {
    expect(() =>
      parseAttribution({ ...attributionFixture(), format: 0 }, "attribution"),
    ).toThrow(/corpus format 0/);
  });

  it("refuses a dataset without a modification note", () => {
    const json = attributionFixture();
    delete json.datasets[0].modifications;
    expect(() => parseAttribution(json, "attribution")).toThrow(
      InvalidCorpusError,
    );
  });

  it.each(["javascript:alert(1)", "data:text/html,x", "http://example.org/"])(
    "refuses the link %s",
    (url) => {
      const json = attributionFixture();
      json.datasets[0].licenseUrl = url;
      expect(() => parseAttribution(json, "attribution")).toThrow(
        InvalidCorpusError,
      );
    },
  );
});
