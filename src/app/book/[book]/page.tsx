import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, bookBySlug } from "@/lib/books";
import { PageShell } from "@/components/site-shell";
export const dynamicParams = false;
export function generateStaticParams() {
  return BOOKS.map((book) => ({ book: book.slug }));
}
export default async function BookPage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const book = bookBySlug((await params).book);
  if (!book) notFound();
  return (
    <PageShell narrow>
      <div className="label-strip">
        <Link href="/">All books</Link>
        <span lang="grc">{book.greek}</span>
      </div>
      <h1 className="book-title">{book.name}</h1>
      <p className="intro">Choose a chapter.</p>
      <div className="chapter-grid">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
          (chapter) => (
            <Link
              key={chapter}
              href={`/read/${book.slug}/${chapter}`}
              aria-label={`${book.name} ${chapter}`}
            >
              {chapter}
            </Link>
          ),
        )}
      </div>
    </PageShell>
  );
}
