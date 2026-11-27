// Downloads a saved analysis as a portable file (saved-work spec "Exporting an
// analysis"; app-server-and-sqlite design decisions 6 and 9). The file names
// the passage and edition and carries the document exactly as stored.
import { connection } from "next/server";
import { appDb, getWork } from "../../../../../db/server";
import { exportRefusal, refuse } from "../../../export-guards";

/** Identifies the file's layout, so a later import can recognise it. */
const EXPORT_FORMAT = "analysis-export";
const EXPORT_FORMAT_VERSION = 1;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  const refused = await exportRefusal(request);
  if (refused) return refused;
  const { id } = await params;
  const record = getWork(await appDb(), "analysis", id);
  if (!record) return refuse(404, "There is no saved analysis with that id.");

  const head = JSON.stringify({
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    kind: "analysis",
    title: record.title,
    passage: {
      book: record.book,
      label: record.passageLabel,
      startWordId: record.startWordId,
      endWordId: record.endWordId,
    },
    edition: record.edition,
    docVersion: record.docVersion,
    updatedAt: record.updatedAt.toISOString(),
  });
  // The stored document is spliced in as text, so it is exported byte for byte.
  const body = `${head.slice(0, -1)},"doc":${record.doc}}\n`;
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="analysis-${record.id}.json"`,
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
    },
  });
}
