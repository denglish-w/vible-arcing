// The one outbox for the page's lifetime. Components subscribe to it and leave
// it running when they unmount, so a client-side navigation does not drop
// attempts that are still waiting to be saved or release the leave-page guard.
import { createOutbox, type Outbox, type OutboxOptions } from "./outbox.ts";

let shared: Outbox | undefined;

/** Created on first use with `send`; later calls return the same outbox. */
export function sharedOutbox(send: OutboxOptions["send"]): Outbox {
  shared ??= createOutbox({
    send,
    target: typeof window === "undefined" ? undefined : window,
  });
  return shared;
}

/** For tests: forget the outbox (it keeps retrying until disposed). */
export function resetSharedOutbox() {
  shared?.dispose();
  shared = undefined;
}
