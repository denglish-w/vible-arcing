// Downloads a saved analysis as a portable file (saved-work spec "Exporting an
// analysis"; app-server-and-sqlite design decisions 6 and 9). The file names
// the passage and edition and carries the document exactly as stored.
import { headers } from "next/headers";
import { connection } from "next/server";
import { appDb, getWork } from "../../../../../db/server";
import {
  assertAllowedHost,
  HostNotAllowedError,
} from "../../../../../lib/host";

/** Identifies the file's layout, so a later import can recognise it. */
const EXPORT_FORMAT = "analysis-export";
const EXPORT_FORMAT_VERSION = 1;

const refuse = (status: number, message: string) =>
  new Response(`${message}\n`, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });

/**
 * Route handlers have no Origin check of their own, so a page on another local
 * port could otherwise request this one. A browser sends Origin on cross-origin
 * requests but not on a same-origin link click, so a request passes when its
 * Origin is this server, or when it has none and the browser marks it as
 * same-origin or typed by the user.
 */
function fromThisOrigin(request: Request, host: string | null): boolean {
  const origin = request.headers.get("origin");
  if (origin !== null) {
    try {
      return host !== null && new URL(origin).host === host.toLowerCase();
    } catch {
      return false;
    }
  }
  const site = request.headers.get("sec-fetch-site");
  return site === "same-origin" || site === "none";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();
  try {
    await assertAllowedHost();
  } catch (error) {
    if (error instanceof HostNotAllowedError) return refuse(403, error.message);
    throw error;
  }
  if (!fromThisOrigin(request, (await headers()).get("host")))
    return refuse(403, "Exports can only be requested from this app.");
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
