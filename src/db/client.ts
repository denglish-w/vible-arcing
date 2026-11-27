// Connections to the two SQLite files (design decisions 2 and 3).
// Shared with scripts and tests, so no `server-only` here: Next code imports
// src/db/server.ts instead (see src/db/README.md).
import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { readMigrationFiles } from "drizzle-orm/migrator";
import path from "node:path";
import { dataPaths } from "./paths.ts";
import * as appSchema from "./schema/app.ts";
import * as corpusSchema from "./schema/corpus.ts";

export type CorpusDb = ReturnType<typeof corpusDrizzle>;
export type AppDb = ReturnType<typeof appDrizzle>;

/** Where drizzle records applied migrations in app.sqlite. */
export const MIGRATIONS_TABLE = "__drizzle_migrations";

// Error messages never contain file paths, because a page may show them; the
// path is on `.file` for logs and the CLI.

/** A database is missing or was never set up; the message says which command fixes it. */
export class DatabaseMissingError extends Error {
  readonly file: string;
  constructor(which: "corpus" | "app", file: string) {
    super(
      which === "corpus"
        ? "The Greek corpus has not been built. Run `npm run db:seed`."
        : "The saved-work database has not been set up. Run `npm run db:migrate`.",
    );
    this.name = "DatabaseMissingError";
    this.file = file;
  }
}

/** The saved-work database failed its integrity check. It is left untouched. */
export class DatabaseDamagedError extends Error {
  readonly file: string;
  readonly detail: string;
  constructor(file: string, detail: string) {
    super(
      "The saved-work database is damaged and has not been changed. Stop the server " +
        "and restore a copy from the backups folder in the data directory.",
    );
    this.name = "DatabaseDamagedError";
    this.file = file;
    this.detail = detail;
  }
}

/** The saved-work database lags the migrations this build ships with. */
export class DatabaseNeedsMigrationError extends Error {
  readonly file: string;
  constructor(file: string) {
    super(
      "The saved-work database needs updating. Stop the server and run `npm run db:migrate`.",
    );
    this.name = "DatabaseNeedsMigrationError";
    this.file = file;
  }
}

/** True when saved work cannot be opened: missing, damaged or behind the migrations. */
export function isStoreUnavailable(error: unknown): error is Error {
  return (
    error instanceof DatabaseMissingError ||
    error instanceof DatabaseDamagedError ||
    error instanceof DatabaseNeedsMigrationError
  );
}

const DAMAGE_CODES = new Set(["SQLITE_CORRUPT", "SQLITE_NOTADB"]);

/** True for SQLite errors that mean the file itself is damaged. */
export function isDamageError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return (
    typeof code === "string" &&
    DAMAGE_CODES.has(code.split("_").slice(0, 2).join("_"))
  );
}

/**
 * Runs `quick_check` without changing the file. Throws `DatabaseDamagedError` for
 * damage; any other failure (busy, read-only, I/O) is rethrown as it is.
 */
export function assertIntact(sqlite: Database.Database, file: string): void {
  let result: unknown;
  try {
    result = sqlite.pragma("quick_check", { simple: true });
  } catch (error) {
    if (isDamageError(error)) {
      throw new DatabaseDamagedError(file, (error as Error).message);
    }
    throw error;
  }
  if (result !== "ok") throw new DatabaseDamagedError(file, String(result));
}

// Must match drizzle's own rule in sqlite-core/dialect.js `migrate()`: a migration
// is pending if its folderMillis is newer than the latest recorded created_at.
// Recheck this when upgrading drizzle-orm.
export function pendingMigrations(
  sqlite: Database.Database,
  migrationsFolder: string,
): number {
  const migrations = readMigrationFiles({ migrationsFolder });
  const journal = sqlite
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(MIGRATIONS_TABLE);
  if (!journal) return migrations.length;
  const last = sqlite
    .prepare(`SELECT max(created_at) AS t FROM "${MIGRATIONS_TABLE}"`)
    .get() as { t: number | null };
  const applied = last.t === null ? -Infinity : Number(last.t);
  return migrations.filter((m) => m.folderMillis > applied).length;
}

function corpusDrizzle(sqlite: Database.Database) {
  return drizzle({ client: sqlite, schema: corpusSchema });
}

function appDrizzle(sqlite: Database.Database) {
  return drizzle({ client: sqlite, schema: appSchema });
}

/**
 * Opens the corpus read-only. It is built with `journal_mode = DELETE` and gets no
 * journal pragma here: a read-only connection cannot change modes, and WAL files
 * left beside a swapped corpus would corrupt it.
 */
export function openCorpus(file: string): CorpusDb {
  if (!existsSync(file)) throw new DatabaseMissingError("corpus", file);
  const sqlite = new Database(file, { readonly: true, fileMustExist: true });
  sqlite.pragma("trusted_schema = OFF");
  return corpusDrizzle(sqlite);
}

/**
 * Opens saved work read-write. It is checked before anything changes it, and it
 * must have been set up by `db:migrate`. With `migrationsFolder`, a store that
 * lags the migrations in it is refused with `DatabaseNeedsMigrationError`.
 */
export function openApp(file: string, migrationsFolder?: string): AppDb {
  if (!existsSync(file)) throw new DatabaseMissingError("app", file);
  const sqlite = new Database(file, { fileMustExist: true });
  try {
    assertIntact(sqlite, file);
    const migrated = sqlite
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(MIGRATIONS_TABLE);
    if (!migrated) throw new DatabaseMissingError("app", file);
    if (migrationsFolder && pendingMigrations(sqlite, migrationsFolder) > 0)
      throw new DatabaseNeedsMigrationError(file);
    configureApp(sqlite);
  } catch (error) {
    sqlite.close();
    throw error;
  }
  return appDrizzle(sqlite);
}

/** The pragmas every saved-work connection uses, including in-memory test ones. */
export function configureApp(sqlite: Database.Database): void {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("trusted_schema = OFF");
}

// Lazily opened singletons. Kept on globalThis so Next's dev reloads reuse them
// instead of leaking a connection per reload. A failed open is not cached, so
// running `db:migrate` or `db:seed` fixes the next request.
const connections = globalThis as typeof globalThis & {
  __vibleCorpusDb?: CorpusDb;
  __vibleAppDb?: AppDb;
};

export function getCorpusDb(): CorpusDb {
  connections.__vibleCorpusDb ??= openCorpus(dataPaths().corpus);
  return connections.__vibleCorpusDb;
}

/**
 * Where the bundled migrations are: beside the project in dev, and inside the
 * standalone output (next.config.ts traces them there, so the server's own
 * directory has them under `npm start` and in the container). The parent
 * directory is a fallback for a server started from a subfolder. Undefined when
 * none exists, which skips the check (`db:migrate` runs before every start).
 */
function bundledMigrations(): string | undefined {
  return [
    path.resolve(process.cwd(), "drizzle", "app"),
    path.resolve(process.cwd(), "..", "drizzle", "app"),
  ].find((dir) => existsSync(path.join(dir, "meta", "_journal.json")));
}

export function getAppDb(): AppDb {
  connections.__vibleAppDb ??= openApp(dataPaths().app, bundledMigrations());
  return connections.__vibleAppDb;
}
