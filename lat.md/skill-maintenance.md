# Shared skill maintenance

Claude and Codex share workflow behavior. Changes to a shared skill must update every separate copy in the same task, while retaining each agent's invocation and tool syntax.

When changing a skill, find its counterparts before editing. Compare the instructions afterward, ignoring frontmatter, invocation names, paths and platform-specific agent calls. Carry across requirements, review steps, validation, stopping conditions and fixes in either direction. Do not overwrite unrelated changes or copy unavailable tools or model names to the other platform.

## Project entrypoints

OpenSpec has separate Claude commands and Codex skills; Impeccable is already shared through a directory symlink, and Lat installs matching skill copies.

Claude's `/opsx:<command>` files live in [`.claude/commands/opsx/`](../.claude/commands/opsx/), and Codex's matching skills live in [`.codex/skills/`](../.codex/skills/). The mappings are `apply` → `openspec-apply-change`, `archive` → `openspec-archive-change`, `bulk-archive` → `openspec-bulk-archive-change`, `continue` → `openspec-continue-change`, `explore` → `openspec-explore`, `ff` → `openspec-ff-change`, `new` → `openspec-new-change`, `onboard` → `openspec-onboard`, `propose` → `openspec-propose`, `sync` → `openspec-sync-specs`, `update` → `openspec-update-change`, and `verify` → `openspec-verify-change`.

The `.agents/skills/openspec-*` directories link to the Codex copies; editing either path changes the same files. `.agents/skills/impeccable` links to `.claude/skills/impeccable`, so its content already has one source. Preserve those links rather than making copies. Lat's `lat-md/SKILL.md` exists under `.agents/skills`, `.claude/skills` and `.codex/skills`; keep generated copies aligned through Lat tooling rather than inserting project guidance into them.

[CLAUDE.md](../CLAUDE.md), [.codex/AGENTS.md](../.codex/AGENTS.md) and [.agents/AGENTS.md](../.agents/AGENTS.md) direct the agents here. Keep this policy in this maintained document, outside the generated root `AGENTS.md` and generated Lat skills. User-global or third-party skills that belong to only one agent are outside this project rule.

## Platform differences

Shared OpenSpec reviews have the same scope and completion requirements, using each platform's available subagent interface.

Claude uses its Agent tool with Sonnet for parallel code/security review and Opus for adversarial spec review. Codex uses native subagents with inherited model and reasoning defaults. Both review code and security before completing code tasks, run lint and tests, and review completed planning artifacts adversarially after strict OpenSpec validation.

Synchronization is an agent instruction, not an automated guarantee. Each agent must compare the affected counterparts and report any unresolved differences before finishing; there is no generator, watcher or CI synchronization check.
