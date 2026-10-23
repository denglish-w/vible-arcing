// Static, database-free data for Reading's word bubble:
//   /data/lexicon.json                 Dodson headword + definition by Strong number
//   /data/lemma-counts.json            New Testament occurrences per lemma
//   /data/<BOOK>/<chapter>.detail.json per-word Strong, gloss and parsing columns
// Only Reading's bubble loads these. Learning mode never does, so the source
// parsing is not fetched there before an answer is checked.
import { resolveDodsonStrong } from "./strongCrosswalk";

const cache = new Map();

function loadJson(url) {
  if (!cache.has(url)) {
    const p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url}`);
      return res.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url);
}

export function prefetchWordDetail(bookCode, chapter) {
  if (chapter < 1) return;
  loadJson(`/data/${bookCode}/${chapter}.detail.json`).catch(() => {});
  loadJson("/data/lexicon.json").catch(() => {});
  loadJson("/data/lemma-counts.json").catch(() => {});
}

// Same shape the bubble used to get from the server: { word, definition,
// headword, hasEntry, occurrences }. `chapterWords` is the chapter's word list
// (to find this word's position in the detail file); `morph` has its lemma.
export async function getStaticWordDetail(word, chapterWords, morph) {
  const [detail, lexicon, counts] = await Promise.all([
    loadJson(`/data/${word.book}/${word.chapter}.detail.json`),
    loadJson("/data/lexicon.json"),
    loadJson("/data/lemma-counts.json"),
  ]);
  const i = chapterWords.findIndex((w) => w.id === word.id);
  const row = detail.d[i];
  if (!row) return { word: null, definition: null, headword: null, hasEntry: false, occurrences: 0 };
  const [strong, gloss, pos_type, person, number, gender, kase, tense, voice, degree] = row;
  const m = morph?.[`${word.verse}:${word.word_num}`] || {};
  const full = {
    ...word,
    lemma: m.lemma,
    pos: m.pos,
    mood: m.mood,
    strong,
    gloss,
    pos_type,
    person,
    number,
    gender,
    case: kase,
    tense,
    voice,
    degree,
  };
  const dodson = resolveDodsonStrong(strong);
  const entry = dodson != null ? lexicon[dodson] : null;
  return {
    word: full,
    definition: entry ? entry[1] : null,
    headword: entry ? entry[0] : null,
    hasEntry: !!entry,
    occurrences: m.lemma ? counts[m.lemma] || 0 : 0,
  };
}