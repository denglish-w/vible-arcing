import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FIELD_LABELS, displayValue } from "@/lib/greek";

function Diamond({ className }) {
  return <span className={cn("inline-block h-2.5 w-2.5 rotate-45", className)} />;
}

function Row({ entry }) {
  const label = entry.field === "word" ? "Word" : FIELD_LABELS[entry.field];
  if (entry.status === "match") {
    const shown =
      entry.field === "word" ? entry.storedValue : displayValue(entry.field, entry.userValue);
    return (
      <div className="border-t border-amber-border/60 py-2">
        <div className="flex items-center justify-between">
          <span className="font-body text-sm text-amber-foreground/90">{label}</span>
          <span className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
            <Check className="h-3 w-3" /> Matches
          </span>
        </div>
        <div className="mt-1 font-display text-base text-foreground">
          {entry.field === "word" ? shown : <span className="font-body text-sm text-muted-foreground">{shown}</span>}
        </div>
      </div>
    );
  }
  const you = entry.field === "word" ? entry.userValue : displayValue(entry.field, entry.userValue);
  const stored = entry.field === "word" ? entry.storedValue : displayValue(entry.field, entry.storedValue);
  return (
    <div className="border-t border-amber-border/60 py-2">
      <div className="flex items-center justify-between">
        <span className="font-body text-sm font-semibold text-amber-foreground">{label}</span>
        <span className="flex items-center gap-1.5 font-body text-xs font-semibold text-amber-foreground">
          <Diamond className="bg-amber-foreground" /> Differs
        </span>
      </div>
      <div className="mt-1 font-body text-sm text-muted-foreground">
        You: {you} · Stored: {stored}
      </div>
    </div>
  );
}

// The result card shown after Check. Matched is a clean white card; Disputed
// is amber/tan (never red) so it reads as "debated", not as an error.
// When `inline` is set the card shows only the result (no action buttons): the
// bubble pins "Ignore" / "Next word" in its footer instead.
export default function ResultCard({ result, onNext, onIgnore, inline = false }) {
  if (result.result === "matched") {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground">
            <Check className="h-4 w-4 text-background" />
          </span>
          <span className="font-heading text-lg font-semibold text-foreground">Matched</span>
        </div>
        <p className="mt-2 font-body text-[15px] leading-relaxed text-foreground">
          {result.sourceParse}
        </p>
        {!inline && (
          <div className="mt-4 flex justify-end">
            <Button onClick={onNext} className="bg-primary text-primary-foreground">
              Next word
            </Button>
          </div>
        )}
      </div>
    );
  }

  const n = result.diffCount;
  const countLabel = n === 1 ? "1 field differs" : `${n} fields differ`;
  return (
    <div className="overflow-hidden rounded-lg border border-amber-border bg-amber">
      <div className="flex items-center justify-between bg-amber-border/30 px-4 py-2">
        <span className="flex items-center gap-2 font-heading text-base font-semibold text-amber-foreground">
          <Diamond className="bg-amber-foreground" /> Disputed
        </span>
        <span className="font-body text-xs text-amber-foreground/70">{countLabel}</span>
      </div>
      <div className="px-4 py-3">
        <p className="font-body text-sm text-amber-foreground/80">
          Your answer differs from the stored parse. Parsing is sometimes debated.
        </p>
        <div className="mt-2">
          {result.comparison.map((c, i) => (
            <Row key={i} entry={c} />
          ))}
        </div>
        <p className="mt-3 font-body text-sm text-amber-foreground">
          Stored parse: <span className="font-semibold">{result.sourceParse}</span>
        </p>
        {!inline && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onIgnore} className="bg-background">
              Ignore
            </Button>
            <Button onClick={onNext} className="bg-primary text-primary-foreground">
              Next word
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}