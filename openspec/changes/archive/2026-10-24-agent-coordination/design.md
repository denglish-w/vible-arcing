## Context

See proposal.md (Why). Facts that shape the approach:

- All worktrees of one repo share a single Git common directory (`git rev-parse --git-common-dir`). For the main checkout that is `.git/`; for a linked worktree it is the main checkout's `.git/`. Files there are visible to every worktree and never tracked.
- `git worktree list --porcelain` names every worktree with its path, `HEAD` and branch (or `detached`). It also keeps entries for worktrees whose directory was deleted, marked `prunable`, and marks a bare repository `bare`. Entries that are neither are the active worktrees.
- `git merge-tree --write-tree --name-only --no-messages A B` (Git ≥ 2.38) merges two commits in memory and changes no working tree, index or ref. Its first output line is the resulting tree's OID. It exits 0 for a clean merge, 1 for a conflict (the conflicted paths follow the OID line), and something else (128 for unrelated histories, a bad object and so on) for an error.
- `git status` refreshes the index and takes `index.lock` unless run with `--no-optional-locks`. Without that flag, a status run in another worktree can make that worktree's own commit fail.
- Node 26 runs TypeScript with erasable syntax directly (type stripping), so the tool can be TypeScript, linted by oxlint and tested by Vitest, with no build step and no new dependency. Type-only imports must be written `import type`, or Node fails at load time.
- A Claude `PreToolUse` hook gets the tool call as JSON on stdin (`session_id`, `cwd`, `tool_name`, `tool_input`). It can print `hookSpecificOutput` with `hookEventName: "PreToolUse"` and `additionalContext`, which the agent sees, plus a top-level `systemMessage`, which the user sees, without deciding on the permission.
- `main` currently trails the branch the active worktrees are built on (`nextjs-stack-and-lat-docs`), so the integration branch cannot be hard-coded.
- Linked worktrees live inside the main checkout (`.claude/worktrees/*`, `.worktrees/*`), so a file in a linked worktree is also under the main checkout's path. macOS paths can reach the same file in several spellings (`/tmp` and `/private/tmp`, different letter case on a case-insensitive volume, and symlinks such as `.agents/skills/openspec-*` → `.codex/skills/*`).
- The `app-server-and-sqlite` branch already runs TypeScript scripts with Node as `scripts/*.ts` with explicit `.ts` imports, and adds `verbatimModuleSyntax`, `erasableSyntaxOnly` and `allowImportingTsExtensions` to `tsconfig.json` (its task 1.5). This change follows that convention.

## Goals / Non-Goals

**Goals:**

- An agent learns about overlapping work **before** it edits, without having to remember to ask.
- Any agent can see, at any time, which files would conflict with each other active branch.
- The hook adds no visible delay and can never fail or block an edit.
- One protocol text, shared by Claude and Codex.

**Non-Goals:**

- Locking, or any mechanism that refuses an edit.
- Coordinating across machines or clones. The store is per clone, so it covers worktrees of one checkout on one machine.
- Resolving conflicts, rebasing, or ordering merges.

## Decisions

### 1. Store: one claims file per worktree under `.git/agent-coord/claims/`

Each worktree has its own file, `claims/<id>.json`, where `<id>` is the first 12 hex characters of the SHA-256 of the worktree's canonical path (Decision 2a). The file holds `{ worktree, branch, claims: [{ path, note?, at }] }`.

- *Writes:* `claim` and `release` read, modify and write the file while holding `claims/<id>.lock`, created with `O_EXCL`. A lock older than 10 seconds is treated as abandoned and removed. The new content goes to a temporary file with a unique name (`<id>.<pid>.<random>.tmp`) in the same directory and is renamed into place, so a reader never sees a half-written file. Several agents can share one worktree (subagents, Codex alongside Claude), so a worktree's file can have more than one writer; the lock keeps their updates from overwriting each other. Readers take no lock.
- *Why per-worktree files:* a crashed writer can only affect its own worktree's file, and readers of other worktrees never wait.
- *Why key by path, not branch:* a worktree can be detached or switch branches. The branch is recorded for display only.
- *Validation:* a reader accepts a claims file only if its name is the hash of an active worktree's canonical path and its content has the expected shape (strings where strings belong, an array of claims, notes at most 200 characters). Anything else is skipped.
- *Stale entries:* a claims file that matches no active worktree is ignored by every reader. `coord prune` deletes such files, abandoned locks and temporary files, and `seen/` files older than 7 days. Nothing expires claims by age, because a quiet worktree's intent is still real.
- *Alternative rejected:* storing claims in a tracked file or a Git ref. A tracked file would cause the very merge conflicts this change is meant to prevent, and a ref adds plumbing for no gain.

### 2. Claim paths are repo-relative files or folders

A claim is a repo-relative POSIX path. A path ending in `/` claims everything below it. A file matches a claim when it is equal to the claim or lies under a folder claim. Globs are not supported: folders cover the real cases (`lat.md/`, `.codex/skills/`), and exact matching keeps the hook simple and predictable. `claim` resolves its arguments against the directory the user ran it from (`INIT_CWD` under `npm run`, else the process directory), normalises them, and rejects paths outside the worktree.

#### 2a. Every path is canonicalised before it is compared

Worktree paths from `git worktree list`, the hook's file path and every claim argument go through `fs.realpathSync.native`, which resolves symlinks and returns the volume's stored letter case. A path that does not exist yet (a `Write` creating a new file, a claim on a planned file) is canonicalised through its nearest existing parent, with the remaining components appended. Comparisons then use the canonical forms, so `/tmp/x` and `/private/tmp/x`, or `.agents/skills/openspec-apply-change/SKILL.md` and `.codex/skills/openspec-apply-change/SKILL.md`, are the same file. The repo-relative path is computed from the canonical forms.

#### 2b. The containing worktree is the longest matching prefix

A file belongs to the active worktree whose canonical path is the longest prefix of the file's canonical path. Since linked worktrees are nested in the main checkout, the longest match picks the linked worktree, not the main checkout. A relative `file_path` in hook input is resolved against the input's `cwd`. A file under no active worktree is ignored.

### 3. Overlap detection does not depend on claims

The hook and `check` both look at real Git state as well as claims, so the tool helps even when an agent forgot to claim, or works in a worktree that predates this change. For another active worktree W, a file F counts as **changed in W** if:

- it differs between the merge base (of our `HEAD` and W's `HEAD`) and W's `HEAD` (committed work: `git diff --name-only -z <base-oid> <W-oid>`), or
- it is modified, staged or untracked in W's working tree (`git --no-optional-locks -C <W> status --porcelain=v1 -z -uall`, parsed as NUL-separated records, taking both names of a rename).

`git -C` runs only on paths taken from `git worktree list`, never on a path read from a claims file. Committed changes are reported as "committed in W", but when F was also changed between the merge base and our integration branch's tip, the report says the base has moved ahead and suggests rebasing, rather than blaming W.

Each check costs about three Git processes per other worktree, plus about 60 ms for Node to start. The hook's budget (Decision 4) caps the total.

### 4. Hook: warn through context, fail open

`scripts/agents/hook.ts` handles `Edit`, `Write`, `MultiEdit` and `NotebookEdit` (it reads `tool_input.file_path`, or `notebook_path` for notebooks; `MultiEdit` is listed only in case the installed Claude Code still has it). It finds the containing worktree (Decision 2b) and checks every other active worktree for a claim on the file, or a change to it. If anything matches, it prints one JSON object:

- `hookSpecificOutput`: `{ hookEventName: "PreToolUse", additionalContext }`, where the context names the other worktree and branch, whether it is a claim or a change (committed or uncommitted), and a reminder to coordinate or re-scope, then run `coord check`. A claim's note is written by another agent, so it is quoted, cut to 200 characters with line breaks removed, and labelled as another agent's note, not an instruction.
- `systemMessage`: a one-line summary for the user.

It never sets `permissionDecision`, so the normal permission flow is unchanged, and it always exits 0. Every Git call runs through `spawnSync` with a timeout and `killSignal: "SIGKILL"`, drawn from a 2-second total budget. Any internal error, or running out of budget, ends the hook silently. The hook timeout in `settings.json` is 5 seconds as a backstop.

To avoid repeating itself, it warns once per (file, other worktree, reason) per Claude session, remembered in `.git/agent-coord/seen/<session_id>.json`. A `session_id` that does not match `[A-Za-z0-9_-]{1,128}` is never used as a file name; the hook then warns without deduplicating.

The `settings.json` command must not fail where the script is absent, such as on a branch without this change, or when Claude's project directory is the main checkout on such a branch. It is:

```sh
f="$CLAUDE_PROJECT_DIR/scripts/agents/hook.ts"; [ -f "$f" ] && node "$f"; exit 0
```

- *Why warn, not block:* agreed with the user. Two agents each holding a claim the other needs would deadlock, and a false positive must never stop work.
- *Why not `SendMessage`:* it reaches only Claude sessions and is read only on the receiver's next turn (see proposal.md).

### 5. `check` reports conflicts and overlap, and its exit code means something

`coord check` compares our `HEAD` with each other active worktree's `HEAD`, and with the integration branch, using `merge-tree`. Every target is resolved to a commit OID first (`git rev-parse --verify --end-of-options <ref>^{commit}`), targets with the same OID are checked once (the main checkout and the integration branch often coincide), and `merge-tree` receives only OIDs. For each target it prints one of:

- **clean**: exit 0 from `merge-tree`. It also lists overlap: files both sides changed that merge cleanly today, since they are the ones most likely to conflict next.
- **conflicts**: exit 1. It lists the conflicted paths (the output after the tree OID line).
- **merged**: the target is an ancestor of our `HEAD`. Skipped.
- **error**: any other exit, no merge base, an unborn `HEAD`, or a missing integration branch. It prints Git's message.

`check` exits 2 if any target is an error, else 1 if any conflicts, else 0, so an agent or script can gate on it. Uncommitted work is not part of a test merge (merge-tree needs commits). `check` says so, and lists files that are dirty in other worktrees and also changed on our side (committed or dirty). Worktrees in detached state are checked by commit.

### 6. Integration branch is configurable through shared Git config

`check` reads `git config agentcoord.base` (Git config is in the common directory, so one setting covers every worktree) and falls back to `main`. `coord base <branch>` sets it after checking that it names a commit. The local branch is used, not `origin/…`, and `check` prints the base and its OID, so a stale local `main` is visible. A base that does not resolve is reported as an error target (Decision 5). Until `main` catches up, the user sets it to `nextjs-stack-and-lat-docs`.

### 7. One CLI in TypeScript, run directly by Node

- `scripts/agents/coord.ts` is the command entry (`claim`, `release`, `list`, `check`, `prune`, `base`). It is exposed as `npm run coord -- …`, or `node scripts/agents/coord.ts …` when npm's start-up time matters.
- `scripts/agents/hook.ts` is the hook entry.
- `scripts/agents/lib/*.ts` hold Git access, the store and the overlap logic as pure functions where possible. Git is always run with an argument array, never a shell string.

This follows the convention `app-server-and-sqlite` sets for Node-run scripts (`src/db/README.md` there): relative imports with an explicit `.ts` extension, no `@/` alias, erasable syntax only (no enums, namespaces or parameter properties), and type-only imports written `import type`. `package.json` gains `"type": "module"` after `"private"`, as that branch adds it, so Node loads the files as ES modules without re-parsing them or printing a warning on every hook run. `tsconfig.json` gains `verbatimModuleSyntax`, `erasableSyntaxOnly` and `allowImportingTsExtensions`, inserted after `isolatedModules` exactly as that branch inserts them, so the two branches make the same change to those lines.

- *Alternative rejected:* `.mts`. It works, but would give the repo two conventions for Node-run TypeScript.
- *Alternative rejected:* plain `.mjs`. It would escape type checking, and the rest of the repo is TypeScript.
- *Alternative rejected:* shell scripts. Quoting, JSON handling and testing are all worse, and Codex on other platforms gains nothing.

### 8. Protocol has one home

The protocol lives in `lat.md/agent-coordination.md`, which also documents the store and tool as current state. Because this change has no specs (`skip_specs: true`), that file is the lasting contract for the tool's behaviour once the change is archived; it links the source symbols and the tests. `CLAUDE.md`, `.codex/AGENTS.md` and `.agents/AGENTS.md` each get a one-line pointer to it, and the `apply` guidance in `openspec/config.yaml` gains one step ("claim the change's shared files, run `coord check` before each commit"). These are the agent entry points `lat.md/skill-maintenance.md` names. Whether Codex loads `.codex/AGENTS.md` from the project is that document's existing assumption, not something this change settles; the root `AGENTS.md` is generated by Lat and is not edited. The protocol:

1. At the start of a task, `coord list` to see what others hold, then `coord claim` the files and folders you expect to change, with a short note.
2. If the hook warns, stop and decide: re-scope, ask the user, or go ahead knowingly and say so in your report.
3. Run `coord check` before each commit and before asking for a merge. Report conflicts to the user rather than resolving another agent's work.
4. `coord release` when the work merges or is abandoned.

### 9. Tests

Unit tests in `scripts/agents/**/*.test.ts` build throwaway repositories with linked worktrees in a temporary directory. Every Git call in a test runs with an environment cleared of inherited `GIT_*` variables, a fixed identity (`GIT_AUTHOR_*`/`GIT_COMMITTER_*`) and `git init -b main`, so results do not depend on the developer's Git config or on running inside a hook. They cover:

- worktree parsing, including detached, `prunable` and `bare` entries;
- canonicalisation: `/tmp` against `/private/tmp`, a symlinked folder, a case difference, a path that does not exist yet;
- longest-prefix worktree resolution for a file in a nested worktree, and a relative `file_path` resolved against `cwd`;
- normalisation and rejection of outside paths, and file and folder matching;
- claim and release round-trips, two concurrent writers on one worktree's file, an abandoned lock, and ignoring and pruning stale and malformed claims files;
- committed and uncommitted change detection, a rename, and a file name with a space, quote or newline;
- `check` reporting a conflict (exit 1), a clean merge with overlap (exit 0), an ancestor as merged, unrelated histories and a missing base as errors (exit 2), duplicate OIDs checked once, the fallback to `main` and the config override, the dirty-file listing and the uncommitted-work notice;
- the hook's output shape including `hookEventName`, that it never sets `permissionDecision`, quoting and truncating a hostile note, exit 0 with no output on malformed stdin, an outside-repo path and an invalid `session_id`, and once-per-session deduplication.

`vitest.config.mts` adds `scripts/**/*.test.ts` to the `unit` project.

## Risks / Trade-offs

- [Agents ignore warnings or forget to claim] → Detection from Git state (Decision 3) works without claims, and the warning arrives as context at the moment of editing.
- [Hook latency grows with many worktrees] → Git plumbing only, per-call timeouts inside a 2-second budget, fail-open, a 5-second hook timeout. Task 4.4 measures it.
- [Another agent's note steers this agent] → Notes are quoted, capped, stripped of line breaks and labelled as untrusted (Decision 4); claims files are accepted only for active worktrees (Decision 1).
- [Running Git in another worktree disturbs it] → `--no-optional-locks` on every `status`, and no command that writes to another worktree.
- [Codex has no hook, so it is warned only if it follows the protocol] → Codex still benefits from `list` and `check`, and Claude agents see Codex's changes through Git state. A Codex hook can be added later without changing the store.
- [Claims pile up] → Stale worktrees are ignored automatically, `prune` cleans up, and `list` shows each claim's age.
- [Store lost on re-clone] → Acceptable. Claims are short-lived intent, not history.
- [Other worktrees get the hook only after rebasing] → Noted in proposal.md (Impact). The Git-state detection on the new branch already covers them, and the guarded hook command does nothing on branches without the script.
- [Overlap with `app-server-and-sqlite`] → Both branches change `tsconfig.json`, `package.json`, `vitest.config.mts`, `CLAUDE.md` and `lat.md/lat.md`. The `tsconfig.json` lines are made identical; the rest is reported by `coord check` before merge.

## Migration Plan

Additive. Merge the branch, set `agentcoord.base` if `main` is not the integration branch, and rebase active worktrees when convenient. To roll back, remove the `PreToolUse` entry from `.claude/settings.json`, revert the commit and delete `.git/agent-coord/`.
