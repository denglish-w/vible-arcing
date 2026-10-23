---
name: "[Product Name]"
description: A scholar's desk for reading, diagramming and arcing the Greek New Testament.
colors:
  parchment: "hsl(40 36% 93%)"
  cream: "hsl(44 50% 96%)"
  ink: "hsl(30 14% 15%)"
  rubric-red: "hsl(0 62% 32%)"
  chi-rho-red: "hsl(357 60% 49%)"
  vellum-shade: "hsl(40 28% 88%)"
  faded-ink: "hsl(38 14% 40%)"
  muted-wash: "hsl(40 20% 86%)"
  rule-line: "hsl(38 22% 82%)"
  amber-wash: "hsl(40 50% 88%)"
  amber-edge: "hsl(38 45% 68%)"
  amber-ink: "hsl(32 30% 25%)"
  rose-highlight: "hsl(0 60% 90%)"
  workspace-paper: "hsl(42 48% 95%)"
  workspace-tray: "hsl(40 50% 93%)"
  workspace-hover: "hsl(38 41% 89%)"
  workspace-edge: "hsl(37 30% 74%)"
  workspace-canvas-edge: "hsl(34 24% 64%)"
  workspace-ink: "hsl(30 18% 28%)"
  workspace-select: "hsl(13 39% 86%)"
  modifier-ochre: "hsl(33 63% 40%)"
  pos-verb: "hsl(0 62% 38%)"
  pos-participle: "hsl(28 80% 36%)"
  pos-infinitive: "hsl(43 75% 30%)"
  pos-noun: "hsl(215 68% 42%)"
  pos-adj: "hsl(175 55% 30%)"
  pos-det: "hsl(30 8% 42%)"
  pos-pron: "hsl(270 48% 45%)"
  pos-prep: "hsl(140 52% 31%)"
  pos-conj: "hsl(30 45% 38%)"
  pos-adv: "hsl(330 62% 46%)"
  pos-other: "hsl(30 10% 41%)"
typography:
  display:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.25
  headline:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  greek-reading:
    fontFamily: "EB Garamond, serif"
    fontSize: "1.7rem"
    fontWeight: 400
    lineHeight: 2.1
  greek-workspace:
    fontFamily: "Gentium Plus, Cardo, ui-serif, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  ui:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.18em"
  wordmark:
    fontFamily: "EB Garamond, ui-serif, Georgia, serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.14em"
    fontFeature: "small-caps"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  workspace: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
  gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rubric-red}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.rubric-red}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.md}"
  option-chip:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  option-chip-selected:
    textColor: "{colors.rubric-red}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  mode-segment-active:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.rubric-red}"
    typography: "{typography.label}"
    rounded: "5px"
    height: "32px"
  chapter-tile:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  word-bubble:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    width: "320px"
  greek-word-selected:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.rubric-red}"
    rounded: "{rounded.sm}"
  workspace-tool-button:
    backgroundColor: "{colors.workspace-paper}"
    textColor: "{colors.workspace-ink}"
    rounded: "{rounded.lg}"
    height: "34px"
    width: "40px"
  workspace-canvas:
    backgroundColor: "{colors.workspace-paper}"
    rounded: "{rounded.workspace}"
---

# Design System: [Product Name]

Extracted from the Base44 prototype, whose source is kept for reference in `docs/design/base44-prototype/` (tokens in `src/index.css`, components in `src/components/`). Screenshots of the light theme are in `docs/design/base44-prototype/screenshots/`: contents, book chapters, reader, word bubble, part-of-speech colouring, English lines, Learning mode, the menu drawer in all three themes, the empty diagramming state, and the new-diagram passage picker. There is no capture of the diagram canvas itself; it is still rough. The prototype is the incumbent visual authority. This file is the normative summary that the Next.js port and every new screen, including the arcing and diagramming editors, must follow. The product name is undecided, so the wordmark stays `[Product Name]` until it is chosen.

## Overview

**Creative North Star: "The Scholar's Desk"**

The app is a well-kept study desk: warm parchment paper, brown-black ink, and a single red pen. Everything serves sustained work with the Greek text. The interface is quiet and bookish, set entirely in serif type, with structure carried by hairline rules and small-caps labels rather than boxes and colour. Red is the scholar's rubric: it marks what is active, selected or linked, and almost nothing else.

Density is calm. Pages sit in a centred column with generous margins. Reading puts the Greek in a large serif with open line spacing, so a chapter reads like a printed edition. Controls are compact and kept to the edges: a slim top bar and a drawer that slides in from the left. Editing workspaces (diagramming, and arcing when built) are the one place the desk gets physical: a raised paper canvas with a dashed edge, sitting on the parchment, with the passage on a separate card beneath it.

The system is themeable by design. Light, dark and sepia are three readings of the same desk, swapped only through tokens.

**Key Characteristics:**
- Serif-only typography (EB Garamond for everything, Gentium Plus for Greek in workspaces).
- One accent: rubric red. Other hues appear only as part-of-speech information.
- Hairline borders and small-caps labels instead of heavy containers.
- Soft, warm-brown shadows. Never grey or black.
- Every colour is a token with light, dark and sepia values.

## Colors

A warm, low-saturation paper-and-ink palette with one deep red accent and an information-only spectrum for parts of speech.

### Primary
- **Rubric Red** (`rubric-red`): the single accent. It is used for links, the selected word, the active mode segment, selected options (border plus a 10% red wash), focus rings, the 4px bar at the top of the menu drawer, primary buttons, and diagram connectors. In dark mode it lightens to a brick pink so it keeps contrast.
- **Chi Rho Red** (`chi-rho-red`): reserved for the Chi Rho brand mark. It is fixed and identical in every theme, and nothing else uses it.

### Secondary
- **Amber Wash / Amber Edge / Amber Ink** (`amber-wash`, `amber-edge`, `amber-ink`): a warm note for callouts and highlighted notes.
- **Rose Highlight** (`rose-highlight`): a soft red-tinted highlight for a word under study, used where the plain selected-word state would be too quiet.

### Neutral
- **Parchment** (`parchment`): the page background. Every screen sits on it.
- **Cream** (`cream`): raised surfaces such as cards, the word bubble, chapter tiles, and the word hover.
- **Ink** (`ink`): all primary text and the 2px diagram baselines.
- **Faded Ink** (`faded-ink`): secondary text, small-caps labels, verse numbers and captions.
- **Vellum Shade** (`vellum-shade`) and **Muted Wash** (`muted-wash`): quiet fills for segmented-control tracks and inactive areas, usually at 40% opacity.
- **Rule Line** (`rule-line`): every border and divider, and the input outline.

### Workspace (editor canvases)
Tokens drawn from the diagramming screen, which used hard-coded hex values. They are kept as its look and must be given dark and sepia values when ported (light values below).
- **Workspace Paper** (`workspace-paper`): the canvas and passage-card surface.
- **Workspace Tray** (`workspace-tray`): the floating tool palette.
- **Workspace Hover** (`workspace-hover`): hover fill on workspace buttons and passage words.
- **Workspace Edge** (`workspace-edge`): solid workspace card borders. **Workspace Canvas Edge** (`workspace-canvas-edge`) is the darker dashed canvas border.
- **Workspace Ink** (`workspace-ink`): icon and label colour on workspace controls.
- **Workspace Select** (`workspace-select`): the background of the passage word selected for placement, with rubric-red text.
- **Modifier Ochre** (`modifier-ochre`): the slanted modifier lines in diagrams.

### Part-of-speech spectrum
Eleven categories, used only for colouring Greek words (as both text colour and underline): verb `pos-verb`, participle `pos-participle`, infinitive `pos-infinitive`, noun `pos-noun`, adjective `pos-adj`, article `pos-det`, pronoun `pos-pron`, preposition `pos-prep`, conjunction/particle `pos-conj`, adverb `pos-adv`, other `pos-other`. Each has a lighter, brighter value in dark mode.

### Theme values
The frontmatter holds the light theme. Dark and sepia override the same tokens (values from `src/index.css`):

| Token | Light | Dark | Sepia |
|---|---|---|---|
| parchment (background) | `hsl(40 36% 93%)` | `hsl(30 12% 12%)` | `hsl(36 40% 86%)` |
| cream (card) | `hsl(44 50% 96%)` | `hsl(30 10% 16%)` | `hsl(36 36% 89%)` |
| ink (foreground) | `hsl(30 14% 15%)` | `hsl(40 20% 92%)` | `hsl(28 24% 20%)` |
| rubric-red (primary) | `hsl(0 62% 32%)` | `hsl(0 55% 70%)` | `hsl(0 52% 38%)` |
| faded-ink (muted text) | `hsl(38 14% 40%)` | `hsl(38 12% 65%)` | `hsl(30 18% 37%)` |
| rule-line (border) | `hsl(38 22% 82%)` | `hsl(30 8% 26%)` | `hsl(34 24% 76%)` |

Sepia darkens the part-of-speech colours because its page is darker: participle `hsl(28 80% 32%)`, infinitive `hsl(43 75% 27%)`, noun `hsl(215 68% 40%)`, adjective `hsl(175 55% 27%)`, article `hsl(30 8% 38%)`, preposition `hsl(140 52% 28%)`, conjunction `hsl(30 45% 35%)`, adverb `hsl(330 62% 43%)`, other `hsl(30 10% 37%)`; verb and pronoun keep their light values.

Every text token reaches WCAG AA contrast (4.5:1) against parchment and cream in its theme, and selected-option red text against its red wash. Several values are darker (dark mode: lighter) than the prototype's for that reason; only lightness changed, so each hue is the prototype's. The decorative Chi Rho mark is exempt. Links in running text are underlined as well as red, so colour is never their only cue.

Sepia is a token swap, not a page filter: the red accents and the red Chi Rho stay red. The prototype's sepia screenshot (`10-menu-drawer-sepia`) shows a page-wide brown recolour and is not canonical.

### Named Rules
**The Rubric Rule.** Rubric red is the only accent in the chrome. It marks state (active, selected, linked, focused), not decoration. Large red fills are limited to primary buttons and the 4px drawer bar.

**The Two-Cue Rule.** Part-of-speech colour never carries meaning alone. Every category also has its own underline style (solid, double, dotted, dashed or wavy), applied with the colour.

**The Tokens-Only Rule.** No component may hard-code a colour. Every colour comes from a token with light, dark and sepia values. The prototype's diagramming screen broke this rule, and its colours are now the workspace tokens above.

## Typography

**Display, Headline and Body Font:** EB Garamond (fallback ui-serif, Georgia, serif)
**Greek Workspace Font:** Gentium Plus (fallback Cardo, ui-serif, serif)
**Reader-selectable Greek faces:** EB Garamond (default), Gentium Plus, Cardo, GFS Didot

**Character:** one Garalde serif carries the whole interface, from headings to buttons, so the app reads like a well-set book rather than software. Gentium Plus is used where Greek must be crisp at small sizes, on diagram baselines and in the passage card.

### Hierarchy
- **Display** (400, 3rem, 1.25): the book title on a book's chapter page.
- **Headline** (400, 2.25rem, 1.25): page titles such as "The Greek New Testament" and "Credits & Licenses". Workspace titles use 1.5rem.
- **Title** (600, 1.25rem, 1.25): the headword in the word bubble. Section headings on prose pages use 1.25rem at 400.
- **Greek reading** (400, 1.25 to 2.25rem in five steps with 1.7rem the default; line height 1.7 compact, 2.1 comfortable, 2.6 spacious): chapter text. It sits in the reader's chosen face, flows as prose, and each verse is a block with 20px below it.
- **Body** (400, 15px, 1.625): intro paragraphs and prose pages, with a maximum width of about 42rem.
- **UI** (400, 0.875rem): menu links, toggle labels and bubble text. Captions and glosses use 0.75rem, glosses in italic.
- **Label** (600, 11px, 0.18em tracking, uppercase, faded ink): the small-caps label that names every section: "Contents", "Display", "Menu", "Text size". Mode segments use the same style at 0.14em tracking.
- **Wordmark** (600, 13px, 0.14em tracking, small-caps): the product name beside the Chi Rho. It hides below 640px.
- **Verse number** (600, 11px, superscript, tabular figures, faded ink): it is clickable, turning red on hover.

### Named Rules
**The Serif-Only Rule.** There is no sans-serif anywhere in the interface. The prototype loaded Inter but never used it, and it is not carried over.

**The Small-Caps Label Rule.** Sections are named with the 11px tracked uppercase label, not with bold headings. Headings are reserved for page titles.

## Layout

Single centred column on parchment, with generous side gutters (32px on content pages, 16 to 24px in the reading bar).

- **Contents and prose pages:** the column is 64rem wide (`max-w-5xl`) for the contents page and 48rem (`max-w-3xl`) for a book's chapters and for credits. Each page opens with the logo at the top left, then a hairline-ruled strip holding two small-caps labels (for example "Contents" and "SBLGNT"), then the headline, an intro paragraph in faded ink, and the content. The footer is centred small text with red links separated by a middle dot.
- **Contents grid:** books in a 1, 2 or 3-column grid (breakpoints 640px and 1024px) with 40px column gaps. Each book is a row with a hairline bottom border: the name in 1.125rem serif on the left, the chapter count in faded ink on the right. Groups ("Gospels and Acts", "Letters", "Revelation") are introduced by small-caps labels with 40px between groups.
- **Chapter grid:** square tiles in 6, 8 or 10 columns with 12px gaps.
- **Reading screen:** a 64px top bar (max width 72rem) with a hairline bottom rule and a 95% parchment backdrop blur. It holds the menu button, logo, centred passage arrows (desktop only), toggles, and the mode control (desktop only). The text column (about 45rem) sits below and opens with the same hairline-ruled label strip as content pages: "Greek · SBLGNT" in small caps on the left, and the book's lowercase unaccented Greek title plus chapter (for example "κατα μαθθαιον 14") in small serif on the right.
- **Menu drawer:** 320px wide (at most 85% of the viewport), sliding in from the left over a 30% black scrim. It opens with a 4px rubric-red bar, then a "Menu" label row, then sections ("Display", "Navigate", "About") spaced 28px apart. Display holds, in order: a text-size slider with a red track and "Small" / "XX-Large" end labels, a live preview card ("ἐν ἀρχῇ ἦν ὁ λόγος" in the chosen face and size), Greek font chips in a 2-column grid, line-spacing chips, the verse-numbers switch, theme chips, and a full-width "Reset to defaults" outline button. Navigate and About are plain serif link lists.
- **Word bubble:** 320px wide, at most 60% of viewport height, placed above or below the word with a pointer aimed at it. Below 768px it becomes a bottom sheet with rounded top corners, at most 85% of viewport height.
- **Workspace:** a column at most 64rem wide holding a title row (headline plus small-caps "Diagramming · SBLGNT", with the Editing switch on the right), a right-aligned tool row, the canvas (fills the remaining height), and the passage card (at most 40% of viewport height, 24px padding) 16px below it.
- **Responsive:** below 768px, the mode control and passage arrows move from the top bar into the drawer's Navigate section.

## Elevation & Depth

Flat by default with tonal layering (parchment, then cream, then hover), plus soft warm-brown shadows on things that float or are meant to feel like paper on a desk. Shadows are tinted with the ink colour (`rgba(43,38,32,…)` and `rgba(65,48,32,…)`), never neutral grey.

### Shadow Vocabulary
- **Soft card** (`box-shadow: 0 1px 2px rgba(43,38,32,0.05), 0 12px 28px -14px rgba(43,38,32,0.18)`): resting cards.
- **Tile** (`box-shadow: 0 1px 2px rgba(43,38,32,0.05), 0 6px 16px -10px rgba(43,38,32,0.18)`): chapter tiles.
- **Workspace canvas** (`box-shadow: 0 12px 30px rgba(65,48,32,0.13)`): the editing canvas.
- **Workspace card** (`box-shadow: 0 10px 26px rgba(65,48,32,0.12)`): the passage card under the canvas.
- **Tool palette** (`box-shadow: 0 4px 14px rgba(65,48,32,0.12)`): the floating diagram palette.
- **Tool hover** (`box-shadow: 0 3px 9px rgba(68,48,31,0.13)`): workspace buttons on hover only.
- **Overlay**: the word bubble and popovers use a large soft shadow, and the drawer an extra-large one. These are the only uses of the framework's default shadows.

### Named Rules
**The Paper-on-Desk Rule.** Elevation means "a sheet resting on the desk". Shadows are warm, soft and long, and appear on floating or paper-like surfaces only. Chrome stays flat.

## Shapes

Gently rounded and restrained. The base radius is 8px, with 6px for controls and 4px for inline highlights. Workspace surfaces are rounder (14px canvas and cards, 12px palette) to read as physical sheets. Pills (fully rounded) are only for the switch and the small "+" split buttons. Borders are 1px hairlines in the rule-line colour. The workspace canvas alone uses a 1.5px dashed border, like a drafting sheet.

## Components

### Buttons
Shapes follow the toolkit (6px radius, 36px tall, 16px horizontal padding; small 32px and 12px text; icon 36px square).
- **Primary:** rubric red with parchment text, a 90% red tint on hover. Use it rarely, for the one main action in a view.
- **Ghost / Outline:** transparent with a hairline border or none. Hover fills with the accent (rubric red) and parchment text.
- **Icon buttons in chrome** (menu, passage arrows): 36px square, 6px radius, a hairline border on the arrows, and a cream fill on hover. Disabled arrows keep their border and fade the icon to 40%.
- **Workspace tool buttons** (undo, redo, delete): 40×34px, 8px radius, workspace-paper fill, workspace-edge border, workspace-ink icon. Hover gives the workspace-hover fill plus the tool-hover shadow, focus gives a 2px rubric-red outline, and disabled is 40% opacity.

### Option chips
Used for theme, line spacing and font choice in the Display menu: a row or 2-column grid of equal-width chips with a hairline border, 6px radius and 12px faded-ink text. Selected: rubric-red border, a 10% rubric-red wash and red text. Font chips set their label in their own typeface.

### Mode control (segmented)
A 36px track with a hairline border and a 40% muted-wash fill, holding uppercase label-style segments ("Reading", "Diagramming" and later "Arcing"). The active segment gets the parchment fill, red text and a small shadow. Inactive segments are faded ink and darken on hover.

### Switch
36×20px pill: rubric red when on, the rule-line colour when off, with a parchment thumb. It always sits beside a serif text label ("Color", "English", "Verse numbers", "Editing").

### Cards / Containers
- **Corner Style:** 8px (workspace 14px).
- **Background:** cream on parchment.
- **Shadow Strategy:** soft card or tile (see Elevation).
- **Border:** hairline rule-line, or none when a shadow carries the edge.
- **Internal Padding:** 12 to 16px for popovers and bubbles, 24px for workspace cards.

### Navigation
- **Top bar:** described in Layout. Toggles are a switch plus label. The colour toggle adds a chevron that opens the category chooser.
- **Drawer:** described in Layout. Links are 0.875rem serif ink and turn red on hover.
- **Book rows and chapter tiles:** a hover turns the text red (tiles) or fills cream at 60% (rows). There are no underlines.
- **Passage arrows:** the book name and chapter in 1.125rem serif with tabular figures, between two bordered icon buttons.

### Greek text (signature)
Words flow as prose, each one a clickable inline element with 1px side padding and a 4px radius. Hover: cream fill and red text. Selected: cream fill and red text that stays. A word under study gets the rose highlight instead. Verse numbers are superscript labels before each verse. With part-of-speech colouring on, each word takes its category colour and underline style, with a 3px underline offset. When an English line is shown (a later feature), it sits directly under its verse in 0.875rem faded-ink body text with relaxed leading, so the Greek stays dominant.

### Mode banner
A full-width rose-highlight strip with an 8px radius at the top of the text column, holding a small rubric-red dot, a bold red mode name and a plain explanation ("Learning mode. Tap or click any word to parse it."). Use it whenever a mode changes what tapping a word does.

### Word bubble (signature)
A cream card, 320px wide, with an 8px radius, a hairline border and the overlay shadow. A two-layer CSS triangle pointer (border then fill) aims at the word and flips with placement. Contents from the top: headword (title style) with a red reference on the right, the definition in UI text, the parse in faded ink, then the gloss in 12px italic above a hairline rule, then an occurrence count in 12px faded ink. When the body overflows, it shows a thin 6px scrollbar in the rule-line colour and a cream fade at the bottom edge. On mobile it becomes a bottom sheet.

### Passage picker dialog
Opens from a mode's empty state ("New Diagram" primary button under a centred headline and one-line explanation). It is a cream dialog with an 8px radius, a hairline border and a title in serif. On the left is a scrolling book list grouped under small-caps labels: each row shows the English name and the lowercase Greek title in faded ink, and the selected row gets a muted wash with red text. On the right, chapter and verse grids of bordered number buttons appear under small-caps labels, and the selected number is filled rubric red with parchment text. A footer holds a plain "Cancel" link and a primary "Confirm" that is shown at reduced opacity until a passage is complete. Arcing reuses this dialog to choose a passage. See `11-diagramming-empty` and `12-new-diagram-dialog`.

### Diagram workspace (signature, provisional)
The prototype's diagramming is rough and will be redesigned in its own change. The tokens and surface treatment below (paper canvas, passage card, tool buttons, palette) are the agreed direction. The interaction model and diagram notation are not settled, and nothing here should be read as a spec for them.

- **Canvas:** workspace-paper at 88% over parchment, a 1.5px dashed workspace-canvas-edge border, a 14px radius and the workspace-canvas shadow. The crosshair cursor shows while placing.
- **Palette:** floats at the canvas's top left. It is a tray with a 12px radius, a hairline workspace-edge border and the tool-palette shadow, holding a 3-column grid of tool icons with tooltips styled as tray chips.
- **Baseline:** Greek words in Gentium Plus at 1.125rem sit on a 2px ink line at least 220px long. Hover gives a 10% red wash.
- **Connectors:** a dashed rubric-red stroke (1.6px, dash 6 5) with a faint red glow, animating its dash offset (1.6s linear, looping) to read as live.
- **Modifiers:** solid modifier-ochre strokes, 2px with round caps.
- **Passage card:** workspace-paper with a 14px radius, a workspace-edge border and the workspace-card shadow. Words are in Gentium Plus at 1.25rem. Placed words fade to about 42% faded ink, and the word chosen for placement gets the workspace-select fill and red text.
- **Arcing workspace (not yet built):** reuses this canvas, passage card, tool buttons and palette, so diagramming and arcing feel like the same desk. Its layout and interactions are designed in the arcing editor change, in our own terms, not copied from any existing arcing tool. Relationship colours are not yet defined. They must be tokens and follow the Two-Cue Rule.

### Brand mark
The Chi Rho: a stroked Χ and Ρ (2.1 stroke, round caps) with serif Α and Ω on either side, all in chi-rho red, 47×32px in the top bar, with no tile behind it. It is followed by the small-caps wordmark.

## Do's and Don'ts

### Do:
- **Do** take every colour from a token, and give each new token light, dark and sepia values (the Tokens-Only Rule).
- **Do** name sections with the 11px tracked small-caps label, and keep bold headings for page titles.
- **Do** keep rubric red for state: active, selected, linked, focused (the Rubric Rule).
- **Do** pair every part-of-speech or relationship colour with a second cue such as an underline style or pattern (the Two-Cue Rule).
- **Do** tint shadows with warm brown and keep them soft (the Paper-on-Desk Rule).
- **Do** give editor workspaces the raised paper canvas with a dashed edge, the passage card below, and the floating palette.
- **Do** set Greek in a serif with full polytonic coverage, at reading sizes of 1.25rem or larger.

### Don't:
- **Don't** introduce a sans-serif typeface (the Serif-Only Rule).
- **Don't** hard-code hex colours in components. The prototype's diagramming screen did, and those values became workspace tokens.
- **Don't** use chi-rho red for anything except the brand mark, or recolour the mark per theme.
- **Don't** add a second accent hue to the chrome. Other hues are only for part-of-speech (and later, relationship) information.
- **Don't** use grey or black shadows, or put shadows on flat chrome such as the top bar or the drawer contents.
- **Don't** load images from Base44's hosting. The prototype's diagram background photo lived there and is not carried over.
