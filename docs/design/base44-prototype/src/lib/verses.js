// Build the sorted, de-duplicated verse numbers for a chapter from the Greek
// words and the BSB English verses, plus a quick verse -> BSB-verse lookup.
export function verseNumbers(words, english) {
  const set = new Set();
  for (const w of words) set.add(w.verse);
  for (const v of english) set.add(v.verse);
  return [...set].sort((a, b) => a - b);
}

export function bsbByVerse(english) {
  const map = new Map();
  for (const v of english) map.set(v.verse, v);
  return map;
}

// Build a verse -> Greek-text-string map from the chapter's words, joining
// each word's form with its trailing punctuation/space (`after`), matching the
// reading-pane rendering.
export function greekByVerse(words) {
  const map = new Map();
  for (const w of words) {
    map.set(w.verse, (map.get(w.verse) || "") + w.text + (w.after || "") + " ");
  }
  return map;
}