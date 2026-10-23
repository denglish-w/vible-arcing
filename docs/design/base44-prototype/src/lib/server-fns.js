import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveDodsonStrong } from "./strongCrosswalk";
import { requireUser } from "@/lib/auth-middleware";
import { fieldsForPos, deAccent, NA, MORPH_ENUMS } from "./greek";
import { buildParse } from "./parse";

// Load one chapter. The Greek words are sent LEAN (no parsing columns) so the
// source parse is never sent to the browser before a Learning check; Reading's
// word detail fetches parsing on demand.
export const getChapter = createServerFn({ method: "GET" })
  .validator(z.object({ book: z.string(), chapter: z.number() }))
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const [wordsRes, englishRes] = await Promise.all([
      b.entities.GreekWord.filter(
        { book: data.book, chapter: data.chapter },
        {
          sort: "word_num",
          limit: 2000,
          fields: ["book", "chapter", "verse", "word_num", "ref", "text", "after"],
        }
      ),
      b.entities.EnglishVerse.filter(
        { book_code: data.book, chapter: data.chapter },
        { sort: "verse", limit: 200 }
      ),
    ]);
    // word_num resets per verse, so sort by verse then word_num to get true
    // reading order (the flat list drives Learning's "Next word").
    const words = (wordsRes.items ?? [])
      .slice()
      .sort((a, b) => (a.verse - b.verse) || (a.word_num - b.word_num));
    return {
      words,
      english: englishRes.items ?? [],
    };
  });

// Full detail for one word, fetched on demand by Reading's word panel: the
// parsing columns plus the Dodson definition. Nothing is sent until the user
// opens the panel.
export const getWordDetail = createServerFn({ method: "GET" })
  .validator(
    z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      word_num: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const res = await b.entities.GreekWord.filter(
      { book: data.book, chapter: data.chapter, verse: data.verse, word_num: data.word_num },
      { limit: 1 }
    );
    const word = res.items?.[0];
    if (!word) {
      return { word: null, definition: null, headword: null, hasEntry: false, occurrences: 0 };
    }
    const dodsonStrong = resolveDodsonStrong(String(word.strong ?? ""));
    // The dictionary lookup and the NT-wide occurrence count are independent:
    // run them together instead of one after the other.
    const [lex, occurrences] = await Promise.all([
      dodsonStrong !== null && dodsonStrong !== undefined
        ? b.entities.LexiconEntry.filter({ strong: dodsonStrong }, { limit: 1 })
        : Promise.resolve(null),
      word.lemma ? b.entities.GreekWord.count({ lemma: word.lemma }) : Promise.resolve(0),
    ]);
    const entry = lex?.items?.[0];
    const definition = entry ? entry.definition_full : null;
    const headword = entry ? entry.greek_headword : null;
    const hasEntry = !!entry;
    return { word, definition, headword, hasEntry, occurrences, bookCount: 0 };
  });

// The values for each morphology dropdown. These are closed sets in Greek
// grammar, so they are served straight from the built-in lists (no database
// round trip); the previous distinct-value queries took over a second each and
// always returned these same values.
export const getLearningOptions = createServerFn({ method: "GET" })
  .handler(async () => ({ pos: [], ...MORPH_ENUMS }));

// Grade the user's answer against the source parse for the exact word, save the
// result to the user's account, and return the comparison. The source parse is
// only revealed after the check.
export const checkAnswer = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      word_num: z.number(),
      typed_word: z.string().max(200),
      selections: z.object({
        pos: z.string(),
        tense: z.string().optional(),
        voice: z.string().optional(),
        mood: z.string().optional(),
        person: z.string().optional(),
        number: z.string().optional(),
        gender: z.string().optional(),
        case: z.string().optional(),
      }),
    })
  )
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const res = await b.entities.GreekWord.filter(
      { book: data.book, chapter: data.chapter, verse: data.verse, word_num: data.word_num },
      { limit: 1 }
    );
    const word = res.items?.[0];
    if (!word) throw new Error("Word not found");

    const sel = data.selections;
    const shownFields = ["pos", ...fieldsForPos(sel.pos, sel.mood)];

    const comparison = [];
    for (const f of shownFields) {
      let userVal;
      let srcVal;
      if (f === "pos") {
        userVal = sel.pos;
        if (sel.pos === "participle") {
          // "Participle" is a shortcut for a verb in the participle mood: it
          // matches when the source word is a participle, and the stored value
          // is reported as "participle" so the result row reads as a match.
          const isParticiple = word.pos === "verb" && word.mood === "participle";
          srcVal = isParticiple ? "participle" : (word.pos ?? "");
        } else {
          srcVal = word.pos ?? "";
        }
      } else {
        userVal = sel[f] ?? "";
        srcVal = word[f] ?? "";
      }
      let match = userVal === srcVal;
      if (!match && (f === "person" || f === "gender") && userVal === NA && srcVal === "") {
        match = true;
      }
      comparison.push({
        field: f,
        status: match ? "match" : "diff",
        userValue: userVal,
        storedValue: srcVal,
      });
    }

    // Grade the typed word against the word's lemma (the dictionary form),
    // not the inflected form in the verse — e.g. Χριστῷ → χριστός.
    const wordMatch = deAccent(data.typed_word) === deAccent(word.lemma ?? "");
    comparison.push({
      field: "word",
      status: wordMatch ? "match" : "diff",
      userValue: data.typed_word,
      storedValue: word.lemma ?? "",
    });

    const diffCount = comparison.filter((c) => c.status === "diff").length;
    const result = diffCount === 0 ? "matched" : "disputed";
    const sourceParse = buildParse(word);

    await b.entities.LearningResult.create({
      book: data.book,
      chapter: data.chapter,
      verse: data.verse,
      word_num: data.word_num,
      ref: word.ref ?? "",
      word_text: word.text ?? "",
      typed_word: data.typed_word,
      pos: sel.pos,
      selections: sel,
      source_parse: sourceParse,
      comparison: result === "disputed" ? comparison : null,
      result,
    });

    return { result, sourceParse, wordText: word.text ?? "", comparison, diffCount };
  });

// The current user's latest saved attempt for one word, so the parsing form can
// re-open pre-filled. RLS scopes to the caller; anonymous visitors get null.
export const getPreviousAttempt = createServerFn({ method: "GET" })
  .validator(
    z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      word_num: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const res = await b.entities.LearningResult.filter(
      { book: data.book, chapter: data.chapter, verse: data.verse, word_num: data.word_num },
      { sort: "-created_date", limit: 1 }
    );
    return res.items?.[0] ?? null;
  });

// Per-verse diaglot annotation: split points, per-segment translation/notes,
// and phrase brackets. One record per (book, chapter, verse), private to the
// owner via RLS. Legacy UserTranslation records are surfaced as a fallback so
// existing translations are not lost.
function normalizeAnnotation(a) {
  return {
    book: a.book,
    chapter: a.chapter,
    verse: a.verse,
    splits: a.splits || [],
    segments: a.segments || {},
    brackets: a.brackets || [],
  };
}

export const getAnnotations = createServerFn({ method: "GET" })
  .validator(z.object({ book: z.string(), chapter: z.number() }))
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const [annRes, legacyRes] = await Promise.all([
      b.entities.VerseAnnotation.filter({ book: data.book, chapter: data.chapter }, { limit: 200 }),
      b.entities.UserTranslation.filter({ book: data.book, chapter: data.chapter }, { limit: 200 }),
    ]);
    const map = {};
    for (const a of annRes.items || []) map[a.verse] = normalizeAnnotation(a);
    for (const t of legacyRes.items || []) {
      if (!map[t.verse]) {
        map[t.verse] = {
          book: data.book,
          chapter: data.chapter,
          verse: t.verse,
          splits: [],
          segments: { "1": { translation: t.text || "", notes: "" } },
          brackets: [],
        };
      }
    }
    return Object.values(map);
  });

// Create or replace the user's annotation for one verse. When everything is
// empty (no translation/notes, no brackets, no splits), the record is deleted so
// the chapter stays tidy. Requires a signed-in caller.
export const saveAnnotation = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      book: z.string(),
      chapter: z.number(),
      verse: z.number(),
      splits: z.array(z.number()).max(50),
      segments: z.record(z.string(), z.any()),
      brackets: z.array(z.any()).max(100),
    })
  )
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const hasText = Object.values(data.segments || {}).some(
      (s) => (s?.translation || "").trim() || (s?.notes || "").trim()
    );
    const hasBrackets = (data.brackets || []).length > 0;
    const hasSplits = (data.splits || []).length > 0;
    const existing = await b.entities.VerseAnnotation.filter(
      { book: data.book, chapter: data.chapter, verse: data.verse },
      { limit: 1 }
    );
    const item = existing.items?.[0];
    if (!hasText && !hasBrackets && !hasSplits) {
      if (item) await b.entities.VerseAnnotation.delete(item.id);
      return { verse: data.verse, saved: false };
    }
    const payload = {
      book: data.book,
      chapter: data.chapter,
      verse: data.verse,
      splits: data.splits,
      segments: data.segments,
      brackets: data.brackets,
    };
    if (item) await b.entities.VerseAnnotation.update(item.id, payload);
    else await b.entities.VerseAnnotation.create(payload);
    return { verse: data.verse, saved: true };
  });

// Lean per-word morphology (lemma, pos, mood) for a chapter, used by Reading's
// part-of-speech coloring and same-word highlighting. Sent WITHOUT the full
// parse columns; Learning mode never requests this (the route clears it on
// entering Learning) so the source answers stay hidden there.
export const getChapterMorph = createServerFn({ method: "GET" })
  .validator(z.object({ book: z.string(), chapter: z.number() }))
  .handler(async ({ data, context }) => {
    const b = context.getBase44();
    const res = await b.entities.GreekWord.filter(
      { book: data.book, chapter: data.chapter },
      { fields: ["verse", "word_num", "lemma", "pos", "mood"], sort: "word_num", limit: 2000 }
    );
    return (res.items || []).map((w) => ({
      verse: w.verse,
      word_num: w.word_num,
      lemma: w.lemma,
      pos: w.pos,
      mood: w.mood,
    }));
  });