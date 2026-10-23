// Build a human-readable parsing string from MACULA morphology columns.
// Verbs switch template by mood (finite / participle / infinitive).

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function join(...a) {
  return a.filter(Boolean).join(" ");
}
function personLabel(p) {
  if (p === "1st") return "1st person";
  if (p === "2nd") return "2nd person";
  if (p === "3rd") return "3rd person";
  return p ? cap(p) : "";
}

export function buildParse(w) {
  if (!w) return "";
  const pos = w.pos;
  const cng = join(cap(w.case), cap(w.number), cap(w.gender));
  switch (pos) {
    case "verb": {
      const mood = w.mood;
      if (mood === "participle")
        return join(cap(w.tense), cap(w.voice), "participle", cng && (cng + ","));
      if (mood === "infinitive")
        return join(cap(w.tense), cap(w.voice), "infinitive");
      return join(personLabel(w.person), cap(w.number), cap(w.tense), cap(w.voice), cap(mood));
    }
    case "noun":
      return join(w.pos_type === "proper" ? "proper noun" : "noun", cng);
    case "det":
      return join("article", cng);
    case "pron":
      return join("pronoun", personLabel(w.person), cng);
    case "adj":
      return join("adjective", cng, w.degree ? `(${w.degree})` : "");
    case "num":
      return join("numeral", cng);
    case "adv":
      return join("adverb", w.degree ? `(${w.degree})` : "");
    case "conj":
      return "conjunction";
    case "prep":
      return "preposition";
    case "ptcl":
      return "particle";
    case "intj":
      return "interjection";
    default:
      return cap(pos) || "";
  }
}

// Full parse string including the part of speech label, e.g.
// "noun · nominative singular feminine"
export function fullParse(w) {
  return buildParse(w);
}