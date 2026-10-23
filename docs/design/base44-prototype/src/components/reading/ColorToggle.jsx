import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import MenuColorCategories from "./MenuColorCategories";

// Top-bar part-of-speech Color toggle. The switch enables coloring; when on
// (and not in Learning mode) a chevron opens the category chooser popover.
export default function ColorToggle({ mode }) {
  const { settings, update } = useStudySettings();
  const disabled = mode === "learning";
  const enabled = !!settings.posColor?.enabled;
  return (
    <div className="flex items-center gap-1.5">
      <Switch
        disabled={disabled}
        checked={enabled}
        onCheckedChange={(on) => update((s) => ({ posColor: { ...s.posColor, enabled: on } }))}
        aria-label="Toggle part-of-speech color"
      />
      <span
        className={
          disabled
            ? "font-body text-sm text-muted-foreground/50"
            : "font-body text-sm text-foreground"
        }
      >
        Color
      </span>
      {!disabled && enabled && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Color categories"
              className="text-muted-foreground hover:text-primary"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <MenuColorCategories />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}