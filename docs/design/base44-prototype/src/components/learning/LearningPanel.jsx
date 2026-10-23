import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ParsingForm from "./ParsingForm";

// The right-hand panel for Learning mode: shows the word (no parsing), the
// parsing form, the result, and the Next-word / end-of-chapter flow.
export default function LearningPanel({
  word,
  words,
  book,
  chapter,
  options,
  open,
  onOpenChange,
  onSelectWord,
}) {
  const [result, setResult] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [ended, setEnded] = useState(false);

  // Selecting a new word (by click or Next) resets the form and any result.
  useEffect(() => {
    setResult(null);
    setEnded(false);
    setResetKey((k) => k + 1);
  }, [word?.id]);

  if (!word) return null;

  function handleNext() {
    const idx = words.findIndex((w) => w.id === word.id);
    const next = words[idx + 1];
    if (next) {
      onSelectWord(next);
    } else {
      setEnded(true);
      setResult(null);
    }
  }

  const refLabel = `${book.code} ${chapter}:${word.verse}`;
  const hasNextChapter = chapter < book.chapters;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        withOverlay={false}
        className="flex w-full flex-col border-t-4 border-t-primary p-0 sm:max-w-md"
      >
        <div className="shrink-0 border-b border-border px-6 pb-4 pt-5">
          <div className="small-caps text-muted-foreground">{refLabel}</div>
          <div className="mt-1 font-heading text-3xl text-foreground">{word.text}</div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {ended ? (
            <div className="px-6 py-12 text-center">
              <p className="font-heading text-2xl text-foreground">End of chapter</p>
              {hasNextChapter ? (
                <Button asChild className="mt-4 bg-primary text-primary-foreground">
                  <Link
                    to="/read/$bookId/$chapter"
                    params={{ bookId: book.id, chapter: String(chapter + 1) }}
                  >
                    Next chapter
                  </Link>
                </Button>
              ) : (
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  You've reached the end of {book.name}.
                </p>
              )}
            </div>
          ) : (
            <ParsingForm
              key={resetKey}
              word={word}
              options={options}
              result={result}
              onResult={setResult}
              onNext={handleNext}
              onIgnore={() => setResult(null)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}