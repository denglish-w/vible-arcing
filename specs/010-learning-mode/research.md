# Research: Learning Mode (Parsing Practice)

Findings checked on 2026-11-16 against the committed corpus (`corpus/v1`, 137,741 words), the reader code (`src/app/read/[book]/[chapter]/page.tsx`, `src/components/reading/greek-text.tsx`), the saved-work store (`src/db/schema/app.ts`, `src/db/work.ts`, `src/app/(work)/actions.ts`) and the Next.js 16.4.6 docs in `node_modules/next/dist/docs/`.

## R1. Keeping the answer out of the page (FR-004, FR-020, SC-002)

- **Finding**: The reading page maps every word to `{ id, v, text, after, lemma, gloss, pos, m }` on the server and passes it to the client `GreekText`. The whole chapter's morphology therefore travels in the page's server-component payload, which Next.js inlines as `<script>self.__next_f.push(...)</script>` tags in the initial HTML. Hiding it with CSS or client state would still leave it in the page source and in memory, which FR-020 forbids.
- **Decision**: Learning mode is decided on the server. The reading page reads the mode from a cookie and, in Learning mode, sends a lean chapter: `{ id, v, text, after }` only. Lemma, gloss, part of speech and morphology for a word reach the browser only in the response to that word's check (R3).
- **Decision**: Switching from Reading to Learning sets the cookie through a server action and then reloads the document (`location.reload()`), so the inline payload of the Reading render, which holds the chapter's morphology, is discarded. Switching from Learning to Reading reveals nothing, so it uses the action's `refresh()` without a full reload.
- **Rationale**: A server-side decision is the only way to make "not in the page" true by construction. The reload costs one local page load (the store reads a chapter in about 6 ms; spec 009 research), which is acceptable for a deliberate mode switch, and chapter navigation inside Learning mode stays a client-side navigation because every Learning render is already lean.
- **Alternatives considered**: (a) Client-side hiding: fails FR-020. (b) `?mode=learning` in the URL: shareable, but FR-003 needs the choice to persist across visits, so a cookie is needed anyway, and two sources of truth would disagree. (c) Fetching word facts on demand in Reading mode too, so no page ever holds morphology: a larger change to the reader, slower word popovers, and not needed for this feature.

## R2. Where the mode choice lives (FR-003, FR-005)

- **Decision**: A cookie `vible.mode` with value `learning` or `reading`, `SameSite=Lax`, `HttpOnly`, path `/`, max age one year. Missing or any other value means Reading. It is set only by the `setReadingMode` server action.
- **Rationale**: Next.js allows reading cookies in a server component and setting them only in a server function or route handler (`cookies.md`), which matches R1. Display settings stay in `localStorage` (`vible.display`) and are never touched by the mode switch, so SC-009 holds by construction.
- **Accounts (spec 015)**: when accounts exist, the mode becomes part of the account's settings. Until then it is per browser, as FR-003 says.

## R3. Where grading happens (FR-014 to FR-019, FR-023)

- **Decision**: Grading runs on the server in a `checkParse` server action. It loads the word from the corpus store, grades the answer with the shared pure module `src/lib/learning/grade.ts`, and returns the comparison together with the source's lemma and full parsing. The client never holds the source before this response.
- **Decision**: Recording is a separate step. The client sends the checked attempt to `recordAttempt` through a small outbox that retries with backoff (R6). The server re-validates and re-grades on record and stores what it computed, never the client's claimed source values.
- **Consequence**: Checking needs the server. If the check itself cannot reach it, the form keeps the answers and offers to check again, shows no source value and saves nothing (spec edge case). The unsaved indicator and retry apply only to a check that succeeded and whose save then failed.
- **Rationale**: Splitting grade from record satisfies FR-023: the result appears after one fast local round trip, and a failed save never hides it. Re-grading on record keeps the stored outcome honest even if the client is tampered with.
- **Alternatives considered**: Grading in the browser would require the source to be in the page (fails R1). One combined grade-and-save action would make a storage failure also lose the result shown, against FR-023.

## R4. Mapping the corpus to the form (FR-009 to FR-011, FR-016, FR-017)

Measured value inventory across the whole corpus:

| Field | Values in the corpus |
|---|---|
| `pos` | noun, verb, det, conj, pron, prep, adj, adv, ptcl, num, intj |
| tense | present, imperfect, future, aorist, perfect, pluperfect |
| voice | active, middle, passive |
| mood | indicative, subjunctive, optative, imperative, participle, infinitive |
| person | first, second, third |
| number | singular, plural |
| gender | masculine, feminine, neuter |
| case | nominative, genitive, dative, accusative, vocative |
| degree | comparative, superlative |

- **Decision**: The form's closed lists equal the corpus values exactly, so no translation table is needed for fields. Part of speech maps one to one: `det` → article, `conj` → conjunction, `pron` → pronoun, `prep` → preposition, `adj` → adjective, `adv` → adverb, `ptcl` → particle, `num` → numeral, `intj` → interjection, `noun` and `verb` unchanged. The form's extra "participle" agrees with `verb` + mood `participle`.
- **Decision**: `fieldsFor(pos, mood)` in `src/lib/learning/fields.ts` is the single definition of which fields apply (FR-010). The form uses it to show fields, `grade.ts` uses it to decide what is graded, and `validate.ts` uses it to refuse fields that do not apply (FR-024).
- **Decision**: A source field that is absent for a word grades "not applicable" as agreeing and any value as differing (FR-017). A form field the user left empty grades as differing and is labelled unanswered (FR-018).
- **Rationale**: One table of applicability used by the form, the grader and the validator cannot drift. If a re-ingest ever introduces a value outside these lists, the validator refuses attempts using it and a unit test over the committed corpus fails, so the drift is caught before release.

## R5. Comparing the dictionary form (FR-015, SC-006)

- **Decision**: `normaliseLemma` decomposes to NFD, removes combining marks (accents, breathings, iota subscript, diaeresis), lower-cases, turns final ς into σ, and strips elision marks (’ ʼ ᾿ ') and other punctuation and whitespace. Both the user's text and the source lemma are normalised before comparison.
- **Rationale**: SC-006 requires unaccented input to grade the same as accented input. Removing iota subscript too is deliberate: students commonly omit it, and grading is about recognising the lexeme, not orthography. Recorded as an assumption in the data model.
- **Alternatives considered**: Exact match (fails SC-006); edit-distance tolerance (would accept wrong lexemes such as λέγω for λείπω).

## R6. Saving attempts without blocking (FR-023, FR-025, FR-027)

- **Decision**: A new append-only outbox, `src/lib/learning/outbox.ts`, holds checked attempts until `recordAttempt` confirms them. Each attempt gets a client-generated UUID, so a retried send is idempotent (the server inserts or ignores by id). Retries back off as in `src/lib/autosave.ts`. While anything is pending, the form shows the unsaved indicator and a `beforeunload` warning is registered, matching saved-work behaviour.
- **Rationale**: The existing `createAutosave` saves one evolving document with optimistic revisions. Attempts are immutable and append-only, so revisions and conflicts do not apply. A separate, smaller outbox is simpler than bending the document loop.
- **Alternatives considered**: Reusing `createAutosave` with a growing attempts list as the "document" (needless conflict handling, the whole list resent on every check).

## R7. Pre-filling from the last attempt (FR-026, SC-005)

- **Decision**: In Learning mode the reading page also loads, for the chapter's word ids, the latest attempt per word: the user's own answers, when it was checked and whether every field agreed. It never loads the source values stored with the attempt, because FR-026 forbids showing them before a new check.
- **Rationale**: One indexed query per page render (`(word_id, created_at)`) avoids a round trip each time a word opens, which keeps opening a word instant. The user's own answers and the all-agreed flag are permitted by FR-026.
- **Note**: An all-agreed flag on a pre-filled form tells the user their earlier answer matched, which can reveal the answer. The spec requires it (FR-026, User Story 2 scenario 2), so it is kept.

## R8. Typing Greek with a Latin keyboard (FR-008, User Story 5)

- **Decision**: Convert as the user types, using the single-letter Beta Code letter map (a b g d e z h q i k l m n c o p r s t u f x y w → α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω). Σ becomes ς at the end of a word, both when typing a space and when checking. Greek characters typed directly pass through unchanged, so an operating-system Greek keyboard also works. Diacritics are not typed, because grading ignores them (R5).
- **Rationale**: Beta Code is the letter map Greek students most often meet. A map of single letters avoids the clash of digraphs ("th" could be θ or τη).
- **Alternatives considered**: An on-screen Greek keyboard (more UI to build and make accessible; possible later); digraph schemes (ambiguous).

## R9. The parsing form's controls (FR-032 to FR-035)

- **Decision**: The form opens in the existing Radix popover (`src/components/ui/popover.tsx`), anchored to the word as the word-detail popover is today, and becomes a bottom sheet at phone width. Part of speech and each field are native `<select>` elements with visible labels. Agreement and difference are shown as a word ("Agrees" / "Differs") plus a symbol, with colour only as a third cue. The outcome is announced through a polite live region. Confirming discard on Escape is done inline in the form, never with a browser dialog.
- **Rationale**: Native selects give the best keyboard, screen-reader and touch behaviour (OS pickers on tablets) for closed lists, with no new dependency. The Two-Cue Rule in `DESIGN.md` requires the non-colour cue.
- **Alternatives considered**: Segmented radio buttons per field (more touch-friendly for short lists, but wide; reconsider during design review); a combobox library (new dependency).

## R10. Export (FR-028)

- **Decision**: A route handler `GET /api/attempts/export` returns all attempts as a JSON file (`parse-attempts-export`, format version 1). Each entry carries the reference, the word's text, the edition and everything stored with the attempt. It reuses the host and same-origin checks of `src/app/api/analyses/[id]/export/route.ts`.
- **Rationale**: Matches the existing analysis export, so the security checks and download behaviour are already proven.

## R11. Storage

- **Decision**: A new `parse_attempts` table in `app.sqlite`, added by a Drizzle migration (`npm run db:generate`), separate from `analyses` and `diagrams`. Attempts store the word id plus the reference and surface text at check time, so an attempt whose word disappears after a re-ingest still exports meaningfully (FR-027).
- **Rationale**: Attempts are a different kind of saved work with a different lifecycle (append-only, never edited). The saved-work store already keeps distinct kinds in distinct tables.
- **Accounts (spec 015)**: spec 015 adds an owner column to every saved-work table, including this one. Nothing here needs to anticipate it beyond keeping all access through `src/db/attempts.ts`.
