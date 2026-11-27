"use server";
// Learning mode (spec 010; contracts/server-actions.md). Every action checks the
// request's Host first, parses its input with zod and returns a typed result
// for every expected outcome; anything else throws, as in src/app/(work)/actions.ts.
// `checkParse` is the only way a word's source parsing reaches the browser in
// Learning mode (FR-020).
import "server-only";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { assertAllowedHost } from "../../lib/host";
import { MODE_COOKIE, type ReadingMode } from "../../lib/learning/mode";
import type { ParsingAnswer, RecordRefusal } from "../../lib/learning/types";
import {
  attemptDeps,
  checkAnswer,
  corpusOnlyDeps,
  isStoreUnavailable,
  recordAttempt as storeAttempt,
  type AttemptRefusal,
  type Checked,
} from "../../db/server";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type ModeResult =
  { ok: true; mode: ReadingMode } | { ok: false; reason: "invalid" };

export async function setReadingMode(mode: ReadingMode): Promise<ModeResult> {
  await assertAllowedHost();
  const parsed = z.enum(["reading", "learning"]).safeParse(mode);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  (await cookies()).set(MODE_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  // Switching to Learning reloads the document instead, so the Reading
  // render's payload is discarded (research R1).
  if (parsed.data === "reading") refresh();
  return { ok: true, mode: parsed.data };
}

export async function checkParse(
  answer: ParsingAnswer,
): Promise<Checked | AttemptRefusal> {
  await assertAllowedHost();
  // The corpus alone: checking does not need saved work.
  const { corpus } = await corpusOnlyDeps();
  return checkAnswer(corpus, answer);
}

export async function recordAttempt(attempt: {
  id: string;
  answer: ParsingAnswer;
}): Promise<{ ok: true } | AttemptRefusal | RecordRefusal> {
  await assertAllowedHost();
  try {
    return storeAttempt(await attemptDeps(), attempt);
  } catch (error) {
    // Retrying cannot fix these, so they are a refusal rather than a failure
    // the browser would keep retrying.
    if (isStoreUnavailable(error))
      return { ok: false, reason: "store-unavailable" };
    throw error;
  }
}
