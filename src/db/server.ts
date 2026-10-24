// The only entry point Next code uses for the databases. `server-only` makes a
// build fail if a client component imports it. Scripts and tests import the
// modules it re-exports directly (see src/db/README.md).
//
// Every getter checks the request's Host first (design decision 9), so a page,
// action or route handler cannot reach saved work for a host the proxy should
// have refused, even if the proxy is skipped.
import "server-only";
import { assertAllowedHost } from "../lib/host";
import { analysisWordIds } from "../lib/analysis/model.ts";
import { validateAnalysis } from "../lib/analysis/validate.ts";
import { getAppDb, getCorpusDb, type AppDb, type CorpusDb } from "./client.ts";
import type { WorkDeps } from "./work.ts";

export { DatabaseDamagedError, DatabaseMissingError } from "./client.ts";
export { HostNotAllowedError } from "../lib/host";
export { getAttribution, type Attribution } from "./corpus.ts";
export {
  EDITION,
  MAX_TITLE_LENGTH,
  createAnalysis,
  createDiagram,
  deleteWork,
  getWork,
  listWork,
  saveAnalysis,
  saveDiagram,
  type Conflict,
  type Created,
  type Refusal,
  type Saved,
  type WorkKind,
  type WorkRecord,
  type WorkSummary,
} from "./work.ts";

export async function appDb(): Promise<AppDb> {
  await assertAllowedHost();
  return getAppDb();
}

export async function corpusDb(): Promise<CorpusDb> {
  await assertAllowedHost();
  return getCorpusDb();
}

/**
 * What src/db/work.ts needs to store saved work: the app database, the corpus
 * (opened only when a save checks word ids, so a missing corpus is reported as
 * such), and the analysis model's word ids and validation.
 */
export async function workDeps(): Promise<WorkDeps> {
  await assertAllowedHost();
  return {
    app: getAppDb(),
    corpus: getCorpusDb,
    analysisWordIds,
    analysisProblems: (doc) => {
      const result = validateAnalysis(doc);
      return result.ok ? [] : result.errors.map((error) => error.message);
    },
  };
}
