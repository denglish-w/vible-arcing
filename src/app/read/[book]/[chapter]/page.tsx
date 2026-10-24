import { notFound } from "next/navigation";
import { connection } from "next/server";
import { bookBySlug } from "@/lib/books";
import { Reader, type ReaderContent } from "@/components/reading/reader";
import { getChapter } from "@/db/corpus";
import { readCorpus } from "@/app/corpus-store";
import type { ChapterText } from "@/components/reading/greek-text";

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
  const result = await readCorpus((db) => getChapter(db, book.code, chapter));
  if (result?.status === "does-not-exist") notFound();
  let content: ReaderContent;
  if (!result) content = { status: "not-installed" };
  else if (result.status === "ok") {
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
    content = { status: "ok", data };
  } else content = { status: "unavailable" };
  return <Reader book={book} chapter={chapter} content={content} />;
}
