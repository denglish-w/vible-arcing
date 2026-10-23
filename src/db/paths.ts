// Shared with scripts/ run by Node's type stripping: relative `.ts` imports only,
// no `@/` alias, no `server-only` (see src/db/README.md).
import path from "node:path";

type Env = Readonly<Record<string, string | undefined>>;

const STANDALONE_SEGMENT = `${path.sep}.next${path.sep}standalone${path.sep}`;

// Lower-cased because macOS and Windows file systems are usually case-insensitive.
function isInsideStandalone(dir: string): boolean {
  return `${dir}${path.sep}`.toLowerCase().includes(STANDALONE_SEGMENT);
}

/**
 * The absolute directory that holds `corpus.sqlite`, `app.sqlite` and `backups/`.
 *
 * `DATA_DIR` wins when set; otherwise it is `<cwd>/data`. Either way the result
 * may not sit inside `.next/standalone`: standalone `server.js` changes into that
 * directory, and every build wipes it, so data there would be lost.
 */
export function resolveDataDir(
  env: Env = process.env,
  cwd: string = process.cwd(),
): string {
  const configured = env.DATA_DIR?.trim();
  const dir = configured
    ? path.resolve(cwd, configured)
    : path.resolve(cwd, "data");

  if (isInsideStandalone(dir)) {
    throw new Error(
      "The data directory would be inside .next/standalone, which every build wipes. " +
        "Set DATA_DIR to the absolute path of the data directory (npm start does this for you).",
    );
  }
  return dir;
}

export function dataPaths(dataDir: string = resolveDataDir()) {
  return {
    dataDir,
    corpus: path.join(dataDir, "corpus.sqlite"),
    app: path.join(dataDir, "app.sqlite"),
    backups: path.join(dataDir, "backups"),
  };
}
