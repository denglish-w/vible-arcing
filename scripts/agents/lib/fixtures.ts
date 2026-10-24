import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Test-only helpers: throwaway repositories with linked worktrees, isolated
// from the developer's Git config and from any GIT_* variables (e.g. in a hook).
export const COORD = join(import.meta.dirname, "..", "coord.ts");
export const HOOK = join(import.meta.dirname, "..", "hook.ts");

export function cleanEnv(
  extra: Record<string, string> = {},
): NodeJS.ProcessEnv {
  const env: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(process.env))
    if (!k.startsWith("GIT_")) env[k] = v;
  delete env.INIT_CWD;
  delete env.npm_lifecycle_event;
  return {
    ...env,
    NODE_ENV: "test",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
    ...extra,
  };
}

export function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: cleanEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
}

export function write(root: string, file: string, content = "x\n") {
  const p = join(root, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

export function commit(cwd: string, files: Record<string, string>, msg = "c") {
  for (const [f, c] of Object.entries(files)) write(cwd, f, c);
  git(cwd, "add", "-A");
  git(cwd, "commit", "-q", "-m", msg);
}

// `main` has one commit; worktrees are created nested under it, like the real layout.
export function makeRepo() {
  const root = join(mkdtempSync(join(tmpdir(), "coord-")), "repo");
  mkdirSync(root);
  git(root, "init", "-q", "-b", "main");
  commit(root, { "a.txt": "a\n", "dir/b.txt": "b\n" }, "init");
  return {
    root,
    canonicalRoot: realpathSync.native(root),
    addWorktree(name: string, branch = name) {
      const path = join(root, ".claude", "worktrees", name);
      git(root, "worktree", "add", "-q", "-b", branch, path);
      return path;
    },
  };
}

export type Run = { status: number | null; stdout: string; stderr: string };

export function runNode(
  script: string,
  args: string[],
  cwd: string,
  opts: { env?: Record<string, string>; input?: string } = {},
): Run {
  const r = spawnSync("node", [script, ...args], {
    cwd,
    encoding: "utf8",
    input: opts.input,
    env: cleanEnv(opts.env),
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

export const coord = (
  cwd: string,
  args: string[],
  env?: Record<string, string>,
) => runNode(COORD, args, cwd, { env });

export const hook = (cwd: string, payload: unknown) =>
  runNode(HOOK, [], cwd, {
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
  });

export function coordAsync(cwd: string, args: string[]): Promise<Run> {
  return new Promise((resolve) => {
    const p = spawn("node", [COORD, ...args], { cwd, env: cleanEnv() });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));
    p.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}
