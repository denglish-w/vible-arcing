// Saves checked attempts without holding up the result (spec 010 FR-023;
// research R6). Attempts are immutable, so this is a queue rather than the
// document loop in src/lib/autosave.ts: each is sent until the server confirms
// or refuses it. Retries reuse the attempt's id, which the server stores at most
// once. Plain TypeScript with no React.
import type { AttemptInput } from "./types.ts";

export type OutboxSendResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        "invalid" | "unknown-word" | "corpus-missing" | "store-unavailable";
    };

export type OutboxStatus =
  | { state: "saved"; id: string }
  | { state: "retrying"; id: string; retryInMs: number }
  | { state: "refused"; id: string; reason: string };

/** An attempt not yet saved: still being sent, or refused for good. */
export type Unsaved = {
  id: string;
  wordId: string;
  state: "pending" | "refused";
  reason?: string;
};

export type UnloadTarget = Pick<
  Window,
  "addEventListener" | "removeEventListener"
>;

export type OutboxOptions = {
  /** Rejects (throws) for retryable failures, such as an unreachable server. */
  send: (attempt: AttemptInput) => Promise<OutboxSendResult>;
  onStatus?: (status: OutboxStatus) => void;
  /** Where the leave-page guard is registered, usually `window`. */
  target?: UnloadTarget;
};

export type Outbox = {
  add: (attempt: AttemptInput) => void;
  /** Ids not yet confirmed or refused. */
  pending: () => string[];
  /**
   * Attempts not yet saved, with their word, so a screen shown later can still
   * show their state. Saved attempts drop out; refused ones stay. The same
   * array is returned until something changes.
   */
  unsaved: () => Unsaved[];
  /** Calls `listener` whenever `unsaved()` changes; returns the way to stop. */
  watch: (listener: () => void) => () => void;
  /** Hears every later status; returns the way to stop listening. */
  subscribe: (listener: (status: OutboxStatus) => void) => () => void;
  dispose: () => void;
};

const BACKOFF_START_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

export function createOutbox(options: OutboxOptions): Outbox {
  const queue = new Map<string, AttemptInput>();
  const refused = new Map<string, { wordId: string; reason: string }>();
  const changes = new Set<() => void>();
  let snapshot: Unsaved[] = [];
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const listeners = new Set<(status: OutboxStatus) => void>();
  let guarded = false;
  let disposed = false;

  const onBeforeUnload = (event: Event) => {
    event.preventDefault();
    (event as BeforeUnloadEvent).returnValue = "";
  };
  function updateGuard() {
    const want = queue.size > 0 && !disposed;
    if (want === guarded || !options.target) return;
    guarded = want;
    if (want) options.target.addEventListener("beforeunload", onBeforeUnload);
    else options.target.removeEventListener("beforeunload", onBeforeUnload);
  }

  function touch() {
    snapshot = [
      ...[...refused].map(([id, { wordId, reason }]) => ({
        id,
        wordId,
        state: "refused" as const,
        reason,
      })),
      ...[...queue].map(([id, attempt]) => ({
        id,
        wordId: attempt.answer.wordId,
        state: "pending" as const,
      })),
    ];
    for (const listener of changes) listener();
  }

  function emit(status: OutboxStatus) {
    options.onStatus?.(status);
    for (const listener of listeners) listener(status);
  }

  function finish(id: string, status: OutboxStatus) {
    const attempt = queue.get(id);
    queue.delete(id);
    if (attempt && status.state === "refused")
      refused.set(id, { wordId: attempt.answer.wordId, reason: status.reason });
    updateGuard();
    if (disposed) return;
    touch();
    emit(status);
  }

  async function send(id: string, failures: number) {
    timers.delete(id);
    const attempt = queue.get(id);
    if (!attempt || disposed) return;
    let result: OutboxSendResult;
    try {
      result = await options.send(attempt);
    } catch {
      if (disposed) return;
      const delay = Math.min(BACKOFF_START_MS * 2 ** failures, BACKOFF_MAX_MS);
      emit({ state: "retrying", id, retryInMs: delay });
      timers.set(
        id,
        setTimeout(() => void send(id, failures + 1), delay),
      );
      return;
    }
    if (result.ok) finish(id, { state: "saved", id });
    else finish(id, { state: "refused", id, reason: result.reason });
  }

  return {
    add(attempt) {
      if (disposed || queue.has(attempt.id)) return;
      queue.set(attempt.id, attempt);
      // A new check of a word supersedes its earlier refusals.
      for (const [id, entry] of refused)
        if (entry.wordId === attempt.answer.wordId) refused.delete(id);
      updateGuard();
      touch();
      void send(attempt.id, 0);
    },
    pending: () => [...queue.keys()],
    unsaved: () => snapshot,
    watch(listener) {
      changes.add(listener);
      return () => void changes.delete(listener);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      updateGuard();
    },
  };
}
