import { useEffect, useState } from "react";

// Renders `defaultValue` on the server and the first client render (so SSR and
// hydration match), then loads the stored value from localStorage after mount.
// Writes the current value back to localStorage whenever it changes.
export function usePersistentState(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}