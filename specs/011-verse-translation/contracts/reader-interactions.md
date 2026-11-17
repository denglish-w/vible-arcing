# Reader Interaction Contract

The feature extends the existing reading column with quiet per-verse editing. DESIGN.md remains the visual authority; these are behavioral requirements for implementation and stories.

## Composition and ordinary activation

A labelled Translate switch defaults off and remembers its value through independently validated settings. Disable it with an explanation when corpus data is unavailable; keep saved work untouched. While on, show the active translation name/picker and a summary save status above the chapter. Each verse retains Greek in reading order, followed by optional reference English from 012 and then the user's segment fields and grouping entries. No English or word-help content flows into these fields.

Use labelled textareas for translation/rendering and notes, growing with multiline text; show the stated field limits and near-limit count. Use normal reader serif typography, theme tokens, hairline rules and existing spacing. At narrow widths stack controls and fields without horizontal page scrolling. Every segment/group label includes its verse even when Greek verse numbers are hidden. Pending selections, boundaries and grouping marks use shape/glyph plus color; paired small endpoint glyphs are distinct from discourse-analysis bracket connectors.

Outside an explicit split/group mode, click, tap or Enter opens the existing word detail popover. Preserve POS underlines, font/spacing settings, punctuation and word ids. Translation fields and controls use English language semantics rather than inheriting `lang=grc` from Greek. Share word rendering instead of forking a second independent reader.

## Splitting and merging

Split opens an explicit per-verse mode with equal buttons at each adjacent-word boundary, labelled “Split verse N after [word]”. Show no first/last exterior boundary. A boundary inside a grouping is still presented equally; activation explains refusal without mutating. Tab/Enter or tap chooses a boundary, Escape/Cancel exits and returns focus to Split. At completion focus the new segment's translation field and announce labels.

Each adjacent segment pair exposes Merge. If corresponding translation or notes fields both have content, preview the joined text and ask confirmation; otherwise apply directly. Preserve reading order with two-newline separators, reassign groupings and announce labels. Cancel changes nothing; overflow retains all candidate text and gives a fix/download path.

## Grouping selection and navigation

Ordinary click followed by Shift-click selects an inclusive word range; mouse drag across words selects after a movement threshold and suppresses the resulting click popover. A single click still opens detail. In explicit Start grouping mode the first and second taps choose endpoints; ordinary touch scrolling is never captured as drag. Keyboard Start grouping focuses a word, Space sets the anchor, Shift+Arrow extends in reading order, and Tab reaches Group/Cancel. Provide labelled endpoint controls as an equivalent keyboard/touch path if the inline range is awkward.

Reverse selections normalize to reading order. Show Group/Cancel for the pending range; Group explains single-word, cross-verse, cross-segment, partial-overlap or duplicate refusal and keeps the selection editable. Escape clears without saving. New grouping fields are empty. Mark order for nested groups is outer-open first and inner-close first; each focusable mark names start/end, verse and group. Activating either mark focuses its entry; a “Back to phrase” control returns focus to its start mark. Deleting one grouping removes only that grouping and returns focus to its phrase.

## Picker and record management

Prefer native select for the translation choice plus labelled management buttons; reuse installed popover/dropdown primitives when a composed picker is required. Announce purpose, active name and translation count. Provide a bounded scroll area for dozens of choices. Escape closes/cancels without selection changes; focus returns to its trigger. Keyboard focus stays visible, no hover-only actions, and touch targets meet the WCAG 2.2 AA minimum.

Create starts empty; rename uses a labelled field with a limit and inline reason on refusal. Duplicate operates on the user's selected source only. Delete always names the record and requires confirmation, including any unsaved snapshot; cancel retains everything. Switch first requests a flush to the old id, then activates the new session. If the old session is still pending, failed or blocked, keep it in a visible “Unsaved work in [name]” area with return, retry and download; it must not be hidden merely because the new record says Saved.

## Save, leave and mismatch states

Show Saved, Saving, Not saved plus pending feedback using polite live status. Conflict offers overwrite, save copy and download; deleted/permanent refusal explains why and offers copy when valid and download always. Do not announce every keystroke or steal focus on background save. Hiding Translate retains the save/recovery summary outside the hidden fields.

Mount the client session provider and a global recovery summary in `src/app/layout.tsx`, above all route children; do not key/remount them on navigation. Before any internal departure initiate a flush, retaining pending/failed sessions regardless of its outcome. Chapter links, the book title, logo/home, `/work`, credits and browser Back/Forward must retain those sessions; destination pages show named status plus return/retry/download controls. All dirty sessions also participate in beforeunload for reload, tab close or external/full-document departure. Never dispose the last copy of failed work silently.

If only Greek text/punctuation changes with identical ordered word ids, preserve saved content on read/export and prepare refreshed canonical source snapshots before the next edit save is validated. Do not change user text or structure or demand structural repair for that case. For missing/reordered ids, show the affected verse, segment/group and word ids. Keep all text visible and the original download available. Offer removal of invalid grouping or a confirmed verse rebuild preview using current words. Explicitly preserve displaced rendering/notes in the repair notes; no automatic cleanup on load. Corpus unavailable disables structural changes and save, while existing recovery/export remains available.
