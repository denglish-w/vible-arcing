import { useEffect, useRef, useState } from "react";
import { getStaticWordDetail } from "@/lib/staticWordDetail";
import { buildParse } from "@/lib/parse";
import { Skeleton } from "@/components/ui/skeleton";
import { useBubbleAnchor } from "@/hooks/useBubbleAnchor";
import { BubblePointer } from "@/components/bubble/BubblePointer";

// A compact word-detail card that pops up beside a clicked word in the reading
// card. It shares one placement routine (useBubbleAnchor) with the Learning
// bubble so the two cannot drift: it opens below/above the word, centers on it,
// flips when content grows, keeps a pointer aimed at the word, and becomes a
// bottom sheet on narrow screens. It is fixed once open (it does not follow the
// word) and closes when the reading card scrolls. Shows the lemma, parsing,
// gloss, Dodson definition, and the lemma's New Testament occurrence count only.
export default function WordDetailPopover({ word, anchorEl, scrollContainerRef, onClose, isMobile, rightInset = 0, words, morph }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  // Fetch detail when a word is opened.
  useEffect(() => {
    if (!word || !anchorEl) return;
    let active = true;
    setLoading(true);
    setD(null);
    getStaticWordDetail(word, words, morph)
      .then((r) => active && setD(r))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [word?.id, anchorEl]);

  const placement = useBubbleAnchor({
    anchorEl,
    cardRef,
    contentRef,
    scrollContainerRef,
    onClose,
    isMobile,
    rightInset,
    width: 320,
  });

  // Outside click (but not on another word) and Escape close the card.
  useEffect(() => {
    function onDown(e) {
      if (e.target.closest?.("[data-word]")) return;
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose?.();
    }
    function onEsc(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  if (!word) return null;

  const fullWord = d?.word;
  const parse = fullWord ? buildParse(fullWord) : "";
  const ntCount = typeof d?.occurrences === "number" ? d.occurrences : null;

  const inner = (
    <div ref={contentRef} className="px-4 pt-3 pb-3">
      {loading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-heading text-xl font-semibold leading-tight text-foreground">
              {d?.headword || fullWord?.lemma || word.text}
            </div>
            {fullWord?.strong && (
              <div className="whitespace-nowrap font-body text-sm text-primary">
                Strong's {String(fullWord.strong).replace(/\.0+$/, "")}
              </div>
            )}
          </div>
          {d?.hasEntry && d.definition && (
            <div className="font-body text-sm leading-relaxed text-foreground/90">{d.definition}</div>
          )}
          {parse && <div className="font-body text-sm text-muted-foreground">{parse}</div>}
          {fullWord?.gloss && (
            <div className="border-t border-border/60 pt-2 font-body text-xs italic text-foreground/80">
              {fullWord.gloss}
            </div>
          )}
          {ntCount != null && (
            <div className="font-body text-xs text-muted-foreground">
              Occurs {ntCount} {ntCount === 1 ? "time" : "times"} in the Greek New Testament
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div
        ref={cardRef}
        className="bubble-scroll fixed inset-x-0 bottom-0 z-50 overflow-y-auto rounded-t-xl border border-border bg-card shadow-lg"
        style={{ maxHeight: "85vh" }}
      >
        {inner}
      </div>
    );
  }

  const style =
    placement && placement.kind === "fixed"
      ? { top: placement.top, left: placement.left, width: 320, maxHeight: placement.maxH, visibility: "visible" }
      : { top: 0, left: 0, width: 320, maxHeight: "60vh", visibility: "hidden" };

  return (
    <div ref={cardRef} className="fixed z-50 flex flex-col rounded-lg border border-border bg-card shadow-lg" style={style}>
      <div className="bubble-scroll min-h-0 flex-1 overflow-y-auto rounded-lg">
        {inner}
      </div>
      {placement && placement.kind === "fixed" && (
        <BubblePointer placeBelow={placement.placeBelow} pointerX={placement.pointerX} />
      )}
    </div>
  );
}