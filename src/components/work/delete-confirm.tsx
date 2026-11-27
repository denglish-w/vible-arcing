"use client";
// Delete with confirmation (saved-work spec "Listing, reopening and deleting
// work"). Nothing is deleted until the second, explicit Delete; Cancel puts
// focus back on the first button.
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "../ui/button";

export function DeleteConfirm({
  title,
  kind,
  onConfirm,
}: {
  /** The record's title, so screen readers know which record a button deletes. */
  title: string;
  kind: "analysis" | "diagram";
  /** Deletes the record. The list then refreshes without it. */
  onConfirm: () => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const openRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) openRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const confirm = () =>
    startTransition(async () => {
      try {
        const result = await onConfirm();
        const unavailable =
          typeof result === "object" &&
          result !== null &&
          "reason" in result &&
          result.reason === "store-unavailable";
        setFailed(unavailable ? "Saved work isn’t available." : null);
      } catch {
        setFailed("It could not be deleted. Try again.");
      }
      setConfirming(false);
    });

  if (!confirming)
    return (
      <div className="delete-confirm">
        {failed && <output>{failed}</output>}
        <Button ref={openRef} onClick={() => setConfirming(true)}>
          Delete<span className="sr-only"> “{title}”</span>
        </Button>
      </div>
    );

  return (
    <fieldset className="delete-confirm">
      <legend className="sr-only">Confirm deleting “{title}”</legend>
      <span>Delete this {kind}? This cannot be undone.</span>
      <Button className="button-primary" onClick={confirm} disabled={pending}>
        {pending ? "Deleting…" : "Delete"}
        <span className="sr-only"> “{title}”</span>
      </Button>
      <Button ref={cancelRef} onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </fieldset>
  );
}
