import { cn } from "@/lib/utils";
import Modifier from "@/components/diagramming/Modifier";

// One Reed-Kellogg-style baseline: a horizontal line crossed at its center by
// a short vertical divider. Placed words sit on the line, left to right.
// Press-drag the line to reposition it; click it (without dragging) while a
// passage word is selected to drop that word onto the line. Placed words are
// themselves draggable: drop onto a baseline (same or different) to reorder or
// move them; the insertion point is set by where on the line you drop. With the
// Modifier tool active, tapping a placed word selects it as the modifier target.
export default function Baseline({
  baseline,
  editing,
  modifierTarget,
  canvasSel,
  onDragItem,
  onDragBegin,
  onDrag,
  onDragEnd,
  onLineClick,
  onWordClick,
  onDropWord,
}) {
  const { id, x, y, words, modifiers } = baseline;
  const baselineSel = canvasSel?.kind === "baseline" && canvasSel.id === id;

  function onMouseDown(e) {
    e.stopPropagation();
    e.preventDefault();
    onDragBegin();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;
    let moved = false;
    function move(ev) {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 4) moved = true;
      if (!moved) return;
      onDrag(id, origX + (ev.clientX - startX), origY + (ev.clientY - startY));
    }
    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      onDragEnd(moved, !moved ? id : null);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  // Where in this baseline's word order a drop at clientX should insert.
  function insertIndexAt(clientX) {
    const spans = [...document.querySelectorAll(`[data-pword-bl="${id}"]`)];
    for (let i = 0; i < spans.length; i++) {
      const r = spans[i].getBoundingClientRect();
      if (clientX < r.left + r.width / 2) return i;
    }
    return spans.length;
  }

  return (
    <div
      style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, 0)" }}
      onMouseDown={onMouseDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropWord(id, insertIndexAt(e.clientX));
      }}
      className={cn(
        "group relative rounded",
        editing ? "cursor-move" : "cursor-default",
        baselineSel && "ring-2 ring-primary ring-offset-2 ring-offset-card"
      )}
    >
      <div className="relative px-1 pb-1 pt-2">
        <div className="flex min-w-[220px] items-end justify-center gap-2 pb-[2px]">
          {words.map((w) => {
            const isTarget =
              modifierTarget && modifierTarget.baselineId === id && modifierTarget.wordId === w.id;
            const isSel =
              canvasSel?.kind === "word" &&
              canvasSel.baselineId === id &&
              !canvasSel.modId &&
              canvasSel.wordId === w.id;
            const mods = (modifiers || []).filter((m) => m.targetWordId === w.id);
            return (
              <span
                key={w.id}
                data-pword-bl={id}
                data-pword-id={w.id}
                draggable={editing}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  onDragItem({ kind: "placed", baselineId: id, modId: null, wordId: w.id });
                }}
                onDragEnd={() => onDragItem(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(id, w.id);
                }}
                className={cn(
                  "relative inline-flex cursor-pointer rounded px-0.5",
                  (isTarget || isSel) && "bg-primary/20",
                  isSel && "ring-1 ring-primary"
                )}
              >
                <span className="font-display text-lg leading-none text-foreground">{w.text}</span>
                {mods.map((m) => (
                  <Modifier
                    key={m.id}
                    modifier={m}
                    baselineId={id}
                    onWordClick={onWordClick}
                    canvasSel={canvasSel}
                    onDragItem={onDragItem}
                  />
                ))}
              </span>
            );
          })}
        </div>
        {/* horizontal line */}
        <div className="h-[2px] w-full min-w-[220px] bg-foreground" />
        {/* vertical divider: crosses the line (subject | predicate), stops at the
            line below only (object), or omitted (plain). */}
        {baseline.variant !== "plain" && (
          <div
            className={cn(
              "absolute left-1/2 w-[2px] -translate-x-1/2 bg-foreground",
              baseline.variant === "object" ? "top-[2px] h-[12px]" : "top-[-10px] h-[22px]"
            )}
          />
        )}
        {/* hover ring to signal it is interactive */}
        <div className="pointer-events-none absolute -inset-x-1 -top-2 bottom-0 rounded opacity-0 transition-opacity group-hover:bg-primary/10 group-hover:opacity-100" />
      </div>
    </div>
  );
}