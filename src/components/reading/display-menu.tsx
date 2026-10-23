"use client";
import { SlidersHorizontal, X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  SIZE_SCALE,
  SIZE_LABELS,
  SPACING_OPTIONS,
  THEMES,
  useSettingsStore,
} from "@/lib/settings";
import { POS_CATEGORIES, categoryStyle } from "@/lib/pos";
export function DisplayMenu() {
  const { settings, updateSettings, setCategory } = useSettingsStore();
  const id = useId();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button aria-label="Display settings">
          <SlidersHorizontal size={16} />
          <span>Display</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Display settings">
        <div className="popover-heading">
          <span className="small-caps">Display</span>
          <PopoverClose asChild>
            <Button aria-label="Close display settings">
              <X size={16} />
            </Button>
          </PopoverClose>
        </div>
        <fieldset className="display-section">
          <legend className="small-caps">Text size</legend>
          <label htmlFor={`${id}-size`}>
            {SIZE_LABELS[settings.fontSizeIndex]}
          </label>
          <input
            id={`${id}-size`}
            className="size-slider"
            type="range"
            min="0"
            max="4"
            step="1"
            value={settings.fontSizeIndex}
            onChange={(event) =>
              updateSettings({ fontSizeIndex: Number(event.target.value) })
            }
          />
          <div
            lang="grc"
            className="font-preview"
            style={{
              fontFamily: settings.fontFamily,
              fontSize: `${SIZE_SCALE[settings.fontSizeIndex]}rem`,
            }}
          >
            ἐν ἀρχῇ ἦν ὁ λόγος
          </div>
        </fieldset>
        <fieldset className="display-section">
          <legend className="small-caps">Greek typeface</legend>
          <div className="chips font-chips">
            {FONT_OPTIONS.map((option) => (
              <button
                type="button"
                className="chip"
                key={option.value}
                style={{ fontFamily: option.value }}
                aria-pressed={settings.fontFamily === option.value}
                onClick={() => updateSettings({ fontFamily: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="display-section">
          <legend className="small-caps">Line spacing</legend>
          <div className="chips">
            {SPACING_OPTIONS.map((option) => (
              <button
                type="button"
                className="chip"
                key={option.value}
                aria-pressed={settings.lineSpacing === option.value}
                onClick={() => updateSettings({ lineSpacing: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="setting-row">
          <label htmlFor={`${id}-verses`}>Verse numbers</label>
          <Switch
            id={`${id}-verses`}
            checked={settings.showVerseNumbers}
            onCheckedChange={(showVerseNumbers) =>
              updateSettings({ showVerseNumbers })
            }
          />
        </div>
        <fieldset className="display-section">
          <legend className="small-caps">Theme</legend>
          <div className="chips">
            {THEMES.map((option) => (
              <button
                type="button"
                className="chip"
                key={option.value}
                aria-pressed={settings.theme === option.value}
                onClick={() => updateSettings({ theme: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="display-section">
          <legend className="small-caps">Part-of-speech colouring</legend>
          <div className="setting-row">
            <label htmlFor={`${id}-color`}>Colour words</label>
            <Switch
              id={`${id}-color`}
              checked={settings.posColor.enabled}
              onCheckedChange={(enabled) =>
                updateSettings({ posColor: { ...settings.posColor, enabled } })
              }
            />
          </div>
          {POS_CATEGORIES.map((category) => (
            <div key={category.key} className="setting-row">
              <label
                htmlFor={`${id}-${category.key}`}
                style={
                  settings.posColor.enabled
                    ? categoryStyle(category.key)
                    : undefined
                }
              >
                {category.label}
              </label>
              <Switch
                id={`${id}-${category.key}`}
                checked={settings.posColor.categories[category.key]}
                onCheckedChange={(enabled) =>
                  setCategory(category.key, enabled)
                }
              />
            </div>
          ))}
        </fieldset>
        <Button
          className="reset-settings"
          onClick={() => updateSettings(DEFAULT_SETTINGS)}
        >
          Reset to defaults
        </Button>
      </PopoverContent>
    </Popover>
  );
}
