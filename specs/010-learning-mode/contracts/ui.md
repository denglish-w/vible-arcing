# Contract: Learning-mode UI

Components live in `src/components/reading/learning/` with a `*.stories.tsx` beside each, so the Storybook project renders every state in all three themes with axe checks. Visual design follows `DESIGN.md`. Copy below is indicative and is reviewed in implementation.

## Mode control (reader bar)

- A two-option control, "Reading" and "Learning", in the reader bar beside the display menu, exposed as a group of two toggle buttons with `aria-pressed`.
- Learning on: a notice below the bar says Learning mode is on and to select a word to parse (FR-002).
- In Learning mode, the display menu's part-of-speech colouring settings stay editable but have no effect until Reading mode returns, and the menu says so. The legend is not rendered (FR-004).

## Word in Learning mode

- Each word is a button labelled with its surface text only, the same as in Reading mode. No `title`, `aria-describedby`, data attribute or class reveals a category or lemma (FR-020).
- A word with a stored attempt carries no visible or announced mark on the page (marking it would hint at progress, not answers, but is out of scope).

## Parsing form (popover; bottom sheet at phone width)

| Region | Contents |
|---|---|
| Heading | Surface word (`lang="grc"`) and reference, e.g. "Philippians 1:3" |
| Previous attempt line | Only when an attempt exists: "Checked before on <date>: all agreed" or "…: n differed" (FR-026) |
| Dictionary form | Text input, `lang="grc"`, label "Dictionary form", Latin-to-Greek conversion as typed (research R8) |
| Part of speech | `<select>` with an empty first option and the 12 `FormPos` values |
| Fields | One labelled `<select>` per field from `fieldsFor`, each with an empty first option |
| Actions | "Check", "Previous word", "Next word", "Close" |
| Unsaved indicator | Shown while the outbox holds this attempt: "Not saved yet — retrying" |
| Discard confirmation | Inline, on Escape or Close with unchecked answers: "Discard your answers?" with "Discard" and "Keep editing" |

After "Check" the form shows a comparison table: one row per graded field with the user's answer, the source's value and an outcome cell holding a symbol and the word "Agrees", "Differs" or "Unanswered" (FR-033). Below it, the source's full parsing, including degree and gloss. A polite live region announces "All fields agree with the source" or "n fields differ from the source".

## Focus and keys

| Action | Behaviour |
|---|---|
| Enter or Space on a word | Opens the form; focus moves to "Dictionary form" |
| Escape in the form | Closes it (after inline confirmation if unchecked answers exist); focus returns to the word (FR-034) |
| Next / Previous word | Form reopens on the adjacent word, which is scrolled into view; focus moves to "Dictionary form" |
| Next word on the last word | Form shows "End of the chapter" with a link to the next chapter, or "End of the New Testament" after Revelation 22 (FR-031) |

## Spec 012 hook

When the English line exists, the reader does not render it while the mode is Learning (FR-036). The reader passes `mode` down so spec 012 needs no further change here.
