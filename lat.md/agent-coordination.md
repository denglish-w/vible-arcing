# Agent coordination

Several Claude and Codex agents work in separate Git worktrees of this repo at once. A shared claims store, the `coord` tool and an edit hook surface overlapping work before it becomes a merge conflict.

This file is the lasting contract for that tooling: the `agent-coordination` OpenSpec change has no specs, so its behaviour is described here and covered by the tests under [[scripts/agents]].

## Protocol

Every agent, Claude or Codex, follows the same four steps in any worktree that has this tooling.

1. At the start of a task, run `npm run coord -- list` to see what others hold, then `npm run coord -- claim <path>… --note "<why>"` for the files and folders you expect to change.
2. If the edit hook warns, stop and decide: re-scope, ask the user, or go ahead knowingly and say so in your report.
3. Run `npm run coord -- check` before each commit and before asking for a merge. Report conflicts to the user rather than resolving another agent's work.
4. Run `npm run coord -- release` when the work merges or is abandoned.

The hook only warns. Blocking was rejected because two agents each holding a claim the other needs would deadlock, and a false positive must never stop work.

## Claims store

Claims live in `.git/agent-coord/` inside the Git common directory, so every worktree of one clone shares them and nothing is ever committed.

Each active worktree has one file, `claims/<id>.json`, where the id is a hash of the worktree's canonical path ([[scripts/agents/lib/store.ts#worktreeId]]). [[scripts/agents/lib/store.ts#updateClaims]] rewrites a file under an exclusive lock file, treating a lock older than 10 seconds as abandoned (a waiter takes it over by renaming it away, so only one wins, and a holder removes the lock on release only if its own token is still inside), and writes through a uniquely named temporary file and a rename. Several agents can share a worktree, so the lock matters.

[[scripts/agents/lib/store.ts#readClaims]] accepts only files named for an active worktree and of the expected shape; anything else is skipped. Worktrees whose directory is gone (`prunable`) and bare entries are not active ([[scripts/agents/lib/git.ts#parseWorktrees]]). [[scripts/agents/lib/store.ts#prune]] deletes stale claims files, abandoned locks and temporary files, and hook deduplication records older than 7 days. Claims never expire by age.

## Paths

A claim is a repo-relative POSIX path; a trailing `/` claims a whole folder. Globs are not supported.

Every path is canonicalised with the real path of its nearest existing parent ([[scripts/agents/lib/paths.ts#canonical]]), so `/tmp` and `/private/tmp`, letter case on macOS, and the `.agents/skills` → `.codex/skills` links all compare equal. A file belongs to the worktree with the longest matching path prefix ([[scripts/agents/lib/paths.ts#worktreeFor]]), since linked worktrees sit inside the main checkout. `claim` resolves its arguments against the directory it was run from, even under `npm run` ([[scripts/agents/lib/paths.ts#normalizeClaim]]).

## Overlap from Git state

The hook and `check` also look at real Git state, so they help when an agent forgot to claim or works on a branch without this tooling.

For each other active worktree, [[scripts/agents/lib/overlap.ts#changesIn]] lists files committed there since the merge base with our `HEAD`, and files modified, staged or untracked in its working tree. The working-tree read uses `git --no-optional-locks status`, so it never takes the other worktree's index lock. A committed file that the integration branch also changed since the merge base is reported as "base moved ahead", meaning a rebase is due, rather than as the other worktree's work.

## The coord command

`npm run coord -- <command>` (or `node scripts/agents/coord.ts`) offers `claim`, `release`, `list`, `check`, `prune` and `base`.

`check` ([[scripts/agents/lib/check.ts#check]]) resolves our `HEAD`, each other worktree's `HEAD` and the integration branch to commit ids, checks each distinct id once with `git merge-tree`, and reports each target as clean (with files both sides changed), conflicts, merged (already an ancestor) or error. It exits 2 on any error, else 1 on any conflict, else 0. Uncommitted work is not test-merged; `check` says so and lists files dirty elsewhere that we also changed.

The integration branch is `git config agentcoord.base`, falling back to `main` ([[scripts/agents/lib/git.ts#baseBranch]]). `coord base <branch>` sets it for every worktree. Set it to the branch active worktrees are built on while `main` trails.

## Edit hook

A Claude `PreToolUse` hook on `Edit`, `Write`, `MultiEdit` and `NotebookEdit` runs `scripts/agents/hook.ts` and warns the agent when the file is claimed or changed in another active worktree.

The warning reaches the agent as `additionalContext` and the user as a one-line `systemMessage`. The hook never sets a permission decision and always exits 0. Every Git call shares a 2-second budget and any error ends the hook silently. Another agent's claim note is quoted, cut to 200 characters and labelled as untrusted text ([[scripts/agents/lib/store.ts#quoteNote]]). Each warning is shown once per file, worktree and reason per session, remembered under `.git/agent-coord/seen/` only for a well-formed session id.

The command in `.claude/settings.json` checks that the script exists before running it, so a checkout without this tooling stays silent. Codex has no hook and relies on the protocol, `list` and `check`.
