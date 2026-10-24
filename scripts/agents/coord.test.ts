import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { commit, coord, git, makeRepo, write } from "./lib/fixtures.ts";

const TEN = Array.from({ length: 10 }, (_, i) => `line ${i}\n`).join("");

// main has a 10-line a.txt; worktrees "one" (the one we run in) and "two".
function setup() {
  const repo = makeRepo();
  commit(repo.root, { "a.txt": TEN }, "ten lines");
  const one = repo.addWorktree("one");
  const two = repo.addWorktree("two");
  return { repo, one, two };
}

describe("coord check", () => {
  it("reports a real conflict and exits 1", () => {
    const { one, two } = setup();
    commit(one, { "a.txt": "ours\n" });
    commit(two, { "a.txt": "theirs\n" });
    const r = coord(one, ["check"]);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/two .*: conflicts\n {2}conflict: a\.txt/);
  });

  it("reports a clean merge with overlap and exits 0", () => {
    const { one, two } = setup();
    commit(one, { "a.txt": TEN.replace("line 0", "ours") });
    commit(two, { "a.txt": TEN.replace("line 9", "theirs") });
    const r = coord(one, ["check"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/two .*: clean\n {2}both sides changed: a\.txt/);
  });

  it("reports an ancestor as merged", () => {
    const { one } = setup();
    commit(one, { "n.txt": "n\n" });
    const r = coord(one, ["check"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/two .*: merged/);
  });

  it("checks targets that share a commit once", () => {
    const { one } = setup();
    commit(one, { "n.txt": "n\n" });
    const r = coord(one, ["check"]);
    // worktree "two" and the main checkout and base `main` are all at one commit
    const merged = r.stdout.split("\n").filter((l) => l.includes(": merged"));
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatch(/main .*two .*base main/);
  });

  it("reports unrelated histories as an error and exits 2", () => {
    const { one, two } = setup();
    commit(one, { "n.txt": "n\n" });
    git(two, "checkout", "-q", "--orphan", "island");
    git(two, "rm", "-rfq", ".");
    commit(two, { "z.txt": "z\n" });
    const r = coord(one, ["check"]);
    expect(r.status).toBe(2);
    expect(r.stdout).toMatch(/island .*: error: /);
  });

  it("falls back to main, prints the base and its OID, and honours the config override", () => {
    const { one, repo } = setup();
    const mainOid = git(repo.root, "rev-parse", "main").trim().slice(0, 9);
    expect(coord(one, ["check"]).stdout).toContain(`base: main (${mainOid})`);
    commit(one, { "n.txt": "n\n" });
    expect(coord(one, ["base"]).stdout).toContain("main (default)");
    expect(coord(one, ["base", "two"]).status).toBe(0);
    const r = coord(one, ["check"]);
    expect(r.stdout).toMatch(/base: two \(\w{9}\)/);
    expect(coord(one, ["base"]).stdout.trim()).toBe("two");
  });

  it("reports a base that does not resolve as an error and refuses to set one", () => {
    const { one } = setup();
    git(one, "config", "agentcoord.base", "ghost");
    const r = coord(one, ["check"]);
    expect(r.status).toBe(2);
    expect(r.stdout).toContain("base: ghost (unresolved)");
    expect(r.stdout).toContain("base ghost: error: cannot resolve to a commit");
    const set = coord(one, ["base", "nope-branch"]);
    expect(set.status).toBe(2);
    expect(set.stderr).toContain("not a commit");
  });

  it("states that uncommitted work is not test-merged and lists dirty files we also changed", () => {
    const { one, two } = setup();
    commit(one, { "a.txt": TEN.replace("line 0", "ours") });
    write(two, "a.txt", TEN.replace("line 9", "dirty"));
    write(two, "other.txt");
    const r = coord(one, ["check"]);
    expect(r.stdout).toContain(
      "note: uncommitted work is not part of the test merge.",
    );
    expect(r.stdout).toMatch(/dirty in two .* and changed here: a\.txt\n?$/m);
    expect(r.stdout).not.toContain("other.txt");
  });
});

describe("coord check robustness", () => {
  it("keeps the other results when one worktree cannot be read", () => {
    const { one, two } = setup();
    commit(one, { "n.txt": "n\n" });
    writeFileSync(join(two, ".git"), "garbage\n");
    const r = coord(one, ["check"]);
    expect(r.status).toBe(2);
    expect(r.stdout).toMatch(/^two \(.*\): error: /m);
    expect(r.stdout).toContain("base: main");
    expect(r.stdout).toMatch(/base main.*: merged/);
  });

  it("ignores repository-redirecting variables inherited from a Git hook", () => {
    const { one, two } = setup();
    commit(one, { "a.txt": "ours\n" });
    commit(two, { "a.txt": "theirs\n" });
    const expected = coord(one, ["check"]);
    const dir = mkdtempSync(join(tmpdir(), "coord-env-"));
    writeFileSync(join(dir, "index"), "not an index");
    const hostile = {
      GIT_INDEX_FILE: join(dir, "index"),
      GIT_DIR: join(dir, "nowhere"),
      GIT_WORK_TREE: dir,
    };
    const r = coord(one, ["check"], hostile);
    expect(expected.status).toBe(1);
    expect(r).toEqual(expected);
  });
});

describe("coord claim, release, list, prune", () => {
  it("round-trips claims and shows notes, branch and age", () => {
    const { one, two } = setup();
    expect(
      coord(one, ["claim", "a.txt", "dir/", "--note", "editing"]).stdout,
    ).toBe("claimed a.txt\nclaimed dir/\n");
    const list = coord(two, ["list"]).stdout;
    expect(list).toMatch(
      /^"a\.txt" {2}"one" ".*\/one" {2}<1m {2}note: "editing"$/m,
    );
    expect(list).toMatch(/^"dir\/" {2}"one" /m);
    expect(coord(one, ["release", "a.txt"]).stdout).toBe(
      "released 1 claim(s)\n",
    );
    expect(coord(one, ["list"]).stdout).not.toContain("a.txt");
    expect(coord(one, ["release"]).stdout).toBe("released 1 claim(s)\n");
    expect(coord(one, ["list"]).stdout).toBe("no claims\n");
  });

  it("resolves relative paths against INIT_CWD", () => {
    const { one } = setup();
    const under = { INIT_CWD: join(one, "dir"), npm_lifecycle_event: "coord" };
    const r = coord(one, ["claim", "b.txt", "../a.txt"], under);
    expect(r.stdout).toBe("claimed dir/b.txt\nclaimed a.txt\n");
    // outside npm, INIT_CWD is ignored
    const plain = coord(one, ["claim", "dir/b.txt"], {
      INIT_CWD: join(one, "dir"),
    });
    expect(plain.stdout).toBe("claimed dir/b.txt\n");
  });

  it("rejects bad input with exit 2", () => {
    const { one } = setup();
    expect(coord(one, ["claim", "../../outside.txt"]).status).toBe(2);
    expect(coord(one, ["claim"]).status).toBe(2);
    expect(coord(one, ["claim", "."]).stderr).toContain(
      "cannot claim the whole worktree",
    );
    expect(coord(one, ["claim", "a.txt", "--note"]).status).toBe(2);
    expect(coord(one, ["frobnicate"]).status).toBe(2);
    expect(coord(one, []).status).toBe(2);
    expect(coord(one, ["--help"]).status).toBe(0);
  });

  it("prune drops claims of a removed worktree", () => {
    const { one, two, repo } = setup();
    coord(two, ["claim", "a.txt"]);
    git(repo.root, "worktree", "remove", "--force", two);
    expect(coord(one, ["list"]).stdout).toBe("no claims\n");
    expect(coord(one, ["prune"]).stdout).toMatch(/^removed \w{12}\.json/);
    expect(coord(one, ["prune"]).stdout).toBe("nothing to prune\n");
  });
});
