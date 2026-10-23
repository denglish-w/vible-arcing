---
name: "OPSX: Apply"
description: "Implement tasks from an OpenSpec change (Experimental)"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "artifacts", "experimental"]
---

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `view`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name (e.g., `/opsx:apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state
   - Optional `context`: current required project instruction input from the selected root
   - Optional `operationGuidance`: current advisory guidance for apply

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx:continue` (if it is not installed, run `openspec status --change "<name>" --json` to see the next artifact and `openspec instructions <artifact-id> --change "<name>" --json` for how to create it)
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

   Treat `context` as a required prompt-level input. Read and consider it, and
   apply relevant project facts, conventions, and constraints while implementing.
   Treat `operationGuidance` as optional additive advice. Read and consider every
   entry, and follow entries that are applicable and compatible with the built-in
   workflow.

   Keep both fields separate from CLI-returned state, missing artifacts, tasks,
   progress, `contextFiles`, and the built-in `instruction`. They are not
   evidence of task completion, do not replace the built-in instruction, and do
   not permit bypassing a blocked state. If context conflicts with the built-in
   instruction, an explicit user choice, or a CLI-controlled value, report the
   conflict and preserve the controlling value. If guidance is inapplicable or
   conflicts with those controlling inputs, do not follow it and explain why.
   These are prompt-level behavior contracts, not enforceable checks.

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   Do not copy `context` or `operationGuidance` verbatim into implementation
   files or planning artifacts unless the user separately asks for that content.

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - **Review the task's changes with two Sonnet agents, code and security** (see below)
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - Continue to next task

   **Review step (every task that changes code):**

   Spawn two review agents in the same message so they run in parallel, both with the Agent tool, `subagent_type: "general-purpose"`, `model: "sonnet"`. Tasks that only touch docs or planning artifacts skip this step. Both reviewers are read-only; tell them not to edit files. Give each the same inputs (task text, artifact paths, the diff) and its own focus.

   *Code reviewer.* Brief it with:
   - The task text, and the paths of the change's proposal, design and specs (from `contextFiles`)
   - The files changed for this task (`git diff` plus any new untracked files), not your own account of what you did
   - What to check: correctness bugs and edge cases, whether the change does what the task and specs ask (no more, no less), the architecture constraints and licensing rules in `CLAUDE.md`, and missing or weak tests
   - To return a short list of findings, each with file:line, severity (blocker / should-fix / nit) and a concrete failure scenario, or "no findings"

   *Security reviewer.* Brief it with the same task text, artifact paths and diff, and tell it to look only for exploitable weaknesses, such as:
   - untrusted input reaching the DOM or SVG unescaped (`dangerouslySetInnerHTML`, `innerHTML`, `href`/`xlink:href` with `javascript:` URLs, injected attributes)
   - imported or saved analyses that bypass the validation module, or crash or hang it (prototype pollution, unbounded size or depth)
   - unsafe XML parsing or file paths in the Python ingest (entity expansion, XXE, path traversal)
   - secrets, tokens or personal data committed or shipped in the static export
   - new or changed dependencies (lockfile churn, install scripts, unmaintained or typo-squatted packages)
   - CI, Dockerfile and nginx changes (workflow permissions, untrusted input in `run:` steps, missing security headers or CSP)
   - if the change adds a server or database: injection, missing authentication or authorisation, unsafe deserialisation
   It returns findings in the same format, each with a concrete attack scenario, or "no findings". Theoretical issues with no realistic path to exploit in this app are nits at most.

   Then:
   - Weigh each finding yourself; the reviewer can be wrong. Fix blockers and should-fix findings you agree with, and note any you reject with a one-line reason.
   - If fixes were substantial, run the reviewer(s) whose findings you fixed once more on the new diff. Do not loop more than twice per task; report anything still open.
   - Run `npm run lint` and `npm test` before marking the task complete.
   - In the task's output, show a one-line summary per reviewer (e.g. `Code review: 2 fixed, 1 rejected (reason)` / `Security review: no findings`).

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! You can archive this change with `/opsx:archive`.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- Do not use context or operation guidance as proof that a task is complete
- Apply relevant project context; report conflicts with controlling workflow inputs
- Consider every guidance entry; explain any inapplicable or conflicting advice
- Do not copy runtime context or operation guidance into implementation files or planning artifacts
- Preserve CLI-controlled blocked/ready/all-done behavior and completion criteria

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
