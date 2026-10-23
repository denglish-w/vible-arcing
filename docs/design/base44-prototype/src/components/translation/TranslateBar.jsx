import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ChapterNotesDialog from "./ChapterNotesDialog";
import { groupByVerse } from "@/lib/diaglot";
import { useStudySettings } from "@/components/study/StudySettingsProvider";

function SaveIndicator({ status }) {
  if (status === "saving") return <span className="font-body text-[11px] text-muted-foreground">Saving…</span>;
  if (status === "saved") return <span className="font-body text-[11px] text-primary">Saved</span>;
  return null;
}

// The slim bar above the Greek text while Translate is on: autosave status, the
// BSB-under-my-translation switch, and the chapter Notes / export dialog. These
// used to live in the side panel header.
export default function TranslateBar({ book, chapter, words, annotations, saveStatus, isAuthenticated, onSignIn }) {
  const { settings, update } = useStudySettings();
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="small-caps">Translate</span>
        <SaveIndicator status={saveStatus} />
        {!isAuthenticated && (
          <span className="font-body text-sm text-amber-foreground">
            <button type="button" onClick={onSignIn} className="underline underline-offset-2 hover:text-primary">
              Sign in
            </button>{" "}
            to write and save your own translation.
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span className="font-body text-[11px] text-muted-foreground">BSB</span>
          <Switch checked={!!settings.showBsb} onCheckedChange={(on) => update({ showBsb: on })} />
        </label>
        <Button variant="outline" size="sm" onClick={() => setNotesOpen(true)}>
          Notes
        </Button>
      </div>
      <ChapterNotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        book={book}
        chapter={chapter}
        words={words}
        annotations={annotations}
        verses={groupByVerse(words)}
      />
    </div>
  );
}