import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { mergeSettings, DEFAULT_SETTINGS } from "@/lib/study-defaults";

const Ctx = createContext(null);

const STORAGE_KEY = "gnt.studySettings";

// Owns all study display settings (theme, Greek font/size/spacing, verse
// numbers, part-of-speech color). Loads from the signed-in user's record
// (`study_settings`, written via auth.updateMe so it is deleted with the
// account) or, when signed out, from localStorage. Applies the theme class to
// <html> and debounces saves so changes apply instantly and persist across
// chapters and devices.
export function StudySettingsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(() => mergeSettings(DEFAULT_SETTINGS));
  const hydrated = useRef(false);
  const lastLoaded = useRef(null);
  const saveTimer = useRef(null);

  // Load whenever the signed-in user changes (sign-in, sign-out, refresh), or
  // on first mount (localStorage for anonymous visitors).
  useEffect(() => {
    if (user && user.study_settings && typeof user.study_settings === "object") {
      const merged = mergeSettings(user.study_settings);
      setSettings(merged);
      lastLoaded.current = merged;
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const merged = mergeSettings(JSON.parse(raw));
          setSettings(merged);
          lastLoaded.current = merged;
        }
      } catch {
        /* ignore */
      }
    }
    hydrated.current = true;
  }, [user]);

  // Apply the theme class to the document root. Light is the default (:root);
  // dark and sepia add a class with their own token overrides.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("dark", "sepia");
    if (settings.theme === "dark") el.classList.add("dark");
    else if (settings.theme === "sepia") el.classList.add("sepia");
  }, [settings.theme]);

  // Persist (debounced) after the initial load. Skip the value we just loaded
  // so we don't immediately rewrite it.
  useEffect(() => {
    if (!hydrated.current) return;
    if (settings === lastLoaded.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      lastLoaded.current = settings;
      if (isAuthenticated) {
        base44.auth
          .updateMe({ study_settings: settings })
          .catch(() => {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            } catch {
              /* ignore */
            }
          });
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch {
          /* ignore */
        }
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, isAuthenticated]);

  const update = useCallback((patch) => {
    setSettings((s) => (typeof patch === "function" ? { ...s, ...patch(s) } : { ...s, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setSettings(() => mergeSettings(DEFAULT_SETTINGS));
  }, []);

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudySettings() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStudySettings must be used within StudySettingsProvider");
  return c;
}