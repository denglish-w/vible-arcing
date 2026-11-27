import Link from "next/link";
import { Logo, SiteFooter } from "@/components/site-shell";
import type { Book } from "@/lib/books";
import type { ReadingMode } from "@/lib/learning/mode";
import type {
  AttemptSummary,
  LeanChapter,
  LearningActions,
} from "@/lib/learning/types";
import { ChapterNavigation } from "./chapter-navigation";
import { ChapterNotInstalled, ChapterUnavailable } from "./chapter-status";
import { DisplayMenu } from "./display-menu";
import { GreekText, type ChapterText } from "./greek-text";
import { LearningNotice } from "./learning/learning-notice";
import { LearningText } from "./learning/learning-text";
import { ModeControl } from "./learning/mode-control";
import { PosLegend } from "./pos-legend";

/**
 * In Learning mode the chapter is lean: each word's text and id only, so the
 * page holds no answers (spec 010 FR-020).
 */
export type ReaderContent =
  | { status: "ok"; mode: "reading"; data: ChapterText }
  | {
      status: "ok";
      mode: "learning";
      data: LeanChapter;
      attempts: Record<string, AttemptSummary>;
    }
  | { status: "unavailable"; mode: ReadingMode }
  | { status: "not-installed"; mode: ReadingMode };

/** Props only, so stories need no database; the page supplies the chapter. */
export function Reader({
  book,
  chapter,
  content,
  actions,
}: {
  book: Book;
  chapter: number;
  content: ReaderContent;
  /** The Learning-mode server actions; stories pass fakes. */
  actions: LearningActions;
}) {
  const learning = content.mode === "learning";
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
          <div className="reader-tools">
            <ModeControl
              mode={content.mode}
              setReadingMode={actions.setReadingMode}
            />
            <DisplayMenu mode={content.mode} />
          </div>
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
        {learning ? <LearningNotice /> : <PosLegend />}
        {content.status === "ok" ? (
          content.mode === "learning" ? (
            <LearningText
              key={`${content.data.book}/${content.data.chapter}`}
              data={content.data}
              attempts={content.attempts}
              actions={actions}
            />
          ) : (
            <GreekText
              key={`${content.data.book}/${content.data.chapter}`}
              data={content.data}
            />
          )
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
