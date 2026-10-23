import { CH } from "@/lib/diagramShapes";

// One shape drawn as SVG at its world origin. Lines get a wide transparent copy
// for easy grabbing; each slot is a clickable/droppable strip holding words.
export default function ShapeView({
  shape,
  origin,
  geom,
  selected,
  canvasSel,
  editing,
  onMouseDown,
  onSlotClick,
  onSlotDrop,
  onWordClick,
}) {
  const stroke = selected ? "hsl(var(--primary))" : "currentColor";
  return (
    <g transform={`translate(${origin.x},${origin.y})`}>
      {geom.lines.map((l, i) => (
        <g key={i}>
          <path d={l.d} fill="none" stroke={stroke} strokeWidth="2" strokeDasharray={l.dashed ? "5 4" : undefined} />
          <path
            d={l.d}
            fill="none"
            stroke="transparent"
            strokeWidth="14"
            pointerEvents="stroke"
            style={{ cursor: editing && !shape.parent ? "move" : "pointer" }}
            onMouseDown={onMouseDown}
          />
        </g>
      ))}
      {geom.slots.map((slot) => {
        const words = shape.words[slot.id] || [];
        const total = words.reduce((n, w) => n + w.text.length * CH + 8, 0);
        let cx = slot.x + (slot.w - total) / 2;
        return (
          <g key={slot.id}>
            <rect
              x={slot.x}
              y={slot.y - 26}
              width={slot.w}
              height={30}
              fill="transparent"
              pointerEvents="all"
              onClick={(e) => {
                e.stopPropagation();
                onSlotClick(shape.id, slot.id);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onSlotDrop(shape.id, slot.id);
              }}
            />
            {words.length === 0 && editing && (
              <text x={slot.x + slot.w / 2} y={slot.y - 6} textAnchor="middle" fontSize="11" className="fill-muted-foreground" pointerEvents="none">
                {slot.hint}
              </text>
            )}
            {words.map((w) => {
              const wl = w.text.length * CH + 8;
              const x = cx + wl / 2;
              cx += wl;
              const sel =
                canvasSel?.kind === "shapeWord" &&
                canvasSel.shapeId === shape.id &&
                canvasSel.wordId === w.id;
              return (
                <text
                  key={w.id}
                  x={x}
                  y={slot.y - 6}
                  textAnchor="middle"
                  fontSize="18"
                  className="font-display"
                  fill={sel ? "hsl(var(--primary))" : "currentColor"}
                  textDecoration={sel ? "underline" : undefined}
                  pointerEvents="all"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(shape.id, slot.id, w.id);
                  }}
                >
                  {w.text}
                </text>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}