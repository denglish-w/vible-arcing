import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseChapter } from "./parse";
const fixturePath = new URL(
  "../../../public/corpus/v1/PHP/1.json",
  import.meta.url,
);
const fixture = () => JSON.parse(readFileSync(fixturePath, "utf8"));

describe("corpus format v1", () => {
  it("accepts the committed chapter and preserves its MACULA identities and punctuation", () => {
    const raw = fixture();
    const chapter = parseChapter(raw);
    expect(chapter.book).toBe("PHP");
    expect(chapter.chapter).toBe(1);
    expect(chapter.words.length).toBeGreaterThan(500);
    expect(chapter.words[0].id).toBe("n50001001001");
    expect(chapter.words.map(({ id }) => id)).toEqual(
      raw.words.map((word: { id: string }) => word.id),
    );
    expect(chapter.words.map(({ text, after }) => text + after).join("")).toBe(
      raw.words
        .map((word: { text: string; after: string }) => word.text + word.after)
        .join(""),
    );
  });
  it("rejects unknown formats, missing identities, duplicate identities and malformed morphology", () => {
    expect(() => parseChapter({ ...fixture(), format: 2 })).toThrow(
      /Invalid corpus|Invalid morphology/,
    );
    for (const patch of [
      { id: undefined },
      { id: "position-1" },
      { v: 0 },
      { after: null },
      { m: { person: 3 } },
    ]) {
      const raw = fixture();
      raw.words[0] = { ...raw.words[0], ...patch };
      expect(() => parseChapter(raw)).toThrow(
        /Invalid corpus|Invalid morphology/,
      );
    }
    const raw = fixture();
    raw.words[1].id = raw.words[0].id;
    expect(() => parseChapter(raw)).toThrow(
      /Invalid corpus|Invalid morphology/,
    );
  });
  it("rejects malformed chapter containers and mismatched canonical ranges", () => {
    for (const raw of [
      null,
      [],
      {},
      { ...fixture(), chapter: 5 },
      { ...fixture(), book: "bad" },
      { ...fixture(), source: {} },
      { ...fixture(), words: [] },
    ])
      expect(() => parseChapter(raw)).toThrow(
        /Invalid corpus|Invalid morphology/,
      );
  });
  it("publishes no UBS keys and attributes both modified source datasets", () => {
    const forbidden = (value: unknown): boolean => {
      if (typeof value !== "object" || value === null) return false;
      return Object.entries(value).some(
        ([key, child]) => ["ln", "domain"].includes(key) || forbidden(child),
      );
    };
    expect(forbidden(fixture())).toBe(false);
    const attribution = JSON.parse(
      readFileSync(
        new URL("../../../public/corpus/v1/attribution.json", import.meta.url),
        "utf8",
      ),
    );
    expect(attribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "SBL Greek New Testament",
          license: "CC BY 4.0",
          modified: true,
        }),
        expect.objectContaining({
          name: "MACULA Greek Linguistic Datasets",
          license: "CC BY 4.0",
          modified: true,
        }),
      ]),
    );
    for (const source of attribution) {
      expect(source.licenseUrl).toMatch(/^https:\/\//);
      expect(source.statement.length).toBeGreaterThan(0);
    }
  });
});
