## Why

Bible arcing/bracketing — the discourse-analysis method developed by Daniel Fuller and popularized by John Piper and Thomas Schreiner — has no free, open-source tool. The established option ([Biblearc](https://biblearc.com)) is a paid subscription (~$90/yr), and the only open competitor found ([`SotS1689/DA-Tool`](https://github.com/SotS1689/DA-Tool)) ships with **no license**, meaning all rights reserved and unusable as a foundation.

Meanwhile the underlying data is now openly licensed: the **SBL Greek New Testament is CC BY 4.0** ([license](https://sblgnt.com/license/)), freely redistributable, modifiable, and usable commercially with attribution. The legal blocker that would have stopped this project does not exist.

This change establishes the domain foundation — the relationship taxonomy and the data model — before any UI or persistence work begins. Getting the model wrong here is expensive to unwind later, and two specific findings (documented below) would each force a rewrite if discovered mid-build.

## What Changes

This is a **foundation-only** change. It defines domain models and captures architectural decisions; it does not build the editor, backend, or persistence layer.

- Encode the canonical **18 logical relationships** (plus 4 extended relationships) as a first-class domain taxonomy. The method comes from the scholarship of Fuller, Piper and Schreiner and is implemented from those sources. Biblearc's reference sheet and course were consulted for research only.
- Establish the **two-data-model split**: discourse analysis (proposition-level) and grammatical analysis (word-level) are separate models, not variations of one.
- Establish that **arcing and bracketing are two renderings of one model**, not two features.
- Define the **passage/proposition source model** over SBLGNT, including attribution requirements imposed by CC BY 4.0.
- Scope the initial language support to **Greek only** (see Impact — Hebrew is pending a licensing determination).

### Key findings driving the model

**1. Arcing and bracketing share one data model.** Biblearc's own bracketing course states the two methods "differ only in how they display the text graphically (i.e., with arcs or with brackets)." The analysis — propositions plus labeled relationships — is identical. Building them as two features would duplicate the entire domain layer.

**2. Grammatical diagramming is a genuinely separate model.** Schreiner's *Interpreting the Pauline Epistles* (2nd ed., Baker 2011) treats these as distinct chapters: "Diagramming and Conducting a Grammatical Analysis" versus "Tracing the Argument." Discourse analysis operates on propositions (clauses) linked by logical relationships; grammatical diagramming operates on words linked by syntactic roles, and requires morphological tagging that bare SBLGNT text does not include.

**3. Ground and Inference are one relationship with opposite direction.** Both are defined as "a statement and the argument or reason for that statement" — differing only in whether the supporting proposition follows (Ground) or precedes (Inference). Modeling all 18 as a flat enum duplicates logic that a direction field expresses once.

**4. Bilateral does not need to break the tree.** Bilateral (`BL`) is "a proposition that supports two other propositions, one preceding and one following", which reads like a node with two parents. It is modelled instead as one ternary connection (before, supporter, after), so the structure stays a tree; its equivalence to a Ground plus an Inference is recorded as semantics on the node. See design decision 2.

**5. Conjunctions narrow the candidates but never decide.** Research into a third-party conjunction table (`docs/data/greek-conjunctions.json`, extracted from a Biblearc sheet with no recorded licence, reference only) showed that most conjunctions are ambiguous (`εἰ` spans four relationships), Action-Result vs. Action-Purpose is not lexically distinguishable at all, and Situation-Response has no conjunction signal. The app's own cue table is compiled from scholarly sources and is reference material the user opens on request, never a suggestion.

**6. Clause data is available as licensed data, and is used only as reference.** MACULA Greek (CC BY 4.0) ships syntax trees over SBLGNT with explicit clause nodes, sentence boundaries and conjunction nodes. It is never used to split a passage into propositions (see Impact), and it satisfies grammatical diagramming's data dependency.

## Capabilities

### New Capabilities

- `discourse/relationship-taxonomy`: The canonical set of logical relationships — 18 core plus 4 extended — with names, abbreviations, definitions, category classification (coordinate vs. subordinate; restatement / distinct statement / contrary statement), directionality, arity, and associated trigger conjunctions per language.
- `discourse/proposition-model`: The proposition tree — how a passage is segmented into propositions, how propositions are linked by labeled relationships, and the structural rules governing valid analyses (including Bilateral as a single ternary connection).
- `text/greek-source`: The SBLGNT text as a source corpus — passage addressing (book/chapter/verse/word), text retrieval, and the attribution obligations imposed by its CC BY 4.0 license.

### Modified Capabilities

None in `openspec/specs/`, which is empty. `app-server-and-sqlite` (unarchived) replaces this change's design decisions 5 and 8 and parts of 4 and 7, and delivers part of this change early (see tasks.md section 0). This change archives after it.

### Moved to later changes

These requirements describe user interface that this foundation does not build, so they are not in this change's specs. Each later change adds them when it builds the feature:
- **Arc and bracket renderers:** rendering independence (same analysis as arcs and as brackets, edits reflected in both, Bilateral drawn as one connection) and rendering an incomplete analysis.
- **Arcing editor:** the relationship picker (choices grouped by category, extended relationships visually distinguished, Bilateral selectable by name), analysis portability (export and re-import round-trip, export naming passage and edition), and showing an analysis's edition to the user.

## Impact

**Establishes, for the first time:** the project's domain vocabulary. Every later capability (editor, renderers, persistence) depends on the taxonomy and proposition model defined here.

**Deliberately out of scope for this change:**
- Arc and bracket **renderers** — they consume this model; they are separate changes.
- **Grammatical/sentence diagramming** — a distinct data model. Its data dependency is now satisfied (MACULA Greek syntax trees, CC BY 4.0), so this is deferred on scope grounds rather than blocked. Its own change.
- **Persistence, accounts, backend API** — storage is decided by `app-server-and-sqlite`, not here.
- **Relationship auto-suggestion and proposition auto-splitting** — not planned. Product decision (2026-10-22): the app never interprets for the user. The conjunction table is reference material a user can look up; MACULA clause data is never used to segment a passage.

**Language scope:** Greek (SBLGNT) for v1.

Hebrew was originally deferred pending an openly-licensed Leningrad Codex-based text. **That condition is now met** — OSHB/morphhb is CC BY 4.0 (public-domain WLC text plus independently developed morphology), and MACULA Hebrew is CC BY 4.0 including Westminster syntax trees under a negotiated carve-out. Adding Hebrew is a scope choice, no longer a licensing blocker. **The taxonomy and proposition model are language-agnostic by design**, and MACULA Greek and Hebrew share an identical schema, so one parser serves both.

**Licensing obligations incurred:** Bundling SBLGNT requires retaining the copyright notice, a link to the license, a statement that the material is CC BY 4.0, and indication of any modifications made — satisfied both in-repo and in the shipped UI.

Two licensing traps documented in `docs/reference/data-sources.md` and worth restating:
- **Westminster morphology/syntax obtained directly from the Groves Center is CC BY-NC-ND 4.0** and must not be bundled — NoDerivatives alone blocks it, since reshaping into our schema is a derivative. Only the MACULA-distributed CC BY 4.0 carve-out is safe.
- **MorphGNT is CC BY-SA 3.0** — ShareAlike would make our data (and downstream users' derivatives) virally licensed. MACULA Greek supplies the same base text under CC BY 4.0 with syntax trees on top; there is no reason to take MorphGNT.
- UBS semantic-domain attributes inside both MACULA repos are "used with permission" and should be stripped absent our own permission. Morphology and syntax are unaffected.

**Prior art constraint:** `SotS1689/DA-Tool` is unlicensed (all rights reserved). Its code must not be copied. The 18-relationship taxonomy itself originates with Fuller/Piper/Schreiner scholarship and is independently implementable.
