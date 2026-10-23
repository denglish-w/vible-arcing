import { Switch } from "@/components/ui/switch";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import { FONT_OPTIONS, SIZE_SCALE, SIZE_LABELS, SPACING_OPTIONS, THEMES } from "@/lib/study-defaults";
import { cn } from "@/lib/utils";

// The DISPLAY section of the hamburger menu: text size (with live preview),
// Greek font, line spacing, verse numbers, theme, and reset. Bound directly to
// the study settings, so changes apply instantly and persist across devices.
export default function MenuDisplay() {
  const { settings, update, reset } = useStudySettings();
  const sizeRem = SIZE_SCALE[settings.fontSizeIndex] ?? SIZE_SCALE[2];
  return (
    <div className="space-y-5">
      <div>
        <div className="small-caps mb-1.5">Text size</div>
        <input
          type="range"
          min={0}
          max={SIZE_SCALE.length - 1}
          step={1}
          value={settings.fontSizeIndex}
          onChange={(e) => update({ fontSizeIndex: Number(e.target.value) })}
          className="w-full accent-[hsl(var(--primary))]"
        />
        <div className="mt-0.5 flex justify-between">
          <span className="font-body text-[10px] text-muted-foreground">{SIZE_LABELS[0]}</span>
          <span className="font-body text-[10px] text-muted-foreground">
            {SIZE_LABELS[SIZE_LABELS.length - 1]}
          </span>
        </div>
        <div
          className="mt-2 rounded border border-border bg-card px-3 py-2 text-foreground"
          style={{ fontFamily: settings.fontFamily, fontSize: `${sizeRem}rem`, lineHeight: 1.5 }}
        >
          ἐν ἀρχῇ ἦν ὁ λόγος
        </div>
      </div>

      <div>
        <div className="small-caps mb-1.5">Greek font</div>
        <div className="grid grid-cols-2 gap-1.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => update({ fontFamily: f.value })}
              className={cn(
                "rounded-md border px-2 py-1.5 text-foreground transition-colors",
                settings.fontFamily === f.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
              )}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="small-caps mb-1.5">Line spacing</div>
        <div className="flex gap-1.5">
          {SPACING_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => update({ lineSpacing: s.value })}
              className={cn(
                "flex-1 rounded-md border px-2 py-1 font-body text-xs transition-colors",
                settings.lineSpacing === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-body text-sm text-foreground">Verse numbers</span>
        <Switch
          checked={!!settings.showVerseNumbers}
          onCheckedChange={(on) => update({ showVerseNumbers: on })}
        />
      </div>

      <div>
        <div className="small-caps mb-1.5">Theme</div>
        <div className="flex gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => update({ theme: t.value })}
              className={cn(
                "flex-1 rounded-md border px-2 py-1 font-body text-xs capitalize transition-colors",
                settings.theme === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        className="w-full rounded-md border border-border py-1.5 font-body text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Reset to defaults
      </button>
    </div>
  );
}