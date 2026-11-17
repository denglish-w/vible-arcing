# Contract: Word Details Panel

This is the user-facing contract for the panel shown when a word is selected.

**Terms.** The spec calls this the **word details**. On wide screens they show in a popover anchored to the word, and on phones in a bottom sheet. Older docs call it the "word bubble". This contract says "panel" for either form. One component, `src/components/reading/word-detail.tsx`, renders it. The arcing editor (spec 007) and the diagramming view (spec 008) MUST reuse that component with the same props, so the facts cannot differ between views (FR-017).

## Props (additions)

| Prop | Type | Notes |
|---|---|---|
| `strong` | `string \| undefined` | The word's normalised source value. |
| `entry` | `{ key: number; headword: string; definition: string } \| null \| undefined` | Resolved by the caller from the chapter payload. `null` means no entry, and `undefined` means the facts are unavailable (FR-021). |
| `occurrences` | `number \| undefined` | The lemma's count. |
| `onOccurrences` | `(() => void) \| undefined` | Supplied only once spec 014 exists. |

## Order and labels

The new facts follow the existing heading, lemma, gloss and morphology list. All labels are visible text.

1. **Strong's number**: a `dt`/`dd` row in the existing `dl`, for example `G3004` or `G1537 + G4053`. The row is omitted when `strong` is absent (FR-010).
2. **Occurrences in the New Testament**: a `dt`/`dd` row, for example `once` or `2,335 times`. It is omitted when `occurrences` is undefined.
   - Without `onOccurrences`, it is plain text, with no button role, link styling or focus stop (FR-008).
   - With `onOccurrences`, it becomes a `<button>` whose accessible name includes the label and the count. Spec 014 owns what the button does.
   - Open with spec 014: 013 FR-008 says the count becomes a control that opens stepping, while 014 FR-023 says the stepper sits beside the count. Both fit this prop, and the final layout is decided when 014 is planned.
3. **Lexicon**: a section headed "Lexicon".
   - When there is an entry, it shows the headword in `lang="grc"`. If `entry.key` is not one of the word's own numbers, it adds `(G<key>)` beside the headword (FR-004). The definition follows in a paragraph with `lang="en"`.
   - When `entry` is `null`, it shows one sentence: "The Dodson lexicon has no entry for this word."
   - When `entry` is undefined, the whole section is omitted, and so is any statement about it.

## Must never appear

The panel must never show any of the following (FR-009, SC-004):

- a sense marked as the one meant in this verse;
- a syntactic role or a semantic domain;
- Louw–Nida data;
- a Strong's label with no value;
- an empty definition area, or a loading indicator in normal use.

## Layout and interaction

- **Wide screens**: the panel's height stays bounded (60vh, unchanged) and its content scrolls.
- **Phone width (< 768px)**: the panel is a bottom sheet capped at 50dvh. Opening it scrolls the selected word into view above the sheet, and the sheet scrolls to the end of the definition (FR-012, SC-006).
- **Opening, closing and focus return**: unchanged from spec 002 (FR-013). With focus in the panel, the arrow keys and Page Up/Down scroll it.
- **Theming**: theme tokens and serif type in light, dark and sepia (FR-014). Every new fact is told apart by its label, never by colour alone.

## Learning mode (spec 010)

In Learning mode the panel is not opened at all, and the chapter payload holds none of these props' data (FR-016).
