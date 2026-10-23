// A small triangle pointer that sits on the bubble's edge nearest the word and
// aims at it. `placeBelow` true means the bubble is below the word, so the
// pointer is on the top edge pointing up; false means the bubble is above the
// word, so the pointer is on the bottom edge pointing down. `pointerX` is the
// pixel offset along the bubble's edge, already clamped by the placement hook.
// Two stacked triangles give it the bubble's border + card fill so it reads as
// a continuation of the card. Colors follow the parchment tokens so it matches
// in Light, Dark, and Sepia.
export function BubblePointer({ placeBelow, pointerX }) {
  const bg = "hsl(var(--card))";
  const bd = "hsl(var(--border))";
  if (placeBelow) {
    return (
      <>
        <div
          aria-hidden
          className="absolute left-0 top-0 h-0 w-0"
          style={{
            left: pointerX - 9,
            top: -9,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            borderBottom: `9px solid ${bd}`,
          }}
        />
        <div
          aria-hidden
          className="absolute left-0 top-0 h-0 w-0"
          style={{
            left: pointerX - 8,
            top: -7,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: `8px solid ${bg}`,
          }}
        />
      </>
    );
  }
  return (
    <>
      <div
        aria-hidden
        className="absolute left-0 h-0 w-0"
        style={{
          left: pointerX - 9,
          bottom: -9,
          borderLeft: "9px solid transparent",
          borderRight: "9px solid transparent",
          borderTop: `9px solid ${bd}`,
        }}
      />
      <div
        aria-hidden
        className="absolute left-0 h-0 w-0"
        style={{
          left: pointerX - 8,
          bottom: -7,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: `8px solid ${bg}`,
        }}
      />
    </>
  );
}