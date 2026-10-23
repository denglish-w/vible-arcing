import { memo, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canAddBracket } from "@/lib/diaglot";
import { wordCategory, categoryStyle } from "@/lib/pos";
import { toast } from "sonner";
import InlineTranslation from "@/components/translation/InlineTranslation";

// One verse in the flowing reading-card prose. Renders clickable words with
// inline dark-red brackets, supports drag / shift-click phrase selection with a
// floating Bracket/Cancel toolbar (Translate on, Reading mode), and applies
// part-of-speech coloring (underline + tint) plus a temporary pink highlight on
// the occurrence currently stepped to. A plain click on a single word activates
// it (word detail).
function ReadingVerse({
  verse,
  vwords,
  brackets,
  selectedWordId,
  onWordActivate,
  enableSelection,
  onAddBracket,
  onBracketClick,
  highlightBracketId,
  isCurrent,
  onVerseNumberClick,
  tone,
  morphMap,
  colorOn,
  colorCats,
  englishText,
  translate,
}) {
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [toolbarPos, setToolbarPos] = useState(null);
  const [splitting, setSplitting] = useState(false);
  const containerRef = useRef(null);
  const wordRefs = useRef({});

  const segBrackets = brackets || [];
  const splitSet = new Set(translate?.annotation?.splits || []);

  function addSplit(wordNum) {
    translate?.onMutate(verse, (a) => {
      if ((a.brackets || []).some((b) => b.start <= wordNum && wordNum < b.end)) {
        toast.error("Can't split inside a bracket.");
        return a;
      }
      if ((a.splits || []).includes(wordNum)) return a;
      return {
        ...a,
        splits: [...(a.splits || []), wordNum].sort((x, y) => x - y),
        segments: { ...a.segments, [String(wordNum + 1)]: { translation: "", notes: "" } },
      };
    });
  }

  const tokens = [];
  for (let i = 0; i < vwords.length; i++) {
    const w = vwords[i];
    const opens = segBrackets.filter((b) => b.start === w.word_num).sort((a, b) => b.end - a.end);
    for (const b of opens) tokens.push({ type: "open", bracket: b });
    tokens.push({ type: "word", word: w, index: i });
    const closes = segBrackets.filter((b) => b.end === w.word_num).sort((a, b) => a.start - b.start);
    for (const b of closes) tokens.push({ type: "close", bracket: b });
  }

  const selectedSet = new Set();
  if (selStart != null && selEnd != null) {
    const lo = Math.min(selStart, selEnd);
    const hi = Math.max(selStart, selEnd);
    for (const w of vwords) if (w.word_num >= lo && w.word_num <= hi) selectedSet.add(w.word_num);
  }
  const hasSelection = selectedSet.size >= 2;

  function morphOf(w) {
    return morphMap ? morphMap[`${verse}:${w.word_num}`] : null;
  }

  function wordStyle(w, selected) {
    const style = {};
    if (colorOn) {
      const m = morphOf(w);
      if (m) {
        const cat = wordCategory(m.pos, m.mood);
        if (colorCats[cat]) Object.assign(style, categoryStyle(cat));
      }
    }
    return style;
  }

  function positionToolbar(lo) {
    if (lo == null) {
      if (selStart == null || selEnd == null) return;
      lo = Math.min(selStart, selEnd);
    }
    const el = wordRefs.current[lo];
    if (el && containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      setToolbarPos({ top: eRect.top - cRect.top - 38, left: Math.max(0, eRect.left - cRect.left) });
    }
  }

  useEffect(() => {
    function onUp() {
      if (!dragging) return;
      setDragging(false);
      if (selStart != null && selEnd != null && selStart !== selEnd) {
        positionToolbar();
      } else {
        const w = vwords.find((x) => x.word_num === anchor);
        if (w) onWordActivate?.(w, wordRefs.current[w.word_num]);
        setSelStart(null);
        setSelEnd(null);
        setToolbarPos(null);
      }
    }
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, selStart, selEnd, anchor, vwords, onWordActivate]);

  function handleMouseDown(e, w) {
    if (!enableSelection) return;
    if (e.shiftKey && anchor != null) {
      e.preventDefault();
      setSelStart(anchor);
      setSelEnd(w.word_num);
      setDragging(false);
      const lo = Math.min(anchor, w.word_num);
      requestAnimationFrame(() => positionToolbar(lo));
      return;
    }
    e.preventDefault();
    setAnchor(w.word_num);
    setSelStart(w.word_num);
    setSelEnd(w.word_num);
    setDragging(true);
    setToolbarPos(null);
  }

  function handleEnter(w) {
    if (dragging) setSelEnd(w.word_num);
  }

  function doBracket() {
    const lo = Math.min(selStart, selEnd);
    const hi = Math.max(selStart, selEnd);
    const nb = {
      id: crypto.randomUUID?.() || String(Date.now() + Math.random()),
      start: lo,
      end: hi,
      rendering: "",
      note: "",
    };
    if (!canAddBracket(segBrackets, nb)) {
      toast.error("Brackets can't partially overlap.");
      return;
    }
    onAddBracket?.(verse, nb);
    setSelStart(null);
    setSelEnd(null);
    setToolbarPos(null);
  }

  function cancelSel() {
    setSelStart(null);
    setSelEnd(null);
    setToolbarPos(null);
  }

  return (
    <div
      ref={containerRef}
      id={`gk-${verse}`}
      className={cn(
        "group relative mb-5 rounded px-1 -mx-1"
      )}
    >
      <sup className="mr-1.5 font-body text-[11px] font-semibold text-muted-foreground [font-variant-numeric:tabular-nums]">
        <button
          type="button"
          onClick={() => onVerseNumberClick?.(verse)}
          className="hover:text-primary"
        >
          {verse}
        </button>
      </sup>
      {tokens.map((t, i) => {
        if (t.type === "word") {
          const w = t.word;
          const sel = selectedSet.has(w.word_num);
          const selected = w.id === selectedWordId;
          return (
            <span key={`w${w.id}`}>
              <span
                id={`w-${verse}-${w.word_num}`}
                data-word={w.id}
                ref={(el) => {
                  wordRefs.current[w.word_num] = el;
                }}
                onMouseDown={(e) => {
                  if (!splitting) handleMouseDown(e, w);
                }}
                onMouseEnter={() => handleEnter(w)}
                onClick={
                  splitting
                    ? (e) => e.preventDefault()
                    : enableSelection
                    ? undefined
                    : (e) => {
                        e.preventDefault();
                        onWordActivate?.(w, wordRefs.current[w.word_num]);
                      }
                }
                style={wordStyle(w, selected)}
                className={cn(
                  "cursor-pointer rounded px-[1px] transition-colors hover:bg-card hover:text-primary",
                  sel && "bg-secondary/70 text-foreground",
                  selected && (tone === "learning" ? "bg-pinkhighlight text-foreground" : "bg-card text-primary")
                )}
              >
                {w.text}
                {w.after || ""}
              </span>{" "}
              {splitSet.has(w.word_num) && (
                <span aria-hidden className="mx-1 select-none font-light text-primary">|</span>
              )}
              {splitting && t.index < vwords.length - 1 && !splitSet.has(w.word_num) && (
                <button
                  type="button"
                  aria-label="Split verse here"
                  onClick={() => addSplit(w.word_num)}
                  className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 align-middle text-[13px] leading-none text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  +
                </button>
              )}
            </span>
          );
        }
        if (t.type === "open") {
          const b = t.bracket;
          return (
            <button
              key={`o${i}`}
              type="button"
              id={`brk-${b.id}`}
              onClick={() => onBracketClick?.(b, verse)}
              className={cn(
                "cursor-pointer font-bold text-primary",
                highlightBracketId === b.id && "ring-2 ring-primary rounded"
              )}
            >
              [
            </button>
          );
        }
        if (t.type === "close") {
          return (
            <span key={`c${i}`} className="font-bold text-primary">
              ]
            </span>
          );
        }
        return null;
      })}
      {englishText && (
        <div className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
          {englishText}
        </div>
      )}
      {translate && (
        <InlineTranslation
          verse={verse}
          vwords={vwords}
          bsbVerse={translate.bsbVerse}
          bsbVisible={translate.bsbVisible}
          annotation={translate.annotation}
          book={translate.book}
          chapter={translate.chapter}
          isAuthenticated={translate.isAuthenticated}
          onMutate={translate.onMutate}
          focusBracket={translate.focusBracket}
          onFocusBracket={translate.onFocusBracket}
          splitting={splitting}
          onToggleSplit={() => setSplitting((s) => !s)}
        />
      )}
      {hasSelection && toolbarPos && (
        <div
          className="absolute z-30 flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-md"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          <Button size="sm" onClick={doBracket}>
            Bracket
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelSel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

// Only the verse whose own inputs changed re-renders (e.g. the one with the
// newly selected word), not every verse in the chapter.
export default memo(ReadingVerse);