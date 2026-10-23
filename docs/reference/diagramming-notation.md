# Diagramming notation

The notation the app's sentence diagrams use: school-style Reed–Kellogg diagramming, adapted for Koine Greek. This is our own description of a public-domain method. Reed and Kellogg published it in their school grammars in the 1870s, and a way of drawing cannot be owned. Specific charts, handouts and textbook drawings are someone's expression, so the symbols here are described and drawn by us, not copied from any chart (see "Prior art" in `CLAUDE.md`).

**The user places every word.** The notation defines what each line means, not where a word goes. The app never positions words automatically and never shows MACULA's sentence-role labels (see `PRODUCT.md`). It does show facts about each word (dictionary form, gloss, case, tense and so on), which the user reads to decide where the word belongs.

Status: draft for the diagramming change. Items marked **Open** are decisions that change will settle.

## Core lines

| Element | Drawing | Meaning |
|---|---|---|
| Baseline | A horizontal line | Carries one clause's core: subject, verb, and any object or complement |
| Subject divider | A vertical line that crosses the baseline | Separates the subject (left) from the predicate (right) |
| Object divider | A vertical line that sits on the baseline and stops there | Separates the verb from its direct object |
| Complement divider | A line slanting back toward the subject, sitting on the baseline | Separates a linking verb (such as εἰμί or γίνομαι) from a predicate nominative or adjective |
| Modifier line | A slanted line hanging below the word it modifies | Carries an adjective, adverb, article or other single-word modifier |
| Phrase line | A slanted line with a horizontal line at its foot | The slant carries a preposition, and the horizontal carries its object |
| Stilt | A short vertical post with a raised horizontal line on top, standing in a slot | Lets a whole phrase or clause fill one slot, such as a noun clause as subject or object, or a substantival infinitive or participle |
| Connector | A dashed line | Joins compound parts or clauses, and carries the joining word (καί, ὅτι, ἵνα and so on) |
| Fork | A line splitting into parallel branches | Holds compound subjects, verbs, objects or modifiers, with the conjunction on the dashed connector between branches |

## Greek adaptations

Greek differs from English in ways that matter for diagramming. These are the conventions the notation adopts.

### Word order
Words keep their Greek form and are placed by function, not by position in the verse, so the diagram reorders the sentence. The passage card under the canvas keeps the original order, and placed words fade there, so nothing is lost.

### Implied subjects
A finite verb carries its subject in its ending (λέγει, "he says"). When no explicit subject is present, the subject slot shows a placeholder. **Open:** whether that is an empty slot, an "×", or a bracketed English pronoun such as "(he)".

### The article
The article goes on a modifier line under the word it belongs to. When the article turns another word or phrase into a noun (τὰ ἄνω, "the things above"), the whole construction stands on a stilt in the slot it fills, with the article on a modifier line under it.

### Cases on modifier lines
- **Genitive** modifying a noun: a modifier line under that noun.
- **Dative of indirect object:** a modifier line under the verb with a short horizontal line at its foot, like a phrase line with no preposition.
- **Adverbial accusative, dative or genitive** (time, manner, means): a modifier line under the verb.
- **Vocative** (direct address): on its own short line above the clause, not connected to it.

### Participles
- **Adjectival** (attributive): on a bent modifier line under the noun it describes. The participle sits on the bend, and its own objects and modifiers attach to the horizontal part.
- **Substantival:** on a stilt in the slot it fills.
- **Adverbial** (circumstantial): on a bent modifier line under the main verb.
- **Genitive absolute:** its own small baseline, with participle and genitive subject, joined to the main verb by a dashed connector.
- **Open:** whether to mark adverbial participles differently from adjectival ones, beyond where they attach.

### Infinitives
- **Complementary** (after δύναμαι, θέλω, δεῖ and similar): on a stilt in the object or complement slot.
- **Purpose or result** (with or without εἰς τό, πρὸς τό or ὥστε): on a phrase line under the main verb, with the introducing word on the slant.
- **Subject of an infinitive** (accusative): before the infinitive on the stilt's own small baseline.

### Clauses
- **Relative clauses:** their own baseline below the main clause, with a dashed connector from the relative pronoun to its antecedent.
- **Noun clauses** (ὅτι "that", ἵνα in content use): on a stilt in the subject or object slot, with the conjunction on the stilt's post.
- **Adverbial clauses** (ἵνα purpose, ὅτι and γάρ reason, εἰ condition, ὅτε time and so on): their own baseline below, joined to the main verb by a dashed connector carrying the conjunction.
- **Coordinate clauses** (καί, δέ, ἀλλά): parallel baselines joined by a dashed connector carrying the conjunction.

### Particles
Discourse particles that do not modify one word (γάρ, οὖν, δέ in its connective use, μέν) sit on the connector that joins their clause to the previous one. Negatives (οὐ, μή) go on a modifier line under the word they negate.

## Rendering rules

- Lines use the design tokens: ink for baselines and dividers, rubric red for connectors and the user's current selection, and modifier ochre for modifier lines (see `DESIGN.md`, "Diagram workspace"). Every distinction also holds without colour, through line style (solid, dashed or slanted), per the Two-Cue Rule.
- Greek on lines uses the workspace Greek face (Gentium Plus).
- Every symbol must be placeable and editable by touch and by keyboard (see `PRODUCT.md`, Accessibility).

## Open decisions for the diagramming change

- How implied subjects are shown.
- Whether adverbial participles get a distinct mark.
- How to treat textual variants and ellipsis, meaning words the reader must supply.
- Whether the user can add an English gloss under a placed word.
- How a diagram spans several verses or sentences: one canvas, or one diagram per sentence.
