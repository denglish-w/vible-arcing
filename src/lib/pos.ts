import type { CSSProperties } from "react";

export const POS_CATEGORIES = [
  { key: "verb", label: "Verb (finite)", underline: "solid" },
  { key: "participle", label: "Participle", underline: "double" },
  { key: "infinitive", label: "Infinitive", underline: "dotted" },
  { key: "noun", label: "Noun", underline: "solid" },
  { key: "adj", label: "Adjective", underline: "dashed" },
  { key: "det", label: "Article", underline: "dotted" },
  { key: "pron", label: "Pronoun", underline: "solid" },
  { key: "prep", label: "Preposition", underline: "dashed" },
  { key: "conj", label: "Conjunction / Particle", underline: "wavy" },
  { key: "adv", label: "Adverb", underline: "double" },
  { key: "other", label: "Numeral / Interjection", underline: "dotted" },
] as const;
export type PosCategory = (typeof POS_CATEGORIES)[number]["key"];
export function wordCategory(pos: string, mood?: string): PosCategory {
  if (pos === "verb")
    return mood === "participle"
      ? "participle"
      : mood === "infinitive"
        ? "infinitive"
        : "verb";
  if (pos === "ptcl" || pos === "particle") return "conj";
  return (
    POS_CATEGORIES.find(
      (category) =>
        category.key === pos &&
        category.key !== "participle" &&
        category.key !== "infinitive",
    )?.key ?? "other"
  );
}
export function categoryStyle(key: PosCategory): CSSProperties {
  const category = POS_CATEGORIES.find((candidate) => candidate.key === key)!;
  return {
    color: `var(--pos-${key})`,
    textDecorationColor: `var(--pos-${key})`,
    textDecorationLine: "underline",
    textDecorationStyle: category.underline,
    textUnderlineOffset: "3px",
  };
}
