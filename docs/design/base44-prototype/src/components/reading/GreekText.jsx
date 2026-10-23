import { useEffect, useMemo } from "react";
import ReadingVerse from "./ReadingVerse";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import { SIZE_SCALE, SPACING } from "@/lib/study-defaults";
import { cn } from "@/lib/utils";
import { bsbByVerse } from "@/lib/verses";

const EMPTY_CATS = {};
const EMPTY_BRACKETS = [];

function groupByVerse(words) {
  const map = new Map();
  for (const w of words) {
    if (!map.has(w.verse)) map.set(w.verse, []);
    map.get(w.verse).push(w);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

// The flowing Greek prose reading card. Font, size, line spacing, and verse
// numbers come from the study display settings; part-of-speech coloring and
// coloring is driven by the morph cache passed from the route (disabled in
// Learning mode). Brackets/selection behave as before when Translate is on.
export default function GreekText({
  words,
  selectedWordId,
  onWordActivate,
  onVerseNumberClick,
  currentVerse,
  tone = "reading",
  enableSelection = false,
  bracketsByVerse,
  onAddBracket,
  onBracketClick,
  focusBracket,
  morphMap,
  scrollToVerse,
  english,
  englishOn,
  translate,
}) {
  const { settings } = useStudySettings();
  const verses = useMemo(() => groupByVerse(words), [words]);
  const bsbMap = useMemo(() => (translate ? bsbByVerse(english) : null), [translate, english]);
  // One stable object per verse, so a memoized verse only re-renders when its own
  // annotation (or the shared translate inputs) change.
  const translateByVerse = useMemo(() => {
    if (!translate) return null;
    const out = {};
    for (const [verse] of verses) {
      out[verse] = {
        bsbVerse: bsbMap.get(verse),
        bsbVisible: !!settings.showBsb,
        annotation: translate.annotations[verse],
        book: translate.book,
        chapter: translate.chapter,
        isAuthenticated: translate.isAuthenticated,
        onMutate: translate.onMutate,
        focusBracket: translate.focusBracket?.verse === verse ? translate.focusBracket : null,
        onFocusBracket: translate.onFocusBracket,
      };
    }
    return out;
  }, [translate, verses, bsbMap, settings.showBsb]);
  // The verse holding the selected word. Every other verse is handed null, so
  // selecting a word re-renders only the old and new verse, not the whole chapter.
  const selectedVerse = useMemo(
    () => (selectedWordId == null ? null : words.find((w) => w.id === selectedWordId)?.verse ?? null),
    [words, selectedWordId]
  );
  const englishByVerse = useMemo(() => {
    const m = {};
    for (const e of english || []) if (e && e.verse != null) m[e.verse] = e.text;
    return m;
  }, [english]);

  useEffect(() => {
    if (currentVerse == null) return;
    const el = document.getElementById(`gk-${currentVerse}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [currentVerse]);

  useEffect(() => {
    if (!focusBracket) return;
    const el = document.getElementById(`brk-${focusBracket.id}`);
    if (el) el.scrollIntoView({ block: "center" });
  }, [focusBracket]);

  // Scroll the Greek text to a verse (e.g. when a verse number is clicked in the
  // English panel) without changing the verse highlight.
  useEffect(() => {
    if (scrollToVerse == null) return;
    const el = document.getElementById(`gk-${scrollToVerse}`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [scrollToVerse]);

  if (!words.length) {
    return (
      <p className="font-body text-sm text-muted-foreground">
        No Greek text loaded for this chapter yet.
      </p>
    );
  }

  const sizeRem = SIZE_SCALE[settings.fontSizeIndex] ?? SIZE_SCALE[2];
  const lineHeight = SPACING[settings.lineSpacing] ?? SPACING.comfortable;
  const colorOn = tone !== "learning" && !!settings.posColor.enabled;
  const cats = settings.posColor.categories || EMPTY_CATS;

  return (
    <div
      className={cn(
        "font-heading text-foreground",
        !settings.showVerseNumbers && "verse-numbers-off"
      )}
      style={{ fontFamily: settings.fontFamily, fontSize: `${sizeRem}rem`, lineHeight }}
    >
      {verses.map(([verse, vwords]) => (
        <ReadingVerse
          key={verse}
          verse={verse}
          vwords={vwords}
          brackets={bracketsByVerse?.[verse]?.brackets || EMPTY_BRACKETS}
          selectedWordId={selectedVerse === verse ? selectedWordId : null}
          onWordActivate={onWordActivate}
          enableSelection={enableSelection}
          onAddBracket={onAddBracket}
          onBracketClick={onBracketClick}
          highlightBracketId={focusBracket?.verse === verse ? focusBracket.id : null}
          isCurrent={currentVerse === verse}
          onVerseNumberClick={onVerseNumberClick}
          tone={tone}
          morphMap={morphMap}
          colorOn={colorOn}
          colorCats={cats}
          englishText={englishOn ? englishByVerse[verse] : undefined}
          translate={translateByVerse?.[verse]}
        />
      ))}
    </div>
  );
}