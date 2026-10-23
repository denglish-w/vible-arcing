import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import ModeControl from "./ModeControl";
import PassageArrows from "./PassageArrows";
import MenuDisplay from "./MenuDisplay";

// The hamburger menu: slides in from the left over the reading view, with a
// dark-red top bar and a close ×. Holds the Display, Navigate, and About
// controls. Translate and Color live in the top bar; clicking the backdrop or
// pressing Esc (handled in the route) closes the menu.
export default function StudyMenu({ open, onClose, book, chapter, mode, onModeChange }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-r border-border bg-background shadow-xl">
        <div className="h-1 shrink-0 bg-primary" />
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <span className="small-caps">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-7">
            <section>
              <div className="small-caps mb-2.5">Display</div>
              <MenuDisplay />
            </section>

            <section>
              <div className="small-caps mb-2.5">Navigate</div>
              <div className="space-y-3">
                <Link
                  to="/"
                  onClick={onClose}
                  className="block font-body text-sm text-foreground hover:text-primary"
                >
                  All books
                </Link>
                <div className="md:hidden">
                  <ModeControl mode={mode} onModeChange={onModeChange} />
                  <div className="mt-3">
                    <PassageArrows book={book} chapter={chapter} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="small-caps mb-2.5">About</div>
              <div className="space-y-2">
                <Link
                  to="/credits"
                  onClick={onClose}
                  className="block font-body text-sm text-foreground hover:text-primary"
                >
                  Credits
                </Link>
                <Link
                  to="/privacy"
                  onClick={onClose}
                  className="block font-body text-sm text-foreground hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}