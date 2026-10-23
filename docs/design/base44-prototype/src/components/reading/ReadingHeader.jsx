import { Menu } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Logo from "@/components/Logo";
import AccountMenu from "./AccountMenu";
import ModeControl from "./ModeControl";
import PassageArrows from "./PassageArrows";
import TranslateToggle from "./TranslateToggle";
import ColorToggle from "./ColorToggle";

// The reading top bar. The hamburger (far left) holds the Display/Navigate/About
// menu; the Chi Rho logo links home; the passage arrows sit centered (desktop).
// Translate, Color, and English toggles sit left of the Reading/Learning control
// (and left of the avatar on narrow screens, where the mode control collapses
// into the menu). All toggles are always visible, signed in or not.
export default function ReadingHeader({
  book,
  chapter,
  mode,
  onModeChange,
  onOpenMenu,
  englishOn,
  onToggleEnglish,
  translateOn,
  onToggleTranslate,
}) {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-card"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo />
        <div className="flex flex-1 items-center justify-center">
          <div className="hidden md:block">
            <PassageArrows book={book} chapter={chapter} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TranslateToggle translateOn={translateOn} onToggle={onToggleTranslate} />
          <ColorToggle mode={mode} />
          <div className="flex items-center gap-2">
            <Switch
              checked={!!englishOn}
              onCheckedChange={onToggleEnglish}
              aria-label="Toggle English panel"
            />
            <span className="font-body text-sm text-foreground">English</span>
          </div>
        </div>
        <div className="hidden md:block">
          <ModeControl mode={mode} onModeChange={onModeChange} />
        </div>
        <AccountMenu />
      </div>
    </header>
  );
}