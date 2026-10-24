import { baseBranch, git, resolveCommit } from "./git.ts";
import type { GitOptions, Worktree } from "./git.ts";
import { changedBetween, dirtyFiles, mergeBase } from "./overlap.ts";

type Target = { oid: string | null; labels: string[] };

const short = (oid: string | null) => (oid ? oid.slice(0, 9) : "unresolved");

// Test-merges HEAD against every other active worktree and the integration
// branch with merge-tree, which changes no working tree, index or ref.
export function check(
  me: Worktree,
  worktrees: Worktree[],
): { lines: string[]; code: 0 | 1 | 2 } {
  const opts: GitOptions = { cwd: me.path };
  const others = worktrees.filter((w) => w.path !== me.path);
  const ours = resolveCommit("HEAD", opts);
  const baseName = baseBranch(opts);
  const baseOid = resolveCommit(baseName, opts);
  const lines = [
    `base: ${baseName} (${short(baseOid)})`,
    `this worktree: ${short(ours)}`,
  ];

  // Targets with the same commit are checked once.
  const targets = new Map<string, Target>();
  const add = (oid: string | null, label: string) => {
    const key = oid ?? `unresolved:${label}`;
    const t = targets.get(key);
    if (t) t.labels.push(label);
    else targets.set(key, { oid, labels: [label] });
  };
  for (const w of others)
    add(resolveCommit(w.head, opts), `${w.branch ?? "detached"} (${w.path})`);
  add(baseOid, `base ${baseName}`);

  let conflicts = false;
  let errors = false;
  for (const { oid, labels } of targets.values()) {
    const head = labels.join(", ");
    const fail = (msg: string) => {
      errors = true;
      lines.push(`${head}: error: ${msg}`);
    };
    if (!oid) {
      fail("cannot resolve to a commit");
    } else if (!ours) {
      fail("this worktree has no commits");
    } else if (
      oid === ours ||
      git(["merge-base", "--is-ancestor", oid, ours], opts).status === 0
    ) {
      lines.push(`${head}: merged (already in this HEAD)`);
    } else {
      const r = git(
        [
          "merge-tree",
          "--write-tree",
          "--name-only",
          "--no-messages",
          "-z",
          ours,
          oid,
        ],
        opts,
      );
      if (r.status === 0) {
        const mb = mergeBase(ours, oid, opts);
        const theirs = new Set(mb ? changedBetween(mb, oid, opts) : []);
        const both = mb
          ? changedBetween(mb, ours, opts).filter((f) => theirs.has(f))
          : [];
        lines.push(`${head}: clean`);
        if (both.length) lines.push(`  both sides changed: ${both.join(", ")}`);
      } else if (r.status === 1) {
        conflicts = true;
        lines.push(`${head}: conflicts`);
        for (const f of r.stdout.split("\0").slice(1).filter(Boolean))
          lines.push(`  conflict: ${f}`);
      } else {
        fail(r.stderr.trim() || `merge-tree exited ${r.status}`);
      }
    }
  }

  lines.push("note: uncommitted work is not part of the test merge.");
  if (ours) {
    let ourDirty: string[] = [];
    try {
      ourDirty = dirtyFiles(me.path, opts);
    } catch (e) {
      errors = true;
      lines.push(`this worktree: error: ${(e as Error).message}`);
    }
    for (const w of others) {
      const label = `${w.branch ?? "detached"} (${w.path})`;
      try {
        const mine = new Set(ourDirty);
        const mb = resolveCommit(w.head, opts) && mergeBase(ours, w.head, opts);
        if (mb) for (const f of changedBetween(mb, ours, opts)) mine.add(f);
        const both = dirtyFiles(w.path, opts).filter((f) => mine.has(f));
        if (both.length) {
          lines.push(`dirty in ${label} and changed here: ${both.join(", ")}`);
        }
      } catch (e) {
        errors = true;
        lines.push(`${label}: error: ${(e as Error).message}`);
      }
    }
  }
  return { lines, code: errors ? 2 : conflicts ? 1 : 0 };
}
