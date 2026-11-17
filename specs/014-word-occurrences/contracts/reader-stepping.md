# Contract: Stepping in the reader (UI)

What a user, assistive technology and the browser history observe. The run state machine is in [../data-model.md](../data-model.md#state-transitions).

## The stepper (inside the word popover)

Rendered by `OccurrenceStepper` (`src/components/reading/occurrence-stepper.tsx`) below the lemma in `WordDetail`, only when the page supplied `occurrences`.

| Lemma total | Shows |
| --- | --- |
| 1 | "Only occurrence in the New Testament (1 of 1)", with no step controls (FR-010). |
| > 1 | `[‹ Previous]  Occurrence 36 of 147 · Romans 8:3  [Next ›]` |

- **Controls**: `<button>`, accessible names "Previous occurrence" and "Next occurrence", `aria-keyshortcuts="["` and `"]"`, tooltip "Previous occurrence ([)" and "Next occurrence (])". The hit area is at least 24×24 CSS px (WCAG 2.2 AA 2.5.8), reusing the existing `Button` sizing for touch (FR-020).
- **Ends**: at the first occurrence Previous, and at the last Next, has `aria-disabled="true"`. It stays focusable, looks unavailable through `.button[aria-disabled="true"]` (the existing `.button:disabled` rule does not match it), and activating it does nothing (FR-009).
- **Position text**: plain text with the reference in book, chapter and verse form, not a live region.
- **Styling**: tokens only, serif, rubric red only for state (FR-025, DESIGN.md).

## Keyboard

| Key (focus inside the popover) | Effect |
| --- | --- |
| `]` | Next occurrence (same as the Next control). |
| `[` | Previous occurrence. |
| Escape (1st) | Closes the popover; focus goes to the **stepped-to** word (US2 scenario 6). The mark stays. |
| Escape (2nd, on the marked word) | Clears the mark and removes `?w` with `replaceState`. |

The keys are ignored with Ctrl, Alt or Meta held, during IME composition, or when the event target is an editable field (FR-018). There is no global listener: with no popover open, or in Learning mode, nothing happens (FR-024).

## After every step

These apply to steps only. Opening an address with `?w` marks the word and scrolls it into view, but does not open the popover, move focus or announce (research R3).

1. The target word gets `data-current-occurrence`. Any previous mark is removed, so exactly one word is marked (FR-008).
2. The target is scrolled to the centre: `behavior: "smooth"`, or `"auto"` under `prefers-reduced-motion: reduce` (FR-022).
3. Its popover opens with the stepper. Focus goes to the control matching the step's direction, even if that control is now unavailable (FR-019).
4. The live region in `src/app/read/layout.tsx` announces "Occurrence {n} of {total}, {Book} {chapter}:{verse}" exactly once, and only if no later step has been requested (FR-017, SC-005).
5. The address becomes `/read/<slug>/<chapter>?w=<id>` (FR-012).

## Mark styling

`.word[data-current-occurrence]`: `background: var(--rose-highlight)` plus `outline: 2px solid var(--primary); outline-offset: 1px`. That is two cues, in all three themes (FR-007, SC-006). It is distinct from `.word[data-state="open"]` and from part-of-speech underlines.

## History and navigation

| Situation | History operation | Back then goes to |
| --- | --- | --- |
| First step of a run, same chapter | `replaceState(origin + ?w=start)` then `pushState(target)` | the origin, starting word marked |
| First step of a run, other chapter | `replaceState(origin + ?w=start)` then `router.push(target, { scroll: false })` | the origin, starting word marked |
| Later step, same chapter | `replaceState(target)` | the origin |
| Later step, other chapter | `router.replace(target, { scroll: false })` | the origin |
| Back or Forward during a run, **same chapter** | browser pop (no server render, no re-mount) | the mark follows `w` from `useSearchParams()`; the run ends and the popover closes (FR-016, SC-008) |
| Chapter link, contents, or Back across chapters during a run | unchanged (normal push or pop) | as today; the run ends (FR-016) |

The mark is always derived from the current address's `w`, read with `useSearchParams()`, never only from the server prop. A change of `w` that the stepper did not make ends the run.

- **No reload, no blank screen**: soft navigation only, and the current chapter stays visible until the next renders (FR-021). `src/app/read/` MUST NOT gain a `loading.tsx`.
- **Rapid steps**: while a cross-chapter navigation is in flight, further steps are counted. On arrival the remainder is applied from the arrived word. The final word equals the start word moved by the net number of steps, clamped at the ends (FR-017).

## Clearing the mark

The mark clears, and `?w` is removed with `replaceState`, when the user:
- selects another word (which starts a new run on its next step);
- clicks or taps outside the marked word and its popover;
- presses Escape twice;
- leaves the chapter by any route other than stepping (FR-008, FR-016).

A display change (size, typeface, theme, spacing) keeps the mark on the same word. The popover re-anchors through Radix.

## Learning mode (010)

The Learning-mode page passes `occurrences: null`, so neither the stepper nor its keys exist (FR-024, SC-009). If 010 lands after 014, its page path MUST pass `null`. If 014 lands after 010, `page.tsx` MUST skip `chapterOccurrences` when the `vible.mode` cookie is `learning`.

## Spec 013 count

When 013's details are present, its "Occurrences in the New Testament" figure sits on the same line as the position text and shows the same `total` (FR-023). Activating 013's count control moves focus to Next occurrence (013 FR-008).
