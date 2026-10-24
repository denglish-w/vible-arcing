// Shown at /analysis/[id] and /diagram/[id] until each editor lands, so saved
// work can be reopened now (app-server-and-sqlite design decision 8).
import Link from "next/link";
import { LabelStrip, PageShell } from "@/components/site-shell";
import type { WorkListItem } from "./work-list";

const KIND = {
  analysis: { label: "Analysis", editor: "arcing and bracketing editor" },
  diagram: { label: "Diagram", editor: "diagramming editor" },
} as const;

export function WorkPlaceholder({ item }: { item: WorkListItem }) {
  const kind = KIND[item.kind];
  return (
    <PageShell narrow>
      <LabelStrip left={kind.label} right={item.passageLabel} />
      <h1>{item.title || "Untitled"}</h1>
      <p className="intro">
        {item.passageLabel} · last changed{" "}
        <time dateTime={item.updatedAt.toISOString()}>
          {item.updatedAt.toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </p>
      <p>
        This {kind.label.toLowerCase()} is saved. It will open here once the{" "}
        {kind.editor} is built.
      </p>
      <p className="work-actions">
        {item.kind === "analysis" && (
          <a
            className="button"
            href={`/api/analyses/${item.id}/export`}
            download
          >
            Download as a file
          </a>
        )}
        <Link className="button" href="/work">
          All saved work
        </Link>
      </p>
    </PageShell>
  );
}
