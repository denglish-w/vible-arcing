import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DatabaseDamagedError } from "./client.ts";
import { BACKUPS_KEPT, backupName, migrateApp } from "./migrate.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const appMigrations = path.join(repoRoot, "drizzle", "app");

let tmp: string;
let dataDir: string;
let migrationsFolder: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "vible-migrate-"));
  dataDir = path.join(tmp, "data");
  migrationsFolder = path.join(tmp, "migrations");
  cpSync(appMigrations, migrationsFolder, { recursive: true });
});

afterEach(() => rmSync(tmp, { recursive: true, force: true }));

/** Appends a migration to the temporary copy of drizzle/app. */
function addMigration(tag: string, sql: string) {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  const last = journal.entries.at(-1);
  journal.entries.push({
    idx: last.idx + 1,
    version: last.version,
    when: last.when + 1000,
    tag,
    breakpoints: true,
  });
  writeFileSync(journalPath, JSON.stringify(journal));
  writeFileSync(path.join(migrationsFolder, `${tag}.sql`), sql);
}

function appFile() {
  return path.join(dataDir, "app.sqlite");
}

function insertAnalysis(id: string) {
  const db = new Database(appFile());
  db.prepare(
    `INSERT INTO analyses (id, title, book, start_word_id, end_word_id, passage_label,
       edition, doc_version, doc, revision, created_at, updated_at)
     VALUES (?, 't', 'PHP', 'a', 'b', 'Philippians 1:1', 'SBLGNT', 1, '{}', 1, 0, 0)`,
  ).run(id);
  db.close();
}

function analysisIds(): string[] {
  const db = new Database(appFile(), { readonly: true });
  const ids = db.prepare("SELECT id FROM analyses ORDER BY id").pluck().all();
  db.close();
  return ids as string[];
}

function backups(): string[] {
  const dir = path.join(dataDir, "backups");
  return existsSync(dir) ? readdirSync(dir).sort() : [];
}

describe("migrateApp", () => {
  it("creates the database and applies every migration, with no backup", () => {
    const result = migrateApp({ dataDir, migrationsFolder });
    expect(result).toEqual({ created: true, applied: 1, backup: null });
    expect(analysisIds()).toEqual([]);
    expect(backups()).toEqual([]);
  });

  it("does nothing when already up to date", () => {
    migrateApp({ dataDir, migrationsFolder });
    expect(migrateApp({ dataDir, migrationsFolder })).toEqual({
      created: false,
      applied: 0,
      backup: null,
    });
    expect(backups()).toEqual([]);
  });

  it("backs up existing work before a pending migration, creating backups/", () => {
    migrateApp({ dataDir, migrationsFolder });
    insertAnalysis("a1");
    addMigration("0001_add_note", "ALTER TABLE analyses ADD note text;");

    const now = new Date("2026-10-22T20:45:01.123Z");
    const result = migrateApp({ dataDir, migrationsFolder, now });

    expect(result.applied).toBe(1);
    expect(result.backup).toBe(
      path.join(dataDir, "backups", "app-20261022T204501123Z.sqlite"),
    );
    expect(path.isAbsolute(result.backup!)).toBe(true);
    const copy = new Database(result.backup!, { readonly: true });
    expect(copy.prepare("SELECT id FROM analyses").pluck().all()).toEqual([
      "a1",
    ]);
    const columns = copy
      .prepare("SELECT name FROM pragma_table_info('analyses')")
      .pluck()
      .all();
    expect(columns).not.toContain("note");
    copy.close();
    expect(analysisIds()).toEqual(["a1"]);
  });

  it(`keeps only the newest ${BACKUPS_KEPT} backups`, () => {
    migrateApp({ dataDir, migrationsFolder });
    insertAnalysis("a1");
    for (let i = 1; i <= BACKUPS_KEPT + 2; i++) {
      addMigration(`000${i}_col${i}`, `ALTER TABLE analyses ADD col${i} text;`);
      migrateApp({
        dataDir,
        migrationsFolder,
        now: new Date(Date.UTC(2026, 9, 22, 20, 0, i)),
      });
    }
    const kept = backups();
    expect(kept).toHaveLength(BACKUPS_KEPT);
    expect(kept[0]).toBe(backupName(new Date(Date.UTC(2026, 9, 22, 20, 0, 3))));
  });

  it("rolls back a failing migration and leaves the backup", () => {
    migrateApp({ dataDir, migrationsFolder });
    insertAnalysis("a1");
    addMigration(
      "0001_broken",
      "CREATE TABLE half_done (x text);\n--> statement-breakpoint\nTHIS IS NOT SQL;",
    );

    expect(() => migrateApp({ dataDir, migrationsFolder })).toThrow(
      /Failed to run the query/,
    );

    expect(backups()).toHaveLength(1);
    expect(analysisIds()).toEqual(["a1"]);
    const db = new Database(appFile(), { readonly: true });
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .pluck()
      .all();
    db.close();
    expect(tables).not.toContain("half_done");
  });

  it("refuses a damaged database and leaves it unchanged", () => {
    mkdirSync(dataDir, { recursive: true });
    const garbage = Buffer.from(
      "this is not a sqlite database at all".repeat(200),
    );
    writeFileSync(appFile(), garbage);

    expect(() => migrateApp({ dataDir, migrationsFolder })).toThrow(
      DatabaseDamagedError,
    );
    expect(readFileSync(appFile()).equals(garbage)).toBe(true);
    expect(backups()).toEqual([]);
  });
});

describe("migrateApp file handling", () => {
  it("creates the database and backups readable only by the owner", () => {
    migrateApp({ dataDir, migrationsFolder });
    insertAnalysis("a1");
    addMigration("0001_add_note", "ALTER TABLE analyses ADD note text;");
    const { backup } = migrateApp({ dataDir, migrationsFolder });

    expect(statSync(appFile()).mode & 0o777).toBe(0o600);
    expect(statSync(backup!).mode & 0o777).toBe(0o600);
    expect(statSync(path.join(dataDir, "backups")).mode & 0o777).toBe(0o700);
  });

  it("removes a database it created when the first migration fails", () => {
    addMigration("0001_broken", "THIS IS NOT SQL;");
    expect(() => migrateApp({ dataDir, migrationsFolder })).toThrow(
      /Failed to run the query/,
    );
    expect(existsSync(appFile())).toBe(false);
    expect(existsSync(`${appFile()}-wal`)).toBe(false);
  });

  it("never prunes backups while a migration keeps failing", () => {
    migrateApp({ dataDir, migrationsFolder });
    insertAnalysis("a1");
    addMigration("0001_broken", "THIS IS NOT SQL;");
    for (let i = 0; i < BACKUPS_KEPT + 2; i++) {
      expect(() =>
        migrateApp({
          dataDir,
          migrationsFolder,
          now: new Date(Date.UTC(2026, 9, 22, 21, 0, i)),
        }),
      ).toThrow(/Failed to run the query/);
    }
    expect(backups()).toHaveLength(BACKUPS_KEPT + 2);
  });
});

describe("scripts/migrate-app.ts", () => {
  function runScript(env: Record<string, string>) {
    return spawnSync(
      process.execPath,
      [path.join(repoRoot, "scripts", "migrate-app.ts")],
      {
        cwd: tmp,
        env: { ...process.env, ...env },
        encoding: "utf8",
        timeout: 30_000,
      },
    );
  }

  it("exits 0 and creates the database under DATA_DIR", () => {
    const run = runScript({ DATA_DIR: dataDir });
    expect(run.status).toBe(0);
    expect(existsSync(appFile())).toBe(true);
  });

  it("resolves a relative DATA_DIR against the working directory", () => {
    const run = runScript({ DATA_DIR: "data" });
    expect(run.status).toBe(0);
    expect(existsSync(path.join(tmp, "data", "app.sqlite"))).toBe(true);
  });

  it("exits non-zero on a failing migration and keeps the backup", () => {
    // A table the real first migration also creates, so that migration fails.
    mkdirSync(dataDir, { recursive: true });
    const seed = new Database(appFile());
    seed.exec(
      "CREATE TABLE analyses (id text); INSERT INTO analyses VALUES ('kept');",
    );
    seed.close();

    const run = runScript({ DATA_DIR: "data" });

    expect(run.status).not.toBe(0);
    expect(run.stderr).toMatch(/already exists/);
    expect(backups()).toHaveLength(1);
    expect(analysisIds()).toEqual(["kept"]);
  });

  it("writes the backup under a relative DATA_DIR from another directory", () => {
    mkdirSync(dataDir, { recursive: true });
    const seed = new Database(appFile());
    seed.exec(
      "CREATE TABLE notes (x text); INSERT INTO notes VALUES ('kept');",
    );
    seed.close();

    const run = runScript({ DATA_DIR: "data" });

    expect(run.status).toBe(0);
    expect(backups()).toHaveLength(1);
    const copy = new Database(path.join(dataDir, "backups", backups()[0]), {
      readonly: true,
    });
    expect(copy.prepare("SELECT x FROM notes").pluck().all()).toEqual(["kept"]);
    copy.close();
  });

  it("exits non-zero on a damaged database", () => {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(appFile(), "not sqlite".repeat(500));
    const run = runScript({ DATA_DIR: dataDir });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toMatch(/damaged/);
    expect(run.stderr).toContain(appFile());
  });
});
