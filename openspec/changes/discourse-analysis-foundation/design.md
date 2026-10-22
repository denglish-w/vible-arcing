## Context

See `proposal.md` — Why. This design covers how the three capabilities are represented and where they execute.

Constraints that shape the approach:

- **Stack is fixed:** Next.js (App Router) + TypeScript, deployed as a static export. There is no application server. Python is used only for the offline corpus-ingest script.
- **Source data is large and XML.** MACULA Greek lowfat trees are ~13 MB per book. Nothing in the request path should parse them.
- **Licence obligations are structural, not cosmetic.** Attribution must survive into the repo and the shipped UI; UBS semantic-domain attributes must be stripped at ingest.
- **Editing is interactive.** Building an analysis is a rapid sequence of small structural edits — connect, label, split, merge, undo. Anything on the edit path that requires a network round-trip degrades the core interaction.
- **Bilateral is in scope** (user decision), so the representation must carry it without special-casing every consumer.

## Goals / Non-Goals

**Goals:**

- One in-memory representation that both renderers consume without transformation.
- A representation where Bilateral is expressible without weakening the structural guarantees the rest of the model relies on.
- Taxonomy and cue data as **data** in one JSON source, with TypeScript types generated from it — never transcribed by hand.
- One validation implementation, in TypeScript, shared by the editor and the import path.
- A corpus format cheap enough to serve from static hosting, so "free forever" stays credible.

**Non-Goals:**

- Renderer internals — arc geometry, bracket layout, hit-testing. Consumers of this model, separate changes.
- Persistence schema, accounts, sync. v1 is local-first (below); a server-side store is later work.
- Relationship suggestion and proposition auto-splitting. The data they need is specified here; the engines are not.
- Grammatical diagramming. Separate model, separate change.

## Decisions

### 1. Analysis structure: a containment tree over the proposition sequence

An analysis is an ordered `Proposition[]` plus a forest of `Connection` nodes. Each connection covers a **contiguous range of proposition indices**; its members are propositions or other connections. This mirrors a constituency tree over the proposition sequence.

```
props:   [0]      [1]      [2]      [3]
          └───┬────┘        │        │
         Ground(0←1)        │        │
              └──────┬──────┘        │
                Series(…, 2)         │
                     └───────┬───────┘
                       Inference(…→3)
```

*Alternatives considered.* A flat edge list (`{from, to, relationship}`) is simpler to store but loses the grouping that arcing depends on — an arc spans a *group* of propositions, not a pair, and reconstructing groups from edges is ambiguous. A general graph would admit structures the method does not have (crossing arcs, cycles) and push validation cost onto every consumer.

**Why this matters for rendering:** contiguity + containment is exactly what both renderers need. Arc rendering reads nesting depth to stack arcs; bracket rendering reads the same nesting as indentation. Neither needs a transform, which is what makes "one model, two renderings" real rather than aspirational.

### 2. Bilateral as a ternary node, not a shared child

A Bilateral connection is a **single node with three ordered members**: the supported member before, the supporting proposition, the supported member after.

```
   ┌──────────── BL ────────────┐
   │                            │
 [before]    [supporter]     [after]
      ▲          │  │           ▲
      └── Ground ┘  └─ Inference ┘
              (semantics)
```

This keeps every connection a single node covering one contiguous span, so the containment tree survives intact and no consumer needs to handle a node with two parents.

*Alternatives considered.* Storing Bilateral as two independent connections sharing a child is closer to the literal wording of the spec's *Multiple support participation* requirement, but it makes the supporter a node with two parents — the structure stops being a tree, and every traversal (rendering, validation, export, undo) has to handle that case. Excluding Bilateral was rejected by user decision.

The Ground + Inference equivalence — stated on the Greek conjunctions sheet — is retained as **semantics recorded on the node**, not as its storage form. That keeps a future "split this Bilateral into its two relationships" affordance available without paying for it now.

> **Spec reconciliation needed.** `proposition-model` — *Multiple support participation* is worded structurally ("participate in more than one connection"). This design satisfies every scenario under that requirement while participating in exactly one node. The requirement should be reworded behaviourally before archive. Flagged rather than silently diverged from. See Risks.

### 3. Ground and Inference share a relation with a direction field

Relationships are data records, not an enum. Subordinate relationships carry `{relation, direction}`; Ground is `{support, follows}` and Inference is `{support, precedes}`. Inversion flips `direction` and re-derives the identifier, which is why inversion preserves the connection instead of deleting and recreating it. Coordinate relationships carry no direction, which is why they reject inversion.

*Alternative considered.* Eighteen flat enum values — rejected because the Ground/Inference relationship then has to be special-cased at every point that needs to invert or compare it, and the taxonomy's own definitions state the two are the same relation.

### 4. Taxonomy and cue data live in one JSON source, with generated types

`docs/data/` holds the taxonomy and the conjunction cue table as language-neutral JSON. The app imports it directly; TypeScript types are generated from it rather than written by hand. The Python ingest script reads the same cue table to classify conjunctions, so the JSON remains the single source across both.

*Alternative considered.* Defining the taxonomy in code and exposing it over an endpoint. Rejected — the relationship picker needs the taxonomy before any network call, and an endpoint makes it a runtime dependency for something that never changes between releases.

The cue table is keyed by language from the start. This is the only concession made to a language the v1 scope excludes, and it costs one map key.

### 5. Corpus ingest is an offline build step, in Python

A Python script in `scripts/ingest/` transforms MACULA Greek `SBLGNT/lowfat` XML into compact per-book JSON: words with stable ids, lemma, morphology, clause boundaries, conjunction classification. Output is committed or produced in CI and shipped as static assets under `public/corpus/`.

*Alternatives considered.* Parsing XML at request time — rejected; there is no server, and it would be slow regardless. A database — rejected as premature; the corpus is read-only, versioned with the release, and small once transformed. Porting ingest to Node — viable, but Python with `lxml` handles 13 MB trees comfortably, and the script runs only at release time, so a second language in the repo costs little.

Two things are enforced **at ingest, not by convention**:

- **UBS attributes (`@ln`, `@domain`) are stripped.** Their permission is not established for downstream redistribution. Doing this in the pipeline means the licence-unsafe fields never reach the repo.
- **Attribution metadata is emitted alongside the data**, so the shipped UI reads its attribution from the same artefact rather than from a string someone must remember to update.

### 6. Word identifiers come from MACULA, not from our indices

The spec requires word identifiers stable across releases. MACULA and OSHB already assign stable per-word ids; positional indices would shift under any re-ingest or upstream correction and silently corrupt saved analyses.

### 7. Validation is a single TypeScript module

Structural rules — contiguity, arity, acyclicity, Bilateral's one-per-side constraint — are enforced in one TypeScript module. The editor calls it on every edit so invalid edits are refused instantly. The import path calls the same module, so an imported analysis is checked exactly as an edited one is.

Because there is no server, there is no second trust boundary to duplicate rules across. If a save/share endpoint is added later, it will need server-side validation; that is the point to revisit this, and the module is pure TS with no browser dependencies so it can run in Node.

*Alternative considered.* Python validation behind an API — rejected; it would reintroduce a round-trip per edit and a second implementation to keep in sync, for no v1 benefit.

Rules are driven by the shared JSON taxonomy rather than hand-written branches, and a fixture set of valid and invalid analyses is run by the unit tests.

### 8. v1 is a static, local-first Next.js app

Next.js App Router with `output: 'export'`, deployable to any static host. The editor is a client component tree. Server components and server actions are not relied on.

- **State:** immutable containment tree held in a store (Zustand + Immer, or a reducer); undo/redo is a history of snapshots or patches.
- **Persistence:** analyses in IndexedDB (Dexie) with export/import to a file — which is what the *Analysis portability* requirement actually asks for. `localStorage` is too small and too synchronous for this.
- **Rendering:** SVG first for both arc and bracket views; hit-testing is straightforward and sufficient at expected passage sizes. Canvas only if profiling demands it.
- **Corpus:** fetched as static JSON from `public/corpus/`, per book.

This keeps v1 free to run and the editor fully functional before any persistence decision. Persistence, accounts, and suggestion are additive; Next.js leaves a path to route handlers or a separate service without a rewrite.

*Alternative considered.* A Vite SPA — lighter for a client-heavy tool. Next.js was chosen for shareable/indexable per-passage routes and the easier path to server features later.

## Risks / Trade-offs

**Spec wording for Bilateral describes structure, not behaviour** → Reword *Multiple support participation* behaviourally before archive. All its scenarios already pass under this design; the risk is a reader treating the current wording as mandating a two-parent representation.

**No server-side validation if sharing is added later** → Validation is a pure TS module runnable in Node, so a future endpoint reuses it. Revisit when any save/share feature is scoped.

**Next.js is more framework than a client-only editor strictly needs** → Constrain to static export and client components; avoid server-only features so the app stays portable to a plain SPA if the framework becomes a burden.

**Ternary Bilateral node means consumers handle a 3-member shape** → Contained by making it the *only* non-binary subordinate form and asserting that in the type. Cheaper than every traversal handling multi-parent nodes.

**Split/merge semantics against existing connections are underspecified** → The spec permits either preserving affected connections or reporting them. Pick one behaviour during implementation and make it consistent; do not let the two paths diverge.

**Upstream corpus corrections could change word ids** → Pin the MACULA commit per release and treat a corpus bump as a migration with its own change, not a silent dependency update.

**Licence obligations decay quietly** → Attribution is emitted by the ingest pipeline and asserted by a test, so removing it fails CI rather than going unnoticed.

**Static corpus assets could grow past what free hosting serves comfortably** → Per-book splitting, and ingest keeps only fields the specs require. Revisit if the transformed corpus exceeds a few MB per book.

## Migration Plan

Not applicable — greenfield, no existing data or deployed system.

Ordering that matters for the task breakdown: taxonomy JSON and its generated types come first (both other capabilities depend on it), then corpus ingest, then the proposition model and its validation. Renderers follow in their own change.

## Open Questions

- **Undo/redo granularity** — per structural edit, or coalesced. Affects editor ergonomics only; the model is immutable-friendly either way and this can be settled when the editor is built.
- **Whether extended relationships ship in v1's picker at all**, versus being data-present but UI-hidden. The taxonomy carries them regardless; this is a UI default.
- **Transformed corpus format** — one JSON per book versus per chapter. Depends on measured size after ingest; does not affect the model or the specs.
