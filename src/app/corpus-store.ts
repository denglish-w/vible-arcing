import {
  corpusDb,
  DatabaseDamagedError,
  DatabaseMissingError,
} from "@/db/server";
import type { CorpusDb } from "@/db/client";

/**
 * Runs `read` against the corpus store. Returns null when the store has not
 * been seeded or cannot be read, so a page can say so instead of failing.
 * Call `await connection()` first so the read happens per request.
 */
export async function readCorpus<T>(
  read: (db: CorpusDb) => T,
): Promise<T | null> {
  try {
    return read(await corpusDb());
  } catch (error) {
    if (
      error instanceof DatabaseMissingError ||
      error instanceof DatabaseDamagedError
    )
      return null;
    throw error;
  }
}
