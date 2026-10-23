import { cn } from "@/lib/utils";

// The Reading / Learning segmented control, shared by the top bar (desktop) and
// the hamburger menu (narrow screens, under NAVIGATE).
export default function ModeControl({ mode, onModeChange }) {
  return (
    <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => onModeChange("reading")}
        aria-pressed={mode === "reading"}
        className={cn(
          "h-8 rounded-[5px] px-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
          mode === "reading" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Reading
      </button>
      <button
        type="button"
        onClick={() => onModeChange("learning")}
        aria-pressed={mode === "learning"}
        className={cn(
          "h-8 rounded-[5px] px-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
          mode === "learning" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Learning
      </button>
      <button
        type="button"
        onClick={() => onModeChange("diagramming")}
        aria-pressed={mode === "diagramming"}
        className={cn(
          "h-8 rounded-[5px] px-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
          mode === "diagramming" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        Diagramming
      </button>
    </div>
  );
}