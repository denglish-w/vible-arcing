# Model Notes

Research findings that constrain the data model. Each of these would force a
rewrite if discovered mid-build, which is why they are recorded before any code exists.

---

## 1. Arcing and bracketing are one model, two renderings

Biblearc's own bracketing course states the two methods "differ only in how they
display the text graphically (i.e., with arcs or with brackets)." The underlying
analysis — propositions plus labeled logical relationships — is identical.

Biblearc reinforces this structurally: their [bracketing course page](https://equip.biblearc.com/course/bracketing)
notes that "Bracketing and Arcing use the same 'Discourse' module," and users can
convert between the two formats.

```
                    ┌─────────────────────┐
                    │   Proposition Tree   │
                    │  nodes = clauses     │
                    │  edges = the 18      │
                    │  relationships       │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
         ┌───────────────┐          ┌──────────────────┐
         │  Arc renderer │          │ Bracket renderer │
         │  SVG beziers  │          │ nested rules     │
         └───────────────┘          └──────────────────┘
```

**Implication:** one domain model, two view layers. Never two features.

Some published material describes a difference in emphasis — that arcing best shows
how groups of propositions relate, while bracketing best shows the main point of a
passage. That difference falls out of the visual layout, not the underlying analysis.

---

## 2. Discourse analysis and grammatical diagramming are separate models

Thomas Schreiner, *Interpreting the Pauline Epistles* (2nd ed., Baker 2011), treats
these as two distinct chapters:

- **"Tracing the Argument"** — discourse analysis. Schreiner calls this "the most
  important step in the exegetical process."
- **"Diagramming and Conducting a Grammatical Analysis"** — sentence-level grammar.

They differ at every level:

| | Discourse analysis | Grammatical analysis |
|---|---|---|
| Unit | Proposition (clause) | Word |
| Edges | 18 logical relationships | Syntactic roles (subject, object, modifier) |
| Scope | Across sentences, whole paragraphs | Within a sentence |
| Rendering | Arcs / brackets | Reed-Kellogg style lines |
| Data needed | Bare text + user segmentation | **Morphological tagging** |

**Implication:** grammatical diagramming is a second model, not a third rendering
of the first.

> **Update after licensing research:** the data dependency is **satisfied**. MACULA Greek
> (CC BY 4.0) ships per-word morphology *and* syntax trees with constituent role labels
> (`s`, `v`, `o`, `io`, `p`, `vc`, `adv`, `aux`) over the SBLGNT text. Grammatical
> diagramming is no longer blocked on data — only on scope. See
> [`data-sources.md`](./data-sources.md).

---

## 3. Ground and Inference are one relationship with a direction

The canonical sheet gives both an identical definition:

> **Ground (G):** A statement and the argument or reason for that statement
> (supporting proposition *follows*)
>
> **Inference (∴):** A statement and the argument or reason for that statement
> (supporting proposition *precedes*)

The only difference is the position of the support relative to what it supports.

**Implication:** model relationships with a direction field rather than as 18 flat
enum values. Otherwise the same logic gets implemented twice, and the UI cannot
offer the natural "flip this relationship" affordance.

Worth checking during spec work whether other pairs collapse the same way — several
relationships are defined in terms of another (Conditional is defined as
"like Action-Result except…"; Progression as "like series, but…").

---

## 4. Bilateral breaks a strict tree

> **Bilateral (BL):** A proposition that supports two other propositions, one
> preceding and one following.

Every other relationship is binary. Bilateral is not: one node supports two parents
simultaneously.

```
        ┌──────────────┐
        │ Proposition A│ ◄──┐
        └──────────────┘    │
        ┌──────────────┐    ├── BL  (one node, two parents)
        │ Proposition B│ ───┘
        └──────────────┘    │
        ┌──────────────┐    │
        │ Proposition C│ ◄──┘
        └──────────────┘
```

A strict parent-child tree cannot express this. Options: model as a DAG, treat
Bilateral as a special node type, or exclude it from v1 with an explicit note.

**This is the highest-leverage structural decision in the foundation.** It is cheap
to decide now and expensive to retrofit.

> **Strong evidence for the composite option.** The Greek conjunctions sheet states
> directly: *"The Bilateral relationship (BL) has not been included because in essence
> is the combination of two other relationships, Ground (G) and Inference (∴)."*
>
> The source material itself treats `BL` as **Ground + Inference composed**, not as a
> primitive. If the model represents it that way, every edge stays binary and the tree
> stays a tree — `BL` becomes a presentation-layer concept (render these two edges as
> one bilateral arc) rather than a structural exception.
>
> Caveat to reconcile during spec work: the same sheet still lists `διό → BL (Ac 26:3)`
> in its table, so `BL` is excluded from the *conjunction index* while remaining a
> selectable relationship. Users will expect to pick "Bilateral" by name.

---

## 5. The taxonomy ships with conjunction triggers

A dedicated Biblearc sheet maps **64 Greek conjunctions to 105 relationship
associations**, each with a scripture example — fully extracted in
[`greek-conjunctions.md`](./greek-conjunctions.md) and
`docs/data/greek-conjunctions.json`.

**Implication:** a ready-made rules table for relationship *suggestion*
(never determination). Capture it as domain data now, keyed by language, even though
the inference engine is later work.

Limits worth recording alongside it:

- **Most conjunctions are ambiguous.** `εἰ` maps to four relationships (Q/A, Id/Exp,
  If/Th, Csv); `καί` and `δέ` likewise. Suggestion must present ranked candidates and
  leave judgment to the user.
- **Some are near-unambiguous** and make high-confidence suggestions: `καίπερ`,
  `καίτοι`, `καίτοιγε`, `μέντοι` → Concessive only; `τοιγαροῦν`, `τοίνυν`, `οὐκοῦν`,
  `οὖν`, `διοπερ` → Inference only.
- **Ac/Res vs. Ac/Pur cannot be disambiguated lexically at all** — both surface as
  "so that" (`ἵνα`, `ὥστε`) and differ only by intent, which is not lexically marked.
- **Situation-Response has no conjunction signal.** It cannot be suggested lexically.
- **Hebrew glyphs did not survive PDF text extraction cleanly.** The Hebrew particle
  lists in `docs/source-pdfs/the-18-logical-relationships.extracted.txt` are mangled.
  Verify against the source PDF before encoding them.

---

## 6. Language scope — Hebrew is viable after all

The original v1 decision was Greek-only, with Hebrew conditional on finding an openly
licensed Leningrad Codex-based text. **That condition is met.** See
[`data-sources.md`](./data-sources.md):

- **OSHB / morphhb** — CC BY 4.0 morphology, public-domain WLC text. Full Hebrew Bible.
- **MACULA Hebrew** — CC BY 4.0, including Westminster **syntax trees** under a
  negotiated carve-out. The only legal route to that data in an OSS project.
- **STEPBible TAHOT**, **UXLC** — also usable.

The one real trap: **Westminster morphology/syntax obtained directly from the Groves
Center is CC BY-NC-ND 4.0 and must not be bundled** — NoDerivatives alone blocks it,
since reshaping into our own schema is a derivative. Only the MACULA-distributed
carve-out is safe. The WLC *text* is public domain either way.

**The taxonomy and proposition model are language-agnostic by design.** The conjunction
table is keyed by language, so adding Hebrew is new source data, not a model change.
MACULA Greek and MACULA Hebrew share an identical schema, so one parser serves both.

**Open decision:** whether v1 ships Greek-only for focus, or Greek + Hebrew now that the
licensing blocker is gone. The cost of Hebrew is lower than assumed — but scope is still
a choice, not an obligation.
