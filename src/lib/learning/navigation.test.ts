import { describe, expect, it } from "vitest";
import { adjacentWord } from "./navigation.ts";

const words = [
  { id: "a", v: 3 },
  { id: "b", v: 3 },
  { id: "c", v: 4 },
];

describe("adjacentWord", () => {
  it("follows reading order across verses", () => {
    expect(adjacentWord(words, "b", 1)).toBe("c");
    expect(adjacentWord(words, "c", -1)).toBe("b");
  });

  it("returns null past the last and first word", () => {
    expect(adjacentWord(words, "c", 1)).toBeNull();
    expect(adjacentWord(words, "a", -1)).toBeNull();
  });

  it("returns null for an unknown word", () => {
    expect(adjacentWord(words, "x", 1)).toBeNull();
  });
});
