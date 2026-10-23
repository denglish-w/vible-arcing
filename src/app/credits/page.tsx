import attribution from "../../../public/corpus/v1/attribution.json";
import { PageShell, LabelStrip } from "@/components/site-shell";
export default function CreditsPage() {
  return (
    <PageShell narrow>
      <LabelStrip left="Sources" right="SBLGNT · MACULA" />
      <h1>Credits &amp; Licences</h1>
      <p className="intro">
        The Greek text and linguistic data are made available through the work
        of the following publishers and contributors.
      </p>
      <div className="credits">
        {attribution.map((source) => (
          <section key={source.name}>
            <h2>
              <a href={source.url}>{source.name}</a>
            </h2>
            <p>{source.statement}</p>
            <p>
              {source.creator} ·{" "}
              <a href={source.licenseUrl}>{source.license}</a>
            </p>
            <p>
              {source.modified
                ? "Modified for this application: extracted and restructured into chapter files; only the published word and morphology fields are retained."
                : "Used without modification."}
            </p>
          </section>
        ))}
      </div>
      <p className="intro">
        This application is not affiliated with or endorsed by the publishers of
        any source.
      </p>
    </PageShell>
  );
}
