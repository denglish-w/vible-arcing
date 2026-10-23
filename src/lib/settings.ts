"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { POS_CATEGORIES, type PosCategory } from "./pos";

export const DISPLAY_STORAGE_KEY = "vible.display";
export const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "sepia", label: "Sepia" },
] as const;
export const FONT_OPTIONS = [
  { label: "EB Garamond", value: "var(--font-garamond), serif" },
  { label: "Gentium Plus", value: "var(--font-gentium), serif" },
  { label: "Cardo", value: "var(--font-cardo), serif" },
  { label: "GFS Didot", value: "var(--font-didot), serif" },
] as const;
export const SIZE_SCALE = [1.25, 1.5, 1.7, 1.95, 2.25] as const;
export const SIZE_LABELS = [
  "Small",
  "Medium",
  "Large",
  "X-Large",
  "XX-Large",
] as const;
export const SPACING = {
  compact: 1.7,
  comfortable: 2.1,
  spacious: 2.6,
} as const;
export const SPACING_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
] as const;
export interface DisplaySettings {
  theme: (typeof THEMES)[number]["value"];
  fontFamily: (typeof FONT_OPTIONS)[number]["value"];
  fontSizeIndex: number;
  lineSpacing: keyof typeof SPACING;
  showVerseNumbers: boolean;
  posColor: { enabled: boolean; categories: Record<PosCategory, boolean> };
}
export function defaultCategories(): Record<PosCategory, boolean> {
  return Object.fromEntries(
    POS_CATEGORIES.map(({ key }) => [key, true]),
  ) as Record<PosCategory, boolean>;
}
export const DEFAULT_SETTINGS: DisplaySettings = {
  theme: "light",
  fontFamily: FONT_OPTIONS[0].value,
  fontSizeIndex: 2,
  lineSpacing: "comfortable",
  showVerseNumbers: true,
  posColor: { enabled: false, categories: defaultCategories() },
};
function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
/** Validate every field independently; unknown and missing values retain their defaults. */
export function mergeSettings(stored: unknown): DisplaySettings {
  const input = record(stored);
  const color = record(input.posColor);
  const categories = record(color.categories);
  return {
    theme:
      THEMES.find(({ value }) => value === input.theme)?.value ??
      DEFAULT_SETTINGS.theme,
    fontFamily:
      FONT_OPTIONS.find(({ value }) => value === input.fontFamily)?.value ??
      DEFAULT_SETTINGS.fontFamily,
    fontSizeIndex:
      typeof input.fontSizeIndex === "number" &&
      Number.isInteger(input.fontSizeIndex) &&
      input.fontSizeIndex >= 0 &&
      input.fontSizeIndex < SIZE_SCALE.length
        ? input.fontSizeIndex
        : DEFAULT_SETTINGS.fontSizeIndex,
    lineSpacing:
      SPACING_OPTIONS.find(({ value }) => value === input.lineSpacing)?.value ??
      DEFAULT_SETTINGS.lineSpacing,
    showVerseNumbers:
      typeof input.showVerseNumbers === "boolean"
        ? input.showVerseNumbers
        : DEFAULT_SETTINGS.showVerseNumbers,
    posColor: {
      enabled: typeof color.enabled === "boolean" ? color.enabled : false,
      categories: Object.fromEntries(
        POS_CATEGORIES.map(({ key }) => [
          key,
          typeof categories[key] === "boolean" ? categories[key] : true,
        ]),
      ) as Record<PosCategory, boolean>,
    },
  };
}
/** Storage access, including obtaining localStorage, may throw in restricted browsers. */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* Settings still work in memory. */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* No persistent state to remove. */
    }
  },
};
interface SettingsState {
  settings: DisplaySettings;
  updateSettings: (patch: Partial<DisplaySettings>) => void;
  setCategory: (key: PosCategory, enabled: boolean) => void;
}
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: mergeSettings(undefined),
      updateSettings: (patch) =>
        set((state) => ({
          settings: mergeSettings({ ...state.settings, ...patch }),
        })),
      setCategory: (key, enabled) =>
        set((state) => ({
          settings: mergeSettings({
            ...state.settings,
            posColor: {
              ...state.settings.posColor,
              categories: {
                ...state.settings.posColor.categories,
                [key]: enabled,
              },
            },
          }),
        })),
    }),
    {
      name: DISPLAY_STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({ settings: state.settings }),
      merge: (persisted, current) => ({
        ...current,
        settings: mergeSettings(record(persisted).settings),
      }),
    },
  ),
);
