import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAnnotations, saveAnnotation } from "@/lib/server-fns";
import { emptyAnnotation } from "@/lib/diaglot";

// Loads the current user's per-verse annotations for a chapter and exposes an
// optimistic `onMutate` that updates local state immediately and persists
// ~1s after the user stops editing. `enabled` gates loading (only when the
// Translate panel is in use) so brackets aren't fetched when irrelevant.
export function useChapterAnnotations(bookCode, chapter, enabled) {
  const fetchAnns = useServerFn(getAnnotations);
  const saveFn = useServerFn(saveAnnotation);
  const [annotations, setAnnotations] = useState({});
  const ref = useRef({});
  const [saveStatus, setSaveStatus] = useState("idle");
  const timers = useRef({});
  const savedTimer = useRef(null);

  useEffect(() => {
    for (const k in timers.current) clearTimeout(timers.current[k]);
    if (!enabled) {
      ref.current = {};
      setAnnotations({});
      return;
    }
    ref.current = {};
    setAnnotations({});
    fetchAnns({ data: { book: bookCode, chapter } })
      .then((arr) => {
        const map = {};
        for (const a of arr) map[a.verse] = a;
        ref.current = map;
        setAnnotations(map);
      })
      .catch(() => {});
    return () => {
      for (const k in timers.current) clearTimeout(timers.current[k]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookCode, chapter, enabled]);

  // Stable identity (changes only with the chapter) so memoized children that
  // receive it don't re-render on every parent render.
  const onMutate = useCallback((verse, updater) => {
    const old = ref.current[verse] || emptyAnnotation(bookCode, chapter, verse);
    const next = updater(old);
    ref.current = { ...ref.current, [verse]: next };
    setAnnotations(ref.current);
    clearTimeout(timers.current[verse]);
    setSaveStatus("saving");
    timers.current[verse] = setTimeout(() => {
      setSaveStatus("saving");
      saveFn({
        data: {
          book: bookCode,
          chapter,
          verse,
          splits: next.splits,
          segments: next.segments,
          brackets: next.brackets,
        },
      })
        .then(() => {
          setSaveStatus("saved");
          clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch(() => setSaveStatus("idle"));
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookCode, chapter]);

  return { annotations, onMutate, saveStatus };
}