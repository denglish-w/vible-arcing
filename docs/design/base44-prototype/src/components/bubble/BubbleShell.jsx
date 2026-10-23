import { useEffect, useRef, useState } from "react";

// The three stacked parts shared by the bubbles: a header that never scrolls, a
// scrollable body, and a footer pinned to the bottom. The body shows a thin
// scrollbar and a soft fade at its bottom edge when more content is below, and
// gets bottom padding equal to the footer's height so nothing hides behind it.
// `contentRef` points at the body's inner wrapper so the placement hook can read
// the natural content height.
export default function BubbleShell({
  header,
  footer,
  children,
  contentRef,
  bodyRef,
  maxH,
  compact = false,
}) {
  const localBody = useRef(null);
  const body = bodyRef || localBody;
  const footRef = useRef(null);
  const [more, setMore] = useState(false);

  function measure() {
    const el = body.current;
    if (!el) return;
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }

  useEffect(() => {
    measure();
    const el = body.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (contentRef?.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxH, children]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">{header}</div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={body}
          onScroll={measure}
          className="bubble-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div ref={contentRef} className={compact ? "px-4 pb-3" : "px-5 pb-4"}>
            {children}
          </div>
        </div>
        {more && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
          />
        )}
      </div>
      {footer && (
        <div
          ref={footRef}
          className={
            "shrink-0 border-t border-border/60 bg-card " +
            (compact ? "px-4 py-2" : "px-5 py-3")
          }
        >
          {footer}
        </div>
      )}
    </div>
  );
}