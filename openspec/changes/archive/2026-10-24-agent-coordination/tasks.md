## 1. Setup

- [x] 1.1 `tsconfig.json`: add `verbatimModuleSyntax`, `erasableSyntaxOnly` and `allowImportingTsExtensions` (all `true`) after `isolatedModules`, in that order, matching the `app-server-and-sqlite` branch; confirm `npm run build` still type-checks (design decision 7)
- [x] 1.2 `vitest.config.mts`: add `scripts/**/*.test.ts` to the `unit` project's `include`
- [x] 1.3 `package.json`: add `"coord": "node scripts/agents/coord.ts"`, and add `scripts/agents/**/*.ts` to the `format` and `format:check` globs
- [x] 1.4 Confirm oxlint covers `scripts/agents/` (it is not in `ignorePatterns`)

## 2. Git and store library

- [x] 2.1 `scripts/agents/lib/git.ts`: run Git through `spawnSync` with an argument array (never a shell string), an optional timeout and `killSignal: "SIGKILL"`; resolve the common dir; parse `git worktree list --porcelain` into `{ path, head, branch | null }` and drop `prunable` and `bare` entries (design Context, decision 4)
- [x] 2.2 `scripts/agents/lib/paths.ts`: canonicalise with `fs.realpathSync.native`, through the nearest existing parent for paths that do not exist yet (decision 2a); find the containing worktree by longest prefix, resolving a relative path against a given `cwd` (2b); normalise a user path to a repo-relative POSIX path against `INIT_CWD ?? process.cwd()`, reject paths outside the worktree, and match a file against file and folder claims (2)
- [x] 2.3 `scripts/agents/lib/store.ts`: per-worktree claims file keyed by canonical-path hash; read-modify-write under an `O_EXCL` lock with a 10-second stale timeout; unique temp names and rename; read all files, accepting only files named for an active worktree and of the expected shape; prune stale claims files, abandoned locks and temp files, and `seen/` files older than 7 days (decision 1)
- [x] 2.4 `scripts/agents/lib/overlap.ts`: for another worktree, list files changed in committed work since the merge base (`diff --name-only -z` on OIDs) and files dirty in its working tree (`--no-optional-locks status --porcelain=v1 -z -uall`, parsed by NUL, both names of a rename); flag committed changes that the integration branch also made since the merge base as "base moved ahead" (decision 3)
- [x] 2.5 Tests for 2.1–2.4 against throwaway repos with linked worktrees, with `GIT_*` cleared, a fixed identity and `git init -b main`: worktree parsing incl. detached, prunable and bare; canonicalisation (`/tmp` vs `/private/tmp`, symlink, case, non-existent file); longest-prefix resolution in a nested worktree and relative paths; normalisation, rejection and folder matching; claim/release round-trip, two concurrent writers, an abandoned lock, stale and malformed files ignored and pruned; committed vs uncommitted detection, a rename, and names with a space, quote or newline (decision 9)

## 3. CLI

- [x] 3.1 `scripts/agents/coord.ts`: `claim <path>… [--note <text>]`, `release [<path>…]` (no args releases all of this worktree's claims), `list` (all live claims with worktree, branch, note and age), `prune`, `base [<branch>]` (show or set `agentcoord.base`, refusing a name that is not a commit), plus usage text and exit 2 on bad input
- [x] 3.2 `check`: resolve every target to an OID with `rev-parse --verify --end-of-options`, check each OID once, test-merge with `merge-tree` and classify each as clean (with overlap) / conflicts / merged / error; print the base and its OID; say that uncommitted work is not test-merged and list files dirty in other worktrees that we also changed; exit 2 on any error, else 1 on any conflict, else 0 (decisions 5, 6)
- [x] 3.3 Tests: a real conflict (exit 1), a clean merge with overlap (exit 0), an ancestor reported as merged, unrelated histories and a missing base reported as errors (exit 2), duplicate OIDs checked once, the fallback to `main` and the config override, the dirty-file listing and the uncommitted-work notice, and `claim` resolving relative paths against `INIT_CWD`

## 4. Claude hook

- [x] 4.1 `scripts/agents/hook.ts`: read the PreToolUse JSON; handle `Edit`/`Write`/`MultiEdit`/`NotebookEdit`; find the containing worktree; check other worktrees' claims and changes; emit `hookSpecificOutput` with `hookEventName: "PreToolUse"` and `additionalContext`, plus `systemMessage`; quote, cap and label claim notes as untrusted; dedupe per session in `.git/agent-coord/seen/` only for a `session_id` matching `[A-Za-z0-9_-]{1,128}`; never set `permissionDecision`; always exit 0; 2-second total budget shared by every Git call (decision 4)
- [x] 4.2 `.claude/settings.json`: add a `PreToolUse` entry with matcher `Edit|Write|MultiEdit|NotebookEdit`, command `f="$CLAUDE_PROJECT_DIR/scripts/agents/hook.ts"; [ -f "$f" ] && node "$f"; exit 0`, timeout 5; keep the existing `lat` hooks unchanged
- [x] 4.3 Tests: output shape for a claim hit and a change hit including `hookEventName`, silence with no overlap, no `permissionDecision` ever, a hostile note quoted and truncated, exit 0 with no output on malformed stdin, an outside-repo path and an invalid `session_id`, once-per-session dedupe
- [ ] 4.4 Manual check in a live Claude session: claim a file from a second worktree, edit it here, and confirm the agent receives the `additionalContext` and the edit proceeds; confirm the guarded command is silent where the script is missing; time the hook with no hits and with three worktrees

## 5. Protocol and docs

- [x] 5.1 `lat.md/agent-coordination.md`: the store, the tool, the hook and the four-step protocol (decision 8), linking the source symbols (confirm `lat check` resolves `.ts` symbols under `scripts/`); state that it is the lasting contract since the change has no specs; add it to `lat.md/lat.md`
- [x] 5.2 One-line pointers in `CLAUDE.md` (Commands and Workflow), `.codex/AGENTS.md` and `.agents/AGENTS.md`; add the claim/check step to `operations.apply.guidance` in `openspec/config.yaml`
- [x] 5.3 Compare the Claude and Codex entry points per `lat.md/skill-maintenance.md` and report any differences

## 6. Finish

- [x] 6.1 `npm run lint`, `npm run format:check`, `npx vitest run --project unit`, `npm run build`, `lat check` all pass
- [x] 6.2 Run `coord check` on this branch against the real worktrees and record the result in the final report
