import ShapeView from "@/components/diagramming/ShapeView";
import { buildShape, shapeOrigin } from "@/lib/diagramShapes";

// The SVG overlay holding every shape. While a shape tool is active it also
// shows the attach points of every baseline and shape; clicking one hangs the
// new shape there. Free shapes can be dragged; attached shapes follow parents.
export default function ShapeLayer({
  shapes,
  measured,
  placing,
  editing,
  canvasSel,
  onAttach,
  onMoveBegin,
  onMove,
  onMoveEnd,
  onSlotClick,
  onSlotDrop,
  onWordClick,
}) {
  const items = shapes.map((s) => ({ s, o: shapeOrigin(s, shapes, measured), g: buildShape(s) }));

  function startDrag(e, s, o) {
    e.stopPropagation();
    e.preventDefault();
    if (s.parent) {
      onMoveEnd(false, s.id);
      return;
    }
    onMoveBegin();
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;
    function move(ev) {
      if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved = true;
      if (moved) onMove(s.id, o.x + ev.clientX - sx, o.y + ev.clientY - sy);
    }
    function up() {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      onMoveEnd(moved, s.id);
    }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  const dots = [];
  if (placing) {
    for (const [bid, pts] of Object.entries(measured))
      for (const [point, p] of Object.entries(pts))
        dots.push({ key: `b${bid}${point}`, p, parent: { baselineId: bid, point } });
    for (const { s, o, g } of items)
      for (const [point, p] of Object.entries(g.points))
        dots.push({ key: `s${s.id}${point}`, p: { x: o.x + p.x, y: o.y + p.y }, parent: { shapeId: s.id, point } });
  }

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full text-foreground" style={{ overflow: "visible" }}>
      {items.map(({ s, o, g }) => (
        <ShapeView
          key={s.id}
          shape={s}
          origin={o}
          geom={g}
          selected={canvasSel?.kind === "shape" && canvasSel.id === s.id}
          canvasSel={canvasSel}
          editing={editing}
          onMouseDown={(e) => startDrag(e, s, o)}
          onSlotClick={onSlotClick}
          onSlotDrop={onSlotDrop}
          onWordClick={onWordClick}
        />
      ))}
      {dots.map((d) => (
        <circle
          key={d.key}
          cx={d.p.x}
          cy={d.p.y}
          r="6"
          fill="hsl(var(--primary))"
          fillOpacity="0.35"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          pointerEvents="all"
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onAttach(d.parent);
          }}
        />
      ))}
    </svg>
  );
}