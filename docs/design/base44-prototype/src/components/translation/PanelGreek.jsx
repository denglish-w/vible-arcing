import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import { SIZE_SCALE, SPACING } from "@/lib/study-defaults";

function SplitControl({ onSplit }) {
  return (
    <button
      type="button"
      onClick={onSplit}
      aria-label="Split verse here"
      className="mx-[1px] inline-flex h-4 w-4 items-center justify-center rounded text-[12px] leading-none text-muted-foreground opacity-0 transition-opacity hover:!opacity-100 hover:text-primary group-hover:opacity-60"
    >
      +
    </button>
  );
}

// The Greek shown inside the panel's ORIGINAL box: words with inline dark-red
// brackets (clickable to focus the bracket entry) and hover split controls
// between words. No phrase selection here — bracketing happens in the reading
// card. `readOnly` hides the split controls (signed-out viewers).
function PanelGreek({ words, brackets, onAddSplit, onBracketClick, highlightBracketId, readOnly }) {
  const { settings } = useStudySettings();
  const sizeRem = SIZE_SCALE[settings.fontSizeIndex] ?? SIZE_SCALE[2];
  const lineHeight = SPACING[settings.lineSpacing] ?? SPACING.comfortable;
  const tokens = useMemo(() => {
    const segBrackets = brackets || [];
    const out = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const opens = segBrackets.filter((b) => b.start === w.word_num).sort((a, b) => b.end - a.end);
      for (const b of opens) out.push({ type: "open", bracket: b });
      out.push({ type: "word", word: w, index: i });
      const closes = segBrackets.filter((b) => b.end === w.word_num).sort((a, b) => a.start - b.start);
      for (const b of closes) out.push({ type: "close", bracket: b });
    }
    return out;
  }, [words, brackets]);
  return (
    <div
      className="group relative font-heading text-foreground"
      style={{ fontFamily: settings.fontFamily, fontSize: `${sizeRem}rem`, lineHeight }}
    >
      {tokens.map((t, i) => {
        if (t.type === "word") {
          const w = t.word;
          return (
            <span key={`w${w.id}`}>
              <span className="cursor-default rounded px-[1px]">
                {w.text}
                {w.after || ""}
              </span>{" "}
              {!readOnly && t.index < words.length - 1 && onAddSplit && (
                <SplitControl onSplit={() => onAddSplit(w.word_num)} />
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
              onClick={() => onBracketClick?.(b)}
              className={cn(
                "font-bold text-primary",
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
    </div>
  );
}

export default memo(PanelGreek);