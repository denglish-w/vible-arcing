<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (MINOR: guidance materially expanded, no principle removed)
- Modified principles:
  - I. The User Interprets: word help now covers lexeme facts (Strong's number, lexicon entry,
    New Testament occurrence count) but never the sense chosen for this passage; adds the
    English-translation reference rule and the reveal-after-answer rule for parsing practice
  - V. Work Is Kept: covers translations, notes and practice history; one validation module per
    kind of work; word ids; no loss when accounts arrive
  - VII. Local and Single-User Until Accounts Exist → VII. Local Until Network Accounts Exist:
    local and live are two settings of one app; live mode may relax the local-only protection
    only with accounts, HTTPS and production credentials; accounts isolate work and support
    export and self-service deletion
- Added rules: Licensing and Data Constraints (licences verified before shipping, BSB as the
  default English text, Dodson blocked until its licence is recorded)
- Removed sections: none
- Templates: plan-template.md, spec-template.md and tasks-template.md read this file at runtime;
  no edits needed
- Motivated by: specs 010-learning-mode, 011-verse-translation, 012-english-line,
  013-richer-word-details, 014-word-occurrences, 015-accounts
- Follow-up TODOs (outside this file):
  - PRODUCT.md "No interpretation" bullet and CLAUDE.md "The app never interprets" and
    "Single user, local only" text must be amended to match. The governance section says this
    file follows them.
  - Record the Dodson lexicon's licence in docs/reference/data-sources.md before spec 013 ships
  - Mirror these principles in openspec/config.yaml project context if it restates them
-->

# Vible Arcing Constitution

A study tool for the Greek New Testament that brings reading, grammatical (sentence) diagramming and arcing/bracketing (discourse analysis) of the same passage together in one place. Product context lives in `PRODUCT.md`, visual rules in `DESIGN.md`, and engineering rules in `CLAUDE.md`.

## Core Principles

### I. The User Interprets; the App Never Does (NON-NEGOTIABLE)

- The app MUST NOT split a passage into propositions, suggest, preselect or rank a relationship, or draw a diagram automatically.
- Word help MUST be limited to facts about the word: surface form, lemma, gloss and morphology, plus
  facts about its lexeme (Strong's number, the lexicon entry for the lemma as a whole, and how often
  the lemma occurs in the New Testament).
- Word help MUST NOT say which sense, semantic domain or syntactic role applies in the passage at hand.
- MACULA's sentence-role labels (subject, object, modifier and the like) MUST NOT be shown.
- The Greek conjunction table is reference material the user opens on request. It MUST NOT drive or pre-fill any choice.
- A published English translation MAY be shown as reference, off by default and labelled with its
  source. It MUST NOT appear inside word help, and it MUST NOT pre-fill, suggest or check anything the
  user writes, analyses or diagrams.
- Parsing practice MAY reveal the source's morphology for a word, but only after the user has
  submitted their own answer for that word.

Rationale: the product exists so the user does the interpretive work. Automatic analysis would defeat its purpose.
Facts about a lexeme hold wherever the word appears, so showing them is not interpretation. Choosing
a sense for this verse is interpretation, and stays with the user.

### II. One Passage, Many Views

- Reading, diagramming and arcing MUST share the passage and the user's selection, so switching views never loses their place.
- Every view starts from the Greek text and returns to it.
- A word the user selects is followed across every view.

Rationale: the product's position is "one study desk", not three tools stitched together.

### III. One Analysis Model, Two Renderings

- Arcing and bracketing MUST share a single proposition model and differ only in their view layers.
- Discourse analysis (propositions linked by logical relationships) and grammatical diagramming (words linked by syntactic role) MUST stay separate models.
- An analysis is a containment tree over an ordered list of propositions, and each connection covers a contiguous range. Bilateral is one ternary node (before, supporter, after) so the structure stays a tree.
- Ground and Inference are one relationship with a direction (`follows` / `precedes`). Inverting a connection flips its direction rather than recreating it. Relationships are data records, not an enum.
- Words are identified by MACULA word ids, never by position, so saved work survives re-ingest.

Rationale: two models for one analysis drift apart. One model for two kinds of analysis conflates logic with grammar.

### IV. Faithful to the Method and Its Sources

- Arcing implements the method of Fuller, Piper and Schreiner (18 relationships plus 4 extended), with credit.
- Diagramming uses Reed–Kellogg notation adapted for Greek (`docs/reference/diagramming-notation.md`).
- Biblearc's code, assets, icons, help text, UI labels, reference-sheet wording, name and logo MUST NOT be used. Screens are designed from `DESIGN.md`, never traced from Biblearc. The same applies to `SotS1689/DA-Tool`.
- Requirements are written as user needs in our own words.

Rationale: respect prior art and build something better, not a clone.

### V. Work Is Kept

- Everything a user makes MUST be saved reliably: analyses, diagrams, translations and notes, and
  parsing-practice history. Edits apply locally first and autosave in the background.
- Each kind of saved work MUST be validated by one shared validation module for that kind before it
  is stored, whether it comes from the editor, an import or a save action.
- Users MUST be able to export their work to a file.
- Saved work that refers to words MUST refer to them by MACULA word id, so it survives re-ingest.
- A change that adds accounts MUST move existing work to its owner and MUST NOT lose it.

Rationale: coursework and sermon preparation span many sessions, and losing them is unacceptable.

### VI. Accessible on Every Device

- Every screen, including the arcing and diagramming editors, MUST meet WCAG 2.2 AA: contrast, full keyboard operation and screen-reader support.
- Touch tablets are a first-class target. Every editor MUST be fully usable without a mouse or keyboard.
- Colour MUST NOT carry meaning alone (the Two-Cue Rule in `DESIGN.md`).
- The UI follows `DESIGN.md` ("The Scholar's Desk"): colours come only from tokens with light, dark and sepia values, rubric red is the single accent in the chrome, and type is serif only.
- The app MUST feel as fast as a single-page app, whatever the server architecture.

Rationale: students, pastors and lay readers study for long sessions on laptops and tablets.

### VII. Local Until Network Accounts Exist

- The server binds to `127.0.0.1` and refuses non-local `Host` headers unless `ALLOW_UNAUTHENTICATED_NETWORK=1` and `ALLOWED_HOSTS` are set.
- This protection MUST NOT be weakened by any change that does not also add accounts built and
  reviewed for network use.
- Running locally and running live MUST be two settings of one app, not two code paths, so the
  sign-in, email and account flows that go live are the ones tested locally.
- In local mode this protection stays exactly as it is. Live mode MAY relax it only when accounts are
  enabled, and MUST refuse to start without HTTPS and production credentials for every enabled
  sign-in method.
- Accounts MUST keep each person's saved work, settings and practice history apart in every view,
  list, export and direct address. A request for another account's record MUST look the same as a
  request for a record that does not exist.
- Users MUST be able to export their work and delete their account, with all its work, from inside the
  app.

Rationale: without network accounts, anyone who can reach the server can read and change all saved
work. Building the accounts that go live, and testing them locally, means publishing is configuration
and deployment, not a rewrite.

## Licensing and Data Constraints

- The text is SBLGNT with MACULA Greek morphology and syntax (both CC BY 4.0). Their attribution notices MUST be shown in the app and kept in the repo, using the exact strings in `docs/reference/data-sources.md`. The UI reads attribution from ingest metadata.
- UBS attributes (`@ln`, `@domain`) MUST be stripped at ingest.
- Westminster morphology or syntax obtained directly from the Groves Center (CC BY-NC-ND) MUST NOT be bundled. Only the MACULA-distributed copy may be used.
- The Biblearc PDFs in `docs/source-pdfs/` are reference only and are never redistributed.
- No dataset (an English translation, a lexicon or any other) may ship until its licence is verified and
  recorded in `docs/reference/data-sources.md`. Every shipped dataset MUST be credited on the credits
  page through ingest metadata, even when its licence does not require attribution.
- The Berean Standard Bible (public domain since 2023-04-30) is the default English text.
- The Dodson Greek–English lexicon's licence is not yet recorded, so it MUST NOT ship until it is.
- Taxonomy and conjunction data are JSON in `docs/data/`. TypeScript types are generated from them, never written by hand.

## Development Workflow and Quality Gates

- **Specs.** OpenSpec (`openspec/`) and Spec Kit (`specs/`) both hold specs. Where they disagree, OpenSpec wins, and `design.md` wins over other docs. A change to a feature updates both copies of its spec.
- **Gates.** Every push passes `npm run lint`, `npm run typecheck` and `npm run format:check`. CI also runs the tests (unit tests, plus every Storybook story rendered with axe checks), a check that migrations are up to date, the Storybook build, `lat check`, and a Docker build with a smoke test.
- **Docs.** `lat.md/` describes what is implemented and is updated in the same change as the behaviour it describes.
- **Parallel agents.** Agents in separate worktrees follow the claim-and-check protocol in `lat.md/agent-coordination.md`.

## Governance

This constitution records the project's non-negotiable rules. It is drawn from `PRODUCT.md`, `DESIGN.md` and `CLAUDE.md`, and where it conflicts with them it is amended to match. Spec Kit plans MUST pass the Constitution Check against these principles before research starts and again after design, and any violation MUST be justified in the plan's Complexity Tracking.

Amendments: edit this file, bump the version (MAJOR when a principle is removed or redefined, MINOR when one is added or materially expanded, PATCH for wording), and update the Sync Impact Report.

**Version**: 1.1.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-16
