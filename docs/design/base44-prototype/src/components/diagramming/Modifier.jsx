import { cn } from "@/lib/utils";

// A modifier hanging from a baseline word: a slanted connector down to a short
// horizontal line that carries the modifying word(s). Rendered as a child of
// the target word's span, so it follows automatically when the baseline moves.
// Modifying words are draggable (to move them onto a baseline) and clickable
// (to select for deletion).
export default function Modifier({
  modifier,
  baselineId,
  onWordClick,
  canvasSel,
  onDragItem,
}) {
  const { id: modId, words } = modifier;
  return (
    <div
      style={{ position: "absolute", left: "50%", top: "100%", overflow: "visible" }}
      className="pointer-events-none"
    >
      {/* curved modifier connector from the word's bottom-center down-left */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        width="1"
        height="1"
      >
        <path d="M 0 0 C -4 14 -18 20 -26 30" className="diagram-mod" />
      </svg>
      {/* horizontal line + modifying word(s), anchored at the slant's end */}
      <div
        style={{ position: "absolute", left: -26, top: 30, transform: "translate(-50%, 0)" }}
        className="flex flex-col items-center"
      >
        <div className="flex items-end justify-center gap-2 pb-[2px]">
          {words.map((w) => (
            <span
              key={w.id}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.effectAllowed = "move";
                onDragItem?.({ kind: "placed", baselineId, modId, wordId: w.id });
              }}
              onDragEnd={() => onDragItem?.(null)}
              onClick={(e) => {
                e.stopPropagation();
                onWordClick?.(baselineId, modId, w.id);
              }}
              className={cn(
                "pointer-events-auto cursor-pointer rounded px-0.5 font-display text-lg leading-none text-foreground",
                canvasSel?.kind === "word" &&
                  canvasSel.modId === modId &&
                  canvasSel.wordId === w.id &&
                  "bg-primary/20 ring-1 ring-primary"
              )}
            >
              {w.text}
            </span>
          ))}
        </div>
        <div className="h-[2px] w-full min-w-[120px] bg-foreground" />
      </div>
    </div>
  );
}