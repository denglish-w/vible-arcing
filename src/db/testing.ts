// In-memory databases with the committed migrations applied, for Vitest.
// Lives under src/db, so it follows the script import rules (src/db/README.md).
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type AppDb, type CorpusDb, configureApp } from "./client.ts";
import * as appSchema from "./schema/app.ts";
import * as corpusSchema from "./schema/corpus.ts";

const migrationsRoot = path.resolve(import.meta.dirname, "../../drizzle");

export function createTestCorpusDb(): CorpusDb {
  const sqlite = new Database(":memory:");
  const db = drizzle({ client: sqlite, schema: corpusSchema });
  migrate(db, { migrationsFolder: path.join(migrationsRoot, "corpus") });
  // Matches openCorpus. Unlike the real store, this one is writable, so tests
  // can load fixtures into it.
  sqlite.pragma("trusted_schema = OFF");
  return db;
}

export function createTestAppDb(): AppDb {
  const sqlite = new Database(":memory:");
  configureApp(sqlite);
  const db = drizzle({ client: sqlite, schema: appSchema });
  migrate(db, { migrationsFolder: path.join(migrationsRoot, "app") });
  return db;
}
