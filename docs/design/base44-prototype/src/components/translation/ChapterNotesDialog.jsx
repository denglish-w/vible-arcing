import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buildSegments, greekPhrase } from "@/lib/diaglot";

function verseHasContent(ann) {
  if (!ann) return false;
  if ((ann.brackets || []).length) return true;
  return Object.values(ann.segments || {}).some(
    (s) => (s.translation || "").trim() || (s.notes || "").trim()
  );
}

function buildMarkdown(book, chapter, verses, annotations) {
  let md = `# ${book.name} ${chapter}\n\n`;
  for (const [verse, vwords] of verses) {
    const ann = annotations[verse];
    if (!verseHasContent(ann)) continue;
    const segs = buildSegments(vwords, ann.splits, verse);
    const greek = vwords.map((w) => w.text + (w.after || "")).join(" ");
    const translation = segs
      .map((s) => (ann.segments[s.key]?.translation || "").trim())
      .filter(Boolean)
      .join(" ");
    const notes = segs
      .map((s) => {
        const n = (ann.segments[s.key]?.notes || "").trim();
        return n ? `${s.label}: ${n}` : "";
      })
      .filter(Boolean)
      .join("\n");
    md += `## ${verse}\n\n`;
    md += `**Greek:** ${greek}\n\n`;
    if (translation) md += `**Translation:** ${translation}\n\n`;
    const brs = ann.brackets || [];
    if (brs.length) {
      md += `**Brackets:**\n`;
      for (const b of brs) {
        const ph = greekPhrase(vwords, b.start, b.end);
        md += `- ${ph}` + (b.rendering ? ` — ${b.rendering}` : "") + (b.note ? ` (*${b.note}*)` : "") + `\n`;
      }
      md += `\n`;
    }
    if (notes) md += `**Notes:**\n${notes}\n\n`;
    md += `---\n\n`;
  }
  return md;
}

// A read-only list of every verse in the chapter that has a translation,
// brackets, or notes, with an "Export chapter" button that downloads Markdown.
export default function ChapterNotesDialog({ open, onOpenChange, book, chapter, words, annotations, verses }) {
  const items = verses.filter(([verse]) => verseHasContent(annotations[verse]));

  function exportMd() {
    const md = buildMarkdown(book, chapter, verses, annotations);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.id}-${chapter}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {book.name} {chapter} — Notes
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportMd}>
            Export chapter
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="py-6 text-center font-body text-sm text-muted-foreground">
            No translations, brackets, or notes yet.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map(([verse, vwords]) => {
              const ann = annotations[verse];
              const segs = buildSegments(vwords, ann.splits, verse);
              const greek = vwords.map((w) => w.text + (w.after || "")).join(" ");
              const translation = segs
                .map((s) => (ann.segments[s.key]?.translation || "").trim())
                .filter(Boolean)
                .join(" ");
              const notes = segs
                .map((s) => (ann.segments[s.key]?.notes || "").trim())
                .filter(Boolean)
                .join("\n");
              return (
                <div key={verse} className="rounded-md border border-border p-3">
                  <div className="font-body text-xs uppercase tracking-wide text-muted-foreground">
                    {book.name} {chapter}:{verse}
                  </div>
                  <div className="mt-1 font-heading text-lg text-foreground">{greek}</div>
                  {translation && (
                    <div className="mt-1 font-body text-sm text-foreground/90">{translation}</div>
                  )}
                  {(ann.brackets || []).map((b) => (
                    <div key={b.id} className="mt-1 font-body text-xs text-muted-foreground">
                      [{greekPhrase(vwords, b.start, b.end)}]
                      {b.rendering ? ` — ${b.rendering}` : ""}
                      {b.note ? ` · ${b.note}` : ""}
                    </div>
                  ))}
                  {notes && (
                    <div className="mt-1 whitespace-pre-wrap font-body text-xs text-muted-foreground">
                      {notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}