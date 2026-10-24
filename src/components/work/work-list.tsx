// The list of saved analyses and diagrams (saved-work spec "Listing, reopening
// and deleting work"). Presentational: records and delete functions come in as
// props, so it renders in Storybook without the database. On /work the delete
// functions are server actions.
import Link from "next/link";
import { DeleteConfirm } from "./delete-confirm";

export type WorkListItem = {
  kind: "analysis" | "diagram";
  id: string;
  title: string;
  passageLabel: string;
  updatedAt: Date;
};

export type DeleteFunctions = Record<
  WorkListItem["kind"],
  (id: string) => Promise<unknown>
>;

const KIND_LABEL = { analysis: "Analysis", diagram: "Diagram" } as const;

const modified = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function WorkList({
  items,
  onDelete,
}: {
  /** Newest first, as listWork returns them. */
  items: WorkListItem[];
  onDelete: DeleteFunctions;
}) {
  if (items.length === 0)
    return (
      <p className="work-empty">
        Nothing is saved yet. Analyses and diagrams appear here once you start
        one.
      </p>
    );
  return (
    <ul className="work-list">
      {items.map((item) => (
        <li className="work-row" key={`${item.kind}/${item.id}`}>
          <div className="work-summary">
            <Link className="work-title" href={`/${item.kind}/${item.id}`}>
              {item.title || "Untitled"}
            </Link>
            <p className="work-meta">
              <span className="small-caps">{KIND_LABEL[item.kind]}</span>
              <span>{item.passageLabel}</span>
              <time dateTime={item.updatedAt.toISOString()}>
                Modified {modified.format(item.updatedAt)}
              </time>
            </p>
          </div>
          <DeleteConfirm
            title={item.title || "Untitled"}
            kind={item.kind}
            onConfirm={onDelete[item.kind].bind(null, item.id)}
          />
        </li>
      ))}
    </ul>
  );
}
