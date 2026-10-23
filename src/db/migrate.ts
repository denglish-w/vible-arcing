// Applies saved-work migrations with a backup first (design decision 10).
// Used by scripts/migrate-app.ts, so shared with scripts (see src/db/README.md).
import {
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { assertIntact, configureApp, MIGRATIONS_TABLE } from "./client.ts";
import { dataPaths } from "./paths.ts";

export const BACKUPS_KEPT = 5;

// Saved work is readable only by the user running the server: on a shared
// machine, file permissions are its only protection.
const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

export type MigrateResult = {
  created: boolean;
  applied: number;
  backup: string | null;
};

export type MigrateOptions = {
  dataDir: string;
  migrationsFolder: string;
  now?: Date;
};

/**
 * Creates `app.sqlite` if it is missing, backs it up if it holds data and has
 * pending migrations, applies them in one transaction, and checks the result.
 * Throws on any failure: a backup, if one was written, is left in place, and a
 * file this call created is removed so the next start reports it as missing.
 */
export function migrateApp({
  dataDir,
  migrationsFolder,
  now = new Date(),
}: MigrateOptions): MigrateResult {
  const paths = dataPaths(dataDir);
  mkdirSync(paths.dataDir, { recursive: true, mode: DIR_MODE });

  const created = !existsSync(paths.app);
  if (created) createPrivateFile(paths.app);
  else chmodSync(paths.app, FILE_MODE); // tighten files made before this rule
  const sqlite = new Database(paths.app, { fileMustExist: true });
  let succeeded = false;
  try {
    if (!created) assertIntact(sqlite, paths.app);
    configureApp(sqlite);

    const pending = pendingMigrations(sqlite, migrationsFolder);
    let backup: string | null = null;
    if (pending > 0 && hasTables(sqlite)) {
      backup = writeBackup(sqlite, paths.backups, now);
    }

    migrate(drizzle({ client: sqlite }), {
      migrationsFolder,
      migrationsTable: MIGRATIONS_TABLE,
    });
    assertIntact(sqlite, paths.app);
    succeeded = true;

    // Pruned only after success, so a migration that keeps failing cannot rotate
    // the backups from before it out of the folder.
    if (backup) pruneBackups(paths.backups, BACKUPS_KEPT);
    return { created, applied: pending, backup };
  } finally {
    sqlite.close();
    if (created && !succeeded) removeDatabase(paths.app);
  }
}

function createPrivateFile(file: string): void {
  closeSync(openSync(file, "wx", FILE_MODE));
  chmodSync(file, FILE_MODE); // openSync's mode is filtered by the umask
}

function removeDatabase(file: string): void {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    rmSync(`${file}${suffix}`, { force: true });
  }
}

function hasTables(sqlite: Database.Database): boolean {
  const row = sqlite
    .prepare(
      "SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    )
    .get() as { n: number };
  return row.n > 0;
}

// Must match drizzle's own rule in sqlite-core/dialect.js `migrate()`: a migration
// is pending if its folderMillis is newer than the latest recorded created_at.
// Recheck this when upgrading drizzle-orm.
function pendingMigrations(
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

/** `app-20261022T204501123Z.sqlite`: UTC, sortable, and safe in a file name. */
export function backupName(now: Date): string {
  return `app-${now.toISOString().replace(/[-:.]/g, "")}.sqlite`;
}

function writeBackup(
  sqlite: Database.Database,
  backupsDir: string,
  now: Date,
): string {
  mkdirSync(backupsDir, { recursive: true, mode: DIR_MODE });
  chmodSync(backupsDir, DIR_MODE);
  const file = path.join(backupsDir, backupName(now));
  // Created empty with private permissions first; VACUUM INTO accepts an empty file.
  createPrivateFile(file);
  try {
    sqlite.prepare("VACUUM INTO ?").run(file);
  } catch (error) {
    // A partial copy must not count as one of the kept backups.
    rmSync(file, { force: true });
    throw error;
  }
  return file;
}

function pruneBackups(backupsDir: string, keep: number): void {
  const backups = readdirSync(backupsDir)
    .filter((name) => /^app-\d{8}T\d{9}Z\.sqlite$/.test(name))
    .sort();
  for (const name of backups.slice(0, Math.max(0, backups.length - keep))) {
    rmSync(path.join(backupsDir, name));
  }
}
