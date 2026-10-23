"use client";
import { POS_CATEGORIES, categoryStyle } from "@/lib/pos";
import { useSettingsStore } from "@/lib/settings";

export function PosLegend() {
  const posColor = useSettingsStore((state) => state.settings.posColor);
  if (!posColor.enabled) return null;
  return (
    <div className="legend" aria-label="Part-of-speech legend">
      {POS_CATEGORIES.filter(
        (category) => posColor.categories[category.key],
      ).map((category) => (
        <span key={category.key} style={categoryStyle(category.key)}>
          {category.label}
        </span>
      ))}
    </div>
  );
}
