# Greek Conjunctions → Logical Relationships

64 Greek conjunctions mapped to their associated logical relationships, with a
scripture example for each pairing. **105 conjunction→relationship mappings total.**

**Primary source:** [Greek Conjunctions bracketing sheet (PDF)](https://s3.amazonaws.com/cdn.gospelpaths.com/tenants/5/1741980881175-Greekconjunctionsbracketingsheetsheetnewlogo.pdf)
— archived at `docs/source-pdfs/greek-conjunctions-bracketing-sheet.pdf`.
Machine-readable form: `docs/data/greek-conjunctions.json`.

Relationship abbreviations are defined in [`logical-relationships.md`](./logical-relationships.md).

---

## Two caveats stated on the sheet itself

> "This list is not exhaustive, but an aid to identifying the logical relationships
> of common Greek conjunctions."

> "The Bilateral relationship (BL) has not been included because in essence is the
> combination of two other relationships, Ground (G) and Inference (∴)."

The second is a **significant modeling confirmation**. The source material itself
describes Bilateral as the composition of Ground and Inference rather than a
primitive relationship. See [`model-notes.md`](./model-notes.md) §4 — this is direct
evidence for modeling `BL` as a derived/composite form rather than a fourth arity case.

(The sheet does list `διό → BL (Ac 26:3)` in its own table, so BL is excluded from the
*conjunction index* while remaining a usable relationship. Worth reconciling during spec work.)

---

## Why this matters: suggestion, not determination

Most conjunctions map to **multiple** relationships. `εἰ` alone spans four
(Q/A, Id/Exp, If/Th, Csv); `καί` and `δέ` span four each. A conjunction narrows the
candidate set — it does not decide the relationship. Any suggestion feature must
present ranked candidates and leave the judgment to the user.

The inverse is also true and useful: some conjunctions are nearly unambiguous.
`καίπερ`, `καίτοι`, `καίτοιγε`, `μέντοι` → Concessive only. `τοιγαροῦν`, `τοίνυν`,
`οὐκοῦν`, `οὖν`, `διοπερ` → Inference only. These are high-confidence suggestions.

---

## The table

| Conjunction | Relationships (with example) |
|---|---|
| ἀλλά | -/+ (Mt 7:21), Csv (Mt 9:18) |
| ἄρα | ∴ (2 Th 2:15), If/Th (1 Co 15:15) |
| ἄχρι | T (Lk 21:24) |
| γάρ | Id/Exp (Mt 3:3), G (Jn 3:19) |
| δέ | S (Mt 16:14), P (Mt 1:13), -/+ (2 Co 10:1), Id/Exp (1 Co 10:11) |
| διό | ∴ (Php 2:9), BL (Ac 26:3) |
| διοπερ | ∴ (1 Co 8:13) |
| διότι | G (Lk 1:13), ∴ (Ac 20:26) |
| ἐάν | If/Th (Jn 6:44), T (1 Jn 3:2) |
| ἐάνπερ | If/Th (Heb 6:3) |
| εἰ | Q/A (Lk 22:49), Id/Exp (Mk 15:44), If/Th (Rom 8:11), Csv (Lk 18:4) |
| ειπερ | If/Th (Rom 8:9) |
| εἴτε | A (Eph 6:8), If/Th (2 Co 1:6) |
| ἐπάν | T (Lk 11:22) |
| ἐπεί | G (Heb 11:11) |
| ἐπειδή | G (Ac 14:12), T (Lk 7:1) |
| ἐπειδήπερ | G (Lk 1:1) |
| ἕως | T (Mt 10:23) |
| ἤ | S (Jn 7:17), A (Rom 6:16), Cf (1 Co 7:9) |
| ἡνίκα | T (2 Co 3:15) |
| ἵνα | Id/Exp (2 Jn 6), Ac/Res (Rev 11:6), Ac/Pur (Ga 6:13) |
| κἀγώ | S (Jn 15:5) |
| καθά | Cf (Mt 27:10) |
| καθάπερ | Cf (1 Th 3:12) |
| καθό | Cf (2 Co 8:12) |
| καθότι | Cf (Ac 4:35), G (Ac 17:31) |
| καθώς | Cf (Eph 5:25), T (Ac 7:17) |
| καθώσπερ | Cf (Heb 5:4) |
| καί | S (Mt 7:8), P (Rom 8:30), Id/Exp (Mt 8:33), Csv (Jn 17:25) |
| καίπερ | Csv (Heb 7:5) |
| καίτοι | Csv (Heb 4:3) |
| καίτοιγε | Csv (Jn 4:2) |
| κἀκεῖνος | S (Jn 7:29), P (Mt 15:18) |
| κἄν | If/Th (Lk 12:38), Csv (Mt 26:35) |
| μέντοι | Csv (Jn 12:42) |
| μέχρι | T (Ga 4:19) |
| μήδέ | S (Lk 12:22), P (Mt 10:14) |
| μήποτε | Ac/Pur (Heb 2:1) |
| μήτε | S (Mt 5:34-35) |
| ὅθεν | ∴ (1 Jn 2:18), L (Mt 25:24) |
| ὁπότε | T (Lk 6:3) |
| ὅπου | L (Jas 3:16) |
| ὅπως | Id/Exp (Ac 25:3), Ac/Pur (2 Th 1:12) |
| ὅταν | T (Col 3:4) |
| ὅτε | T (Php 4:15) |
| ὅτι | Id/Exp (2 Pe 3:5), G (1 Pe 5:7) |
| οὗ | L (Rev 17:15) |
| οὐδέ | S (Mt 7:18), P (Mt 6:26), If/Th (Mt 6:15) |
| οὐκοῦν | ∴ (Jn 18:37) |
| οὖν | ∴ (2 Co 12:9) |
| οὔτε | S (Ac 2:31), P (Mt 12:32) |
| οὕτως | Ac/Mn (1 Co 8:12), Cf (Lk 24:24) |
| πλήν | -/+ (Ac 27:22), Csv (Mt 18:7) |
| πόθεν | Q/A (Jas 4:1), L (Rev 2:5) |
| πότερον | A (Jn 7:17) |
| πρίν | T (Ac 25:16) |
| τέ | S (Ac 2:43), P (Ac 5:19) |
| τοιγαροῦν | ∴ (1 Th 4:8) |
| τοίνυν | ∴ (Heb 13:13) |
| τότε | P (Mt 5:24), T (Mt 24:30) |
| ὡς | Cf (Eph 5:23), Ac/Pur (Lk 9:52), T (Jn 11:6) |
| ὡσεί | Cf (Rom 6:13) |
| ὥσπερ | Cf (Rev 10:3) |
| ὥστε | ∴ (Php 4:1), Ac/Res (1 Th 1:8), Ac/Pur (Mt 10:1) |

---

## Inverted index: relationship → conjunctions

Useful for the reverse UI affordance ("what would signal a Ground here?").

| Relationship | Conjunctions |
|---|---|
| **S** (Series) | ἤ, κἀγώ, καί, κἀκεῖνος, μήδέ, μήτε, οὐδέ, οὔτε, τέ, δέ |
| **P** (Progression) | δέ, καί, κἀκεῖνος, μήδέ, οὐδέ, οὔτε, τέ, τότε |
| **A** (Alternative) | εἴτε, ἤ, πότερον |
| **Ac/Mn** (Action-Manner) | οὕτως |
| **Cf** (Comparison) | ἤ, καθά, καθάπερ, καθό, καθότι, καθώς, καθώσπερ, οὕτως, ὡς, ὡσεί, ὥσπερ |
| **-/+** (Negative-Positive) | ἀλλά, δέ, πλήν |
| **Id/Exp** (Idea-Explanation) | γάρ, δέ, εἰ, ἵνα, καί, ὅπως, ὅτι |
| **Q/A** (Question-Answer) | εἰ, πόθεν |
| **G** (Ground) | γάρ, διότι, ἐπεί, ἐπειδή, ἐπειδήπερ, καθότι, ὅτι |
| **∴** (Inference) | ἄρα, διό, διοπερ, διότι, ὅθεν, οὐκοῦν, οὖν, τοιγαροῦν, τοίνυν, ὥστε |
| **BL** (Bilateral) | διό |
| **Ac/Res** (Action-Result) | ἵνα, ὥστε |
| **Ac/Pur** (Action-Purpose) | ἵνα, μήποτε, ὅπως, ὡς, ὥστε |
| **If/Th** (Conditional) | ἄρα, ἐάν, ἐάνπερ, εἰ, ειπερ, εἴτε, κἄν, οὐδέ |
| **T** (Temporal) | ἄχρι, ἐάν, ἐπάν, ἐπειδή, ἕως, ἡνίκα, καθώς, μέχρι, ὁπότε, ὅταν, ὅτε, πρίν, τότε, ὡς |
| **L** (Locative) | ὅθεν, ὅπου, οὗ, πόθεν |
| **Csv** (Concessive) | ἀλλά, εἰ, καί, καίπερ, καίτοι, καίτοιγε, κἄν, μέντοι, πλήν |
| **Sit/R** (Situation-Response) | *(none listed)* |

Note `Sit/R` has no conjunction signal on this sheet — consistent with its definition
(the sheet lists only "and" for it in the relationships PDF). It cannot be suggested
lexically at all.

---

## Extraction method and confidence

The source PDF embeds subset fonts with custom encodings; naive text extraction
returns garbage. This table was produced by:

1. Parsing the PDF's `ToUnicode` CMaps to recover real Unicode per font.
2. Tracking `Tf`/`Td`/`TD`/`Tm` operators to recover x/y position per text run.
3. Clustering runs into rows, then into three column groups
   (conjunction ≈ x66-110/235-265/400-425, relationship ≈ x120-150/285-310/450-475,
   reference ≈ x165-195/330-355/495-515).
4. Assigning each relationship/reference row to its nearest conjunction label by y-distance
   (conjunction labels are vertically centred against their group, so nearest-neighbour
   is correct rather than strictly-below).

**Confidence: good but not verified exhaustively.** Spot-checks are linguistically
sound throughout (γάρ→Ground, οὖν→Inference, ἵνα→Purpose, καίπερ→Concessive,
ὥστε→Result). Two entries required manual repair where a conjunction glyph and a
neighbouring column's label merged during extraction (`ἵνα`/`Csv`, `οὐδέ`/`-/+`).

**Before shipping this as product data, verify against the source PDF visually.**
The extraction script lives in the session scratchpad only and was not retained —
the outputs (`greek-conjunctions.json`, this file) are the artifacts.
