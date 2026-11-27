// Which mode the reading screen is in (spec 010 FR-003; research R2). Decided on
// the server from a cookie, so a Learning render never carries the answers.

export const MODE_COOKIE = "vible.mode";

export type ReadingMode = "reading" | "learning";

/** Missing or any other value means Reading. */
export function parseMode(value: string | undefined): ReadingMode {
  return value === "learning" ? "learning" : "reading";
}
