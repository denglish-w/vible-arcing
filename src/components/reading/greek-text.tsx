"use client";
import { Fragment, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
} from "@/components/ui/popover";
import { WordDetail } from "./word-detail";
import type { CorpusChapter, CorpusWord } from "@/lib/corpus/format";
import { wordCategory, categoryStyle } from "@/lib/pos";
import { SIZE_SCALE, SPACING, useSettingsStore } from "@/lib/settings";

/** The part of a chapter the reader shows; fixtures and the store both supply it. */
export type ChapterText = Pick<CorpusChapter, "book" | "chapter" | "words">;

export function GreekText({ data }: { data: ChapterText }) {
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
              const category = wordCategory(word.pos, word.m?.mood);
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
