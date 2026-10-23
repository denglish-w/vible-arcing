// Shared Greek-key transliteration, accent-stripping, and parsing-form logic
// used by both the client (Learning form) and the server (grading).

// Latin-key → Greek letter map (Greeklish). 's' is handled specially: ς at the
// end of a word, σ elsewhere.
const GREEK_MAP = {
  a: "α", b: "β", g: "γ", d: "δ", e: "ε", z: "ζ", h: "η", q: "θ",
  i: "ι", k: "κ", l: "λ", m: "μ", n: "ν", c: "ξ", o: "ο", p: "π",
  r: "ρ", t: "τ", u: "υ", f: "φ", x: "χ", y: "ψ", w: "ω",
};

export function latinToGreek(latin) {
  let out = "";
  for (let i = 0; i < latin.length; i++) {
    const ch = latin[i].toLowerCase();
    if (ch === "s") {
      out += i === latin.length - 1 ? "ς" : "σ";
    } else {
      out += GREEK_MAP[ch] ?? ch;
    }
  }
  return out;
}

// Inverse of latinToGreek for plain (accentless) Greek, used to restore a
// previously typed word into GreekInput's internal Latin source.
const GREEK_TO_LATIN = (() => {
  const m = {};
  for (const [lat, gr] of Object.entries(GREEK_MAP)) m[gr] = lat;
  m["σ"] = "s";
  m["ς"] = "s";
  return m;
})();

export function greekToLatin(greek) {
  let out = "";
  for (const ch of (greek || "")) out += GREEK_TO_LATIN[ch] ?? ch;
  return out;
}

// Strip accents, breathing marks, capitalization, and punctuation (including
// elision apostrophes such as δι') so a typed word can be compared to the
// stored word form without regard for diacritics.
export function deAccent(s) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/[^α-ω]/g, "");
}

// The synthetic "Not applicable" option offered for person and gender.
export const NA = "n/a";

// Fields that may legitimately be blank for a word (some pronouns have no
// person/gender). These dropdowns include a "Not applicable" option.
export const NA_FIELDS = new Set(["person", "gender"]);

// Closed Greek morphology sets. Used as a fallback so the parsing dropdowns are
// never empty even if the distinct-values query is slow or unavailable — the
// part-of-speech list is already fixed (POS_ORDER); these cover the rest.
export const MORPH_ENUMS = {
  tense: ["present", "imperfect", "future", "aorist", "perfect", "pluperfect"],
  voice: ["active", "middle", "passive"],
  mood: ["indicative", "subjunctive", "optative", "imperative", "participle", "infinitive"],
  person: ["first", "second", "third"],
  number: ["singular", "plural"],
  gender: ["masculine", "feminine", "neuter"],
  case: ["nominative", "genitive", "dative", "accusative", "vocative"],
};

export const POS_LABEL = {
  noun: "Noun",
  verb: "Verb",
  participle: "Participle",
  det: "Article",
  pron: "Pronoun",
  adj: "Adjective",
  adv: "Adverb",
  prep: "Preposition",
  conj: "Conjunction",
  ptcl: "Particle",
  num: "Numeral",
  intj: "Interjection",
};

// Fixed, human-friendly ordering of the part-of-speech options.
export const POS_ORDER = [
  "noun", "verb", "participle", "det", "pron", "adj", "adv", "prep", "conj", "ptcl", "num", "intj",
];

export const PERSON_LABEL = {
  first: "1st",
  second: "2nd",
  third: "3rd",
};

export const FIELD_LABELS = {
  pos: "Part of speech",
  tense: "Tense",
  voice: "Voice",
  mood: "Mood",
  person: "Person",
  number: "Number",
  gender: "Gender",
  case: "Case",
};

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

// Which parsing fields (besides pos) the form should show for a given part of
// speech and, for verbs, mood. Mirrors the grading rules so the server and the
// form agree on which fields were visible.
export function fieldsForPos(pos, mood) {
  switch (pos) {
    case "verb": {
      const f = ["tense", "voice", "mood"];
      if (mood === "indicative" || mood === "subjunctive" || mood === "optative" || mood === "imperative") {
        f.push("person", "number");
      } else if (mood === "participle") {
        f.push("case", "number", "gender");
      } else if (mood === "infinitive") {
        // no extra fields
      }
      return f;
    }
    case "participle":
      // A non-finite verb form: mood is implied, so the form shows tense, voice,
      // and the adjectival case/number/gender without a separate Mood field.
      return ["tense", "voice", "case", "number", "gender"];
    case "noun":
    case "adj":
    case "det":
    case "num":
      return ["case", "number", "gender"];
    case "pron":
      return ["case", "number", "gender", "person"];
    default:
      return [];
  }
}

// Display label for a stored value in a result row or dropdown.
export function displayValue(field, value) {
  if (value === NA) return "Not applicable";
  if (field === "pos") return POS_LABEL[value] ?? cap(value);
  if (field === "person") return PERSON_LABEL[value] ?? cap(value);
  return cap(value);
}

// Build the dropdown options for a field from the distinct column values.
// `pos` (the learner's chosen part of speech) is used so the "Not applicable"
// option is offered only for a pronoun's person and gender.
export function fieldOptions(field, distinctValues, pos) {
  if (field === "pos") {
    return POS_ORDER.map((v) => ({ value: v, label: POS_LABEL[v] ?? cap(v) }));
  }
  let values = (distinctValues ?? []).filter((v) => v !== "" && v != null);
  if (!values.length) values = MORPH_ENUMS[field] || [];
  values = values.slice().sort();
  const opts = values.map((v) => ({
    value: v,
    label: field === "person" ? PERSON_LABEL[v] ?? cap(v) : cap(v),
  }));
  if (pos === "pron" && NA_FIELDS.has(field)) opts.push({ value: NA, label: "Not applicable" });
  return opts;
}