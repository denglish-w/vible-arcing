import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

// The previous/next chapter arrows + passage label, shared by the top bar
// (desktop) and the hamburger menu (narrow screens, under NAVIGATE).
export default function PassageArrows({ book, chapter }) {
  const prev = chapter > 1 ? chapter - 1 : null;
  const next = chapter < book.chapters ? chapter + 1 : null;
  return (
    <div className="flex items-center gap-2">
      {prev ? (
        <Link
          to="/read/$bookId/$chapter"
          params={{ bookId: book.id, chapter: String(prev) }}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-card"
          aria-label="Previous chapter"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      <span className="font-heading text-lg text-foreground tabular-nums">
        {book.name} {chapter}
      </span>
      {next ? (
        <Link
          to="/read/$bookId/$chapter"
          params={{ bookId: book.id, chapter: String(next) }}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-card"
          aria-label="Next chapter"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground/40">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}