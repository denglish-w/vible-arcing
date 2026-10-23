import { notFound } from "next/navigation";
import { BOOKS, getBook } from "@/lib/books";
import { Reader } from "@/components/reading/reader";
export const dynamicParams = false;
export function generateStaticParams() {
  return BOOKS.flatMap((book) =>
    Array.from({ length: book.chapters }, (_, i) => ({
      book: book.code,
      chapter: String(i + 1),
    })),
  );
}
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const route = await params;
  const book = getBook(route.book);
  const chapter = Number(route.chapter);
  if (
    !book ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > book.chapters ||
    String(chapter) !== route.chapter
  )
    notFound();
  return (
    <Reader key={`${book.code}/${chapter}`} book={book} chapter={chapter} />
  );
}
