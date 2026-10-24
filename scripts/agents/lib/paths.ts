import { realpathSync, statSync } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import type { Worktree } from "./git.ts";

// Resolves symlinks and the volume's stored letter case. A path that does not
// exist yet is resolved through its nearest existing parent.
export function canonical(p: string): string {
  const abs = resolve(p);
  try {
    return realpathSync.native(abs);
  } catch {
    const parent = dirname(abs);
    return parent === abs ? abs : join(canonical(parent), basename(abs));
  }
}

function within(root: string, p: string): boolean {
  return p === root || p.startsWith(root.endsWith(sep) ? root : root + sep);
}

// Linked worktrees sit inside the main checkout, so the longest prefix wins.
export function worktreeFor(
  file: string,
  cwd: string,
  worktrees: Worktree[],
): Worktree | null {
  const f = canonical(resolve(cwd, file));
  let best: Worktree | null = null;
  for (const w of worktrees) {
    if (within(w.path, f) && (!best || w.path.length > best.path.length))
      best = w;
  }
  return best;
}

// Repo-relative POSIX path, or null when the file is outside the worktree.
export function repoRelative(root: string, file: string): string | null {
  const rel = relative(root, canonical(file));
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel))
    return null;
  return rel.split(sep).join("/");
}

// A claim is a file, or a folder written with a trailing slash. An existing
// directory is treated as a folder even when the slash is missing.
export function normalizeClaim(
  arg: string,
  root: string,
  base: string,
): string | null {
  const abs = resolve(base, arg);
  const rel = repoRelative(root, abs);
  if (!rel) return null;
  const isDir = arg.endsWith("/") || arg.endsWith(sep) || isDirectory(abs);
  return isDir ? rel + "/" : rel;
}

function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function matchesClaim(file: string, claim: string): boolean {
  return claim.endsWith("/") ? file.startsWith(claim) : file === claim;
}
