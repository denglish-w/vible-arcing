import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { join } from "node:path";
import type { Worktree } from "./git.ts";

export type Claim = { path: string; note?: string; at: string };
export type ClaimsFile = {
  worktree: string;
  branch: string | null;
  claims: Claim[];
};

const LOCK_STALE_MS = 10_000;
const SEEN_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const NOTE_MAX = 200;

export const worktreeId = (path: string) =>
  createHash("sha256").update(path).digest("hex").slice(0, 12);

const claimsDir = (common: string) => join(common, "agent-coord", "claims");
export const seenDir = (common: string) => join(common, "agent-coord", "seen");

// Text that came from another agent or a file name: control, format (bidi,
// zero-width) and line-separator characters become a space, then it is quoted.
export function quote(text: string, max = Infinity): string {
  return JSON.stringify(
    text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/gu, " ").slice(0, max),
  );
}

export const quoteNote = (note: string) => quote(note, NOTE_MAX);

function safeClaimPath(p: string): boolean {
  return (
    p !== "" &&
    !/\p{Cc}/u.test(p) &&
    !p.startsWith("/") &&
    !p.split("/").includes("..")
  );
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

function isClaim(c: unknown): c is Claim {
  return (
    isObject(c) &&
    typeof c.path === "string" &&
    safeClaimPath(c.path) &&
    typeof c.at === "string" &&
    (c.note === undefined ||
      (typeof c.note === "string" && c.note.length <= NOTE_MAX))
  );
}

function parseFile(file: string): ClaimsFile | null {
  try {
    const d: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (
      isObject(d) &&
      typeof d.worktree === "string" &&
      (d.branch === null || typeof d.branch === "string") &&
      Array.isArray(d.claims) &&
      d.claims.every(isClaim)
    ) {
      return { worktree: d.worktree, branch: d.branch, claims: d.claims };
    }
  } catch {
    // unreadable or malformed: treated as absent
  }
  return null;
}

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function withLock<T>(lock: string, fn: () => T): T {
  const token = randomBytes(8).toString("hex");
  const giveUp = Date.now() + 3 * LOCK_STALE_MS;
  for (;;) {
    try {
      writeFileSync(lock, token, { flag: "wx" });
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      try {
        if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS) {
          // Renaming is atomic, so only one waiter takes the stale lock over.
          const gone = `${lock}.stale.${randomBytes(4).toString("hex")}`;
          renameSync(lock, gone);
          rmSync(gone, { force: true });
        }
      } catch {
        // another waiter or the holder got there first
      }
      if (Date.now() > giveUp) throw new Error(`could not lock ${lock}`);
      sleep(20);
    }
  }
  try {
    return fn();
  } finally {
    // Do not delete a lock someone else took over after ours went stale.
    try {
      if (readFileSync(lock, "utf8") === token) rmSync(lock, { force: true });
    } catch {
      // already gone
    }
  }
}

// Read-modify-write of one worktree's claims, atomic for readers (temp + rename).
export function updateClaims(
  common: string,
  wt: Pick<Worktree, "path" | "branch">,
  fn: (claims: Claim[]) => Claim[],
): Claim[] {
  const dir = claimsDir(common);
  mkdirSync(dir, { recursive: true });
  const id = worktreeId(wt.path);
  const file = join(dir, `${id}.json`);
  return withLock(join(dir, `${id}.lock`), () => {
    const claims = fn(parseFile(file)?.claims ?? []);
    const data: ClaimsFile = { worktree: wt.path, branch: wt.branch, claims };
    const tmp = join(
      dir,
      `${id}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`,
    );
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, file);
    return claims;
  });
}

// Only files named for an active worktree and of the expected shape are accepted.
export function readClaims(
  common: string,
  worktrees: Worktree[],
): { worktree: Worktree; claims: Claim[] }[] {
  const out: { worktree: Worktree; claims: Claim[] }[] = [];
  for (const worktree of worktrees) {
    const data = parseFile(
      join(claimsDir(common), `${worktreeId(worktree.path)}.json`),
    );
    if (data) out.push({ worktree, claims: data.claims });
  }
  return out;
}

// Deletes claims files of inactive worktrees, malformed ones, abandoned locks
// and temp files, and old `seen/` files. Returns the names removed.
export function prune(common: string, worktrees: Worktree[]): string[] {
  const active = new Set(worktrees.map((w) => `${worktreeId(w.path)}.json`));
  const removed: string[] = [];
  const sweep = (
    dir: string,
    doomed: (name: string, age: number, file: string) => boolean,
  ) => {
    let names: string[] = [];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const file = join(dir, name);
      try {
        if (!doomed(name, Date.now() - statSync(file).mtimeMs, file)) continue;
        rmSync(file, { force: true });
        removed.push(name);
      } catch {
        // already gone
      }
    }
  };
  sweep(claimsDir(common), (name, age, file) =>
    name.endsWith(".json")
      ? !active.has(name) || parseFile(file) === null
      : age > LOCK_STALE_MS,
  );
  sweep(seenDir(common), (_name, age) => age > SEEN_MAX_AGE_MS);
  return removed;
}
