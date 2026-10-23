// Hand-drawn SVG diagram shapes from the Master Symbols Chart. Each shape is
// built in local coordinates where (0,0) is its ANCHOR: the point that sits on
// its parent's attach point. A shape also exposes named attach points of its
// own, so children can hang from it. A shape's world position is always derived
// from its parent, so moving a parent moves every descendant.

export const CH = 10; // approximate pixels per Greek character at 18px
const wordsWidth = (words, min) =>
  Math.max(min, (words || []).reduce((n, w) => n + (w.text || "").length * CH + 8, 16));

export const SHAPES = {
  // Substantive / clause stand: a caret on the parent, a post, a raised line.
  stand: {
    label: "Clause stand",
    build(words) {
      const W = wordsWidth(words.main, 130);
      return {
        lines: [
          { d: "M-9 0 L0 -13 L9 0" },
          { d: "M0 -13 L0 -54" },
          { d: `M0 -54 L${W} -54` },
        ],
        slots: [{ id: "main", x: 0, y: -54, w: W, line: true, hint: "clause" }],
        points: { top: { x: W / 2, y: -54 }, end: { x: W, y: -54 } },
      };
    },
  },
  // Subordinate connector: dashed slant carrying ὅτι/ἵνα/γάρ, then a clause line.
  subordinate: {
    label: "Subordinate",
    build(words) {
      const Wc = wordsWidth(words.conn, 30);
      const Wl = wordsWidth(words.clause, 130);
      return {
        lines: [
          { d: "M0 0 L28 54", dashed: true },
          { d: `M28 54 L${28 + Wl} 54` },
        ],
        slots: [
          { id: "conn", x: 8 - Wc, y: 34, w: Wc, line: false, hint: "ὅτι" },
          { id: "clause", x: 28, y: 54, w: Wl, line: true, hint: "clause" },
        ],
        points: { mid: { x: 28 + Wl / 2, y: 54 }, end: { x: 28 + Wl, y: 54 } },
      };
    },
  },
  // Conjunction fork: two lines joined by a dashed bar carrying the conjunction.
  conjunction: {
    label: "Conjunction",
    build(words) {
      const W1 = wordsWidth(words.top, 110);
      const W2 = wordsWidth(words.bottom, 110);
      const Wc = wordsWidth(words.conj, 40);
      return {
        lines: [
          { d: "M0 0 L26 -32" },
          { d: "M0 0 L26 32" },
          { d: `M26 -32 L${26 + W1} -32` },
          { d: `M26 32 L${26 + W2} 32` },
          { d: "M42 -32 L42 32", dashed: true },
        ],
        slots: [
          { id: "top", x: 26, y: -32, w: W1, line: true, hint: "word" },
          { id: "conj", x: 46, y: 5, w: Wc, line: false, hint: "Conj." },
          { id: "bottom", x: 26, y: 32, w: W2, line: true, hint: "word" },
        ],
        points: {
          top: { x: 26 + W1, y: -32 },
          bottom: { x: 26 + W2, y: 32 },
        },
      };
    },
  },
  // Infinitive stand: a short post with the double tick, then a raised line.
  infinitive: {
    label: "Infinitive",
    build(words) {
      const W = wordsWidth(words.main, 120);
      return {
        lines: [
          { d: "M0 0 L0 -30" },
          { d: "M-5 -9 L5 -9" },
          { d: "M-5 -16 L5 -16" },
          { d: `M0 -30 L${W} -30` },
        ],
        slots: [{ id: "main", x: 0, y: -30, w: W, line: true, hint: "infinitive" }],
        points: { top: { x: W / 2, y: -30 }, end: { x: W, y: -30 } },
      };
    },
  },
};

export const SHAPE_TYPES = Object.keys(SHAPES);

export function buildShape(shape) {
  return SHAPES[shape.type].build(shape.words || {});
}

// Position of an attach point on a parent ({baselineId|shapeId, point}).
export function pointOf(parent, shapes, measured) {
  if (!parent) return null;
  if (parent.baselineId) return measured[parent.baselineId]?.[parent.point] || null;
  const s = shapes.find((x) => x.id === parent.shapeId);
  if (!s) return null;
  const o = shapeOrigin(s, shapes, measured);
  const pt = buildShape(s).points[parent.point];
  return pt ? { x: o.x + pt.x, y: o.y + pt.y } : null;
}

// World position of a shape's anchor: its parent's attach point, or its own
// x/y when it is free-floating.
export function shapeOrigin(shape, shapes, measured) {
  return pointOf(shape.parent, shapes, measured) || { x: shape.x, y: shape.y };
}

export function cloneShapes(shapes) {
  return shapes.map((s) => ({
    ...s,
    parent: s.parent ? { ...s.parent } : null,
    words: Object.fromEntries(
      Object.entries(s.words || {}).map(([k, v]) => [k, v.map((w) => ({ ...w }))])
    ),
  }));
}

// Remove every shape matching `match`, plus all of their descendants.
export function removeShapes(shapes, match) {
  const gone = new Set(shapes.filter(match).map((s) => s.id));
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of shapes) {
      if (!gone.has(s.id) && s.parent?.shapeId && gone.has(s.parent.shapeId)) {
        gone.add(s.id);
        grew = true;
      }
    }
  }
  return shapes.filter((s) => !gone.has(s.id));
}

export function shapeWordIds(shapes) {
  const ids = [];
  for (const s of shapes) for (const ws of Object.values(s.words || {})) for (const w of ws) ids.push(w.id);
  return ids;
}