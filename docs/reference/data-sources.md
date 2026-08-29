# Text & Linguistic Data Sources — Licensing

Verified licensing for every candidate data source. **This determines what can legally
be bundled in an open-source repository.** Distinctions here are load-bearing:
"public domain," "CC BY," "CC BY-SA," and "CC BY-NC-ND" have materially different
consequences.

Researched 2026-08-29. Re-verify before shipping — licenses change.

---

## Recommended stack

All entries below are CC BY 4.0 or public domain — bundleable in an MIT/Apache repo,
commercially usable, no ShareAlike.

| Layer | Source | License |
|---|---|---|
| Greek text + morphology + **syntax trees** | [MACULA Greek](https://github.com/Clear-Bible/macula-greek) `SBLGNT/lowfat` | CC BY 4.0 |
| Hebrew text + morphology + **syntax trees** | [MACULA Hebrew](https://github.com/Clear-Bible/macula-hebrew) `WLC/lowfat` | CC BY 4.0 |
| Hebrew fallback (simpler format) | [OSHB / morphhb](https://github.com/openscriptures/morphhb) | CC BY 4.0 |
| Morph-code glosses for UI labels | [STEPBible](https://github.com/STEPBible/STEPBible-Data) TEHMC + TEGMC | CC BY 4.0 |
| English side-by-side | BSB, WEB | Public domain |

**Why MACULA for both testaments:** identical schema across Greek and Hebrew — same
`class="cl"` clause nodes, same role labels, same lowfat format. One parser serves both.
This avoids stitching together OSHB + MorphGNT + separate tree sources, and avoids
CC BY-SA entirely.

### Required attribution (a `NOTICE` or `CREDITS.md` satisfies CC BY 4.0)

- `MACULA Greek Linguistic Datasets, available at https://github.com/Clear-Bible/macula-greek/`
- `MACULA Hebrew Linguistic Datasets, available at https://github.com/Clear-Bible/macula-hebrew/`
- `Original work of the Open Scriptures Hebrew Bible available at https://github.com/openscriptures/morphhb`
- `STEP Bible` — linked to www.STEPBible.org
- SBLGNT per CC BY 4.0 — retain creator identification and copyright notice, link the
  license, state the CC BY 4.0 licensing, and indicate modifications made.

---

## The finding that matters most: clause segmentation already exists

MACULA's lowfat trees contain **explicit clause nodes**. Verified by parsing the actual
files, not from documentation:

**Greek** (`macula-greek/Nestle1904/lowfat/01-matthew.xml`, 13 MB):
- **6,001 `<wg class="cl">` clause nodes** — the most common node type in the file
- 1,133 `<sentence>` elements above the clause level
- Constituent roles: `v` (3,666), `adv` (2,683), `o` (1,906), `s` (1,585), `io` (504),
  `p` (390), `vc` (303), `aux` (190)
- Phrase classes: `np`, `pp`, `vp`, `adjp`, `advp`, with `rule` attributes naming
  constructions (`NPofNP`, `apposition`, …)

**Hebrew** (`macula-hebrew/WLC/lowfat/01-Gen-001-lowfat.xml`):
- **138 `class="cl"` clause nodes**, roles `v` (100), `s` (63), `pp` (52), `o` (40),
  `p` (21), `adv` (7)
- Hebrew-specific classes: `cj` (conjunction), `om` (object marker, אֵת), `relp`/`rel`, `art`

**Implication for the proposition model:** the `cl` nodes give candidate proposition
boundaries directly; `<sentence>` gives the level above; `class="cj"` / `class="conj"`
nodes surface the logical connectors (γάρ, οὖν, ἵνα, ὅτι, καί…) that cue relationships.
Segmentation *and* the relational cue arrive in one dataset. Auto-splitting a passage
into propositions is far less speculative than assumed.

It also means **grammatical/sentence diagramming has its data dependency satisfied** —
the syntax trees and role labels are present. That feature is no longer blocked on data
availability, only on scope.

---

## Greek

### SBLGNT (base text)
**VERDICT: CC BY 4.0 — safe to bundle.**
Redistributable in whole or in part, modifiable, commercially usable, with attribution.
No verse-count restriction. — [sblgnt.com/license](https://sblgnt.com/license/)

### MACULA Greek — `Clear-Bible/macula-greek`
**VERDICT: CC BY 4.0 — safe to bundle. Best fit for this project.**
Both `Nestle1904/` and `SBLGNT/` trees on `main`, each in `lowfat`, `nodes`, `tei`, `tsv`.
Use `SBLGNT/lowfat` to match our base text. These are the GBI (Global Bible Initiative)
trees, now maintained by Clear Bible — "GBI trees" and "Lowfat trees" both resolve here.
Per-word morphology: `@lemma @pos @morph @person @number @gender @case @voice @tense @mood`,
plus `@strong` and `@gloss`.

> ⚠️ **Strip `@ln` and `@domain`** (UBS MARBLE / Louw-Nida semantic data) unless you obtain
> your own UBS permission — see *Known gaps* below. Does not affect morphology or syntax.

### STEPBible TAGNT — `STEPBible/STEPBible-Data`
**VERDICT: CC BY 4.0 — safe to bundle. Flag: README-only assertion.**
Unusually broad coverage: all words in NA27/28, TR, SBLGNT, Treg, Byz, WH, THGNT, each
marked with which editions contain it, plus positional and meaning variants. Morphology
Robinson-based (via Tauber). **The only open dataset here with textual-variant awareness**
— relevant if the app should ever show variant readings.

### MorphGNT — `morphgnt/sblgnt`
**VERDICT: CC BY-SA 3.0 — viral. Avoid; use MACULA Greek instead.**
Tags SBLGNT specifically, full parsing. But ShareAlike means the data *and any derivative*
(your reprocessed JSON, your database) must be redistributed under BY-SA — the repo stops
being uniformly MIT and downstream users inherit the obligation. BY-SA 3.0 is one-way
compatible to BY-SA 4.0 but **not** to CC BY. MACULA Greek gives the same base text under
CC BY 4.0 *with* syntax trees on top. No reason to take this.

### Nestle 1904 morphology — `biblicalhumanities/Nestle1904`
**VERDICT: CC0 on `/morph` — safe to bundle, no attribution required.**
1904 text is public domain by age. ⚠️ Licensing **differs per subdirectory** — CC0 is
confirmed for `/morph` only; check each directory separately.

### `biblicalhumanities/greek-new-testament`
**VERDICT: OBSOLETE — do not build on it.**
Its own README declares it obsolete and redirects to MACULA Greek. Survives only for
un-migrated PROIEL data.

---

## Hebrew

The user's condition was an openly-licensed text "super close to the Leningrad Codex."
**Several qualify.** Hebrew is not blocked.

### OSHB — `openscriptures/morphhb`
**VERDICT: CC BY 4.0 (morphology) + public domain (text) — safe to bundle.**
Dual-stated in `LICENSE.md`: *"Lemma and morphology data are licensed under a Creative
Commons Attribution 4.0 International license... The text of the WLC remains in the
Public Domain."* Includes full morphology — `lemma` (augmented Strong's, e.g. `c/m/6529`),
`morph` (e.g. `HC/R/Ncmsc`), stable immutable `id` per word. v2.0 (2019) completed and
verified morphology for the entire Hebrew Bible.

Base is the WLC vocalized text (in `wlc/`), with an **independently developed** lemma/
morphology layer — that independence is precisely why it is CC BY rather than NC-ND.
It is a Leningrad Codex transcription, inherited via Westminster's work.

> GitHub's API reports `spdx_id: NOASSERTION` because of the dual-license structure,
> not because terms are unclear. `LICENSE.md` is unambiguous.

### MACULA Hebrew — `Clear-Bible/macula-hebrew`
**VERDICT: CC BY 4.0 — safe to bundle. Highest-value Hebrew source.**
Base text is the tanach.us WLC snapshot, combined with OSHB morphology **and Westminster
syntax trees under a CC BY 4.0 carve-out**.

**This is the only legal route to Westminster Hebrew syntax trees in an OSS project.**
Clear Bible negotiated it; downstream users inherit it. Their `LICENSE.md` records:
*"Copyright (C) 1991-2018 by The J. Alan Groves Center for Advanced Biblical Research is
licensed under a Creative Commons Attribution 4.0 International License."*

> ⚠️ **Strip `@sdbh`, `@lexdomain`, `@coredomain`, `@contextualdomain`** (UBS Semantic
> Dictionary of Biblical Hebrew) unless you obtain your own UBS permission.

### Westminster Leningrad Codex (Groves Center) — read this split carefully
**VERDICT (WLC *text*): Public domain — safe to bundle.**
**VERDICT (Westminster *Morphology/Syntax* as distributed by Groves): CC BY-NC-ND 4.0 — DO NOT BUNDLE.**

The Groves Center licenses these **separately**:
- WLC text: *"Public Domain Text — No restrictions on its use"*
- Westminster Hebrew Morphology: *"Free for Personal & Non-commercial use"*, with
  commercial use requiring paid licensing.

NC-ND is incompatible with an MIT/Apache repo — **NoDerivatives alone kills it**, since
transforming the data into our own schema is a derivative. The *text* is free; the
*Groves-distributed morphology* is not. Use OSHB or MACULA Hebrew instead.

### UXLC — `tanach.us`
**VERDICT: Effectively unrestricted for the Hebrew text — safe to bundle. Informally worded.**
*"All biblical Hebrew text, in any format, may be viewed or copied without restriction."*
Citation appreciated, not required.

Two caveats: (1) the license page explicitly states this **is not the WLC** and should not
be labelled as such — it derives from WLC 4.20 then applies crowd-sourced corrections
against Leningrad facsimiles, arguably making it *closer* to the codex but a distinct
edition; (2) only the text is free — fonts and site design are separately restricted.
This is a self-declared prose statement rather than a standard license instrument;
Clear Bible's own counsel called it "somewhat informal" and relied on it anyway.
Risk low but non-zero.

### STEPBible TAHOT — `STEPBible/STEPBible-Data`
**VERDICT: CC BY 4.0 — safe to bundle. Flag: README-only assertion.**
*"The Leningrad codex based on Westminster via OpenScriptures, corrected from colour scans,
with full morphological and semantic tags for all words, prefixes and suffixes."*
Morphology for prefixes and suffixes **separately**. ETCBC-derived, converted to OSHB-style
codes, with disambiguated Strong's. `TEHMC` provides human-readable expansions of every
Hebrew morph code — directly useful for rendering parsing labels in a UI.
Tab-separated text, not XML.

### Hebrew summary

| Source | License | Bundle in MIT repo? |
|---|---|---|
| OSHB (morphhb) | CC BY 4.0 (morph) + PD (text) | ✅ Yes |
| WLC text via Groves | Public domain | ✅ Yes |
| Westminster Morph/Syntax via Groves | CC BY-NC-ND 4.0 | ❌ **No** |
| Westminster Syntax via MACULA | CC BY 4.0 (carve-out) | ✅ Yes |
| UXLC (tanach.us) | Unrestricted (informal) | ✅ Yes |
| STEPBible TAHOT | CC BY 4.0 (README only) | ✅ Yes |
| MACULA Hebrew | CC BY 4.0 | ✅ Yes (minus SDBH fields) |

---

## English translations (side-by-side display)

| Translation | Verdict | Notes |
|---|---|---|
| **Berean Standard Bible (BSB)** | **Public domain** — safe, no attribution required | Public domain as of 2023-04-30. Licensing form exists but is explicitly optional. Also makes the Berean Interlinear glosses inside MACULA Greek public domain. Best default — modern, fairly literal, produced alongside an interlinear so word choices align with Greek/Hebrew lemmas. |
| **World English Bible (WEB)** | **Public domain** — safe | ⚠️ "World English Bible" is an eBible.org trademark — don't modify the text and keep calling it WEB. Display-only use is fine. |
| **Open English Bible (OEB)** | **CC0** — maximally permissive | ⚠️ Incomplete: NT complete, OT partial. |
| **Literal Standard Version (LSV)** | CC BY-SA — viral, skip | No reason to take ShareAlike when BSB and WEB are public domain. Verified from secondary sources only. |

---

## Known gaps and unverified items

Recorded honestly rather than glossed over.

1. **STEPBible has no LICENSE file.** CC BY 4.0 is asserted in the README headline by the
   rights holder with explicit grant language, but GitHub's API reports `"license": null`.
   Substantively clear, procedurally thin. An email would close it.
2. **MorphGNT has no LICENSE file either** — README assertion only, linking CC BY-SA **3.0**.
   Moot if we skip it as recommended.
3. **UBS MARBLE / SDBH semantic data in both MACULA repos is "used with permission,"** not
   openly licensed. Whether that permission flows to downstream redistributors is
   undetermined. **Recommendation: strip those attributes.** Morphology and syntax trees
   are unaffected.
4. **tanach.us's license is informal prose**, not a standard instrument.
5. **Groves Center's exact CC version** for the morphology is from secondary sources; their
   own pages say only "Free for Personal & Non-commercial use." The practical conclusion
   (do not bundle) holds under any NC reading.
6. **LSV's CC BY-SA status** verified from secondary sources only.
7. **PROIEL Greek NT treebank license not examined.** Generally CC BY-NC-SA (which would be
   unusable), but unverified. Only relevant if a second syntactic annotation is wanted.

---

## Prior art constraint

[`SotS1689/DA-Tool`](https://github.com/SotS1689/DA-Tool) — a visual discourse analysis tool
for biblical texts doing arcing and bracketing with Greek and Hebrew modes. Single
`index.html`, created April 2026.

**Its license field is `null` — no license means all rights reserved.** Its code must not be
copied. It may be studied for UX. The 18-relationship taxonomy originates with
Fuller/Piper/Schreiner scholarship and is independently implementable.
