import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ShapeLayer from "@/components/diagramming/ShapeLayer";
import DiagramPalette from "@/components/diagramming/DiagramPalette";
import { cloneShapes, removeShapes, shapeWordIds } from "@/lib/diagramShapes";
import { loadStaticChapter } from "@/lib/staticChapter";
import { verseNumbers } from "@/lib/verses";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Trash2, Undo2, Redo2 } from "lucide-react";
import Baseline from "@/components/diagramming/Baseline";
import ConnectorLayer from "@/components/diagramming/ConnectorLayer";

// The diagram screen for a chosen passage. An empty canvas sits on top; below
// it, the selected SBLGNT Greek passage is shown with verse numbers in
// superscript and each word as its own tappable element.
//
// Selecting a passage word automatically enters Editing mode. With the
// "Baseline" tool active, clicking the canvas drops a horizontal baseline with
// a central vertical divider; select a passage word and click a baseline (or
// drag the word onto it) to place it. With the "Modifier" tool active, tap a
// placed baseline word to mark it as the target, then click a passage word to
// hang a slanted modifier line off that target. Drag any baseline to reposition
// it; modifiers follow.
//
// Click a baseline (no passage word selected) or any placed word to select it;
// the trash button or Delete/Backspace removes the selection and restores any
// removed words to the passage panel. Undo/Redo via the toolbar or Ctrl/Cmd-Z
// / Ctrl/Cmd-Shift-Z.
function cloneBaselines(bs) {
  return bs.map((b) => ({
    ...b,
    words: b.words.map((w) => ({ ...w })),
    modifiers: (b.modifiers || []).map((m) => ({ ...m, words: m.words.map((w) => ({ ...w })) })),
  }));
}

export default function DiagrammingScreen({ passage }) {
  const { book, chapter, startVerse, endVerse } = passage;
  const title =
    startVerse === endVerse
      ? `${book.name} ${chapter}:${startVerse}`
      : `${book.name} ${chapter}:${startVerse}-${endVerse}`;

  const [verses, setVerses] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'baseline' | 'modifier' | null
  const [baselines, setBaselines] = useState([]); // {id, x, y, words:[], modifiers:[]}
  const [modifierTarget, setModifierTarget] = useState(null); // {baselineId, wordId}
  const [canvasSel, setCanvasSel] = useState(null); // {kind:'baseline'|'word', id?, baselineId?, modId?, wordId?}
  const [shapes, setShapes] = useState([]); // SVG shapes: {id,type,x,y,parent,words:{slot:[]}}
  const [measured, setMeasured] = useState({}); // baseline attach points, canvas coords
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const screenRef = useRef(null);
  const canvasRef = useRef(null);
  const dragItemRef = useRef(null);
  const dragStartRef = useRef(null);
  const fnsRef = useRef({});

  // Placed word ids are derived from baselines so deleting/undoing always
  // restores the passage panel correctly.
  const placedIds = useMemo(() => {
    const s = new Set();
    for (const b of baselines) {
      for (const w of b.words) s.add(w.id);
      for (const m of b.modifiers || []) for (const w of m.words) s.add(w.id);
    }
    for (const id of shapeWordIds(shapes)) s.add(id);
    return s;
  }, [baselines, shapes]);

  useEffect(() => {
    let cancelled = false;
    setVerses(null);
    setSelectedId(null);
    setBaselines([]);
    setShapes([]);
    setPast([]);
    setFuture([]);
    setCanvasSel(null);
    setModifierTarget(null);
    loadStaticChapter(book.code, chapter)
      .then(({ words, english }) => {
        if (cancelled) return;
        const nums = verseNumbers(words, english).filter(
          (v) => v >= startVerse && v <= endVerse
        );
        const byVerse = new Map();
        for (const w of words) {
          if (w.verse < startVerse || w.verse > endVerse) continue;
          if (!byVerse.has(w.verse)) byVerse.set(w.verse, []);
          byVerse.get(w.verse).push(w);
        }
        setVerses(nums.map((v) => ({ verse: v, words: byVerse.get(v) || [] })));
      })
      .catch(() => {
        if (!cancelled) setVerses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [book.code, chapter, startVerse, endVerse]);

  const allWords = useMemo(() => (verses || []).flatMap((v) => v.words), [verses]);
  const canPlace = editing && activeTool !== "modifier";

  const snap = () => ({ baselines: cloneBaselines(baselines), shapes: cloneShapes(shapes) });
  function restore(s) {
    setBaselines(s.baselines);
    setShapes(s.shapes);
    setCanvasSel(null);
  }

  function commit(updater, shapeUpdater) {
    setPast((p) => [...p, snap()].slice(-50));
    setFuture([]);
    if (updater) setBaselines(updater);
    if (shapeUpdater) setShapes(shapeUpdater);
  }

  function undo() {
    if (past.length === 0) return;
    setFuture((f) => [snap(), ...f].slice(0, 50));
    setPast(past.slice(0, -1));
    restore(past[past.length - 1]);
  }

  function redo() {
    if (future.length === 0) return;
    setPast((p) => [...p, snap()].slice(-50));
    setFuture(future.slice(1));
    restore(future[0]);
  }

  // Shapes: anchor positions of baselines are measured from the DOM so shapes
  // can hang from them and follow when a baseline moves or grows.
  useLayoutEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const next = {};
    for (const b of baselines) {
      const el = c.querySelector(`[data-bl-wrap="${b.id}"]`)?.firstElementChild;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const y = r.bottom - cr.top - c.clientTop - 5;
      const l = r.left - cr.left - c.clientLeft;
      const rt = r.right - cr.left - c.clientLeft;
      next[b.id] = { left: { x: l + 8, y }, middle: { x: (l + rt) / 2, y }, right: { x: rt - 8, y } };
    }
    const str = JSON.stringify(next);
    setMeasured((m) => (JSON.stringify(m) === str ? m : next));
  });

  const shapeTool = activeTool?.startsWith("shape:") ? activeTool.slice(6) : null;

  function addShape(parent, at) {
    const shape = {
      id: Math.random().toString(36).slice(2),
      type: shapeTool,
      x: at?.x ?? 0,
      y: at?.y ?? 0,
      parent: parent || null,
      words: {},
    };
    commit(null, (s) => [...s, shape]);
  }

  function placeShapeWord(shapeId, slotId, wordId) {
    const w = allWords.find((x) => x.id === wordId);
    if (!w) return;
    commit(null, (s) =>
      s.map((x) =>
        x.id === shapeId
          ? { ...x, words: { ...x.words, [slotId]: [...(x.words[slotId] || []), { id: w.id, text: w.text }] } }
          : x
      )
    );
    setSelectedId(null);
  }

  function onShapeSlotClick(shapeId, slotId) {
    if (selectedId) placeShapeWord(shapeId, slotId, selectedId);
    else setCanvasSel({ kind: "shape", id: shapeId });
  }

  function onShapeSlotDrop(shapeId, slotId) {
    const item = dragItemRef.current;
    dragItemRef.current = null;
    if (item?.kind === "passage") placeShapeWord(shapeId, slotId, item.wordId);
  }

  function onShapeMoveEnd(moved, id) {
    if (moved) {
      setPast((p) => [...p, dragStartRef.current || snap()].slice(-50));
      setFuture([]);
    } else {
      setCanvasSel({ kind: "shape", id });
    }
    dragStartRef.current = null;
  }

  function deleteSelection() {
    if (!canvasSel) return;
    if (canvasSel.kind === "shape") {
      commit(null, (s) => removeShapes(s, (x) => x.id === canvasSel.id));
    } else if (canvasSel.kind === "shapeWord") {
      const { shapeId, slot, wordId } = canvasSel;
      commit(null, (s) =>
        s.map((x) =>
          x.id === shapeId
            ? { ...x, words: { ...x.words, [slot]: (x.words[slot] || []).filter((w) => w.id !== wordId) } }
            : x
        )
      );
    } else if (canvasSel.kind === "baseline") {
      commit(
        (prev) => prev.filter((b) => b.id !== canvasSel.id),
        (s) => removeShapes(s, (x) => x.parent?.baselineId === canvasSel.id)
      );
    } else if (canvasSel.kind === "word") {
      const { baselineId, modId, wordId } = canvasSel;
      commit((prev) =>
        prev.map((b) => {
          if (b.id !== baselineId) return b;
          if (modId) {
            const modifiers = (b.modifiers || [])
              .map((m) =>
                m.id === modId ? { ...m, words: m.words.filter((w) => w.id !== wordId) } : m
              )
              .filter((m) => m.words.length > 0);
            return { ...b, modifiers };
          }
          const words = b.words.filter((w) => w.id !== wordId);
          const wordIds = new Set(words.map((w) => w.id));
          const modifiers = (b.modifiers || []).filter((m) => wordIds.has(m.targetWordId));
          return { ...b, words, modifiers };
        })
      );
    }
    setCanvasSel(null);
  }

  fnsRef.current = { deleteSelection, undo, redo };

  useEffect(() => {
    function onKey(e) {
      const tag = (e.target?.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        fnsRef.current.deleteSelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) fnsRef.current.redo();
        else fnsRef.current.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        fnsRef.current.redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleEdit() {
    setEditing((e) => {
      const next = !e;
      if (!next) {
        setActiveTool(null);
        setModifierTarget(null);
        setCanvasSel(null);
      }
      return next;
    });
  }

  function pickTool(tool) {
    setActiveTool((t) => (t === tool ? null : tool));
    setModifierTarget(null);
    setCanvasSel(null);
  }

  function onCanvasClick(e) {
    if (e.target !== canvasRef.current) return;
    if (editing && activeTool?.startsWith("baseline")) {
      const rect = canvasRef.current.getBoundingClientRect();
      const variant = activeTool.split(":")[1] || "cross";
      setBaselines((bs) => [
        ...bs,
        {
          id: Math.random().toString(36).slice(2),
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          words: [],
          modifiers: [],
          variant,
        },
      ]);
      setPast((p) => [...p, snap()].slice(-50));
      setFuture([]);
    } else if (editing && shapeTool) {
      const rect = canvasRef.current.getBoundingClientRect();
      addShape(null, { x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setCanvasSel(null);
    }
  }

  function onDragBegin() {
    dragStartRef.current = snap();
  }

  function handleDrag(id, x, y) {
    setBaselines((bs) => bs.map((b) => (b.id === id ? { ...b, x, y } : b)));
  }

  function onDragEnd(moved, lineId) {
    if (moved) {
      setPast((p) => [...p, dragStartRef.current || snap()].slice(-50));
      setFuture([]);
    } else if (lineId) {
      onLineClick(lineId);
    }
    dragStartRef.current = null;
  }

  function placeWord(baselineId, wordId, index = Infinity) {
    if (!wordId) return;
    const w = allWords.find((x) => x.id === wordId);
    if (!w) return;
    commit((prev) =>
      prev.map((b) => {
        if (b.id !== baselineId) return b;
        const words = [...b.words];
        const at = Math.max(0, Math.min(index, words.length));
        words.splice(at, 0, { id: w.id, text: w.text, after: w.after || "" });
        return { ...b, words };
      })
    );
    setSelectedId(null);
  }

  // Move an already-placed word (baseline or modifier) onto a baseline at the
  // given insertion index, removing it from its origin. Same-baseline drops
  // reorder; the index is adjusted for the removal.
  function movePlacedWord(targetBaselineId, index, item) {
    commit((prev) => {
      const next = cloneBaselines(prev);
      let moved = null;
      for (const b of next) {
        if (b.id !== item.baselineId) continue;
        if (item.modId) {
          const m = (b.modifiers || []).find((mm) => mm.id === item.modId);
          moved = m?.words.find((w) => w.id === item.wordId);
        } else {
          moved = b.words.find((w) => w.id === item.wordId);
        }
      }
      if (!moved) return prev;
      for (const b of next) {
        if (b.id !== item.baselineId) continue;
        if (item.modId) {
          b.modifiers = (b.modifiers || [])
            .map((m) =>
              m.id === item.modId ? { ...m, words: m.words.filter((w) => w.id !== item.wordId) } : m
            )
            .filter((m) => m.words.length > 0);
        } else {
          const oldIdx = b.words.findIndex((w) => w.id === item.wordId);
          b.words = b.words.filter((w) => w.id !== item.wordId);
          const wordIds = new Set(b.words.map((w) => w.id));
          b.modifiers = (b.modifiers || []).filter((m) => wordIds.has(m.targetWordId));
          if (b.id === targetBaselineId) {
            index = index > oldIdx ? index - 1 : index;
          }
        }
      }
      const target = next.find((b) => b.id === targetBaselineId);
      if (target) {
        const words = [...target.words];
        const at = Math.max(0, Math.min(index, words.length));
        words.splice(at, 0, moved);
        target.words = words;
      }
      return next;
    });
  }

  function handleDropWord(baselineId, index) {
    const item = dragItemRef.current;
    dragItemRef.current = null;
    if (!item) return;
    if (item.kind === "passage") {
      placeWord(baselineId, item.wordId, index);
    } else {
      movePlacedWord(baselineId, index, item);
    }
  }

  function onLineClick(baselineId) {
    if (selectedId) {
      placeWord(baselineId, selectedId);
      return;
    }
    setCanvasSel({ kind: "baseline", id: baselineId });
  }

  function onBaselineWordClick(baselineId, wordId) {
    if (activeTool === "modifier") {
      setModifierTarget((t) =>
        t && t.baselineId === baselineId && t.wordId === wordId
          ? null
          : { baselineId, wordId }
      );
      return;
    }
    if (selectedId) {
      placeWord(baselineId, selectedId);
      return;
    }
    setCanvasSel({ kind: "word", baselineId, wordId });
  }

  function onModWordClick(baselineId, modId, wordId) {
    setCanvasSel({ kind: "word", baselineId, modId, wordId });
  }

  function placeModifier(w) {
    if (!modifierTarget) return;
    commit((prev) =>
      prev.map((b) => {
        if (b.id !== modifierTarget.baselineId) return b;
        const mods = b.modifiers || [];
        const existing = mods.find((m) => m.targetWordId === modifierTarget.wordId);
        const nextMods = existing
          ? mods.map((m) =>
              m === existing ? { ...m, words: [...m.words, { id: w.id, text: w.text }] } : m
            )
          : [
              ...mods,
              {
                id: Math.random().toString(36).slice(2),
                targetWordId: modifierTarget.wordId,
                words: [{ id: w.id, text: w.text }],
              },
            ];
        return { ...b, modifiers: nextMods };
      })
    );
    setSelectedId(null);
  }

  function onPassageWordClick(w) {
    if (!editing) setEditing(true);
    if (activeTool === "modifier" && modifierTarget) {
      placeModifier(w);
      return;
    }
    setSelectedId((id) => (id === w.id ? null : w.id));
  }

  return (
    <div ref={screenRef} className="relative mx-auto flex h-full max-w-5xl flex-col px-6 py-6">
      <img
        src="https://media.base44.com/images/public/6ac6f32f47a9445b7b57774b/55ace8a96_generated_59ecf636.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-16 [filter:sepia(0.55)_saturate(0.65)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(246,241,229,0.72)] to-[rgba(239,233,220,0.96)]" />
      <div className="relative mb-4 flex shrink-0 items-center justify-between border-b border-[#c9bca6] pb-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground">{title}</h1>
          <span className="small-caps">Diagramming · SBLGNT</span>
        </div>
        <label className="flex items-center gap-2">
          <span className="small-caps">Editing</span>
          <Switch checked={editing} onCheckedChange={toggleEdit} />
        </label>
      </div>

      {editing && (
        <div className="relative mb-3 flex shrink-0 items-center justify-end gap-2.5">
          <button
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl/Cmd-Z)"
            className="flex h-[34px] w-10 items-center justify-center rounded-lg border border-[#c9bca6] bg-[#f8f4eb] text-[#55483b] transition-colors hover:bg-[#eadfce] hover:shadow-[0_3px_9px_rgba(68,48,31,0.13)] focus-visible:outline-2 focus-visible:outline-[#8b2928] disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl/Cmd-Shift-Z)"
            className="flex h-[34px] w-10 items-center justify-center rounded-lg border border-[#c9bca6] bg-[#f8f4eb] text-[#55483b] transition-colors hover:bg-[#eadfce] hover:shadow-[0_3px_9px_rgba(68,48,31,0.13)] focus-visible:outline-2 focus-visible:outline-[#8b2928] disabled:opacity-40"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={deleteSelection}
            disabled={!canvasSel}
            title="Delete selection (Delete)"
            className="flex h-[34px] w-10 items-center justify-center rounded-lg border border-[#c9bca6] bg-[#f8f4eb] text-[#55483b] transition-colors hover:bg-[#eadfce] hover:shadow-[0_3px_9px_rgba(68,48,31,0.13)] focus-visible:outline-2 focus-visible:outline-[#8b2928] disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={onCanvasClick}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden rounded-[14px] border-[1.5px] border-dashed border-[#b8a58c] bg-[rgba(248,244,235,0.88)] shadow-[0_12px_30px_rgba(65,48,32,0.13)]",
          editing && activeTool?.startsWith("baseline") && "cursor-crosshair"
        )}
      >
        {editing && (
          <DiagramPalette activeTool={activeTool} onPick={pickTool} />
        )}
        {baselines.map((b) => (
          <div key={b.id} data-bl-wrap={b.id} style={{ display: "contents" }}>
          <Baseline
            baseline={b}
            editing={editing}
            modifierTarget={modifierTarget}
            canvasSel={canvasSel}
            onDragBegin={onDragBegin}
            onDrag={handleDrag}
            onDragEnd={onDragEnd}
            onLineClick={onLineClick}
            onWordClick={onBaselineWordClick}
            onModWordClick={onModWordClick}
            onDragItem={(item) => {
              dragItemRef.current = item;
            }}
            onDropWord={handleDropWord}
          />
          </div>
        ))}
        <ShapeLayer
          shapes={shapes}
          measured={measured}
          placing={editing && !!shapeTool}
          editing={editing}
          canvasSel={canvasSel}
          onAttach={(parent) => addShape(parent)}
          onMoveBegin={onDragBegin}
          onMove={(id, x, y) => setShapes((s) => s.map((p) => (p.id === id ? { ...p, x, y } : p)))}
          onMoveEnd={onShapeMoveEnd}
          onSlotClick={onShapeSlotClick}
          onSlotDrop={onShapeSlotDrop}
          onWordClick={(shapeId, slot, wordId) => setCanvasSel({ kind: "shapeWord", shapeId, slot, wordId })}
        />
      </div>

      {/* Passage panel */}
      <div
        data-passage-panel
        className="bubble-scroll relative mt-4 max-h-[40vh] shrink-0 overflow-y-auto rounded-[14px] border border-[#d1c2aa] bg-[#f8f4eb] p-6 shadow-[0_10px_26px_rgba(65,48,32,0.12)]"
      >
        {verses === null ? (
          <p className="font-body text-sm text-muted-foreground">Loading…</p>
        ) : verses.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">No Greek text found for this passage.</p>
        ) : (
          <div className="space-y-3">
            {verses.map(({ verse, words }) => (
              <p key={verse} className="font-display text-xl leading-relaxed text-foreground">
                <sup className="mr-1 font-body text-xs text-muted-foreground">{verse}</sup>
                {words.map((w) => {
                  const placed = placedIds.has(w.id);
                  return (
                    <span
                      key={w.id}
                      data-word={w.id}
                      draggable={!placed}
                      onDragStart={(e) => {
                        dragItemRef.current = { kind: "passage", wordId: w.id };
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        dragItemRef.current = null;
                      }}
                      onClick={() => !placed && onPassageWordClick(w)}
                      className={cn(
                        "rounded transition-colors",
                        placed
                          ? "text-[rgba(120,108,93,0.42)]"
                          : "cursor-pointer hover:bg-[#eee5d6]",
                        !placed && selectedId === w.id && "bg-[#ead5cf] text-[#8b2928]"
                      )}
                    >
                      {w.text}
                      {w.after || ""}
                      {" "}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        )}
      </div>
      <ConnectorLayer baselines={baselines} containerRef={screenRef} />
    </div>
  );
}