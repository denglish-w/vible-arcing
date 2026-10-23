"use client";
// Thin React wrapper around createAutosave (design decision 7). The options are
// bound to one record: they are read when the controller is created, and a new
// `recordKey` creates a new controller, so a save can never reach another
// record's content or id. Editors give functions that stay valid for the record.
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
  // The options of the render that created the current record's controller.
  const current = useRef(options);
  useEffect(() => {
    current.current = options;
  });

  useEffect(() => {
    const autosave = createAutosave<T>({
      ...current.current,
      onStatus: setStatus,
      unloadTarget: window,
    });
    setControls(autosave);
    setStatus(autosave.getStatus());
    return () => autosave.dispose();
  }, [recordKey]);

  return { status, controls };
}
