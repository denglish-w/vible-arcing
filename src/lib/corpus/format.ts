// Corpus format v1: the ingest output that `npm run db:seed` loads (design
// decision 4, corpus-store spec "Corpus format"). The one parser for it.
// Shared with scripts (see src/db/README.md).
import { z } from "zod";
import { BOOKS, chapterExists } from "../books.ts";

export const CORPUS_FORMAT = 1;

// Strict objects: an unknown field is an error, so nothing outside the
// whitelist (Louw-Nida `ln`, UBS `domain`, ...) can pass through to the store.
// Lengths are bounded generously; the longest New Testament chapter has under
// 2,000 words.
const MAX_WORDS = 5000;
const short = () => z.string().min(1).max(200);
const long = () => z.string().min(1).max(2000);

const morphology = z.strictObject({
  person: short().optional(),
  number: short().optional(),
  gender: short().optional(),
  case: short().optional(),
  tense: short().optional(),
  voice: short().optional(),
  mood: short().optional(),
  degree: short().optional(),
});

// Links are rendered on the credits page, so only https is accepted.
const httpsUrl = () => z.url({ protocol: /^https$/ }).max(2000);

const word = z.strictObject({
  /** MACULA xml:id, the only word identity. */
  id: z.string().regex(/^n\d{11}$/),
  v: z.int().min(1).max(200),
  text: short(),
  after: z.string().max(20),
  lemma: short(),
  gloss: short().optional(),
  pos: short(),
  m: morphology.optional(),
});

const chapter = z.strictObject({
  format: z.literal(CORPUS_FORMAT),
  edition: z.literal("SBLGNT"),
  source: z.strictObject({
    dataset: z.literal("macula-greek"),
    commit: z.string().regex(/^[0-9a-f]{40}$/),
  }),
  book: z.string().regex(/^[1-3]?[A-Z]{2,3}$/),
  chapter: z.int().min(1).max(200),
  words: z.array(word).min(1).max(MAX_WORDS),
});

const dataset = z.strictObject({
  name: short(),
  creator: short(),
  license: short(),
  licenseUrl: httpsUrl(),
  statement: long(),
  modified: z.boolean(),
  modifications: long(),
  url: httpsUrl(),
});

const attribution = z.strictObject({
  format: z.literal(CORPUS_FORMAT),
  datasets: z.array(dataset).min(1).max(50),
});

export type CorpusWord = z.infer<typeof word>;
export type CorpusChapter = z.infer<typeof chapter>;
export type AttributionDataset = z.infer<typeof dataset>;
export type CorpusAttribution = z.infer<typeof attribution>;

/** Corpus output in a format version this code does not know. */
export class UnknownFormatError extends Error {
  readonly version: unknown;
  constructor(what: string, version: unknown) {
    super(
      `${what} is in corpus format ${JSON.stringify(version)}, but only format ${CORPUS_FORMAT} is supported.`,
    );
    this.name = "UnknownFormatError";
    this.version = version;
  }
}

/** Corpus output that claims format v1 but does not match it. */
export class InvalidCorpusError extends Error {
  constructor(what: string, issues: string) {
    super(`${what} is not valid corpus format ${CORPUS_FORMAT}: ${issues}`);
    this.name = "InvalidCorpusError";
  }
}

function checkVersion(json: unknown, what: string): void {
  const version =
    typeof json === "object" && json !== null && "format" in json
      ? (json as { format: unknown }).format
      : undefined;
  if (version !== CORPUS_FORMAT) throw new UnknownFormatError(what, version);
}

function parseWith<T>(schema: z.ZodType<T>, json: unknown, what: string): T {
  checkVersion(json, what);
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new InvalidCorpusError(what, z.prettifyError(result.error));
  }
  return result.data;
}

/**
 * Checks one chapter file; `what` names the file in error messages. The book
 * and chapter must exist in the New Testament, and the words must belong to it
 * and be in reading order.
 */
export function parseChapter(json: unknown, what: string): CorpusChapter {
  const parsed = parseWith(chapter, json, what);
  const bookIndex = BOOKS.findIndex((b) => b.code === parsed.book);
  if (bookIndex < 0 || !chapterExists(parsed.book, parsed.chapter)) {
    throw new InvalidCorpusError(
      what,
      `${parsed.book} ${parsed.chapter} is not a New Testament chapter`,
    );
  }

  // MACULA ids are n BB CCC VVV WWW, with Matthew as book 40.
  const prefix = `n${bookIndex + 40}${String(parsed.chapter).padStart(3, "0")}`;
  let previous = "";
  for (const w of parsed.words) {
    if (!w.id.startsWith(prefix)) {
      throw new InvalidCorpusError(
        what,
        `word ${w.id} is not in ${parsed.book} ${parsed.chapter}`,
      );
    }
    if (Number(w.id.slice(6, 9)) !== w.v) {
      throw new InvalidCorpusError(
        what,
        `word ${w.id} is marked as verse ${w.v}`,
      );
    }
    // Fixed-width digits, so string order is reading order.
    if (w.id <= previous) {
      throw new InvalidCorpusError(
        what,
        `word ${w.id} is out of reading order or repeated`,
      );
    }
    previous = w.id;
  }
  return parsed;
}

export function parseAttribution(
  json: unknown,
  what: string,
): CorpusAttribution {
  return parseWith(attribution, json, what);
}
