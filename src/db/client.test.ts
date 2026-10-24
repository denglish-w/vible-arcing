import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DatabaseDamagedError,
  DatabaseMissingError,
  getAppDb,
  isDamageError,
  openApp,
  openCorpus,
} from "./client.ts";
import { migrateApp } from "./migrate.ts";

const repoRoot = path.resolve(import.meta.dirname, "../..");

let tmp: string;
beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "vible-client-"));
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function captureError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the call to throw");
}

function migratedApp(): string {
  const dataDir = path.join(tmp, "data");
  const migrationsFolder = path.join(tmp, "migrations");
  cpSync(path.join(repoRoot, "drizzle", "app"), migrationsFolder, {
    recursive: true,
  });
  migrateApp({ dataDir, migrationsFolder });
  return path.join(dataDir, "app.sqlite");
}

describe("openApp", () => {
  it("opens a migrated database with the app pragmas", () => {
    const db = openApp(migratedApp());
    expect(db.$client.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.$client.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(db.$client.pragma("busy_timeout", { simple: true })).toBe(5000);
    db.$client.close();
  });

  it("fails with the setup message and creates nothing when the file is missing", () => {
    const file = path.join(tmp, "app.sqlite");
    expect(() => openApp(file)).toThrow(DatabaseMissingError);
    expect(() => openApp(file)).toThrow(/npm run db:migrate/);
    expect(existsSync(file)).toBe(false);
  });

  it("refuses a database that was never migrated", () => {
    const file = path.join(tmp, "app.sqlite");
    new Database(file).close();
    expect(() => openApp(file)).toThrow(/npm run db:migrate/);
  });

  it("refuses a corrupt file and leaves it byte for byte unchanged", () => {
    const file = path.join(tmp, "app.sqlite");
    const garbage = Buffer.from("not a database ".repeat(300));
    writeFileSync(file, garbage);

    expect(() => openApp(file)).toThrow(DatabaseDamagedError);
    expect(readFileSync(file).equals(garbage)).toBe(true);
    expect(existsSync(`${file}-wal`)).toBe(false);
  });

  it("keeps file paths out of error messages but on .file", () => {
    const file = path.join(tmp, "app.sqlite");
    writeFileSync(file, "not a database ".repeat(300));
    const error = captureError(() => openApp(file));
    expect(error).toBeInstanceOf(DatabaseDamagedError);
    expect(error.message).not.toContain(tmp);
    expect((error as DatabaseDamagedError).file).toBe(file);
  });
});

describe("openCorpus", () => {
  it("fails with the setup message and creates nothing when the file is missing", () => {
    const file = path.join(tmp, "corpus.sqlite");
    expect(() => openCorpus(file)).toThrow(/npm run db:seed/);
    expect(existsSync(file)).toBe(false);
  });

  it("opens read-only, so writes fail and leave the store unchanged", () => {
    const file = path.join(tmp, "corpus.sqlite");
    const setup = new Database(file);
    setup.exec("CREATE TABLE t (x integer); INSERT INTO t VALUES (1);");
    setup.close();
    const before = readFileSync(file);

    const db = openCorpus(file);
    expect(() => db.$client.exec("INSERT INTO t VALUES (2)")).toThrow(
      /readonly/,
    );
    db.$client.close();
    expect(readFileSync(file).equals(before)).toBe(true);
  });
});

describe("getAppDb", () => {
  it("does not cache a failed open", () => {
    const previous = process.env.DATA_DIR;
    process.env.DATA_DIR = path.join(tmp, "data");
    try {
      expect(() => getAppDb()).toThrow(DatabaseMissingError);
      migratedApp();
      const db = getAppDb();
      expect(getAppDb()).toBe(db);
      db.$client.close();
    } finally {
      delete (globalThis as { __vibleAppDb?: unknown }).__vibleAppDb;
      if (previous === undefined) delete process.env.DATA_DIR;
      else process.env.DATA_DIR = previous;
    }
  });
});

describe("isDamageError", () => {
  it("recognises corruption codes and nothing else", () => {
    expect(isDamageError({ code: "SQLITE_CORRUPT" })).toBe(true);
    expect(isDamageError({ code: "SQLITE_CORRUPT_INDEX" })).toBe(true);
    expect(isDamageError({ code: "SQLITE_NOTADB" })).toBe(true);
    expect(isDamageError({ code: "SQLITE_BUSY" })).toBe(false);
    expect(isDamageError({ code: "SQLITE_READONLY" })).toBe(false);
    expect(isDamageError(null)).toBe(false);
  });
});
