// Saves checked attempts without holding up the result (spec 010 FR-023;
// research R6). Attempts are immutable, so this is a queue rather than the
// document loop in src/lib/autosave.ts: each is sent until the server confirms
// or refuses it. Retries reuse the attempt's id, which the server stores at most
// once. Plain TypeScript with no React.
import type { AttemptInput } from "./types.ts";

export type OutboxSendResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "unknown-word" | "corpus-missing" };

export type OutboxStatus =
  | { state: "saved"; id: string }
  | { state: "retrying"; id: string; retryInMs: number }
  | { state: "refused"; id: string; reason: string };

export type UnloadTarget = Pick<
  Window,
  "addEventListener" | "removeEventListener"
>;

export type OutboxOptions = {
  /** Rejects (throws) for retryable failures, such as an unreachable server. */
  send: (attempt: AttemptInput) => Promise<OutboxSendResult>;
  onStatus: (status: OutboxStatus) => void;
  /** Where the leave-page guard is registered, usually `window`. */
  target?: UnloadTarget;
};

export type Outbox = {
  add: (attempt: AttemptInput) => void;
  /** Ids not yet confirmed or refused. */
  pending: () => string[];
  dispose: () => void;
};

const BACKOFF_START_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

export function createOutbox(options: OutboxOptions): Outbox {
  const queue = new Map<string, AttemptInput>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
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

  function finish(id: string, status: OutboxStatus) {
    queue.delete(id);
    updateGuard();
    if (!disposed) options.onStatus(status);
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
      options.onStatus({ state: "retrying", id, retryInMs: delay });
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
      updateGuard();
      void send(attempt.id, 0);
    },
    pending: () => [...queue.keys()],
    dispose() {
      disposed = true;
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      updateGuard();
    },
  };
}
