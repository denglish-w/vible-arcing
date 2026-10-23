// De-duplicates "previous attempt" lookups. Opening a word's bubble can mount the
// parsing form twice in quick succession; both mounts share one request instead
// of sending two identical ones. Entries are dropped once settled so a later
// re-open (after the learner has saved a new answer) always reads fresh data.
const inflight = new Map();

export function fetchPreviousOnce(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);
  const p = fetcher().finally(() => {
    window.setTimeout(() => inflight.delete(key), 400);
  });
  inflight.set(key, p);
  return p;
}

// Call after saving a new result so the next open does not reuse a stale one.
export function forgetPreviousAttempt(key) {
  inflight.delete(key);
}