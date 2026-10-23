import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { greekPhrase } from "@/lib/diaglot";
import { cn } from "@/lib/utils";

// One bracket entry in the panel's bracket list: the bracketed Greek (click to
// jump to and highlight the bracket in the reading card), a "my rendering"
// field, a note field, and a delete action. Fields save on blur.
export default function BracketEntry({ bracket, words, onUpdate, onDelete, onJump, highlight }) {
  const [rendering, setRendering] = useState(bracket.rendering || "");
  const [note, setNote] = useState(bracket.note || "");
  const ref = useRef(null);

  useEffect(() => {
    if (highlight && ref.current) ref.current.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  return (
    <div ref={ref} className={cn("rounded-md border border-border p-2.5", highlight && "ring-2 ring-primary")}>
      <button type="button" onClick={onJump} className="block w-full text-left">
        <span className="font-heading text-base text-primary">[</span>
        <span className="font-heading text-base text-foreground">
          {greekPhrase(words, bracket.start, bracket.end)}
        </span>
        <span className="font-heading text-base text-primary">]</span>
      </button>
      <Input
        value={rendering}
        onChange={(e) => setRendering(e.target.value)}
        onBlur={() => onUpdate({ rendering })}
        placeholder="My rendering of this phrase"
        className="mt-2 font-body text-sm"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => onUpdate({ note })}
        placeholder="Note"
        rows={2}
        className="mt-2 w-full rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="mt-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={onDelete}>
          Delete bracket
        </Button>
      </div>
    </div>
  );
}