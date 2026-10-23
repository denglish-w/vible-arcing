import { useStudySettings } from "@/components/study/StudySettingsProvider";
import { POS_CATEGORIES, legendSwatchStyle } from "@/lib/pos";

// The legend + per-category checkboxes revealed by "Choose categories…" in the
// hamburger menu. Same rows as the old Color popover, bound to the same study
// settings so the two never disagree.
export default function MenuColorCategories() {
  const { settings, update } = useStudySettings();
  const cats = settings.posColor.categories || {};
  function toggle(key, on) {
    update((s) => ({
      posColor: { ...s.posColor, categories: { ...s.posColor.categories, [key]: on } },
    }));
  }
  return (
    <div className="mt-2 space-y-1.5 rounded-md border border-border bg-card p-2">
      {POS_CATEGORIES.map((c) => (
        <label
          key={c.key}
          className="flex items-center gap-2.5 rounded px-1 py-0.5 hover:bg-muted/40"
        >
          <input
            type="checkbox"
            checked={!!cats[c.key]}
            onChange={(e) => toggle(c.key, e.target.checked)}
            className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
          />
          <span
            className="w-16 shrink-0 text-center font-heading text-base"
            style={legendSwatchStyle(c.key)}
          >
            λογος
          </span>
          <span className="font-body text-xs text-foreground/90">{c.label}</span>
        </label>
      ))}
    </div>
  );
}