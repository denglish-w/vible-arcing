// The selected word, kept across a mode switch (spec 010 FR-006). Switching
// into Learning reloads the page (research R1), so the id is handed over
// through sessionStorage; it is never persisted beyond that hand-over.
import { create } from "zustand";

export const SELECTED_WORD_KEY = "vible.selectedWord";

type SelectionState = {
  /** The word whose popover is open. */
  selectedId: string | null;
  /** The word selected most recently, kept after its popover closes. */
  lastId: string | null;
  select: (id: string | null) => void;
};

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedId: null,
  lastId: null,
  select: (selectedId) =>
    set((state) => ({ selectedId, lastId: selectedId ?? state.lastId })),
}));

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

const session = (): Storage | undefined => {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
};

// Set once this page has handed the selection over and is reloading, so a
// render that lands before the page unloads does not take it back.
let leaving = false;

/** Remembers the selected word just before the page reloads. */
export function handOverSelection(storage: Storage | undefined = session()) {
  leaving = true;
  const id = useSelectionStore.getState().lastId;
  try {
    if (id) storage?.setItem(SELECTED_WORD_KEY, id);
    else storage?.removeItem(SELECTED_WORD_KEY);
  } catch {
    // Storage may be blocked; the selection is a convenience.
  }
}

/** Reads and clears a handed-over selection, if any. */
export function takeHandedOverSelection(
  storage: Storage | undefined = session(),
): string | null {
  if (leaving) return null;
  try {
    const id = storage?.getItem(SELECTED_WORD_KEY) ?? null;
    storage?.removeItem(SELECTED_WORD_KEY);
    return id;
  } catch {
    return null;
  }
}

/** Brings a word into view, without smooth scrolling under reduced motion. */
export function revealWord(id: string, focus = false) {
  const element = document.getElementById(id);
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  element?.scrollIntoView({
    block: "center",
    behavior: reduced ? "auto" : "smooth",
  });
  if (focus) element?.focus({ preventScroll: true });
}

/**
 * On showing a chapter's text: brings the word selected before a mode switch
 * into view and focuses it (FR-006). Popovers start closed.
 */
export function restoreSelection(wordIds: readonly { id: string }[]) {
  const state = useSelectionStore.getState();
  const id = takeHandedOverSelection() ?? state.lastId;
  const known = id !== null && wordIds.some((word) => word.id === id);
  useSelectionStore.setState({ selectedId: null, lastId: known ? id : null });
  if (known) revealWord(id, true);
}

/** For tests: forget that this page handed its selection over. */
export function resetHandOver() {
  leaving = false;
}
