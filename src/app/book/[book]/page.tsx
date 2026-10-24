import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { bookBySlug } from "@/lib/books";
import { PageShell } from "@/components/site-shell";
import { listBooks } from "@/db/corpus";
import { readCorpus } from "@/app/corpus-store";

export default async function BookPage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  await connection();
  const book = bookBySlug((await params).book);
  if (!book) notFound();
  const summary = await readCorpus((db) =>
    listBooks(db).find((entry) => entry.code === book.code),
  );
  const available = summary ? new Set(summary.available) : null;
  return (
    <PageShell narrow>
      <div className="label-strip">
        <Link href="/">All books</Link>
        <span lang="grc">{book.greek}</span>
      </div>
      <h1 className="book-title">{book.name}</h1>
      <p className="intro">
        {available && available.size === 0
          ? "The Greek text of this book has not been added yet. Choose a chapter to see where it will appear."
          : "Choose a chapter."}
      </p>
      <div className="chapter-grid">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
          (chapter) => (
            <Link
              key={chapter}
              href={`/read/${book.slug}/${chapter}`}
              aria-label={
                available && !available.has(chapter)
                  ? `${book.name} ${chapter}, not yet available`
                  : `${book.name} ${chapter}`
              }
            >
              {chapter}
            </Link>
          ),
        )}
      </div>
    </PageShell>
  );
}
