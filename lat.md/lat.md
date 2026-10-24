This directory defines the high-level concepts, business logic, and architecture of this project using markdown. It is managed by [lat.md](https://www.npmjs.com/package/lat.md) — a tool that anchors source code to these definitions. Install the `lat` command with `npm i -g lat.md` and run `lat --help`.

- [[architecture]] — Next.js Node server with SQLite stores, local-only access, container and CI, single validation module, offline Python ingest
- [[domain]] — The arcing method, the 18 relationships, and the modelling findings behind them
- [[proposition-model]] — Containment tree, Bilateral as a ternary node, segmentation, validity
- [[taxonomy-data]] — Shared taxonomy and conjunction-cue JSON and language scope
- [[corpus]] — SBLGNT and MACULA data, ingest pipeline, stable word ids, licensing rules
- [[design-system]] — DESIGN.md as the visual source of truth and the rules that bind UI code
- [[agent-coordination]] — Claims store, `coord` tool and edit hook that surface overlapping work across agent worktrees
- [[skill-maintenance]] — Keep Claude and Codex skill behavior aligned while preserving platform-specific syntax
- [[reader]] — Static chapter navigation, factual word help, corpus loading and persisted display settings
