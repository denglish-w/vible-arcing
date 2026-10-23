"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Logo, SiteFooter } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
} from "@/components/ui/popover";
import { DisplayMenu } from "./display-menu";
import { nextChapter, prevChapter, type Book } from "@/lib/books";
import { loadChapter } from "@/lib/corpus/load";
import {
  MORPHOLOGY_FIELDS,
  type CorpusChapter,
  type CorpusWord,
} from "@/lib/corpus/types";
import { POS_CATEGORIES, wordCategory, categoryStyle } from "@/lib/pos";
import { SIZE_SCALE, SPACING, useSettingsStore } from "@/lib/settings";

function ChapterNavigation({
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
        <Link
          className="button"
          href={`/read/${previous.book.code}/${previous.chapter}`}
          aria-label={`Previous chapter: ${previous.book.name} ${previous.chapter}`}
        >
          <ChevronLeft size={16} />
        </Link>
      )}
      <span>
        <Link href={`/book/${book.code}`}>
          {book.name} {chapter}
        </Link>
      </span>
      {next && (
        <Link
          className="button"
          href={`/read/${next.book.code}/${next.chapter}`}
          aria-label={`Next chapter: ${next.book.name} ${next.chapter}`}
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}
function WordDetail({ word }: { word: CorpusWord }) {
  return (
    <>
      <div className="popover-heading">
        <h2 lang="grc">{word.text}</h2>
        <PopoverClose asChild>
          <Button aria-label="Close word details">
            <X size={16} />
          </Button>
        </PopoverClose>
      </div>
      <p>
        <span className="small-caps">Lemma</span>
        <br />
        <span lang="grc">{word.lemma}</span>
      </p>
      <p className="gloss">
        {word.gloss || "Gloss not supplied by the source."}
      </p>
      <dl>
        <dt>Part of speech</dt>
        <dd>
          {
            POS_CATEGORIES.find(
              (category) =>
                category.key === wordCategory(word.pos, word.m.mood),
            )?.label
          }
        </dd>
        {MORPHOLOGY_FIELDS.filter((field) => word.m[field]).map((field) => (
          <Fragment key={field}>
            <dt>{field}</dt>
            <dd>{word.m[field]}</dd>
          </Fragment>
        ))}
      </dl>
    </>
  );
}
export function GreekText({ data }: { data: CorpusChapter }) {
  const settings = useSettingsStore((state) => state.settings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const verses = new Map<number, CorpusWord[]>();
  for (const word of data.words) {
    const verse = verses.get(word.v) ?? [];
    verse.push(word);
    verses.set(word.v, verse);
  }
  return (
    <>
      <div
        className="greek-text"
        lang="grc"
        style={{
          fontFamily: settings.fontFamily,
          fontSize: `${SIZE_SCALE[settings.fontSizeIndex]}rem`,
          lineHeight: SPACING[settings.lineSpacing],
        }}
      >
        {[...verses].map(([verse, words]) => (
          <p className="verse" key={verse}>
            {settings.showVerseNumbers && (
              <sup className="verse-number">{verse}</sup>
            )}
            {words.map((word) => {
              const category = wordCategory(word.pos, word.m.mood);
              const colored =
                settings.posColor.enabled &&
                settings.posColor.categories[category];
              return (
                <Fragment key={word.id}>
                  <Popover
                    open={selectedId === word.id}
                    onOpenChange={(open) =>
                      setSelectedId((current) =>
                        open ? word.id : current === word.id ? null : current,
                      )
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="word"
                        data-word-id={word.id}
                        id={word.id}
                        style={colored ? categoryStyle(category) : undefined}
                        aria-label={`${word.text}, word details`}
                      >
                        {word.text}
                      </button>
                    </PopoverTrigger>
                    {selectedId === word.id && (
                      <PopoverContent
                        className="word-detail"
                        lang="en"
                        aria-label={`Word details: ${word.text}`}
                        onInteractOutside={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest(".word")
                          )
                            event.preventDefault();
                        }}
                        onEscapeKeyDown={() =>
                          document.getElementById(word.id)?.focus()
                        }
                        onCloseAutoFocus={(event) => event.preventDefault()}
                      >
                        <WordDetail word={word} />
                        <PopoverArrow className="popover-arrow" />
                      </PopoverContent>
                    )}
                  </Popover>
                  {word.after}
                  {word.after && !/\s$/.test(word.after) ? " " : ""}
                </Fragment>
              );
            })}
          </p>
        ))}
      </div>
    </>
  );
}
export function Reader({ book, chapter }: { book: Book; chapter: number }) {
  const [data, setData] = useState<CorpusChapter | null | undefined>(undefined);
  const settings = useSettingsStore((state) => state.settings);
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
          <Link href={`/book/${book.code}`}>
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
        {settings.posColor.enabled && (
          <div className="legend" aria-label="Part-of-speech legend">
            {POS_CATEGORIES.filter(
              (category) => settings.posColor.categories[category.key],
            ).map((category) => (
              <span key={category.key} style={categoryStyle(category.key)}>
                {category.label}
              </span>
            ))}
          </div>
        )}
        {data === undefined ? (
          <output>Loading Greek text…</output>
        ) : data === null ? (
          <section className="unavailable">
            <h2>Text not yet available</h2>
            <p>
              This chapter’s Greek text could not be loaded. Philippians 1 is
              available to read.
            </p>
            <Link href="/read/php/1">Read Philippians 1</Link>
          </section>
        ) : (
          <GreekText key={`${data.book}/${data.chapter}`} data={data} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
