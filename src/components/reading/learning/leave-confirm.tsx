"use client";
// Asks before a held-back link click discards unchecked answers. Same wording
// as the mode switch and the parsing form; focus moves to Keep editing and
// returns to the link on Keep editing.
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSelectionStore } from "@/lib/learning/selection";

export function LeaveConfirm() {
  const router = useRouter();
  const request = useSelectionStore((state) => state.leaveRequest);
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (request) keepRef.current?.focus();
  }, [request]);

  if (!request) return null;
  return (
    <fieldset className="leave-confirm">
      <legend className="sr-only">Leave this chapter</legend>
      Discard your answers?{" "}
      <button
        type="button"
        className="chip"
        onClick={() => {
          useSelectionStore.getState().setDirty(false);
          router.push(request.href);
        }}
      >
        Discard
      </button>{" "}
      <button
        ref={keepRef}
        type="button"
        className="chip"
        onClick={() => {
          useSelectionStore.getState().cancelLeave();
          request.trigger?.focus();
        }}
      >
        Keep editing
      </button>
    </fieldset>
  );
}
