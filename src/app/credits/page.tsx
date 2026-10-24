import { connection } from "next/server";
import { PageShell, LabelStrip } from "@/components/site-shell";
import {
  AttributionList,
  NON_AFFILIATION,
} from "@/components/credits/attribution-list";
import { getAttribution } from "@/db/server";
import { readCorpus } from "../corpus-store";
import { committedAttribution } from "@/components/credits/committed-attribution";
import { TAXONOMY_CREDIT } from "@/lib/analysis/taxonomy";

// Attribution comes from the corpus store, which ingest fills from the same
// output as the text, so the credits cannot drift from the data shipped. When
// the store is missing or damaged, the committed ingest attribution is shown
// instead so the licence notices are never absent.
export default async function CreditsPage() {
  await connection();
  const stored = await readCorpus(getAttribution);
  const entries = stored ?? committedAttribution();
  return (
    <PageShell narrow>
      <LabelStrip left="Sources" right="SBLGNT · MACULA" />
      <h1>Credits &amp; Licences</h1>
      <p className="intro">
        The Greek text and linguistic data are made available through the work
        of the following publishers and contributors.
      </p>
      <AttributionList entries={entries} />
      {!stored && (
        <p role="note">
          The Greek text is not installed on this server, so these notices come
          from the copy shipped with the application. Run{" "}
          <code>npm run db:seed</code> to install it.
        </p>
      )}
      <div className="credits">
        <section>
          <h2>Method</h2>
          <p>{TAXONOMY_CREDIT}</p>
        </section>
      </div>
      <p className="intro">{NON_AFFILIATION}</p>
    </PageShell>
  );
}
