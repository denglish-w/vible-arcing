import { gitOk, git, resolveCommit } from "./git.ts";
import type { GitOptions, Worktree } from "./git.ts";

export type Changes = {
  committed: string[];
  baseMoved: string[];
  dirty: string[];
};

const names = (out: string) => out.split("\0").filter(Boolean);

// Paths from `status --porcelain=v1 -z`: "XY path\0", and for a rename or copy
// "XY to\0from\0"; both names count.
export function parseStatus(out: string): string[] {
  const files: string[] = [];
  const recs = out.split("\0");
  for (let i = 0; i < recs.length; i++) {
    const rec = recs[i];
    if (rec.length < 4) continue;
    files.push(rec.slice(3));
    if (/[RC]/.test(rec.slice(0, 2)) && recs[i + 1]) files.push(recs[++i]);
  }
  return files;
}

export function changedBetween(
  a: string,
  b: string,
  opts: GitOptions,
): string[] {
  return names(gitOk(["diff", "--name-only", "-z", a, b], opts));
}

// --no-optional-locks: a status here must not take index.lock in another worktree.
export function dirtyFiles(path: string, opts: GitOptions): string[] {
  const args = [
    "--no-optional-locks",
    "-C",
    path,
    "status",
    "--porcelain=v1",
    "-z",
    "-uall",
  ];
  return parseStatus(gitOk(args, opts));
}

export function mergeBase(
  a: string,
  b: string,
  opts: GitOptions,
): string | null {
  const r = git(["merge-base", a, b], opts);
  return r.status === 0 ? r.stdout.trim() : null;
}

// What another worktree has changed: commits since the merge base with our
// HEAD, plus its working tree. `baseMoved` lists committed files the
// integration branch has also changed since that merge base.
export function changesIn(
  ours: string | null,
  w: Worktree,
  baseOid: string | null,
  opts: GitOptions,
): Changes {
  const dirty = dirtyFiles(w.path, opts);
  const mb =
    ours && resolveCommit(w.head, opts) ? mergeBase(ours, w.head, opts) : null;
  const committed = mb ? changedBetween(mb, w.head, opts) : [];
  let baseMoved: string[] = [];
  if (mb && baseOid && committed.length) {
    const moved = new Set(changedBetween(mb, baseOid, opts));
    baseMoved = committed.filter((f) => moved.has(f));
  }
  return { committed, baseMoved, dirty };
}
