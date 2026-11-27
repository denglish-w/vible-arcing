"use client";
// Switches the reading screen between Reading and Learning (spec 010 FR-001;
// contracts/ui.md "Mode control"). Switching into Learning reloads the page,
// so the Reading render's word facts leave the browser (research R1).
import { useState } from "react";
import type { ReadingMode } from "@/lib/learning/mode";
import { handOverSelection } from "@/lib/learning/selection";
import type { LearningActions } from "@/lib/learning/types";

export function ModeControl({
  mode,
  setReadingMode,
  reload = () => window.location.reload(),
}: {
  mode: ReadingMode;
  setReadingMode: LearningActions["setReadingMode"];
  /** Replaced in stories. */
  reload?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function choose(next: ReadingMode) {
    if (next === mode || busy) return;
    setBusy(true);
    try {
      const result = await setReadingMode(next);
      if (result.ok && next === "learning") {
        // After the action: its response may already have re-rendered the
        // text, which takes any earlier hand-over.
        handOverSelection();
        reload();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset className="mode-control">
      <legend className="sr-only">Mode</legend>
      {(["reading", "learning"] as const).map((option) => (
        <button
          key={option}
          type="button"
          className="chip"
          aria-pressed={mode === option}
          disabled={busy}
          onClick={() => void choose(option)}
        >
          {option === "reading" ? "Reading" : "Learning"}
        </button>
      ))}
    </fieldset>
  );
}
