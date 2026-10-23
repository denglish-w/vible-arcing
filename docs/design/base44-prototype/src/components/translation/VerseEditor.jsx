import { Fragment, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import SegmentEditor from "./SegmentEditor";
import BracketEntry from "./BracketEntry";
import { buildSegments, joinText, joinNotes, canAddBracket, emptyAnnotation } from "@/lib/diaglot";

// The editor for one verse inside the Translate panel: stacked segment boxes
// (with merge seams), per-segment translation/notes, and the verse's bracket
// entry list. Owns the verse's annotation mutations; the panel persists them.
export default function VerseEditor({
  inline = false,
  verse,
  vwords,
  bsbVerse,
  bsbVisible,
  annotation,
  book,
  chapter,
  isAuthenticated,
  onMutate,
  focusBracket,
  onFocusBracket,
  splitting,
  onToggleSplit,
}) {
  const ann = annotation || emptyAnnotation(book.code, chapter, verse);
  const [notesOpen, setNotesOpen] = useState({});
  const segments = buildSegments(vwords, ann.splits, verse);
  // Attach each segment's stored data so SegmentEditor can render it.
  const segsWithData = segments.map((s) => ({ ...s, data: ann.segments[s.key] || { translation: "", notes: "" } }));

  function updateSeg(key, patch) {
    onMutate(verse, (a) => ({
      ...a,
      segments: { ...a.segments, [key]: { ...(a.segments[key] || { translation: "", notes: "" }), ...patch } },
    }));
  }
  function addSplit(wordNum) {
    onMutate(verse, (a) => {
      if ((a.brackets || []).some((b) => b.start <= wordNum && wordNum < b.end)) {
        toast.error("Can't split inside a bracket.");
        return a;
      }
      if ((a.splits || []).includes(wordNum)) return a;
      return {
        ...a,
        splits: [...(a.splits || []), wordNum].sort((x, y) => x - y),
        segments: { ...a.segments, [String(wordNum + 1)]: { translation: "", notes: "" } },
      };
    });
  }
  function mergeAt(i) {
    const segs = buildSegments(vwords, ann.splits, verse);
    const s1 = segs[i];
    const s2 = segs[i + 1];
    if (!s1 || !s2) return;
    const d1 = ann.segments[s1.key] || { translation: "", notes: "" };
    const d2 = ann.segments[s2.key] || { translation: "", notes: "" };
    const combining =
      ((d1.translation || "").trim() && (d2.translation || "").trim()) ||
      ((d1.notes || "").trim() && (d2.notes || "").trim());
    if (combining && !window.confirm("Merge these segments? Their translation and notes will be combined.")) return;
    const splitVal = s1.words[s1.words.length - 1].word_num;
    onMutate(verse, (a) => {
      const dd1 = a.segments[s1.key] || { translation: "", notes: "" };
      const dd2 = a.segments[s2.key] || { translation: "", notes: "" };
      const merged = { translation: joinText(dd1.translation, dd2.translation), notes: joinNotes(dd1.notes, dd2.notes) };
      const segments = { ...a.segments };
      delete segments[s2.key];
      segments[s1.key] = merged;
      return { ...a, splits: (a.splits || []).filter((x) => x !== splitVal), segments };
    });
  }
  function updateBracket(id, patch) {
    onMutate(verse, (a) => ({
      ...a,
      brackets: (a.brackets || []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }
  function deleteBracket(id) {
    onMutate(verse, (a) => ({ ...a, brackets: (a.brackets || []).filter((b) => b.id !== id) }));
  }
  function onBracketClick(b) {
    onFocusBracket?.({ verse, id: b.id });
  }

  const fbId = focusBracket && focusBracket.verse === verse ? focusBracket.id : null;
  const allBrackets = ann.brackets || [];
  const single = segsWithData.length === 1;

  return (
    <div className="space-y-2">
      {segsWithData.map((seg, i) => (
        <Fragment key={seg.key}>
          <SegmentEditor
            seg={seg}
            brackets={allBrackets}
            bsbVerse={i === 0 ? bsbVerse : null}
            bsbVisible={bsbVisible}
            showBsb={i === 0}
            single={single}
            inline={inline}
            splitting={splitting}
            onToggleSplit={onToggleSplit}
            isAuthenticated={isAuthenticated}
            onAddSplit={addSplit}
            onBracketClick={onBracketClick}
            onTranslationChange={(v) => updateSeg(seg.key, { translation: v })}
            onNotesChange={(v) => updateSeg(seg.key, { notes: v })}
            notesOpen={!!notesOpen[seg.key]}
            onToggleNotes={(v) => setNotesOpen((p) => ({ ...p, [seg.key]: v == null ? !p[seg.key] : v }))}
            highlightBracketId={fbId}
          />
          {i < segsWithData.length - 1 && (
            <div className="flex items-center gap-2 py-1 pl-[2rem]">
              <button
                type="button"
                onClick={() => mergeAt(i)}
                aria-label="Merge segments"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="font-body text-[10px] uppercase tracking-wide text-muted-foreground">merge</span>
            </div>
          )}
        </Fragment>
      ))}
      {allBrackets.length > 0 && (
        <div className="pt-2">
          <div className="small-caps mb-1.5">Brackets</div>
          <div className="space-y-2">
            {allBrackets.map((b) => (
              <BracketEntry
                key={b.id}
                bracket={b}
                words={vwords}
                onUpdate={(p) => updateBracket(b.id, p)}
                onDelete={() => deleteBracket(b.id)}
                onJump={() => onFocusBracket?.({ verse, id: b.id })}
                highlight={fbId === b.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}