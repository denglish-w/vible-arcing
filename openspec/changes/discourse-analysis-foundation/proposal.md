## Why

Bible arcing/bracketing — the discourse-analysis method developed by Daniel Fuller and popularized by John Piper and Thomas Schreiner — has no free, open-source tool. The established option ([Biblearc](https://biblearc.com)) is a paid subscription (~$90/yr), and the only open competitor found ([`SotS1689/DA-Tool`](https://github.com/SotS1689/DA-Tool)) ships with **no license**, meaning all rights reserved and unusable as a foundation.

Meanwhile the underlying data is now openly licensed: the **SBL Greek New Testament is CC BY 4.0** ([license](https://sblgnt.com/license/)), freely redistributable, modifiable, and usable commercially with attribution. The legal blocker that would have stopped this project does not exist.

This change establishes the domain foundation — the relationship taxonomy and the data model — before any UI or persistence work begins. Getting the model wrong here is expensive to unwind later, and two specific findings (documented below) would each force a rewrite if discovered mid-build.

## What Changes

This is a **foundation-only** change. It defines domain models and captures architectural decisions; it does not build the editor, backend, or persistence layer.

- Encode the canonical **18 logical relationships** (plus 4 extended relationships) as a first-class domain taxonomy, sourced from the [canonical Biblearc reference sheet](https://s3.amazonaws.com/cdn.gospelpaths.com/tenants/5/1598617223758-The18LogicalRelationshipsEng.pdf) and cross-checked against the [Biblearc bracketing course](https://equip.biblearc.com/course/bracketing/123266).
- Establish the **two-data-model split**: discourse analysis (proposition-level) and grammatical analysis (word-level) are separate models, not variations of one.
- Establish that **arcing and bracketing are two renderings of one model**, not two features.
- Define the **passage/proposition source model** over SBLGNT, including attribution requirements imposed by CC BY 4.0.
- Scope the initial language support to **Greek only** (see Impact — Hebrew is pending a licensing determination).

### Key findings driving the model

**1. Arcing and bracketing share one data model.** Biblearc's own bracketing course states the two methods "differ only in how they display the text graphically (i.e., with arcs or with brackets)." The analysis — propositions plus labeled relationships — is identical. Building them as two features would duplicate the entire domain layer.

**2. Grammatical diagramming is a genuinely separate model.** Schreiner's *Interpreting the Pauline Epistles* (2nd ed., Baker 2011) treats these as distinct chapters: "Diagramming and Conducting a Grammatical Analysis" versus "Tracing the Argument." Discourse analysis operates on propositions (clauses) linked by logical relationships; grammatical diagramming operates on words linked by syntactic roles, and requires morphological tagging that bare SBLGNT text does not include.

**3. Ground and Inference are one relationship with opposite direction.** Both are defined as "a statement and the argument or reason for that statement" — differing only in whether the supporting proposition follows (Ground) or precedes (Inference). Modeling all 18 as a flat enum duplicates logic that a direction field expresses once.

**4. Bilateral may not need to break the tree.** Bilateral (`BL`) is "a proposition that supports two other propositions, one preceding and one following" — a node with two parents, not expressible in a strict tree. But the [Greek conjunctions sheet](https://s3.amazonaws.com/cdn.gospelpaths.com/tenants/5/1741980881175-Greekconjunctionsbracketingsheetsheetnewlogo.pdf) states directly that `BL` "in essence is the combination of two other relationships, Ground (G) and Inference (∴)." Modeling it as a *composite of two binary edges* keeps every edge binary and the structure a tree, making `BL` a presentation concern rather than a structural exception. This remains the highest-leverage structural decision in the change; the composite reading is the leading candidate.

**5. A full conjunction→relationship rules table exists and has been extracted.** A dedicated Biblearc sheet maps **64 Greek conjunctions to 105 relationship associations**, each with a scripture example. Extracted in full to `docs/data/greek-conjunctions.json`. This is a ready-made basis for relationship *suggestion*. Its limits are also now known: most conjunctions are ambiguous (`εἰ` spans four relationships), Action-Result vs. Action-Purpose is not lexically distinguishable at all, and Situation-Response has no conjunction signal whatsoever.

**6. Clause segmentation is already available as licensed data.** MACULA Greek (CC BY 4.0) ships syntax trees over SBLGNT containing explicit clause nodes — 6,001 `<wg class="cl">` nodes in Matthew alone — plus sentence boundaries, constituent role labels, and conjunction nodes. Auto-splitting a passage into candidate propositions is therefore far less speculative than assumed, and grammatical diagramming's data dependency is satisfied rather than blocked.

## Capabilities

### New Capabilities

- `discourse/relationship-taxonomy`: The canonical set of logical relationships — 18 core plus 4 extended — with names, abbreviations, definitions, category classification (coordinate vs. subordinate; restatement / distinct statement / contrary statement), directionality, arity, and associated trigger conjunctions per language.
- `discourse/proposition-model`: The proposition tree — how a passage is segmented into propositions, how propositions are linked by labeled relationships, and the structural rules governing valid analyses (including the Bilateral multi-parent case).
- `text/greek-source`: The SBLGNT text as a source corpus — passage addressing (book/chapter/verse/word), text retrieval, and the attribution obligations imposed by its CC BY 4.0 license.

### Modified Capabilities

None — this is the first change in the project.

## Impact

**Establishes, for the first time:** the project's domain vocabulary. Every later capability (editor, renderers, persistence, relationship suggestion) depends on the taxonomy and proposition model defined here.

**Deliberately out of scope for this change:**
- Arc and bracket **renderers** — they consume this model; they are separate changes.
- **Grammatical/sentence diagramming** — a distinct data model. Its data dependency is now satisfied (MACULA Greek syntax trees, CC BY 4.0), so this is deferred on scope grounds rather than blocked. Its own change.
- **Persistence, accounts, backend API** — no storage decisions made here.
- **Relationship auto-suggestion** — the conjunction table is captured as data; the inference engine that consumes it is later work.
- **Proposition auto-splitting** — MACULA clause nodes make this tractable, but the segmentation feature is later work.

**Language scope:** Greek (SBLGNT) for v1.

Hebrew was originally deferred pending an openly-licensed Leningrad Codex-based text. **That condition is now met** — OSHB/morphhb is CC BY 4.0 (public-domain WLC text plus independently developed morphology), and MACULA Hebrew is CC BY 4.0 including Westminster syntax trees under a negotiated carve-out. Adding Hebrew is a scope choice, no longer a licensing blocker. **The taxonomy and proposition model are language-agnostic by design**, and MACULA Greek and Hebrew share an identical schema, so one parser serves both.

**Licensing obligations incurred:** Bundling SBLGNT requires retaining the copyright notice, a link to the license, a statement that the material is CC BY 4.0, and indication of any modifications made — satisfied both in-repo and in the shipped UI.

Two licensing traps documented in `docs/reference/data-sources.md` and worth restating:
- **Westminster morphology/syntax obtained directly from the Groves Center is CC BY-NC-ND 4.0** and must not be bundled — NoDerivatives alone blocks it, since reshaping into our schema is a derivative. Only the MACULA-distributed CC BY 4.0 carve-out is safe.
- **MorphGNT is CC BY-SA 3.0** — ShareAlike would make our data (and downstream users' derivatives) virally licensed. MACULA Greek supplies the same base text under CC BY 4.0 with syntax trees on top; there is no reason to take MorphGNT.
- UBS semantic-domain attributes inside both MACULA repos are "used with permission" and should be stripped absent our own permission. Morphology and syntax are unaffected.

**Prior art constraint:** `SotS1689/DA-Tool` is unlicensed (all rights reserved). Its code must not be copied. The 18-relationship taxonomy itself originates with Fuller/Piper/Schreiner scholarship and is independently implementable.
