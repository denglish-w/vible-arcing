import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOutbox,
  type OutboxSendResult,
  type OutboxStatus,
  type UnloadTarget,
} from "./outbox.ts";
import type { AttemptInput } from "./types.ts";

const attempt = (id: string): AttemptInput => ({
  id,
  answer: { wordId: "n50001003001", lemma: "", pos: "", fields: {} },
});

function fakeTarget() {
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const target: UnloadTarget = {
    addEventListener: (_type: string, l: EventListenerOrEventListenerObject) =>
      void listeners.add(l),
    removeEventListener: (
      _type: string,
      l: EventListenerOrEventListenerObject,
    ) => void listeners.delete(l),
  } as UnloadTarget;
  return { target, listeners };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createOutbox", () => {
  it("retries a failed send with backoff until it succeeds", async () => {
    const statuses: OutboxStatus[] = [];
    let calls = 0;
    const send = vi.fn<(a: AttemptInput) => Promise<OutboxSendResult>>(
      async () => {
        calls++;
        if (calls < 3) throw new Error("offline");
        return { ok: true };
      },
    );
    const { target, listeners } = fakeTarget();
    const outbox = createOutbox({
      send,
      onStatus: (s) => statuses.push(s),
      target,
    });
    outbox.add(attempt("a"));
    expect(outbox.pending()).toEqual(["a"]);
    expect(listeners.size).toBe(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toEqual({
      state: "retrying",
      id: "a",
      retryInMs: 1000,
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(statuses.at(-1)).toEqual({
      state: "retrying",
      id: "a",
      retryInMs: 2000,
    });
    await vi.advanceTimersByTimeAsync(2000);
    expect(statuses.at(-1)).toEqual({ state: "saved", id: "a" });
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.every(([a]) => a.id === "a")).toBe(true);
    expect(outbox.pending()).toEqual([]);
    expect(listeners.size).toBe(0);
  });

  it("drops and reports a refusal without retrying", async () => {
    const statuses: OutboxStatus[] = [];
    const send = vi.fn<() => Promise<OutboxSendResult>>(async () => ({
      ok: false,
      reason: "unknown-word",
    }));
    const outbox = createOutbox({ send, onStatus: (s) => statuses.push(s) });
    outbox.add(attempt("a"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(statuses).toEqual([
      { state: "refused", id: "a", reason: "unknown-word" },
    ]);
    expect(send).toHaveBeenCalledOnce();
    expect(outbox.pending()).toEqual([]);
  });

  it("keeps the leave-page guard while anything is pending", async () => {
    let resolveA: (r: OutboxSendResult) => void = () => {};
    const send = vi.fn<(a: AttemptInput) => Promise<OutboxSendResult>>(
      (a: AttemptInput) =>
        new Promise<OutboxSendResult>((resolve) => {
          if (a.id === "a") resolveA = resolve;
          else resolve({ ok: true });
        }),
    );
    const { target, listeners } = fakeTarget();
    const outbox = createOutbox({ send, onStatus: () => {}, target });
    outbox.add(attempt("a"));
    outbox.add(attempt("b"));
    await vi.advanceTimersByTimeAsync(0);
    expect(outbox.pending()).toEqual(["a"]);
    expect(listeners.size).toBe(1);
    resolveA({ ok: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(listeners.size).toBe(0);
  });

  it("ignores a repeated id while it is pending", async () => {
    const send = vi.fn<() => Promise<OutboxSendResult>>(async () => ({
      ok: true,
    }));
    const outbox = createOutbox({ send, onStatus: () => {} });
    outbox.add(attempt("a"));
    outbox.add(attempt("a"));
    await vi.advanceTimersByTimeAsync(0);
    expect(send).toHaveBeenCalledOnce();
  });
});
