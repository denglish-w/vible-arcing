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
  /** Whether the open parsing form holds answers that were not checked. */
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** A link click held back while answers are unchecked, awaiting the user's choice. */
  leaveRequest: { href: string; trigger: HTMLElement | null } | null;
  requestLeave: (href: string, trigger: HTMLElement | null) => void;
  cancelLeave: () => void;
};

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedId: null,
  lastId: null,
  select: (selectedId) =>
    set((state) => ({ selectedId, lastId: selectedId ?? state.lastId })),
  dirty: false,
  setDirty: (dirty) => set(dirty ? { dirty } : { dirty, leaveRequest: null }),
  leaveRequest: null,
  requestLeave: (href, trigger) => set({ leaveRequest: { href, trigger } }),
  cancelLeave: () => set({ leaveRequest: null }),
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

// A selection handed over without a reload (switching to Reading refreshes
// the page in place), taken by the next text shown.
let withinPage: string | null = null;

/** Remembers the selected word for a mode switch that does not reload. */
export function handOverWithinPage() {
  withinPage = useSelectionStore.getState().lastId;
}

/** Drops a within-page hand-over when the switch failed. */
export function cancelHandOverWithinPage() {
  withinPage = null;
}

/** Reads and clears a handed-over selection, if any. */
export function takeHandedOverSelection(
  storage: Storage | undefined = session(),
): string | null {
  if (withinPage !== null) {
    const id = withinPage;
    withinPage = null;
    return id;
  }
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
 * On showing a chapter's text: brings the word handed over by a mode switch into
 * view and focuses it (FR-006). Popovers start closed. Without a hand-over only
 * a selection from another chapter is dropped, so showing the same chapter again
 * (a refresh, a return visit) leaves an open popover and the scroll alone.
 */
export function restoreSelection(wordIds: readonly { id: string }[]) {
  const has = (id: string | null) =>
    id !== null && wordIds.some((word) => word.id === id);
  const state = useSelectionStore.getState();
  const handedOver = takeHandedOverSelection();
  if (handedOver === null) {
    useSelectionStore.setState({
      selectedId: has(state.selectedId) ? state.selectedId : null,
      lastId: has(state.lastId) ? state.lastId : null,
    });
    return;
  }
  const known = has(handedOver);
  useSelectionStore.setState({
    selectedId: null,
    lastId: known ? handedOver : null,
  });
  if (known) revealWord(handedOver, true);
}

/** For tests: forget that this page handed its selection over. */
export function resetHandOver() {
  leaving = false;
  withinPage = null;
}
