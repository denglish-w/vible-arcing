// Part-of-speech categories for the "Color by part of speech" study feature.
// Each category has a label, an underline style (varied so the legend stays
// readable for color-blind users), and a CSS variable `--pos-<key>` that holds
// the tint per theme (defined in src/index.css).

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
];

const BY_KEY = Object.fromEntries(POS_CATEGORIES.map((c) => [c.key, c]));

// Map a MACULA word's pos (+ mood for verbs) to one of the color categories.
// Participle and infinitive come from mood on verb rows; all other verbs are
// finite. num/intj and anything unmapped fall into the neutral "other" bucket.
export function wordCategory(pos, mood) {
  if (pos === "verb") {
    if (mood === "participle") return "participle";
    if (mood === "infinitive") return "infinitive";
    return "verb";
  }
  if (pos === "noun") return "noun";
  if (pos === "adj") return "adj";
  if (pos === "det") return "det";
  if (pos === "pron") return "pron";
  if (pos === "prep") return "prep";
  if (pos === "conj" || pos === "ptcl") return "conj";
  if (pos === "adv") return "adv";
  return "other";
}

// Inline style for a colored word: a soft underline plus a subtle text tint.
export function categoryStyle(key) {
  const cat = BY_KEY[key];
  if (!cat) return null;
  return {
    textDecorationLine: "underline",
    textDecorationStyle: cat.underline,
    textDecorationColor: `hsl(var(--pos-${key}))`,
    color: `hsl(var(--pos-${key}))`,
    textUnderlineOffset: "3px",
  };
}

// A small underline swatch for the legend, shown in the category's own style.
export function legendSwatchStyle(key) {
  const cat = BY_KEY[key];
  if (!cat) return {};
  return {
    textDecorationLine: "underline",
    textDecorationStyle: cat.underline,
    textDecorationColor: `hsl(var(--pos-${key}))`,
    color: `hsl(var(--pos-${key}))`,
    textUnderlineOffset: "3px",
  };
}