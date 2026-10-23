// The only entry point Next code uses for the databases. `server-only` makes a
// build fail if a client component imports it. Scripts and tests import the
// modules it re-exports directly (see src/db/README.md).
import "server-only";

export {
  DatabaseDamagedError,
  DatabaseMissingError,
  getAppDb,
  getCorpusDb,
} from "./client.ts";
