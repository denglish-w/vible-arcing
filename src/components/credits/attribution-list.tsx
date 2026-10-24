// The datasets to credit, with licence, attribution and what was changed
// (corpus-store spec "Attribution held with the corpus"; design decision 8).
// Presentational: /credits reads the entries from the corpus store.

export type AttributionEntry = {
  name: string;
  creator: string;
  license: string;
  licenseUrl: string;
  statement: string;
  modified: boolean;
  modifications: string;
  url: string;
};

export const NON_AFFILIATION =
  "This application is not affiliated with or endorsed by the publishers of any source.";

export function AttributionList({ entries }: { entries: AttributionEntry[] }) {
  return (
    <div className="credits">
      {entries.map((entry) => (
        <section key={entry.name}>
          <h2>
            <a href={entry.url}>{entry.name}</a>
          </h2>
          <p>{entry.statement}</p>
          <p>
            {entry.creator} · <a href={entry.licenseUrl}>{entry.license}</a>
          </p>
          <p>
            {entry.modified
              ? `Modified for this application: ${entry.modifications}`
              : "Used without modification."}
          </p>
        </section>
      ))}
    </div>
  );
}
