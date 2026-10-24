// `npm run db:seed`: rebuild data/corpus.sqlite from corpus/v1 (design decision 4).
// A running server keeps reading the old store until it restarts.
import path from "node:path";
import { resolveDataDir } from "../src/db/paths.ts";
import { seedCorpus } from "../src/db/seed.ts";

const root = path.resolve(import.meta.dirname, "..");

try {
  const dataDir = resolveDataDir();
  const result = seedCorpus({
    dataDir,
    corpusDir: path.join(root, "corpus", "v1"),
    migrationsFolder: path.join(root, "drizzle", "corpus"),
  });
  console.log(
    `Built ${path.join(dataDir, "corpus.sqlite")}: ${result.chapters} chapter(s), ${result.words} words.`,
  );
  console.log("Restart a running server to pick up the new corpus.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error) console.error(`Cause: ${cause.message}`);
  process.exitCode = 1;
}
