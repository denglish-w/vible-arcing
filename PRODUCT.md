# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, weighted equally for the first version:

- **Seminary students** learning Greek and exegesis, arcing and diagramming assigned passages, often against a deadline and a professor's method.
- **Pastors and teachers** who already know some Greek and arc or diagram a passage each week to prepare a sermon or lesson.
- **Serious lay Bible students** with little or no formal Greek, who need gloss and parsing help to work in the text at all.

All three come to the app to understand how a passage's argument and grammar fit together, and to keep that work.

## Product Purpose

A study tool for the Greek New Testament that brings reading, grammatical (sentence) diagramming and arcing/bracketing (discourse analysis) together. Success means a user can open a passage, read it with word-level help, diagram its sentences, and trace its argument with arcs or brackets, then come back to that work later.

## Positioning

**One study desk.** Reading, diagramming and arcing of the same passage happen in one place, and a word the user taps is followed across every view. Biblearc is the established tool in this space. The aim is to respect it and build something better, never a clone (see "Prior art" in `CLAUDE.md`).

## Operating Context

- Users work passage by passage: pick a book, chapter and verse range, then read, diagram and arc it.
- Study sessions are long and focused (coursework, sermon preparation), on laptops and on tablets with touch.
- Arcing follows the method of Daniel Fuller, John Piper and Thomas Schreiner, with 18 logical relationships plus 4 extended ones. Arcs and brackets are two renderings of one analysis.
- Sentence diagramming is a separate model (words linked by syntactic role) from arcing (propositions linked by logical relationship).

## Capabilities and Constraints

- **Text:** the SBL Greek New Testament with MACULA Greek morphology and syntax, both CC BY 4.0, with attribution shown in the app. Greek only for now.
- **Modes:** Reading (word detail, part-of-speech colouring, display settings), Diagramming and Arcing. A parsing practice mode existed in the prototype; whether it returns is undecided.
- **No interpretation (decided 2026-10-22):** the app never interprets for the user. It does not split a passage into propositions, suggest or preselect relationships, or draw diagrams automatically. Word help is limited to facts about the word: its form, dictionary form, gloss and grammar. MACULA's sentence-role labels (subject, object, modifier) are never shown, matching the prototype. The Greek conjunction table is reference material a user can open on request, like a handout. It never proposes a relationship.
- **Diagramming notation:** school-style Reed–Kellogg sentence diagrams, adapted for Greek.
- **Saved work:** arcs and diagrams are saved on a server (SQLite now, Postgres expected with accounts). There are no accounts yet, so the app is single-user and must not be deployed publicly until accounts exist.
- **Terminology:** passage, proposition, relationship, arc, bracket, diagram, baseline, modifier, SBLGNT, MACULA.
- **Open decisions:**
  - Whether the product is free and whether it is open source. Earlier project docs assume "free and open source"; that is not confirmed.
  - The product name. The wordmark is a placeholder.
  - Accounts, sharing and hosting.

## Brand Commitments

- The name is undecided and shown as `[Product Name]`.
- The Chi Rho mark with Alpha and Omega, in fixed red, is the brand mark.
- The visual system is `DESIGN.md` ("The Scholar's Desk").
- Biblearc's name, logo, code, assets and wording are never used.

## Evidence on Hand

- A design prototype (Base44 export) with source and 12 screenshots in `docs/design/base44-prototype/`.
- Reference material on the method in `docs/reference/` and `docs/source-pdfs/` (Biblearc PDFs, reference only).
- No users, testimonials, usage data or pricing exist yet. None may be invented.

## Product Principles

1. **The text is the centre.** Every view starts from the Greek passage and returns to it.
2. **One passage, many views.** Reading, diagramming and arcing share the passage and the user's selection, so moving between them never loses your place.
3. **The user interprets; the app never does.** The app supplies the text, facts about each word, reference material and tools. Every split, connection, relationship and diagram is the user's own. Automatic analysis would defeat the purpose of the product.
4. **Respect the method and its sources.** Implement arcing and diagramming faithfully from the scholarship, credit it, and learn from prior tools without copying them.
5. **Work is kept.** A user's analysis is saved reliably and can be exported.

## Accessibility & Inclusion

- **WCAG 2.2 AA** across the whole app, including the arcing and diagramming editors: contrast, full keyboard operation and screen-reader support.
- **Tablets with touch** are a first-class target. Arcing and diagramming must be fully usable without a mouse or keyboard.
- Colour never carries meaning alone (see the Two-Cue Rule in `DESIGN.md`).
