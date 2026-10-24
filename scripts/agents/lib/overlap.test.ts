import { describe, expect, it } from "vitest";
import { listWorktrees, resolveCommit } from "./git.ts";
import { changesIn, parseStatus } from "./overlap.ts";
import { commit, git, makeRepo, write } from "./fixtures.ts";

function setup() {
  const repo = makeRepo();
  const wt = repo.addWorktree("one");
  const opts = { cwd: repo.root };
  const other = () => listWorktrees(opts).find((w) => w.branch === "one")!;
  return { repo, wt, opts, other };
}

describe("parseStatus", () => {
  it("takes both names of a rename and handles untracked files", () => {
    expect(parseStatus("R  new.txt\0old.txt\0?? u.txt\0 M m.txt\0")).toEqual([
      "new.txt",
      "old.txt",
      "u.txt",
      "m.txt",
    ]);
  });
});

describe("changesIn", () => {
  it("separates committed work from uncommitted work", () => {
    const { wt, opts, other } = setup();
    commit(wt, { "committed.txt": "c\n" });
    write(wt, "a.txt", "changed\n");
    write(wt, "untracked.txt");
    git(wt, "add", "untracked.txt");
    const ours = resolveCommit("HEAD", opts);
    const ch = changesIn(ours, other(), null, opts);
    expect(ch.committed).toEqual(["committed.txt"]);
    expect(ch.dirty.sort()).toEqual(["a.txt", "untracked.txt"]);
    expect(ch.baseMoved).toEqual([]);
  });

  it("reports a staged rename under both names", () => {
    const { wt, opts, other } = setup();
    git(wt, "mv", "a.txt", "renamed.txt");
    const ch = changesIn(resolveCommit("HEAD", opts), other(), null, opts);
    expect(ch.dirty.sort()).toEqual(["a.txt", "renamed.txt"]);
  });

  it("handles names with a space, a quote and a newline", () => {
    const { wt, opts, other } = setup();
    const names = ["with space.txt", 'say "hi".txt', "line\nbreak.txt"];
    for (const n of names) write(wt, n);
    const ch = changesIn(resolveCommit("HEAD", opts), other(), null, opts);
    expect(ch.dirty.sort()).toEqual([...names].sort());
    git(wt, "add", "-A");
    git(wt, "commit", "-q", "-m", "odd names");
    const after = changesIn(resolveCommit("HEAD", opts), other(), null, opts);
    expect(after.committed.sort()).toEqual([...names].sort());
    expect(after.dirty).toEqual([]);
  });

  it("flags a committed file that the integration branch also changed", () => {
    const { repo, wt, opts, other } = setup();
    commit(wt, { "a.txt": "theirs\n", "only-theirs.txt": "t\n" });
    commit(repo.root, { "a.txt": "base moved\n" });
    const ours = resolveCommit("HEAD", opts);
    const baseOid = resolveCommit("main", opts);
    const ch = changesIn(ours, other(), baseOid, opts);
    expect(ch.committed.sort()).toEqual(["a.txt", "only-theirs.txt"]);
    expect(ch.baseMoved).toEqual(["a.txt"]);
  });
});
