"use client";
// The Learning-mode counterpart of GreekText (spec 010 FR-004, FR-007, FR-020,
// FR-023, FR-029 to FR-031). It receives each word's text and id only; a word's
// source parsing arrives in the response to checking it. Same verse layout and
// display settings as Reading mode, without part-of-speech styling.
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getBook, nextChapter } from "@/lib/books";
import { createOutbox, type Outbox } from "@/lib/learning/outbox";
import { adjacentWord } from "@/lib/learning/navigation";
import {
  revealWord,
  restoreSelection,
  useSelectionStore,
} from "@/lib/learning/selection";
import type {
  AttemptSummary,
  CheckResult,
  LeanChapter,
  LeanWord,
  LearningActions,
  ParsingAnswer,
} from "@/lib/learning/types";
import { SIZE_SCALE, SPACING, useSettingsStore } from "@/lib/settings";
import { ParsingForm, type EndOfChapter, type SaveState } from "./parsing-form";

type Save = { id: string; state: SaveState; reason?: string };

export function LearningText({
  data,
  attempts: initialAttempts,
  actions,
}: {
  data: LeanChapter;
  attempts: Record<string, AttemptSummary>;
  actions: Pick<LearningActions, "checkParse" | "recordAttempt">;
}) {
  const settings = useSettingsStore((state) => state.settings);
  const selectedId = useSelectionStore((state) => state.selectedId);
  const select = useSelectionStore((state) => state.select);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [saves, setSaves] = useState<Record<string, Save>>({});
  const [atEnd, setAtEnd] = useState(false);
  const dirty = useRef(false);
  const outbox = useRef<Outbox | null>(null);
  const book = getBook(data.book);

  useEffect(() => {
    const box = createOutbox({
      send: actions.recordAttempt,
      onStatus: (status) =>
        setSaves((current) => {
          const entry = Object.entries(current).find(
            ([, save]) => save.id === status.id,
          );
          if (!entry) return current;
          const [wordId] = entry;
          return {
            ...current,
            [wordId]: {
              id: status.id,
              state:
                status.state === "retrying"
                  ? "pending"
                  : status.state === "refused"
                    ? "refused"
                    : undefined,
              reason: status.state === "refused" ? status.reason : undefined,
            },
          };
        }),
      target: window,
    });
    outbox.current = box;
    return () => box.dispose();
  }, [actions.recordAttempt]);

  // A word selected before switching mode stays selected (FR-006).
  useEffect(() => restoreSelection(data.words), [data.words]);

  const close = useCallback(
    (id: string) => {
      select(null);
      setAtEnd(false);
      dirty.current = false;
      document.getElementById(id)?.focus();
    },
    [select],
  );

  function move(from: string, step: 1 | -1) {
    if (atEnd && step === -1) {
      setAtEnd(false);
      return;
    }
    const target = adjacentWord(data.words, from, step);
    dirty.current = false;
    if (!target) {
      if (step === 1) setAtEnd(true);
      return;
    }
    setAtEnd(false);
    select(target);
    revealWord(target);
  }

  async function check(answer: ParsingAnswer): Promise<CheckResult> {
    const result = await actions.checkParse(answer);
    if (result.ok) {
      const id = crypto.randomUUID();
      setSaves((current) => ({
        ...current,
        [answer.wordId]: { id, state: "pending" },
      }));
      setAttempts((current) => ({
        ...current,
        [answer.wordId]: {
          answer,
          checkedAt: new Date().toISOString(),
          allAgreed: result.allAgreed,
          differCount: result.differCount,
        },
      }));
      // The result shows at once; saving happens in the background (FR-023).
      outbox.current?.add({ id, answer });
    }
    return result;
  }

  const verses = new Map<number, LeanWord[]>();
  for (const word of data.words) {
    const verse = verses.get(word.v) ?? [];
    verse.push(word);
    verses.set(word.v, verse);
  }
  const following = nextChapter(data.book, data.chapter);
  const endOfChapter: EndOfChapter = following
    ? {
        href: `/read/${following.book.slug}/${following.chapter}`,
        label: `${following.book.name} ${following.chapter}`,
      }
    : null;
  const onDirtyChange = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  return (
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
            const open = selectedId === word.id;
            const index = data.words.indexOf(word);
            return (
              <Fragment key={word.id}>
                <Popover
                  open={open}
                  onOpenChange={(next) => {
                    if (next) {
                      dirty.current = false;
                      setAtEnd(false);
                      select(word.id);
                    } else if (open && !dirty.current) close(word.id);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="word"
                      data-word-id={word.id}
                      id={word.id}
                      aria-label={`${word.text}, parse this word`}
                    >
                      {word.text}
                    </button>
                  </PopoverTrigger>
                  {open && (
                    <PopoverContent
                      className="word-detail parsing-popover"
                      lang="en"
                      aria-label={`Parse ${word.text}`}
                      onOpenAutoFocus={(event) => event.preventDefault()}
                      onCloseAutoFocus={(event) => event.preventDefault()}
                      // The form handles Escape, asking first if answers
                      // are unchecked (FR-034).
                      onEscapeKeyDown={(event) => event.preventDefault()}
                      onInteractOutside={(event) => {
                        if (
                          dirty.current ||
                          (event.target instanceof Element &&
                            event.target.closest(".word"))
                        )
                          event.preventDefault();
                      }}
                    >
                      <ParsingForm
                        key={word.id}
                        word={word}
                        reference={`${book?.name ?? data.book} ${data.chapter}:${word.v}`}
                        previous={attempts[word.id]}
                        onCheck={check}
                        saveState={saves[word.id]?.state}
                        saveRefusal={saves[word.id]?.reason}
                        onPrevious={
                          index > 0 || atEnd
                            ? () => move(word.id, -1)
                            : undefined
                        }
                        onNext={() => move(word.id, 1)}
                        onClose={() => close(word.id)}
                        endOfChapter={atEnd ? endOfChapter : undefined}
                        onDirtyChange={onDirtyChange}
                      />
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
  );
}
