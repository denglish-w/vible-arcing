import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParsingForm, ParsingFields } from "@/components/learning/ParsingForm";
import ResultCard from "@/components/learning/ResultCard";
import BubbleShell from "@/components/bubble/BubbleShell";
import { useBubbleAnchor } from "@/hooks/useBubbleAnchor";
import { BubblePointer } from "@/components/bubble/BubblePointer";

// Learning-mode parsing shown as a fixed bubble anchored to the clicked word,
// sharing one placement routine (useBubbleAnchor) with the Reading-mode
// WordDetailPopover. Three stacked parts: a header that never scrolls (the
// reference label + "×" on one line, the headword on its own line below), a
// scrollable body (lemma input, parse dropdowns, and the Matched/Disputed
// result), and a footer pinned to the bottom (helper text, Check / Check again,
// and after a result Ignore + Next word). The bubble never exceeds the safe
// area; on narrow screens it is a bottom sheet (max 85% of the screen).
//
// The bubble closes whenever the page is scrolled outside it, and never
// reopens itself. Programmatic scrolls (bringing a low word up, or "Next word")
// are ignored by the close rule while they run.
const BUBBLE_W = 384;
const COMPACT_VH = 640; // windows shorter than this get compact controls
const RESULT_RESERVE = 260; // extra height kept free for the result card

// Keyed by word so the form (and its saved-attempt restore) resets for each
// word, while the bubble frame is re-created only when the word changes.
export default function LearningBubble(props) {
  if (!props.word) return null;
  return <LearningBubbleInner key={props.word.id} {...props} />;
}

function LearningBubbleInner({
  word,
  anchorEl,
  onClose,
  words,
  book,
  chapter,
  options,
  onSelectWord,
  rightInset,
  scrollContainerRef,
  isMobile,
}) {
  const [result, setResult] = useState(null);
  const [ended, setEnded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [short, setShort] = useState(false);
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const resultRef = useRef(null);

  // Protection (unchecked edits or a result showing) blocks the second-Esc
  // close. Held in a ref so the listener always reads the latest value.
  const protectedRef = useRef(false);
  const suppressRef = useRef(false);
  protectedRef.current = dirty || !!result;

  useEffect(() => {
    const update = () => setShort(window.innerHeight < COMPACT_VH);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Header + footer heights are fixed chrome around the scrolling body; the
  // placement hook adds them to the body's content height to get the natural
  // bubble height. Approximated from the live frame.
  const [chromeH, setChromeH] = useState(0);
  useLayoutEffect(() => {
    const card = cardRef.current;
    const body = bodyRef.current;
    if (!card || !body) return;
    const next = Math.max(0, card.offsetHeight - body.clientHeight);
    setChromeH((c) => (Math.abs(c - next) > 1 ? next : c));
  });

  const placement = useBubbleAnchor({
    anchorEl,
    cardRef,
    contentRef,
    scrollContainerRef,
    onClose,
    canCloseOnScroll: () => !suppressRef.current,
    isMobile,
    rightInset,
    chromeH,
    // Reserve room for the result (Matched / Disputed) so a word near the
    // bottom opens above the word with space for it, instead of flipping or
    // clipping once the result appears.
    reserveH: RESULT_RESERVE,
    width: BUBBLE_W,
  });

  const form = useParsingForm({
    word,
    onResult: setResult,
    onDirtyChange: setDirty,
  });

  // When a result appears, scroll the body so the top of the result is visible
  // (the footer is a separate flex row and does not move).
  useEffect(() => {
    if (!result || !resultRef.current || !bodyRef.current) return;
    const body = bodyRef.current;
    const t = window.setTimeout(() => {
      if (!resultRef.current || !bodyRef.current) return;
      const top = resultRef.current.offsetTop - 8;
      body.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 30);
    return () => window.clearTimeout(t);
  }, [result]);

  // Outside click and Escape. Clicking the menu (data-parse-menu), another
  // word, or the Translate panel does not close the bubble. The first Escape
  // closes an open menu (the menu handles it; we bail if one is open); a
  // second Escape closes the bubble only when there is no work in progress.
  useEffect(() => {
    function onDown(e) {
      if (e.target.closest?.("[data-word]")) return;
      if (e.target.closest?.("[data-translate-box]")) return;
      if (e.target.closest?.("[data-parse-menu]")) return;
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
    }
    function onEsc(e) {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-parse-menu]")) return;
      if (protectedRef.current) return;
      onClose?.();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  const handleNext = useCallback(() => {
    const idx = words.findIndex((w) => w.id === word.id);
    const next = words[idx + 1];
    if (!next) {
      setEnded(true);
      setResult(null);
      return;
    }
    const el =
      document.getElementById(`w-${next.verse}-${next.word_num}`) ||
      document.querySelector(`[data-word="${next.id}"]`);
    // Bring the next word into view first (programmatic scroll, ignored by the
    // close rule), then re-anchor the bubble on it. The anchor effect above
    // repeats the "lower 55%" adjustment for the new word.
    if (el) {
      suppressRef.current = true;
      el.scrollIntoView({ block: "nearest" });
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 350);
    }
    onSelectWord(next, el);
  }, [word, words, onSelectWord]);

  const refLabel = `${book.code} ${chapter}:${word.verse}`;
  const hasNextChapter = chapter < book.chapters;
  const compact = short || isMobile;

  const header = (
    <div className={compact ? "px-4 pt-3" : "px-5 pt-4"}>
      <div className="flex items-center justify-end gap-2">
        <span className="font-body text-sm text-primary">{refLabel}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div
        className={`font-heading leading-snug text-foreground ${compact ? "mt-2 pb-2 text-xl" : "mt-3 pb-3 text-2xl"}`}
      >
        {word.text}
      </div>
    </div>
  );

  const body = ended ? (
    <div className="py-8 text-center">
      <p className="font-heading text-xl text-foreground">End of chapter</p>
      {hasNextChapter ? (
        <Button asChild className="mt-3 bg-primary text-primary-foreground">
          <Link to="/read/$bookId/$chapter" params={{ bookId: book.id, chapter: String(chapter + 1) }}>
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
    <>
      <ParsingFields form={form} options={options} compact={compact} />
      {result && (
        <div ref={resultRef} className={compact ? "mt-3" : "mt-4"}>
          <ResultCard result={result} inline />
        </div>
      )}
    </>
  );

  const footer = ended ? null : (
    <div className="flex items-center justify-between gap-3">
      {!result && (
        <p className="max-w-[55%] font-body text-xs leading-snug text-muted-foreground">
          Latin keys become Greek as you type. s turns to ς at a word end.
        </p>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {(form.hasInput || result) && (
          <Button
            variant="ghost"
            size={compact ? "sm" : "default"}
            onClick={() => {
              form.clearAnswer();
              setResult(null);
            }}
            disabled={form.checking}
          >
            Clear
          </Button>
        )}
        {result && (
          <>
            {result.result === "disputed" && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => setResult(null)}
                className="bg-background"
              >
                Ignore
              </Button>
            )}
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={form.handleCheck}
              disabled={!form.allFilled || form.checking}
              className="bg-background"
            >
              {form.checking ? "Checking…" : "Check again"}
            </Button>
            <Button size={compact ? "sm" : "default"} onClick={handleNext} className="bg-primary text-primary-foreground">
              Next word
            </Button>
          </>
        )}
        {!result && (
          <Button
            size={compact ? "sm" : "default"}
            onClick={form.handleCheck}
            disabled={!form.allFilled || form.checking}
            className="bg-primary text-primary-foreground"
          >
            {form.checking ? "Checking…" : "Check"}
          </Button>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        ref={cardRef}
        className="fixed inset-x-0 bottom-0 z-[60] flex flex-col overflow-hidden rounded-t-xl border border-border bg-card shadow-lg"
        style={{ maxHeight: "85vh" }}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border" />
        <BubbleShell header={header} footer={footer} contentRef={contentRef} bodyRef={bodyRef} compact>
          {body}
        </BubbleShell>
      </div>
    );
  }

  const fixed = placement && placement.kind === "fixed";
  const style = fixed
    ? { top: placement.top, left: placement.left, width: BUBBLE_W, maxHeight: placement.maxH, visibility: "visible" }
    : { top: 0, left: 0, width: BUBBLE_W, maxHeight: "60vh", visibility: "hidden" };

  return (
    <div
      ref={cardRef}
      className="fixed z-[60] flex flex-col rounded-lg border border-border bg-card shadow-lg"
      style={style}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg">
        <BubbleShell
          header={header}
          footer={footer}
          contentRef={contentRef}
          bodyRef={bodyRef}
          maxH={placement?.maxH}
          compact={compact}
        >
          {body}
        </BubbleShell>
      </div>
      {fixed && <BubblePointer placeBelow={placement.placeBelow} pointerX={placement.pointerX} />}
    </div>
  );
}