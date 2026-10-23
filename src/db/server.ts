// The only entry point Next code uses for the databases. `server-only` makes a
// build fail if a client component imports it. Scripts and tests import the
// modules it re-exports directly (see src/db/README.md).
//
// Every getter checks the request's Host first (design decision 9), so a page,
// action or route handler cannot reach saved work for a host the proxy should
// have refused, even if the proxy is skipped.
import "server-only";
import { assertAllowedHost } from "../lib/host";
import { getAppDb, getCorpusDb, type AppDb, type CorpusDb } from "./client.ts";

export { DatabaseDamagedError, DatabaseMissingError } from "./client.ts";
export { HostNotAllowedError } from "../lib/host";

export async function appDb(): Promise<AppDb> {
  await assertAllowedHost();
  return getAppDb();
}

export async function corpusDb(): Promise<CorpusDb> {
  await assertAllowedHost();
  return getCorpusDb();
}
