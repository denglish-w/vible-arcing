import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Shared placement + close routine for the word-anchored bubbles used by both
// Reading (WordDetailPopover) and Learning (LearningBubble), so the two cannot
// drift apart.
//
// SAFE AREA: the browser window minus the top bar, minus the side panel (the
// Translate panel) when it is open, minus a 16px margin on every edge. The
// bubble never extends past it.
//
// SIDE: the bubble opens below the word when its natural height fits below,
// else above when it fits above, else on the side with more room (its body then
// scrolls). Its max height is the room on that side (never more than the safe
// area). To stop it jumping while the learner types or picks an option, the
// side only changes when the current side no longer fits and the other side
// fits better (or the bubble would be clipped).
//
// MEASUREMENT: `cardRef` is the whole bubble. The bubble's body reports its
// natural content height through `contentRef` (optional), so the natural height
// is known even while the body is currently capped by maxH. The placement is
// recomputed on content-size changes, window resize, and panel open/resize
// (rightInset), via a ResizeObserver.
//
// CLOSE ON SCROLL: a user scroll of the reading card closes the bubble unless
// `canCloseOnScroll` returns false. Programmatic scrolls (see
// `scrollWordIntoPlace`) are ignored until they finish.

export const SAFE_MARGIN = 16;
const POINTER_GAP = 8;
const MIN_H = 120;

function topBarBottom() {
  const h = document.querySelector("header");
  if (h) {
    const b = h.getBoundingClientRect().bottom;
    if (b > 0) return b;
  }
  return 56;
}

// Smoothly scroll the reading card so the word sits about a quarter of the way
// down the visible area, when it currently lies in the lower 55% of that area.
// Returns true when a scroll was started. `onDone` runs when it has finished
// (or immediately if nothing was needed). The caller must ignore scroll events
// while `onStart`..`onDone` is in effect.
export function scrollWordIntoPlace(container, wordEl, { onStart, onDone } = {}) {
  if (!container || !wordEl) {
    onDone?.();
    return false;
  }
  const c = container.getBoundingClientRect();
  const r = wordEl.getBoundingClientRect();
  const visibleTop = Math.max(c.top, topBarBottom());
  const visibleH = c.bottom - visibleTop;
  if (visibleH <= 0) {
    onDone?.();
    return false;
  }
  const rel = (r.top - visibleTop) / visibleH;
  if (rel <= 0.55) {
    onDone?.();
    return false;
  }
  const maxScroll = container.scrollHeight - container.clientHeight;
  const want = container.scrollTop + (r.top - visibleTop - visibleH * 0.25);
  const target = Math.max(0, Math.min(maxScroll, want));
  if (Math.abs(target - container.scrollTop) < 2) {
    onDone?.();
    return false;
  }
  onStart?.();
  container.scrollTo({ top: target, behavior: "smooth" });

  // Finish when scrolling settles (no change for ~120ms) or after a hard cap.
  let last = container.scrollTop;
  let still = 0;
  let elapsed = 0;
  const id = window.setInterval(() => {
    elapsed += 40;
    const now = container.scrollTop;
    still = Math.abs(now - last) < 0.5 ? still + 40 : 0;
    last = now;
    if (still >= 120 || elapsed >= 1200 || Math.abs(now - target) < 1) {
      window.clearInterval(id);
      // Let the final scroll event(s) flush before re-arming close-on-scroll.
      window.setTimeout(() => onDone?.(), 60);
    }
  }, 40);
  return true;
}

export function useBubbleAnchor({
  anchorEl,
  cardRef,
  contentRef,
  scrollContainerRef,
  onClose,
  canCloseOnScroll,
  isMobile = false,
  rightInset = 0,
  chromeH = 0,
  reserveH = 0,
  width,
}) {
  const [placement, setPlacement] = useState(null);
  const canCloseRef = useRef(canCloseOnScroll);
  canCloseRef.current = canCloseOnScroll;
  const sideRef = useRef(null); // last chosen side, for stability while typing
  const anchorRef = useRef(anchorEl);

  const compute = useCallback(() => {
    if (!anchorEl || !cardRef.current) return;
    if (isMobile) {
      setPlacement((p) => (p && p.kind === "sheet" ? p : { kind: "sheet" }));
      return;
    }
    if (anchorRef.current !== anchorEl) {
      anchorRef.current = anchorEl;
      sideRef.current = null;
    }
    const card = cardRef.current;
    const cardW = width || card.offsetWidth || 320;
    const r = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const safeTop = topBarBottom() + SAFE_MARGIN;
    const safeBottom = vh - SAFE_MARGIN;
    const safeLeft = SAFE_MARGIN;
    const safeRight = vw - (rightInset || 0) - SAFE_MARGIN;
    const safeH = Math.max(MIN_H, safeBottom - safeTop);

    // Natural height = fixed chrome (header, footer, borders) + body content.
    const contentH = contentRef?.current ? contentRef.current.scrollHeight : card.scrollHeight;
    const natural = Math.min(contentH + chromeH, safeH);

    const roomBelow = safeBottom - (r.bottom + POINTER_GAP);
    const roomAbove = r.top - POINTER_GAP - safeTop;

    // `reserveH` is extra height the bubble will need later (a result card), so
    // the side is chosen for the larger size and does not flip when it appears.
    const planned = Math.min(natural + reserveH, safeH);
    const fits = (room) => room >= planned;
    let placeBelow;
    const prev = sideRef.current;
    // Keep the current side while it still fits; only flip when it would clip.
    if (prev === "below" && fits(roomBelow)) placeBelow = true;
    else if (prev === "above" && fits(roomAbove)) placeBelow = false;
    else if (fits(roomBelow)) placeBelow = true;
    else if (fits(roomAbove)) placeBelow = false;
    else if (prev === "below" && roomBelow >= roomAbove * 0.85) placeBelow = true;
    else if (prev === "above" && roomAbove >= roomBelow * 0.85) placeBelow = false;
    else placeBelow = roomBelow >= roomAbove;
    sideRef.current = placeBelow ? "below" : "above";

    const sideRoom = placeBelow ? roomBelow : roomAbove;
    const maxH = Math.max(MIN_H, Math.min(Math.floor(sideRoom), safeH));
    const h = Math.min(natural, maxH);

    let top = placeBelow ? r.bottom + POINTER_GAP : r.top - POINTER_GAP - h;
    if (top < safeTop) top = safeTop;
    if (top + h > safeBottom) top = Math.max(safeTop, safeBottom - h);

    const wordCx = (r.left + r.right) / 2;
    let left = wordCx - cardW / 2;
    if (left + cardW > safeRight) left = safeRight - cardW;
    if (left < safeLeft) left = safeLeft;
    const pointerX = Math.max(18, Math.min(cardW - 18, wordCx - left));

    setPlacement((p) =>
      p && p.kind === "fixed" && p.top === top && p.left === left &&
      p.pointerX === pointerX && p.maxH === maxH && p.placeBelow === placeBelow
        ? p
        : { kind: "fixed", top, left, pointerX, maxH, placeBelow }
    );
  }, [anchorEl, cardRef, contentRef, isMobile, rightInset, chromeH, reserveH, width]);

  // Initial measure before paint, and again whenever inputs change (including
  // the Translate panel opening/resizing via rightInset).
  useLayoutEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [compute]);

  // Recompute when the bubble's content or frame changes size (a different part
  // of speech adds/removes dropdowns, a result appears, the Disputed card
  // expands).
  useEffect(() => {
    const els = [cardRef.current, contentRef?.current].filter(Boolean);
    if (!els.length) return;
    const ro = new ResizeObserver(() => compute());
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [compute, cardRef, contentRef, anchorEl, placement?.kind]);

  // Shared scroll-close.
  useEffect(() => {
    if (!onClose) return;
    let closed = false;
    function inBubble(t) {
      const card = cardRef.current;
      return !!(card && t instanceof Node && card.contains(t));
    }
    function inMenu(t) {
      return !!(t instanceof Element && t.closest?.("[data-parse-menu]"));
    }
    function close() {
      if (closed) return;
      if (canCloseRef.current && !canCloseRef.current()) return;
      closed = true;
      onClose();
    }
    // Scroll events don't bubble, so listen in the capture phase on the document:
    // this catches the reading card, the page, or any other scrolling element.
    function onScroll(e) {
      if (inBubble(e.target) || inMenu(e.target)) return;
      close();
    }
    // Wheel / touch-drag over the page (not the bubble) also counts as scrolling,
    // even when the content is already at its end and no scroll event fires.
    function onWheel(e) {
      if (inBubble(e.target) || inMenu(e.target)) return;
      close();
    }
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("wheel", onWheel, { passive: true, capture: true });
    document.addEventListener("touchmove", onWheel, { passive: true, capture: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("wheel", onWheel, { capture: true });
      document.removeEventListener("touchmove", onWheel, { capture: true });
    };
  }, [cardRef, onClose, anchorEl]);

  return placement;
}