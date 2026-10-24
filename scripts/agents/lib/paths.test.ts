import { describe, expect, it } from "vitest";
import { mkdirSync, realpathSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { listWorktrees } from "./git.ts";
import {
  canonical,
  matchesClaim,
  normalizeClaim,
  repoRelative,
  worktreeFor,
} from "./paths.ts";
import { makeRepo, write } from "./fixtures.ts";

describe("canonical", () => {
  it("makes /var and /private/var the same path", () => {
    const repo = makeRepo();
    expect(canonical(repo.root)).toBe(repo.canonicalRoot);
    expect(canonical(repo.canonicalRoot)).toBe(repo.canonicalRoot);
    // the same directory without the /private prefix macOS puts on /var, /tmp
    const short = repo.canonicalRoot.replace(/^\/private(?=\/)/, "");
    expect(canonical(short)).toBe(repo.canonicalRoot);
  });

  it("resolves a symlinked folder to its target", () => {
    const repo = makeRepo();
    write(repo.root, "real/f.txt");
    symlinkSync(join(repo.root, "real"), join(repo.root, "link"));
    expect(canonical(join(repo.root, "link/f.txt"))).toBe(
      join(repo.canonicalRoot, "real/f.txt"),
    );
  });

  it("returns the stored letter case on a case-insensitive volume", () => {
    const repo = makeRepo();
    write(repo.root, "Folder/File.txt");
    const swapped = join(repo.root, "fOLDER/fILE.txt");
    // a case-sensitive volume has no such file; the check only applies where it does
    const insensitive = (() => {
      try {
        realpathSync.native(swapped);
        return true;
      } catch {
        return false;
      }
    })();
    const stored = join(
      repo.canonicalRoot,
      insensitive ? "Folder/File.txt" : "fOLDER/fILE.txt",
    );
    expect(canonical(swapped)).toBe(stored);
  });

  it("resolves a file that does not exist yet through its nearest parent", () => {
    const repo = makeRepo();
    expect(canonical(join(repo.root, "dir/new/deeper/file.txt"))).toBe(
      join(repo.canonicalRoot, "dir/new/deeper/file.txt"),
    );
  });
});

describe("worktreeFor", () => {
  it("picks the nested linked worktree over the main checkout", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("one");
    const list = listWorktrees({ cwd: repo.root });
    expect(worktreeFor(join(wt, "a.txt"), repo.root, list)?.branch).toBe("one");
    expect(worktreeFor(join(repo.root, "a.txt"), repo.root, list)?.branch).toBe(
      "main",
    );
  });

  it("resolves a relative file against the given cwd", () => {
    const repo = makeRepo();
    const wt = repo.addWorktree("one");
    const list = listWorktrees({ cwd: repo.root });
    expect(worktreeFor("dir/b.txt", wt, list)?.branch).toBe("one");
    expect(worktreeFor("../../../a.txt", wt, list)?.branch).toBe("main");
  });

  it("ignores a file under no worktree and does not match a sibling prefix", () => {
    const repo = makeRepo();
    const list = listWorktrees({ cwd: repo.root });
    expect(worktreeFor("/etc/hosts", repo.root, list)).toBeNull();
    expect(worktreeFor(repo.root + "-other/a.txt", repo.root, list)).toBeNull();
  });
});

describe("repoRelative and normalizeClaim", () => {
  it("gives repo-relative POSIX paths and rejects outside ones", () => {
    const repo = makeRepo();
    const R = repo.canonicalRoot;
    expect(repoRelative(R, join(repo.root, "dir/b.txt"))).toBe("dir/b.txt");
    expect(repoRelative(R, join(repo.root, "../elsewhere.txt"))).toBeNull();
    expect(normalizeClaim("../x", R, R)).toBeNull();
    expect(normalizeClaim("/etc/hosts", R, R)).toBeNull();
    expect(normalizeClaim(".", R, R)).toBeNull();
  });

  it("resolves against the base directory and marks folders with a slash", () => {
    const repo = makeRepo();
    const R = repo.canonicalRoot;
    const dir = join(repo.root, "dir");
    expect(normalizeClaim("b.txt", R, dir)).toBe("dir/b.txt");
    expect(normalizeClaim("../a.txt", R, dir)).toBe("a.txt");
    expect(normalizeClaim("dir", R, R)).toBe("dir/");
    expect(normalizeClaim("planned/", R, R)).toBe("planned/");
    expect(normalizeClaim("planned/file.md", R, R)).toBe("planned/file.md");
  });

  it("treats two spellings through a symlink as one claim", () => {
    const repo = makeRepo();
    const R = repo.canonicalRoot;
    write(repo.root, ".codex/skills/s/SKILL.md");
    mkdirSync(join(repo.root, ".agents/skills"), { recursive: true });
    symlinkSync(
      join(repo.root, ".codex/skills/s"),
      join(repo.root, ".agents/skills/s"),
    );
    expect(normalizeClaim(".agents/skills/s/SKILL.md", R, R)).toBe(
      ".codex/skills/s/SKILL.md",
    );
  });
});

describe("matchesClaim", () => {
  it("matches a file exactly and everything under a folder", () => {
    expect(matchesClaim("a.txt", "a.txt")).toBe(true);
    expect(matchesClaim("a.txt.bak", "a.txt")).toBe(false);
    expect(matchesClaim("lat.md/x.md", "lat.md/")).toBe(true);
    expect(matchesClaim("lat.md.old/x.md", "lat.md/")).toBe(false);
    expect(matchesClaim("lat.md", "lat.md/")).toBe(false);
  });
});
