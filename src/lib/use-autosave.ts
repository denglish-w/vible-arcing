"use client";
// Thin React wrapper around createAutosave (design decision 7). Editors pass
// their store's subscribe and getSnapshot; the controller is recreated only
// when the record (its revision baseline) changes.
import { useEffect, useRef, useState } from "react";
import {
  createAutosave,
  type Autosave,
  type AutosaveOptions,
  type AutosaveStatus,
} from "./autosave.ts";

export function useAutosave<T>(
  options: Omit<AutosaveOptions<T>, "onStatus" | "unloadTarget">,
  recordKey: string,
): { status: AutosaveStatus; controls: Autosave | null } {
  const [status, setStatus] = useState<AutosaveStatus>({ state: "saved" });
  const [controls, setControls] = useState<Autosave | null>(null);
  // Latest callbacks without recreating the controller on every render.
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  useEffect(() => {
    const autosave = createAutosave<T>({
      subscribe: (listener) => latest.current.subscribe(listener),
      getSnapshot: () => latest.current.getSnapshot(),
      save: (snapshot, revision) => latest.current.save(snapshot, revision),
      saveAsCopy: latest.current.saveAsCopy
        ? (snapshot) => latest.current.saveAsCopy!(snapshot)
        : undefined,
      download: (snapshot) => latest.current.download?.(snapshot),
      revision: latest.current.revision,
      debounceMs: latest.current.debounceMs,
      onStatus: setStatus,
      unloadTarget: window,
    });
    setControls(autosave);
    setStatus(autosave.getStatus());
    return () => autosave.dispose();
  }, [recordKey]);

  return { status, controls };
}
