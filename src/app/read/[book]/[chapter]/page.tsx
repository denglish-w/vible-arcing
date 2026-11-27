import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { bookBySlug } from "@/lib/books";
import { MODE_COOKIE, parseMode } from "@/lib/learning/mode";
import type { AttemptSummary } from "@/lib/learning/types";
import { Reader, type ReaderContent } from "@/components/reading/reader";
import { getChapter } from "@/db/corpus";
import {
  appDb,
  DatabaseDamagedError,
  DatabaseMissingError,
  latestAttempts,
} from "@/db/server";
import { readCorpus } from "@/app/corpus-store";
import {
  checkParse,
  recordAttempt,
  setReadingMode,
} from "@/app/read/learning-actions";
import type { ChapterText } from "@/components/reading/greek-text";

const actions = { checkParse, recordAttempt, setReadingMode };

/** The latest attempt per word, or none when the saved-work store is unusable. */
async function attemptSummaries(
  wordIds: string[],
): Promise<Record<string, AttemptSummary>> {
  try {
    return Object.fromEntries(latestAttempts(await appDb(), wordIds));
  } catch (error) {
    if (
      error instanceof DatabaseMissingError ||
      error instanceof DatabaseDamagedError
    )
      return {};
    throw error;
  }
}

// Read per request, so chapters ingested after the build appear.
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  await connection();
  const route = await params;
  const book = bookBySlug(route.book);
  const chapter = Number(route.chapter);
  if (
    !book ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > book.chapters ||
    String(chapter) !== route.chapter
  )
    notFound();
  // Decided on the server, so a Learning render never carries the answers
  // (spec 010 research R1).
  const mode = parseMode((await cookies()).get(MODE_COOKIE)?.value);
  const result = await readCorpus((db) => getChapter(db, book.code, chapter));
  if (result?.status === "does-not-exist") notFound();
  let content: ReaderContent;
  if (!result) content = { status: "not-installed", mode };
  else if (result.status === "ok" && mode === "learning") {
    // Text and ids only: no lemma, gloss, part of speech or morphology (FR-020).
    content = {
      status: "ok",
      mode,
      data: {
        book: result.book,
        chapter: result.chapter,
        words: result.words.map(({ id, verse, text, after }) => ({
          id,
          v: verse,
          text,
          after,
        })),
      },
      attempts: await attemptSummaries(result.words.map((word) => word.id)),
    };
  } else if (result.status === "ok") {
    const data: ChapterText = {
      book: result.book,
      chapter: result.chapter,
      words: result.words.map((word) => ({
        id: word.id,
        v: word.verse,
        text: word.text,
        after: word.after,
        lemma: word.lemma,
        gloss: word.gloss ?? undefined,
        pos: word.pos,
        m: word.morphology,
      })),
    };
    content = { status: "ok", mode: "reading", data };
  } else content = { status: "unavailable", mode };
  return (
    <Reader book={book} chapter={chapter} content={content} actions={actions} />
  );
}
