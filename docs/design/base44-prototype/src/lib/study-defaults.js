// Defaults and option lists for the study display settings (theme, size, font,
// spacing, verse numbers, part-of-speech color). Kept separate from the React
// provider so server code can import the defaults without pulling in JSX.

import { POS_CATEGORIES } from "./pos";

// Greek font choices — all serif with full polytonic Greek support. `value` is
// the CSS font-family stack; the option label is rendered in its own face in
// the settings popover.
export const FONT_OPTIONS = [
  { label: "EB Garamond", value: "'EB Garamond', serif" },
  { label: "Gentium Plus", value: "'Gentium Plus', serif" },
  { label: "Cardo", value: "Cardo, serif" },
  { label: "GFS Didot", value: "'GFS Didot', serif" },
];

export const FONT_DEFAULT = "'EB Garamond', serif";

// Greek text size, as a slider index into SIZE_SCALE (rem). Default index 2
// matches the original md:text-[1.7rem].
export const SIZE_SCALE = [1.25, 1.5, 1.7, 1.95, 2.25];
export const SIZE_LABELS = ["Small", "Medium", "Large", "X-Large", "XX-Large"];
export const SIZE_DEFAULT_INDEX = 2;

export const SPACING = { compact: 1.7, comfortable: 2.1, spacious: 2.6 };
export const SPACING_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "sepia", label: "Sepia" },
];

export function defaultCategories() {
  const o = {};
  for (const c of POS_CATEGORIES) o[c.key] = true;
  return o;
}

export const DEFAULT_SETTINGS = {
  theme: "light",
  fontSizeIndex: SIZE_DEFAULT_INDEX,
  fontFamily: FONT_DEFAULT,
  lineSpacing: "comfortable",
  showVerseNumbers: true,
  translate: false,
  showBsb: false,
  english: false,
  posColor: { enabled: false, categories: null },
};

// Merge a stored blob (from the user record or localStorage) onto defaults so
// new fields always have a value even if an older saved blob lacks them.
export function mergeSettings(stored) {
  const s = stored || {};
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    posColor: {
      enabled: !!(s.posColor && s.posColor.enabled),
      categories: (s.posColor && s.posColor.categories) || defaultCategories(),
    },
  };
}