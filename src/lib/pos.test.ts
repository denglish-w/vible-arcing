import { describe, expect, it } from "vitest";
import { POS_CATEGORIES, categoryStyle, wordCategory } from "./pos";

describe("part-of-speech cues", () => {
  it("separates participles and infinitives from finite verbs", () => {
    expect(wordCategory("verb", "participle")).toBe("participle");
    expect(wordCategory("verb", "infinitive")).toBe("infinitive");
    expect(wordCategory("verb", "indicative")).toBe("verb");
  });
  it("groups particles and conjunctions and gives unmapped parts the other category", () => {
    expect(wordCategory("ptcl")).toBe("conj");
    expect(wordCategory("particle")).toBe("conj");
    expect(wordCategory("conj")).toBe("conj");
    for (const pos of ["num", "intj", "unknown", "participle"])
      expect(wordCategory(pos)).toBe("other");
  });
  it("supplies every category with a token colour and underline", () => {
    expect(POS_CATEGORIES).toHaveLength(11);
    for (const { key, underline } of POS_CATEGORIES) {
      expect(categoryStyle(key)).toMatchObject({
        color: `var(--pos-${key})`,
        textDecorationLine: "underline",
        textDecorationStyle: underline,
      });
    }
  });
});
