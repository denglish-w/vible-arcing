import type { Metadata } from "next";
import { connection } from "next/server";
import { PageShell, LabelStrip } from "../../../components/site-shell";
import { WorkList } from "../../../components/work/work-list";
import { appDb, listWork } from "../../../db/server";
import { deleteAnalysis, deleteDiagram } from "../actions";

export const metadata: Metadata = { title: "Saved work" };

export default async function WorkPage() {
  // Read per request, so work saved after the build is listed.
  await connection();
  const items = listWork(await appDb());
  return (
    <PageShell narrow>
      <LabelStrip left="Saved work" right={`${items.length} saved`} />
      <h1>Saved work</h1>
      <p className="intro">
        Your analyses and diagrams, most recently changed first. They are stored
        on this computer.
      </p>
      <WorkList
        items={items}
        onDelete={{ analysis: deleteAnalysis, diagram: deleteDiagram }}
      />
    </PageShell>
  );
}
