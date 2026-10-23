import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  mergeSettings,
  safeStorage,
  useSettingsStore,
} from "./settings";

afterEach(() => {
  vi.unstubAllGlobals();
  useSettingsStore.setState({ settings: mergeSettings(undefined) });
});
describe("display settings", () => {
  it("returns defaults for missing, malformed and unknown settings", () => {
    for (const input of [
      undefined,
      null,
      "broken",
      [],
      42,
      {
        theme: "future",
        fontFamily: "unknown",
        fontSizeIndex: 5,
        lineSpacing: "huge",
        showVerseNumbers: "yes",
        posColor: { enabled: "true", categories: { verb: 0 } },
      },
    ])
      expect(mergeSettings(input)).toEqual(DEFAULT_SETTINGS);
  });
  it("validates each field while keeping valid choices and defaulting new categories", () => {
    expect(
      mergeSettings({
        theme: "sepia",
        fontFamily: FONT_OPTIONS[1].value,
        fontSizeIndex: 4,
        lineSpacing: "spacious",
        showVerseNumbers: false,
        posColor: { enabled: true, categories: { noun: false } },
      }),
    ).toMatchObject({
      theme: "sepia",
      fontFamily: FONT_OPTIONS[1].value,
      fontSizeIndex: 4,
      lineSpacing: "spacious",
      showVerseNumbers: false,
      posColor: { enabled: true, categories: { noun: false, verb: true } },
    });
    for (const fontSizeIndex of [-1, 2.5, NaN, Infinity])
      expect(mergeSettings({ fontSizeIndex }).fontSizeIndex).toBe(2);
  });
  it("does not share mutable categories between default settings", () => {
    const first = mergeSettings(null);
    first.posColor.categories.noun = false;
    expect(mergeSettings(null).posColor.categories.noun).toBe(true);
  });
  it("continues in memory when browser storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    });
    expect(safeStorage.getItem("test")).toBeNull();
    expect(() => safeStorage.setItem("test", "value")).not.toThrow();
    expect(() => safeStorage.removeItem("test")).not.toThrow();
    useSettingsStore.getState().updateSettings({ theme: "dark" });
    useSettingsStore.getState().setCategory("verb", false);
    expect(useSettingsStore.getState().settings).toMatchObject({
      theme: "dark",
      posColor: { categories: { verb: false, noun: true } },
    });
  });
  it("hydrates validated persisted fields and handles corrupt JSON", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({
          state: { settings: { theme: "dark", fontSizeIndex: 100 } },
          version: 0,
        }),
      setItem: vi.fn<(name: string, value: string) => void>(),
    });
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().settings).toMatchObject({
      theme: "dark",
      fontSizeIndex: 2,
    });
    vi.stubGlobal("localStorage", {
      getItem: () => "broken JSON",
      setItem: vi.fn<(name: string, value: string) => void>(),
    });
    await expect(useSettingsStore.persist.rehydrate()).resolves.toBeUndefined();
  });
});
