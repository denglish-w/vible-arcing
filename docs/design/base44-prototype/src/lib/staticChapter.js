// Reads a chapter from the static files in /data/<BOOK>/<chapter>.json. Each
// file holds the Greek words and the BSB English verses, so no database round
// trip is needed to open a chapter. Parsing columns (case, tense, ...) and
// definitions are NOT in these files; they stay in the database and are
// fetched per word.
//
// The words returned are lean (text only). The lemma / part of speech / mood
// come back separately as `morph`, which only Reading mode uses for coloring;
// Learning mode never reads it, so the answers are not held on the words.
const cache = new Map();

export function loadStaticChapter(bookCode, chapter) {
  const key = `${bookCode}/${chapter}`;
  if (!cache.has(key)) {
    const p = fetch(`/data/${bookCode}/${chapter}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${bookCode} ${chapter}`);
        return res.json();
      })
      .then((raw) => {
        const words = [];
        const morph = {};
        for (const [verse, word_num, text, after, lemma, pos, mood] of raw.w) {
          words.push({
            id: `${bookCode}-${chapter}-${verse}-${word_num}`,
            book: bookCode,
            chapter,
            verse,
            word_num,
            text,
            after,
          });
          morph[`${verse}:${word_num}`] = { pos, mood, lemma };
        }
        const english = raw.e.map(([verse, text]) => ({ verse, text }));
        return { words, english, morph };
      });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}

// Warm the cache for a neighbouring chapter so the next page turn is instant.
export function prefetchStaticChapter(bookCode, chapter) {
  if (chapter < 1) return;
  loadStaticChapter(bookCode, chapter).catch(() => {});
}