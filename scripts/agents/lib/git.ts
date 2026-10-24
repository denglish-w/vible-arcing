import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { canonical } from "./paths.ts";

export type Worktree = { path: string; head: string; branch: string | null };
// `deadline` (epoch ms) lets a caller share one time budget across many calls.
export type GitOptions = { cwd: string; deadline?: number };
export type GitResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

// Variables that would redirect Git to another repository or index, as set when
// running inside a Git hook.
const REPO_ENV = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_COMMON_DIR",
  "GIT_PREFIX",
];

// Always an argument array, never a shell string.
export function git(args: string[], { cwd, deadline }: GitOptions): GitResult {
  const timeout = deadline === undefined ? undefined : deadline - Date.now();
  if (timeout !== undefined && timeout <= 0) {
    return { status: null, stdout: "", stderr: "out of time" };
  }
  const env = { ...process.env };
  for (const k of REPO_ENV) delete env[k];
  const r = spawnSync("git", args, {
    cwd,
    env,
    encoding: "utf8",
    timeout,
    killSignal: "SIGKILL",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

export function gitOk(args: string[], opts: GitOptions): string {
  const r = git(args, opts);
  if (r.status !== 0)
    throw new Error(`git ${args[0]} failed: ${r.stderr.trim() || "no output"}`);
  return r.stdout;
}

export function commonDir(opts: GitOptions): string {
  const out = gitOk(["rev-parse", "--git-common-dir"], opts).replace(/\n$/, "");
  return canonical(resolve(opts.cwd, out));
}

// Active worktrees only: prunable (directory deleted) and bare entries are dropped.
export function parseWorktrees(out: string): Worktree[] {
  const list: Worktree[] = [];
  let cur: (Worktree & { skip: boolean }) | null = null;
  for (const field of [...out.split("\0"), ""]) {
    if (field === "") {
      if (cur && !cur.skip)
        list.push({ path: cur.path, head: cur.head, branch: cur.branch });
      cur = null;
      continue;
    }
    const sp = field.indexOf(" ");
    const key = sp < 0 ? field : field.slice(0, sp);
    const val = sp < 0 ? "" : field.slice(sp + 1);
    if (key === "worktree")
      cur = { path: val, head: "", branch: null, skip: false };
    else if (!cur) continue;
    else if (key === "HEAD") cur.head = val;
    else if (key === "branch") cur.branch = val.replace(/^refs\/heads\//, "");
    else if (key === "prunable" || key === "bare") cur.skip = true;
  }
  return list;
}

export function listWorktrees(opts: GitOptions): Worktree[] {
  const out = gitOk(["worktree", "list", "--porcelain", "-z"], opts);
  return parseWorktrees(out).map((w) => ({ ...w, path: canonical(w.path) }));
}

export function resolveCommit(ref: string, opts: GitOptions): string | null {
  const r = git(
    ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`],
    opts,
  );
  return r.status === 0 ? r.stdout.trim() : null;
}

// The integration branch is one shared setting, so it covers every worktree.
export function baseBranch(opts: GitOptions): string {
  const r = git(["config", "--get", "agentcoord.base"], opts);
  return (r.status === 0 && r.stdout.trim()) || "main";
}
