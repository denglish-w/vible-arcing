// `npm run db:migrate`: create or upgrade data/app.sqlite (design decision 10).
// Exits non-zero on failure so start scripts do not start the server.
import path from "node:path";
import { migrateApp } from "../src/db/migrate.ts";
import { resolveDataDir } from "../src/db/paths.ts";

const migrationsFolder = path.resolve(import.meta.dirname, "../drizzle/app");

try {
  const dataDir = resolveDataDir();
  const result = migrateApp({ dataDir, migrationsFolder });
  if (result.created)
    console.log(`Created ${path.join(dataDir, "app.sqlite")}`);
  if (result.backup) console.log(`Backed up saved work to ${result.backup}`);
  console.log(
    result.applied === 0
      ? "Saved-work database is up to date."
      : `Applied ${result.applied} migration(s).`,
  );
} catch (error) {
  // This is the operator's own terminal, so paths and details are shown here.
  const { message, file, detail } = error as Error & {
    file?: string;
    detail?: string;
  };
  console.error(message ?? error);
  if (file) console.error(`File: ${file}`);
  if (detail) console.error(`Detail: ${detail}`);
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) console.error(`Cause: ${cause.message}`);
  process.exitCode = 1;
}
