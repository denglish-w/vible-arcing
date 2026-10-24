## Why

Several agents (Claude and Codex) now work on this repo at once, each in its own Git worktree. They often edit the same files, such as `CLAUDE.md`, `lat.md/*`, `package.json` and the paired OpenSpec skill copies. Nothing tells one agent what another is changing, so overlaps only show up as conflicts at merge time, when they are largest and hardest to resolve. Claude's session messaging cannot fix this: it reaches only Claude sessions, and a message is read only when the receiving agent next takes a turn.

## What Changes

- Add a coordination store in the Git common directory (`.git/agent-coord/`). Every worktree of the repo shares it, it is never committed, and both Claude and Codex can read and write it as plain files.
- Add a `coord` command-line tool (`npm run coord -- <command>`), written in TypeScript and run directly by the pinned Node:
  - `claim <path>…` / `release [<path>…]` / `list`: record that this worktree intends to change a file or folder, and see what other worktrees have claimed. Claims made from worktrees that no longer exist are ignored, and `prune` deletes them.
  - `check`: test-merges this branch against every other active worktree's branch and the integration branch using `git merge-tree`. It touches no working tree and reports which files would conflict and which files both sides have changed.
- Add a Claude `PreToolUse` hook on file edits. It **warns** (never blocks) when the file is claimed by another worktree, or already changed (committed or uncommitted) in another active worktree. The warning reaches the agent as context, and the edit proceeds.
- Write the coordination protocol once, in a new `lat.md/agent-coordination.md`: claim shared files before editing, run `check` before committing and before merging. Point `CLAUDE.md`, `.codex/AGENTS.md`, `.agents/AGENTS.md` and the OpenSpec apply guidance in `openspec/config.yaml` to it, so Claude and Codex follow the same rules.

**Decisions taken in discussion:** warn, not block, because two agents blocking on each other's claims would deadlock. No server, daemon or new runtime dependency.

**Not in scope:** automatic merging or rebasing, real-time messaging between agents, a Codex-side hook (Codex follows the written protocol), and CI enforcement.

## Capabilities

### New Capabilities

None. This is developer tooling with no product behaviour, so the change sets `skip_specs: true`. The tool's behaviour and acceptance checks are defined in `design.md` and covered by unit tests; after archive, `lat.md/agent-coordination.md` is the lasting description of that behaviour.

### Modified Capabilities

None.

## Impact

- New: `scripts/agents/` (CLI, hook entry and their tests), `lat.md/agent-coordination.md`.
- Changed: `.claude/settings.json` (PreToolUse hook), `package.json` (`coord` script; the Prettier globs gain `scripts/agents/**/*.ts`), `vitest.config.mts` (unit tests include `scripts/**/*.test.ts`), `tsconfig.json` (the three Node type-stripping options `app-server-and-sqlite` also adds), `lat.md/lat.md`, `CLAUDE.md`, `.codex/AGENTS.md`, `.agents/AGENTS.md`, `openspec/config.yaml`.
- Runtime state lives only in `.git/agent-coord/`, outside every working tree.
- Other worktrees get the hook and protocol only after they rebase onto a branch that contains this change. Until then they do not read or write claims, but `check` still sees their committed work, and the hook still sees their changed files.
- Requires Git 2.38 or later for `merge-tree --write-tree` (the dev machine has 2.55).
