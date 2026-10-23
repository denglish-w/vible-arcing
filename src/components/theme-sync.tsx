"use client";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/settings";
export function ThemeSync() {
  const theme = useSettingsStore((state) => state.settings.theme);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    void Promise.resolve(useSettingsStore.persist.rehydrate()).then(() =>
      setHydrated(true),
    );
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("sepia", theme === "sepia");
  }, [theme, hydrated]);
  return null;
}
