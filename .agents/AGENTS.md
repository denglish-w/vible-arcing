# Shared skill maintenance

Before changing project skills, read and follow `lat.md/skill-maintenance.md`. Shared Claude and Codex workflows must be updated and compared together, including platform-specific entrypoints.

# Agent coordination

Create new worktrees at `.worktrees/<branch>` inside this repo (`git worktree add .worktrees/<branch> -b <branch>`), not under `.claude/worktrees/`. When working in a worktree alongside other agents, follow the claim and check protocol in `lat.md/agent-coordination.md` (`npm run coord -- list|claim|check|release`). Codex has no edit hook, so run `coord check` yourself before each commit.
