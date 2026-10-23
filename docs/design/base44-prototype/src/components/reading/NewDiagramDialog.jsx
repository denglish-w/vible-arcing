import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BOOKS, GROUPS } from "@/lib/books";
import { loadStaticChapter } from "@/lib/staticChapter";
import { verseNumbers } from "@/lib/verses";
import { cn } from "@/lib/utils";

// Book / chapter / verse-range picker for a new diagram. The book list follows
// the canonical Greek New Testament order (the order of BOOKS), grouped by the
// standard sections. Once a chapter is chosen the verse grid is built from the
// existing SBLGNT static data for that chapter. The user picks a start and end
// verse; Confirm returns { book, chapter, startVerse, endVerse }.
export default function NewDiagramDialog({ open, onOpenChange, onConfirm }) {
  const [book, setBook] = useState(BOOKS[0]);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  // Load the verse numbers for the selected book + chapter from the static
  // SBLGNT data. Reset the range whenever the book or chapter changes.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingVerses(true);
    setStart(null);
    setEnd(null);
    loadStaticChapter(book.code, chapter)
      .then(({ words, english }) => {
        if (cancelled) return;
        setVerses(verseNumbers(words, english));
      })
      .catch(() => {
        if (!cancelled) setVerses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingVerses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, book, chapter]);

  function selectBook(b) {
    if (b.id === book.id) return;
    setBook(b);
    setChapter(1);
  }

  function selectChapter(c) {
    if (c === chapter) return;
    setChapter(c);
  }

  // First click sets the start; a second click sets the end (swapping if the
  // verse is before the start); a third click restarts the range.
  function selectVerse(v) {
    if (start === null) {
      setStart(v);
      setEnd(v);
      return;
    }
    if (start !== null && end === start) {
      if (v >= start) setEnd(v);
      else {
        setStart(v);
        setEnd(v);
      }
      return;
    }
    setStart(v);
    setEnd(v);
  }

  const rangeReady = start !== null && end !== null && end >= start;
  const min = Math.min(start ?? 1, end ?? 1);
  const max = Math.max(start ?? 1, end ?? 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>New Diagram</DialogTitle>
        </DialogHeader>
        <div className="flex h-[26rem] border-t border-border">
          {/* Book list — canonical GNT order, grouped */}
          <div className="bubble-scroll w-48 shrink-0 overflow-y-auto border-r border-border py-2">
            {GROUPS.map((g) => (
              <div key={g} className="mb-3">
                <div className="small-caps px-3 py-1.5">{g}</div>
                {BOOKS.filter((b) => b.group === g).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => selectBook(b)}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-1.5 text-left font-body text-sm transition-colors",
                      b.id === book.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{b.name}</span>
                    <span className="font-display text-xs text-muted-foreground">{b.greek}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Chapter + verse grids */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="bubble-scroll shrink-0 overflow-y-auto border-b border-border px-4 py-3">
              <div className="small-caps mb-2">Chapter</div>
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectChapter(c)}
                    className={cn(
                      "h-8 rounded-md border font-body text-sm transition-colors",
                      c === chapter
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="bubble-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="small-caps mb-2">Verses</div>
              {loadingVerses ? (
                <p className="font-body text-sm text-muted-foreground">Loading verses…</p>
              ) : verses.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground">No verses found.</p>
              ) : (
                <div className="grid grid-cols-8 gap-1.5">
                  {verses.map((v) => {
                    const inRange = start !== null && end !== null && v >= min && v <= max;
                    const isEdge = v === start || v === end;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => selectVerse(v)}
                        className={cn(
                          "h-8 rounded-md border font-body text-sm transition-colors",
                          isEdge
                            ? "border-primary bg-primary text-primary-foreground"
                            : inRange
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!rangeReady}
            onClick={() => {
              onConfirm({ book, chapter, startVerse: min, endVerse: max });
              onOpenChange(false);
            }}
            className="bg-primary text-primary-foreground"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}