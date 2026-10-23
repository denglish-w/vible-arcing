import { Switch } from "@/components/ui/switch";

// Top-bar Translate toggle: shows/hides the translation side panel. The panel
// itself prompts for sign-in when needed, so the toggle stays simple.
export default function TranslateToggle({ translateOn, onToggle }) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={!!translateOn}
        onCheckedChange={onToggle}
        aria-label="Toggle Translate panel"
      />
      <span className="font-body text-sm text-foreground">Translate</span>
    </div>
  );
}