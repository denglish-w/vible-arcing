// Docker entrypoint helper: build data/corpus.sqlite only when it is missing or
// was built from different input (design decision 11). Compares the store's
// `build` row with the hash of the shipped corpus/v1 and corpus migrations.
import { existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { dataPaths, resolveDataDir } from "../src/db/paths.ts";
import { ingestHash, seedCorpus } from "../src/db/seed.ts";

const root = path.resolve(import.meta.dirname, "..");
const corpusDir = path.join(root, "corpus", "v1");
const migrationsFolder = path.join(root, "drizzle", "corpus");

function builtHash(file: string): string | null {
  if (!existsSync(file)) return null;
  const sqlite = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const row = sqlite
      .prepare("SELECT ingest_hash AS hash FROM build WHERE id = 1")
      .get() as { hash: string } | undefined;
    return row?.hash ?? null;
  } catch {
    // Unreadable or without a build row: rebuild it.
    return null;
  } finally {
    sqlite.close();
  }
}

try {
  const dataDir = resolveDataDir();
  const current = builtHash(dataPaths(dataDir).corpus);
  if (current === ingestHash(corpusDir, migrationsFolder)) {
    console.log("Corpus store is up to date.");
  } else {
    const result = seedCorpus({ dataDir, corpusDir, migrationsFolder });
    console.log(
      `Built the corpus store: ${result.chapters} chapter(s), ${result.words} words.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
