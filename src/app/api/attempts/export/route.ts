// Downloads every parsing-practice attempt as a file (spec 010 FR-028;
// data-model "Export file"). Same host and same-origin checks as the analysis
// export.
import { connection } from "next/server";
import {
  appDb,
  DatabaseDamagedError,
  DatabaseMissingError,
  listAttempts,
  type StoredAttempt,
} from "../../../../db/server";
import { getBook } from "../../../../lib/books";
import { exportRefusal, refuse } from "../../export-guards";

const EXPORT_FORMAT = "parse-attempts-export";
const EXPORT_FORMAT_VERSION = 1;

const reference = (a: StoredAttempt) =>
  `${getBook(a.book)?.name ?? a.book} ${a.chapter}:${a.verse}`;

export async function GET(request: Request) {
  await connection();
  const refused = await exportRefusal(request);
  if (refused) return refused;
  let attempts: StoredAttempt[];
  try {
    attempts = listAttempts(await appDb());
  } catch (error) {
    if (
      error instanceof DatabaseMissingError ||
      error instanceof DatabaseDamagedError
    )
      return refuse(503, error.message);
    throw error;
  }
  const now = new Date();
  const body = JSON.stringify({
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    edition: "SBLGNT",
    exportedAt: now.toISOString(),
    attempts: attempts.map((a) => ({
      id: a.id,
      wordId: a.wordId,
      reference: reference(a),
      surface: a.surface,
      edition: a.edition,
      checkedAt: a.checkedAt.toISOString(),
      answer: a.answer,
      source: a.source,
      comparisons: a.comparisons,
      allAgreed: a.allAgreed,
    })),
  });
  return new Response(`${body}\n`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="parse-attempts-${now.toISOString().slice(0, 10)}.json"`,
      "x-content-type-options": "nosniff",
      "cache-control": "no-store",
    },
  });
}
