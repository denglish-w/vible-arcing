import { describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { baseBranch, commonDir, listWorktrees, parseWorktrees } from "./git.ts";
import { git, makeRepo } from "./fixtures.ts";

describe("parseWorktrees", () => {
  it("keeps active entries and drops prunable and bare ones", () => {
    const out = [
      "worktree /r\0HEAD aaa\0branch refs/heads/main\0",
      "worktree /r/wt\0HEAD bbb\0detached\0",
      "worktree /gone\0HEAD ccc\0branch refs/heads/gone\0prunable gitdir file points to non-existent location\0",
      "worktree /bare\0bare\0",
      "",
    ].join("\0");
    expect(parseWorktrees(out)).toEqual([
      { path: "/r", head: "aaa", branch: "main" },
      { path: "/r/wt", head: "bbb", branch: null },
    ]);
  });

  it("handles a path with a newline", () => {
    expect(
      parseWorktrees("worktree /a\nb\0HEAD x\0branch refs/heads/f/g\0\0"),
    ).toEqual([{ path: "/a\nb", head: "x", branch: "f/g" }]);
  });
});

describe("listWorktrees", () => {
  it("lists real worktrees with canonical paths and a detached head", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("one", "feat/one");
    const det = repo.addWorktree("two");
    git(det, "checkout", "-q", "--detach");
    const list = listWorktrees({ cwd: wt });
    expect(list.map((w) => [w.path, w.branch])).toEqual([
      [repo.canonicalRoot, "main"],
      [join(repo.canonicalRoot, ".claude/worktrees/one"), "feat/one"],
      [join(repo.canonicalRoot, ".claude/worktrees/two"), null],
    ]);
  });

  it("drops a worktree whose directory was deleted", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("gone");
    rmSync(wt, { recursive: true });
    expect(listWorktrees({ cwd: repo.root }).map((w) => w.branch)).toEqual([
      "main",
    ]);
  });
});

describe("commonDir and baseBranch", () => {
  it("is the main checkout's .git from a linked worktree", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("one");
    expect(commonDir({ cwd: wt })).toBe(join(repo.canonicalRoot, ".git"));
    expect(commonDir({ cwd: repo.root })).toBe(
      join(repo.canonicalRoot, ".git"),
    );
  });

  it("falls back to main and honours agentcoord.base", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("one");
    expect(baseBranch({ cwd: wt })).toBe("main");
    git(wt, "config", "agentcoord.base", "dev");
    expect(baseBranch({ cwd: repo.root })).toBe("dev");
  });
});
