"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo, SiteFooter } from "@/components/site-shell";
import { ChapterNavigation } from "./chapter-navigation";
import { ChapterLoading, ChapterUnavailable } from "./chapter-status";
import { DisplayMenu } from "./display-menu";
import { GreekText } from "./greek-text";
import { PosLegend } from "./pos-legend";
import type { Book } from "@/lib/books";
import { loadChapter } from "@/lib/corpus/load";
import type { CorpusChapter } from "@/lib/corpus/types";

export function Reader({ book, chapter }: { book: Book; chapter: number }) {
  const [data, setData] = useState<CorpusChapter | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    void loadChapter(book.code, chapter).then((result) => {
      if (active)
        setData(result.status === "available" ? result.chapter : null);
    });
    return () => {
      active = false;
    };
  }, [book.code, chapter]);
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
        {data === undefined ? (
          <ChapterLoading />
        ) : data === null ? (
          <ChapterUnavailable />
        ) : (
          <GreekText key={`${data.book}/${data.chapter}`} data={data} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
