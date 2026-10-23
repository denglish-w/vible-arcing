// Shared helpers for the diaglot translation workspace: segment building from
// split points, bracket overlap rules, and text joining for merges/exports.

export function emptyAnnotation(book, chapter, verse) {
  return { book, chapter, verse, splits: [], segments: {}, brackets: [] };
}

export function groupByVerse(words) {
  const map = new Map();
  for (const w of words) {
    if (!map.has(w.verse)) map.set(w.verse, []);
    map.get(w.verse).push(w);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

// Partition a verse's words into segments using the split points (word_num
// values after which to break). Returns { key, label, words } per segment, where
// key is the first word_num (stable across edits) and label is "21" or "21a"...
export function buildSegments(vwords, splits, verse) {
  const valid = new Set(vwords.map((w) => w.word_num));
  const clean = (splits || []).filter((s) => valid.has(s)).sort((a, b) => a - b);
  const set = new Set(clean);
  const parts = [];
  let cur = [];
  for (const w of vwords) {
    cur.push(w);
    if (set.has(w.word_num)) {
      parts.push(cur);
      cur = [];
    }
  }
  parts.push(cur);
  return parts.map((words, i) => {
    const letter = parts.length > 1 ? String.fromCharCode(97 + i) : "";
    return {
      key: String(words[0]?.word_num),
      label: `${verse}${letter}`,
      words,
    };
  });
}

// Brackets may nest or be disjoint, but never partially overlap.
export function rangeInside(a, b) {
  return a.start >= b.start && a.end <= b.end;
}
export function rangesDisjoint(a, b) {
  return a.end < b.start || b.end < a.start;
}
export function canAddBracket(existing, nb) {
  for (const b of existing) {
    const aInB = rangeInside(nb, b);
    const bInA = rangeInside(b, nb);
    const disjoint = rangesDisjoint(nb, b);
    if (!(aInB || bInA || disjoint)) return false;
  }
  return true;
}

// Brackets that fall fully within a segment's word range (splits can't cut
// through a bracket, so every bracket belongs to exactly one segment).
export function verseSegmentBrackets(brackets, segWords) {
  if (!segWords.length) return [];
  const lo = segWords[0].word_num;
  const hi = segWords[segWords.length - 1].word_num;
  return (brackets || []).filter((b) => b.start >= lo && b.end <= hi);
}

export function greekPhrase(words, start, end) {
  return words
    .filter((w) => w.word_num >= start && w.word_num <= end)
    .map((w) => w.text + (w.after || ""))
    .join(" ");
}

export function joinText(a, b) {
  const x = (a || "").trim();
  const y = (b || "").trim();
  if (!x) return y;
  if (!y) return x;
  return x + " " + y;
}

export function joinNotes(a, b) {
  const x = (a || "").trim();
  const y = (b || "").trim();
  if (!x) return y;
  if (!y) return x;
  return x + "\n—\n" + y;
}