"use client";
// Switches the reading screen between Reading and Learning (spec 010 FR-001;
// contracts/ui.md "Mode control"). Switching into Learning reloads the page,
// so the Reading render's word facts leave the browser (research R1).
import { useEffect, useRef, useState } from "react";
import type { ReadingMode } from "@/lib/learning/mode";
import {
  handOverSelection,
  handOverWithinPage,
  cancelHandOverWithinPage,
  useSelectionStore,
} from "@/lib/learning/selection";
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
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState<ReadingMode | null>(null);
  const dirty = useSelectionStore((state) => state.dirty);
  const keepRef = useRef<HTMLButtonElement>(null);
  // The mode button that opened the confirmation, which gets focus back.
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  async function switchTo(next: ReadingMode) {
    setBusy(true);
    setMessage("");
    // Reading arrives by the action's refresh() in this page, which may
    // render before the action resolves, so its hand-over is set first.
    if (next === "reading") handOverWithinPage();
    try {
      const result = await setReadingMode(next);
      if (!result.ok) {
        cancelHandOverWithinPage();
        setMessage("The mode could not be changed. Try again.");
        return;
      }
      // Unchecked answers are discarded only once the switch has happened.
      useSelectionStore.getState().setDirty(false);
      if (next === "learning") {
        // After the action: its response may already have re-rendered the
        // text, which takes any earlier hand-over.
        handOverSelection();
        reload();
      }
    } catch {
      cancelHandOverWithinPage();
      setMessage(
        "The mode could not be changed. Check the connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function choose(next: ReadingMode, trigger: HTMLButtonElement) {
    if (next === mode || busy) return;
    // Answers not yet checked are asked about first, as on closing the form.
    if (dirty) {
      triggerRef.current = trigger;
      setConfirming(next);
    } else void switchTo(next);
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
          onClick={(event) => choose(option, event.currentTarget)}
        >
          {option === "reading" ? "Reading" : "Learning"}
        </button>
      ))}
      {confirming && (
        <p className="mode-message">
          Discard your answers?{" "}
          <button
            type="button"
            className="chip"
            onClick={() => {
              const next = confirming;
              setConfirming(null);
              void switchTo(next);
            }}
          >
            Discard
          </button>{" "}
          <button
            ref={keepRef}
            type="button"
            className="chip"
            onClick={() => {
              setConfirming(null);
              triggerRef.current?.focus();
            }}
          >
            Keep editing
          </button>
        </p>
      )}
      <output className="mode-message" aria-live="polite">
        {message}
      </output>
    </fieldset>
  );
}
