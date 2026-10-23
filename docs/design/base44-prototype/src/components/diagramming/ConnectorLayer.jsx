import { useLayoutEffect, useState } from "react";

// Live connector lines drawn from each placed word's original position in the
// passage panel up to its slot on a baseline. One absolute SVG overlays the
// whole diagram screen (canvas + passage panel), so a connector can span from
// the passage text below into the canvas above. The SVG carries
// pointer-events-none so it never blocks baseline/word interaction.
//
// Paths are re-measured whenever the baselines change (placement, drag,
// reorder, undo/redo) and on scroll/resize, since both endpoints move when the
// passage panel scrolls or the layout reflows.
export default function ConnectorLayer({ baselines, containerRef }) {
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    function measure() {
      const c = containerRef.current;
      if (!c) return;
      const cr = c.getBoundingClientRect();
      const next = [];
      for (const b of baselines) {
        for (const w of b.words) {
          const slot = c.querySelector(`[data-pword-id="${w.id}"]`);
          const passage = c.querySelector(`[data-word="${w.id}"]`);
          if (!slot || !passage) continue;
          const sr = slot.getBoundingClientRect();
          const pr = passage.getBoundingClientRect();
          const sx = sr.left + sr.width / 2 - cr.left;
          const sy = sr.bottom - cr.top;
          const px = pr.left + pr.width / 2 - cr.left;
          const py = pr.top - cr.top;
          if (py <= sy) continue; // passage should sit below the slot
          const lift = Math.min(140, (py - sy) * 0.45);
          const d = `M ${px} ${py} C ${px} ${py - lift} ${sx} ${sy + lift} ${sx} ${sy}`;
          next.push({ id: w.id, d });
        }
      }
      setPaths((cur) => {
        if (cur.length === next.length && cur.every((p, i) => p.id === next[i].id && p.d === next[i].d)) {
          return cur;
        }
        return next;
      });
    }
    measure();
    const c = containerRef.current;
    const panel = c?.querySelector("[data-passage-panel]");
    window.addEventListener("resize", measure);
    panel?.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      panel?.removeEventListener("scroll", measure);
    };
  }, [baselines, containerRef]);

  return (
    <svg className="diagram-connectors pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      {paths.map((p) => (
        <path key={p.id} d={p.d} className="diagram-conn" />
      ))}
    </svg>
  );
}