import Link from "next/link";
import { Logo, SiteFooter } from "@/components/site-shell";
import { ChapterNavigation } from "./chapter-navigation";
import { ChapterNotInstalled, ChapterUnavailable } from "./chapter-status";
import { DisplayMenu } from "./display-menu";
import { GreekText, type ChapterText } from "./greek-text";
import { PosLegend } from "./pos-legend";
import type { Book } from "@/lib/books";

export type ReaderContent =
  | { status: "ok"; data: ChapterText }
  | { status: "unavailable" }
  | { status: "not-installed" };

/** Props only, so stories need no database; the page supplies the chapter. */
export function Reader({
  book,
  chapter,
  content,
}: {
  book: Book;
  chapter: number;
  content: ReaderContent;
}) {
  return (
    <div className="page-shell">
      <header className="reader-bar">
        <div className="reader-bar-inner">
          <Logo />
          <ChapterNavigation
            book={book}
            chapter={chapter}
            className="desktop-nav"
          />
          <DisplayMenu />
        </div>
      </header>
      <main id="main" className="reader-content">
        <h1 className="reader-title">
          <Link href={`/book/${book.slug}`}>
            {book.name} {chapter}
          </Link>
        </h1>
        <ChapterNavigation
          book={book}
          chapter={chapter}
          className="mobile-nav"
        />
        <div className="label-strip">
          <span className="small-caps">Greek · SBLGNT</span>
          <span lang="grc">
            {book.greek} {chapter}
          </span>
        </div>
        <PosLegend />
        {content.status === "ok" ? (
          <GreekText
            key={`${content.data.book}/${content.data.chapter}`}
            data={content.data}
          />
        ) : content.status === "unavailable" ? (
          <ChapterUnavailable />
        ) : (
          <ChapterNotInstalled />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
