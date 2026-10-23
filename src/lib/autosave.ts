// The save loop for editors (design decision 7; saved-work spec "Saving never
// blocks editing" and "Conflicting saves never lose work"). Plain TypeScript
// with no React or store dependency: the editor owns its state, and this only
// watches it and sends saves. `useAutosave` in ./use-autosave.ts wraps it.

/** What a save action returns for an expected outcome (mirrors src/db/work.ts). */
export type SaveResult =
  | { ok: true; revision: number }
  | {
      ok: false;
      reason: "conflict";
      current: { revision: number; updatedAt: Date };
    }
  | { ok: false; reason: PermanentReason; [detail: string]: unknown };

/** Refusals that retrying the same content cannot fix. */
export type PermanentReason =
  | "invalid"
  | "unknown-word"
  | "not-found"
  | "too-large"
  | "unknown-version"
  | "corpus-missing";

export type AutosaveStatus =
  | { state: "saved" }
  /** Edited; a save is about to be sent. */
  | { state: "pending" }
  | { state: "saving" }
  /** A retryable failure: changes are kept and the save is retried. */
  | { state: "not-saved"; retryInMs: number }
  /** Changed in another tab or window; waiting for the user to choose. */
  | {
      state: "conflict";
      current: { revision: number; updatedAt: Date };
    }
  /** Refused for a reason retrying cannot fix; waiting for the user. */
  | { state: "refused"; reason: PermanentReason; result: SaveResult };

export type UnloadTarget = Pick<
  Window,
  "addEventListener" | "removeEventListener"
>;

export type AutosaveOptions<T> = {
  /** Calls `listener` after every edit; returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  /** Rejects (throws) for retryable failures, such as an unreachable server. */
  save: (snapshot: T, baseRevision: number) => Promise<SaveResult>;
  /** The stored revision the editor's content was loaded from. */
  revision: number;
  onStatus: (status: AutosaveStatus) => void;
  /**
   * Creates a new record from `snapshot`, for "save as a new copy". Before it
   * resolves, the caller points `save` at the new record, whose revision the
   * result carries.
   */
  saveAsCopy?: (snapshot: T) => Promise<SaveResult>;
  /** Offers `snapshot` to the user as a file. */
  download?: (snapshot: T) => void;
  /** Where the leave-page guard is registered, usually `window`. */
  unloadTarget?: UnloadTarget;
  debounceMs?: number;
};

export type Autosave = {
  getStatus: () => AutosaveStatus;
  /** After a conflict: store the local content over the newer version. */
  overwrite: () => void;
  /** After a conflict or refusal: store the local content as a new record. */
  saveAsCopy: () => void;
  download: () => void;
  /** After a refusal: try saving the current content again. */
  retry: () => void;
  /** True while some edits are not stored, for in-app navigation guards. */
  hasUnsavedChanges: () => boolean;
  /**
   * Stops the controller. Unsaved edits that are not waiting on the user are
   * sent once more, without retries, since the editor is going away.
   */
  dispose: () => void;
};

export const DEBOUNCE_MS = 800;
const BACKOFF_START_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/** Refusals that an edit to the content may fix, so editing tries again. */
const CONTENT_REASONS = new Set<PermanentReason>([
  "invalid",
  "unknown-word",
  "too-large",
  "unknown-version",
]);

export function createAutosave<T>(options: AutosaveOptions<T>): Autosave {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS;
  let revision = options.revision;
  let status: AutosaveStatus = { state: "saved" };
  // Edits counted so a save knows whether it captured the latest content.
  let edits = 0;
  let savedEdits = 0;
  let inFlight = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  let guarded = false;
  let disposed = false;

  const dirty = () => edits !== savedEdits;
  const blocked = () =>
    status.state === "conflict" || status.state === "refused";

  const onBeforeUnload = (event: Event) => {
    event.preventDefault();
    // Older browsers show the prompt only when returnValue is set.
    (event as BeforeUnloadEvent).returnValue = "";
  };
  function updateGuard() {
    const want = dirty() && !disposed;
    if (want === guarded || !options.unloadTarget) return;
    guarded = want;
    if (want)
      options.unloadTarget.addEventListener("beforeunload", onBeforeUnload);
    else
      options.unloadTarget.removeEventListener("beforeunload", onBeforeUnload);
  }

  function setStatus(next: AutosaveStatus) {
    status = next;
    updateGuard();
    if (!disposed) options.onStatus(next);
  }

  const saveToRecord = (snapshot: T) => options.save(snapshot, revision);

  function schedule(delay: number, send = saveToRecord) {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(send), delay);
  }

  async function flush(
    send: (snapshot: T) => Promise<SaveResult> = saveToRecord,
  ) {
    timer = undefined;
    if (disposed || inFlight) return;
    inFlight = true;
    const sentEdits = edits;
    setStatus({ state: "saving" });
    let result: SaveResult;
    try {
      result = await send(options.getSnapshot());
    } catch {
      inFlight = false;
      if (disposed) return;
      const delay = Math.min(
        BACKOFF_START_MS * 2 ** failures++,
        BACKOFF_MAX_MS,
      );
      setStatus({ state: "not-saved", retryInMs: delay });
      // Retry the same request: a failed copy must not fall back to the record.
      schedule(delay, send);
      return;
    }
    inFlight = false;
    if (disposed) return;
    failures = 0;
    if (result.ok) {
      revision = result.revision;
      savedEdits = sentEdits;
      if (dirty()) {
        // Edits arrived during the save: one follow-up save covers them all.
        setStatus({ state: "pending" });
        schedule(debounceMs);
      } else setStatus({ state: "saved" });
    } else if (result.reason === "conflict") {
      setStatus({ state: "conflict", current: result.current });
    } else {
      setStatus({ state: "refused", reason: result.reason, result });
    }
  }

  const unsubscribe = options.subscribe(() => {
    if (disposed) return;
    edits++;
    // An edit may fix content the server refused, so it is sent again.
    if (status.state === "refused" && CONTENT_REASONS.has(status.reason)) {
      setStatus({ state: "pending" });
      schedule(debounceMs);
      return;
    }
    // A conflict or other refusal waits for the user; edits still apply.
    if (blocked()) {
      updateGuard();
      return;
    }
    if (inFlight) {
      updateGuard();
      return;
    }
    if (status.state === "not-saved") {
      // The pending retry will send the latest content.
      updateGuard();
      return;
    }
    setStatus({ state: "pending" });
    schedule(debounceMs);
  });

  return {
    getStatus: () => status,
    overwrite() {
      if (status.state !== "conflict" || inFlight) return;
      revision = status.current.revision;
      void flush();
    },
    saveAsCopy() {
      const copy = options.saveAsCopy;
      if (!blocked() || inFlight || !copy) return;
      void flush(copy);
    },
    download() {
      options.download?.(options.getSnapshot());
    },
    retry() {
      if (status.state !== "refused" || inFlight) return;
      void flush();
    },
    hasUnsavedChanges: dirty,
    dispose() {
      if (disposed) return;
      const finalSave = dirty() && !blocked() && !inFlight;
      disposed = true;
      clearTimeout(timer);
      unsubscribe();
      updateGuard();
      // Best effort: nothing is left to report the outcome to.
      if (finalSave) void saveToRecord(options.getSnapshot()).catch(() => {});
    },
  };
}
