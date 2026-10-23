import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEBOUNCE_MS,
  createAutosave,
  type AutosaveOptions,
  type AutosaveStatus,
  type SaveResult,
} from "./autosave.ts";

/** An editor's content and change notifications. */
function fakeSource(initial: string) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    edit(next: string) {
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listenerCount: () => listeners.size,
  };
}

/** A save whose calls can be answered one by one. */
function fakeSave() {
  const calls: {
    snapshot: string;
    revision: number;
    resolve: (r: SaveResult) => void;
    reject: (e: Error) => void;
  }[] = [];
  const save = vi.fn<
    (snapshot: string, revision: number) => Promise<SaveResult>
  >(
    (snapshot, revision) =>
      new Promise<SaveResult>((resolve, reject) =>
        calls.push({ snapshot, revision, resolve, reject }),
      ),
  );
  return { save, calls };
}

function fakeUnloadTarget() {
  const handlers = new Set<EventListenerOrEventListenerObject>();
  return {
    addEventListener: vi.fn<
      (type: string, h: EventListenerOrEventListenerObject) => void
    >((_, h) => {
      handlers.add(h);
    }),
    removeEventListener: vi.fn<
      (type: string, h: EventListenerOrEventListenerObject) => void
    >((_, h) => {
      handlers.delete(h);
    }),
    guarded: () => handlers.size > 0,
    /** Returns whether the page would ask before closing. */
    close() {
      const event = new Event("beforeunload", { cancelable: true });
      for (const h of handlers) {
        if (typeof h === "function") h(event);
        else h.handleEvent(event);
      }
      return event.defaultPrevented;
    },
  };
}

const flushPromises = () => vi.advanceTimersByTimeAsync(0);

function setup(overrides: Partial<AutosaveOptions<string>> = {}) {
  const source = fakeSource("v0");
  const { save, calls } = fakeSave();
  const unload = fakeUnloadTarget();
  const statuses: AutosaveStatus[] = [];
  const autosave = createAutosave<string>({
    subscribe: source.subscribe,
    getSnapshot: source.get,
    save,
    revision: 1,
    onStatus: (s) => statuses.push(s),
    unloadTarget: unload as unknown as Window,
    ...overrides,
  });
  const state = () => autosave.getStatus().state;
  return { source, save, calls, unload, statuses, autosave, state };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createAutosave", () => {
  it("lets edits apply at once and saves after the debounce", async () => {
    const { source, save, calls, state } = setup();
    source.edit("v1");
    // The editor's own content changed immediately; nothing waited on a save.
    expect(source.get()).toBe("v1");
    expect(state()).toBe("pending");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ snapshot: "v1", revision: 1 });
    expect(state()).toBe("saving");
    calls[0].resolve({ ok: true, revision: 2 });
    await flushPromises();
    expect(state()).toBe("saved");
  });

  it("sends one save at a time and one follow-up for edits made during it", async () => {
    const { source, calls, state } = setup();
    source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    source.edit("v2");
    source.edit("v3");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 5);
    expect(calls).toHaveLength(1);

    calls[0].resolve({ ok: true, revision: 2 });
    await flushPromises();
    expect(state()).toBe("pending");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ snapshot: "v3", revision: 2 });
    calls[1].resolve({ ok: true, revision: 3 });
    await flushPromises();
    expect(state()).toBe("saved");
    expect(calls).toHaveLength(2);
  });

  it("retries a retryable failure with backoff and clears 'not saved' on success", async () => {
    const { source, calls, statuses, state } = setup();
    source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    calls[0].reject(new Error("fetch failed"));
    await flushPromises();
    expect(autosaveStatus(statuses)).toEqual({
      state: "not-saved",
      retryInMs: 1000,
    });
    expect(source.get()).toBe("v1");

    await vi.advanceTimersByTimeAsync(1000);
    calls[1].reject(new Error("fetch failed"));
    await flushPromises();
    expect(autosaveStatus(statuses)).toMatchObject({ retryInMs: 2000 });

    // An edit while waiting is carried by the next retry.
    source.edit("v2");
    await vi.advanceTimersByTimeAsync(1999);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls[2].snapshot).toBe("v2");
    calls[2].resolve({ ok: true, revision: 2 });
    await flushPromises();
    expect(state()).toBe("saved");
  });

  it("caps the backoff at 30 seconds", async () => {
    const { source, calls, statuses } = setup();
    source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    for (let i = 0; i < 7; i++) {
      calls[i].reject(new Error("offline"));
      await flushPromises();
      await vi.advanceTimersByTimeAsync(30_000);
    }
    const delays = statuses
      .filter((s) => s.state === "not-saved")
      .map((s) => (s as { retryInMs: number }).retryInMs);
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
  });

  it("stops on a conflict, keeps the changes, and offers overwrite, copy and download", async () => {
    const download = vi.fn<(snapshot: string) => void>();
    const copies: string[] = [];
    const { source, calls, state, autosave } = setup({
      download,
      saveAsCopy: async (snapshot) => {
        copies.push(snapshot);
        return { ok: true, revision: 1 };
      },
    });
    source.edit("mine");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    const updatedAt = new Date(0);
    calls[0].resolve({
      ok: false,
      reason: "conflict",
      current: { revision: 5, updatedAt },
    });
    await flushPromises();
    expect(autosave.getStatus()).toEqual({
      state: "conflict",
      current: { revision: 5, updatedAt },
    });

    // No retries, and later edits are kept but not sent.
    source.edit("mine, edited");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toHaveLength(1);
    expect(source.get()).toBe("mine, edited");

    autosave.download();
    expect(download).toHaveBeenCalledWith("mine, edited");

    autosave.overwrite();
    await flushPromises();
    expect(calls[1]).toMatchObject({ snapshot: "mine, edited", revision: 5 });
    calls[1].resolve({ ok: true, revision: 6 });
    await flushPromises();
    expect(state()).toBe("saved");
    expect(copies).toEqual([]);
  });

  it("saves a conflicted document as a new copy when asked", async () => {
    const copies: string[] = [];
    const { source, calls, state, autosave } = setup({
      saveAsCopy: async (snapshot) => {
        copies.push(snapshot);
        return { ok: true, revision: 1 };
      },
    });
    source.edit("mine");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    calls[0].resolve({
      ok: false,
      reason: "conflict",
      current: { revision: 2, updatedAt: new Date(0) },
    });
    await flushPromises();
    autosave.saveAsCopy();
    await flushPromises();
    expect(copies).toEqual(["mine"]);
    expect(state()).toBe("saved");

    // Later saves continue from the copy's revision.
    source.edit("mine 2");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(calls[1]).toMatchObject({ snapshot: "mine 2", revision: 1 });
  });

  it.each([
    "invalid",
    "unknown-word",
    "not-found",
    "too-large",
    "unknown-version",
    "corpus-missing",
  ] as const)(
    "stops retrying a permanent '%s' refusal and keeps the changes",
    async (reason) => {
      const download = vi.fn<(snapshot: string) => void>();
      const { source, calls, autosave, unload } = setup({ download });
      source.edit("v1");
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      const result = { ok: false, reason, wordIds: ["n1"] } as SaveResult;
      calls[0].resolve(result);
      await flushPromises();
      expect(autosave.getStatus()).toEqual({
        state: "refused",
        reason,
        result,
      });
      await vi.advanceTimersByTimeAsync(60_000);
      expect(calls).toHaveLength(1);
      expect(source.get()).toBe("v1");
      expect(unload.guarded()).toBe(true);
      autosave.download();
      expect(download).toHaveBeenCalledWith("v1");

      // The user can try again, for example after fixing the content.
      autosave.retry();
      await flushPromises();
      expect(calls).toHaveLength(2);
    },
  );

  it("guards leaving the page only while there are unsaved changes", async () => {
    const { source, calls, unload } = setup();
    expect(unload.guarded()).toBe(false);
    source.edit("v1");
    expect(unload.close()).toBe(true);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(unload.close()).toBe(true);
    calls[0].resolve({ ok: true, revision: 2 });
    await flushPromises();
    expect(unload.guarded()).toBe(false);
    expect(unload.close()).toBe(false);
  });

  it("stops watching, timing and guarding once disposed, sending unsaved edits once", async () => {
    const { source, save, calls, unload, autosave } = setup();
    source.edit("v1");
    expect(autosave.hasUnsavedChanges()).toBe(true);
    autosave.dispose();
    expect(source.listenerCount()).toBe(0);
    expect(unload.guarded()).toBe(false);
    await flushPromises();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ snapshot: "v1", revision: 1 });
    calls[0].reject(new Error("offline"));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 50);
    expect(save).toHaveBeenCalledOnce();
  });

  it("on dispose, sends edits made during a save after that save settles", async () => {
    const { source, calls, autosave } = setup();
    source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    source.edit("v2");
    autosave.dispose();
    // The editor may already show another record by the time the save is sent.
    source.edit("another record");
    expect(calls).toHaveLength(1);
    calls[0].resolve({ ok: true, revision: 2 });
    await flushPromises();
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ snapshot: "v2", revision: 2 });
    calls[1].resolve({ ok: true, revision: 3 });
    await flushPromises();
    expect(autosave.hasUnsavedChanges()).toBe(false);
  });

  it("sends nothing on dispose when everything is saved or waiting on the user", async () => {
    const clean = setup();
    clean.autosave.dispose();
    expect(clean.save).not.toHaveBeenCalled();

    const conflicted = setup();
    conflicted.source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    conflicted.calls[0].resolve({
      ok: false,
      reason: "conflict",
      current: { revision: 2, updatedAt: new Date(0) },
    });
    await flushPromises();
    conflicted.autosave.dispose();
    expect(conflicted.save).toHaveBeenCalledOnce();
  });

  it("retries a failed copy as a copy, not against the old record", async () => {
    const copies: string[] = [];
    let failCopy = true;
    const { source, calls, state, autosave } = setup({
      saveAsCopy: async (snapshot) => {
        copies.push(snapshot);
        if (failCopy) throw new Error("offline");
        return { ok: true, revision: 1 };
      },
    });
    source.edit("mine");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    calls[0].resolve({
      ok: false,
      reason: "conflict",
      current: { revision: 2, updatedAt: new Date(0) },
    });
    await flushPromises();
    autosave.saveAsCopy();
    await flushPromises();
    expect(state()).toBe("not-saved");
    failCopy = false;
    await vi.advanceTimersByTimeAsync(1000);
    expect(copies).toEqual(["mine", "mine"]);
    expect(calls).toHaveLength(1);
    expect(state()).toBe("saved");
  });

  it("tries again after an edit to content the server refused", async () => {
    const { source, calls, state } = setup();
    source.edit("huge");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    calls[0].resolve({ ok: false, reason: "too-large", bytes: 1 });
    await flushPromises();
    source.edit("trimmed");
    expect(state()).toBe("pending");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(calls[1].snapshot).toBe("trimmed");
  });

  it("keeps waiting on the user after a refusal an edit cannot fix", async () => {
    const { source, calls, state } = setup();
    source.edit("v1");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    calls[0].resolve({ ok: false, reason: "not-found" });
    await flushPromises();
    source.edit("v2");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 10);
    expect(calls).toHaveLength(1);
    expect(state()).toBe("refused");
  });
});

function autosaveStatus(statuses: AutosaveStatus[]) {
  return statuses.at(-1);
}
