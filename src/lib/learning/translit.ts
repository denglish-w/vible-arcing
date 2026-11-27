// Typing Greek with a Latin keyboard (spec 010 FR-008; research R8): single
// Beta Code letters, final sigma at the end of a word. Greek passes through.

const LOWER: Record<string, string> = {
  a: "α",
  b: "β",
  g: "γ",
  d: "δ",
  e: "ε",
  z: "ζ",
  h: "η",
  q: "θ",
  i: "ι",
  k: "κ",
  l: "λ",
  m: "μ",
  n: "ν",
  c: "ξ",
  o: "ο",
  p: "π",
  r: "ρ",
  s: "σ",
  t: "τ",
  u: "υ",
  f: "φ",
  x: "χ",
  y: "ψ",
  w: "ω",
};

/** Converts Latin letters as typed, turning σ before whitespace into ς. */
export function toGreek(input: string): string {
  let out = "";
  for (const char of input) {
    const lower = char.toLowerCase();
    const greek = Object.hasOwn(LOWER, lower) ? LOWER[lower] : undefined;
    out += greek ? (char === lower ? greek : greek.toUpperCase()) : char;
  }
  return out.replace(/σ(?=\s)/g, "ς");
}

/** As `toGreek`, and also turns a final σ into ς (on check). */
export function finalise(input: string): string {
  return toGreek(input).replace(/σ$/, "ς");
}
