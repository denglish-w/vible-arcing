import { ChevronLeft, ChevronRight } from "lucide-react";
import { GuardedLink } from "./learning/guarded-link";
import { nextChapter, prevChapter, type Book } from "@/lib/books";

export function ChapterNavigation({
  book,
  chapter,
  className = "",
}: {
  book: Book;
  chapter: number;
  className?: string;
}) {
  const previous = prevChapter(book.code, chapter);
  const next = nextChapter(book.code, chapter);
  return (
    <nav aria-label="Chapter navigation" className={`chapter-nav ${className}`}>
      {previous && (
        <GuardedLink
          className="button"
          href={`/read/${previous.book.slug}/${previous.chapter}`}
          aria-label={`Previous chapter: ${previous.book.name} ${previous.chapter}`}
        >
          <ChevronLeft size={16} />
        </GuardedLink>
      )}
      <span>
        <GuardedLink href={`/book/${book.slug}`}>
          {book.name} {chapter}
        </GuardedLink>
      </span>
      {next && (
        <GuardedLink
          className="button"
          href={`/read/${next.book.slug}/${next.chapter}`}
          aria-label={`Next chapter: ${next.book.name} ${next.chapter}`}
        >
          <ChevronRight size={16} />
        </GuardedLink>
      )}
    </nav>
  );
}
