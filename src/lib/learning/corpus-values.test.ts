// Catches drift after a re-ingest: every part of speech and morphology value in
// the committed corpus must be one the parsing form offers (research R4).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseChapter } from "../corpus/format.ts";
import { FIELD_VALUES, corpusPosToForm, type FieldName } from "./fields.ts";

const corpusRoot = path.resolve(import.meta.dirname, "../../../corpus/v1");

describe("committed corpus values", () => {
  it("are all in the parsing form's closed lists", () => {
    const unknownPos = new Set<string>();
    const unknownValues = new Set<string>();
    let words = 0;
    for (const book of readdirSync(corpusRoot)) {
      const dir = path.join(corpusRoot, book);
      if (!book.match(/^[1-3]?[A-Z]{2,3}$/)) continue;
      for (const file of readdirSync(dir)) {
        const chapter = parseChapter(
          JSON.parse(readFileSync(path.join(dir, file), "utf8")),
          `${book}/${file}`,
        );
        for (const word of chapter.words) {
          words++;
          if (corpusPosToForm(word.pos) === null) unknownPos.add(word.pos);
          for (const [field, value] of Object.entries(word.m ?? {})) {
            if (field === "degree" || value === undefined) continue;
            if (!FIELD_VALUES[field as FieldName].includes(value))
              unknownValues.add(`${field}=${value}`);
          }
        }
      }
    }
    expect(words).toBeGreaterThan(100_000);
    expect([...unknownPos]).toEqual([]);
    expect([...unknownValues]).toEqual([]);
  });
});
