import { useRef } from "react";
import { StickyNote } from "lucide-react";
import PanelGreek from "./PanelGreek";
import AutoTextarea from "./AutoTextarea";
import { verseSegmentBrackets } from "@/lib/diaglot";
import { useStudySettings } from "@/components/study/StudySettingsProvider";
import { SIZE_SCALE } from "@/lib/study-defaults";
import { cn } from "@/lib/utils";

// One segment inside the panel's verse editor: a gutter label (21 / 21a), the
// ORIGINAL box (Greek with brackets + split controls), and the MY TRANSLATION
// box with the BSB underneath. Tab from the translation box moves focus to the
// notes field. Signed-out viewers see a sign-in prompt instead of the textarea.
export default function SegmentEditor({
  seg,
  brackets,
  bsbVerse,
  bsbVisible,
  showBsb,
  single,
  inline = false,
  splitting = false,
  onToggleSplit,
  isAuthenticated,
  onAddSplit,
  onBracketClick,
  onTranslationChange,
  onNotesChange,
  notesOpen,
  onToggleNotes,
  highlightBracketId,
}) {
  const { settings } = useStudySettings();
  const segBrackets = verseSegmentBrackets(brackets, seg.words);
  const hasNotes = false; // content check handled by parent list
  const notesRef = useRef(null);
  const bsbSize = (SIZE_SCALE[settings.fontSizeIndex] ?? SIZE_SCALE[2]) * 0.82;
  // Look up this segment's stored data from the parent via callbacks; we keep a
  // local focus helper for Tab-to-notes.
  const data = seg.data || { translation: "", notes: "" };

  function focusNotes() {
    onToggleNotes(true);
    setTimeout(() => notesRef.current?.focus(), 60);
  }

  // Inline (under the verse's own Greek): splitting happens on that Greek line
  // itself, so no second copy of the Greek is shown. A split verse still shows
  // each segment's Greek so the segments make sense.
  const canSplitInline = inline && isAuthenticated && showBsb;
  const showOriginal = !inline;
  const showGutter = !inline || !single;

  return (
    <div className={cn("grid gap-2", showGutter ? "grid-cols-[2rem_1fr]" : "grid-cols-1")}>
      {showGutter && (
        <div className="pt-2 text-right font-heading text-sm text-muted-foreground tabular-nums">
          {seg.label}
        </div>
      )}
      <div className="space-y-2">
        {showOriginal && (
          <div className="rounded-md border border-border p-2.5">
            <div className="small-caps mb-1">Original</div>
            <PanelGreek
              words={seg.words}
              brackets={segBrackets}
              onAddSplit={isAuthenticated ? onAddSplit : undefined}
              onBracketClick={onBracketClick}
              highlightBracketId={highlightBracketId}
              readOnly={!isAuthenticated}
            />
          </div>
        )}
        <div className="rounded-md border border-border p-2.5">
          <div className="mb-1 flex items-center justify-between">
            <div className="small-caps">My Translation</div>
            <div className="flex items-center gap-3">
              {canSplitInline && (
                <button
                  type="button"
                  onClick={onToggleSplit}
                  className={cn(
                    "rounded font-body text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground",
                    splitting && "text-primary"
                  )}
                >
                  Split
                </button>
              )}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => onToggleNotes()}
                  className={cn(
                    "inline-flex items-center gap-1 rounded font-body text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground",
                    notesOpen && "text-primary"
                  )}
                  aria-label="Notes for this segment"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          {isAuthenticated ? (
            <AutoTextarea
              value={data.translation || ""}
              onChange={onTranslationChange}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.shiftKey) {
                  e.preventDefault();
                  focusNotes();
                }
              }}
              placeholder="Write your own translation of this verse."
            />
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-2 font-body text-sm italic text-muted-foreground">
              Sign in to write and save your own translation.
            </div>
          )}
          {bsbVisible && showBsb && (
            <div
              className="mt-1.5 font-body italic text-muted-foreground/80"
              style={{ fontSize: `${bsbSize}rem` }}
            >
              {bsbVerse?.text ? bsbVerse.text : "Omitted in the BSB"}
            </div>
          )}
        </div>
        {notesOpen && isAuthenticated && (
          <div className="rounded-md border border-dashed border-border p-2.5">
            <div className="small-caps mb-1">{single ? "Notes on this verse" : "Notes"}</div>
            <AutoTextarea
              inputRef={notesRef}
              value={data.notes || ""}
              onChange={onNotesChange}
              placeholder="Notes…"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}