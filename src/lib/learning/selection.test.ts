import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SELECTED_WORD_KEY,
  cancelHandOverWithinPage,
  handOverSelection,
  handOverWithinPage,
  resetHandOver,
  restoreSelection,
  takeHandedOverSelection,
  useSelectionStore,
} from "./selection.ts";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

beforeEach(() => {
  useSelectionStore.setState({ selectedId: null, lastId: null });
  resetHandOver();
});

describe("selection store", () => {
  it("holds the selected word", () => {
    useSelectionStore.getState().select("n50001003001");
    expect(useSelectionStore.getState().selectedId).toBe("n50001003001");
  });

  it("remembers the last selected word after its popover closes", () => {
    useSelectionStore.getState().select("a");
    useSelectionStore.getState().select(null);
    expect(useSelectionStore.getState()).toMatchObject({
      selectedId: null,
      lastId: "a",
    });
  });

  it("forgets a remembered word that is not in the chapter", () => {
    useSelectionStore.getState().select("a");
    restoreSelection([{ id: "b" }]);
    expect(useSelectionStore.getState()).toMatchObject({
      selectedId: null,
      lastId: null,
    });
  });

  it("leaves an open popover alone when the same chapter shows again", () => {
    useSelectionStore.getState().select("a");
    restoreSelection([{ id: "a" }, { id: "b" }]);
    expect(useSelectionStore.getState()).toMatchObject({
      selectedId: "a",
      lastId: "a",
    });
  });

  it("does not bring a remembered word back without a hand-over", () => {
    const focus = vi.fn<() => void>();
    vi.stubGlobal("document", {
      getElementById: () => ({ scrollIntoView: vi.fn<() => void>(), focus }),
    });
    vi.stubGlobal("window", {});
    useSelectionStore.getState().select("a");
    useSelectionStore.getState().select(null);
    restoreSelection([{ id: "a" }]);
    expect(focus).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("hands the selection over a reload once", () => {
    const storage = memoryStorage();
    useSelectionStore.getState().select("n50001003001");
    handOverSelection(storage);
    expect(storage.data.get(SELECTED_WORD_KEY)).toBe("n50001003001");
    // A render on the page that is leaving does not take it back.
    expect(takeHandedOverSelection(storage)).toBeNull();
    resetHandOver(); // the reloaded page
    expect(takeHandedOverSelection(storage)).toBe("n50001003001");
    expect(takeHandedOverSelection(storage)).toBeNull();
  });

  it("clears a stale hand-over when nothing is selected", () => {
    const storage = memoryStorage();
    storage.setItem(SELECTED_WORD_KEY, "old");
    handOverSelection(storage);
    expect(storage.data.has(SELECTED_WORD_KEY)).toBe(false);
  });

  it("survives blocked storage", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    useSelectionStore.getState().select("x");
    expect(() => handOverSelection(blocked)).not.toThrow();
    expect(takeHandedOverSelection(blocked)).toBeNull();
  });

  it("hands the selection to Reading within the page, closing the popover", () => {
    const focus = vi.fn<() => void>();
    vi.stubGlobal("document", {
      getElementById: () => ({ scrollIntoView: vi.fn<() => void>(), focus }),
    });
    vi.stubGlobal("window", {});
    useSelectionStore.getState().select("a");
    handOverWithinPage();
    restoreSelection([{ id: "a" }, { id: "b" }]);
    expect(useSelectionStore.getState()).toMatchObject({
      selectedId: null,
      lastId: "a",
    });
    expect(focus).toHaveBeenCalledOnce();
    expect(takeHandedOverSelection(memoryStorage())).toBeNull();
    vi.unstubAllGlobals();
  });

  it("drops a within-page hand-over when the switch fails", () => {
    useSelectionStore.getState().select("a");
    handOverWithinPage();
    cancelHandOverWithinPage();
    expect(takeHandedOverSelection(memoryStorage())).toBeNull();
  });
});
