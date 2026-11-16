# Feature Specification: Visual Theme

**Source**: Mirrors the OpenSpec spec `openspec/specs/app/visual-theme/spec.md` (context: `DESIGN.md`, `lat.md/design-system.md`). OpenSpec stays authoritative.

**Feature Branch**: `003-visual-theme`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description: "One consistent visual identity: light, dark and sepia themes, themeable colour tokens, part-of-speech colour categories with non-colour cues, polytonic Greek typefaces and shared page chrome. Ported from the OpenSpec spec path app/visual-theme."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a theme that follows me everywhere (Priority: P1)

A visitor sees the light theme on first arrival. They can switch to dark or sepia, and the choice applies to every page and is already in place when a page first appears, with no flash of the default.

**Why this priority**: Comfortable long reading depends on the right theme, and a theme that applies only to one screen or flashes on load feels broken.

**Independent Test**: Open a page with no stored preference, pick sepia, move to another page, then reload and check the first frame.

**Acceptance Scenarios**:

1. **Given** a visitor with no stored preference, **When** they open any page, **Then** the page renders in the light theme.
2. **Given** a user who selects the dark theme on the reading screen, **When** they open the contents page, **Then** it renders in the dark theme.
3. **Given** a user who chose sepia, **When** they reload a page, **Then** the first rendered frame already uses the sepia theme.

---

### User Story 2 - Tell parts of speech apart without relying on colour (Priority: P1)

A reader colouring words by part of speech can tell the eleven categories apart by colour and also by underline style, so someone who cannot distinguish the colours still can, and can match words to the legend.

**Why this priority**: The two-cue rule is a product accessibility requirement, and the categories are what the reader's colouring is built on.

**Independent Test**: List the eleven categories and confirm each has a colour in all three themes and a distinct underline style; classify sample words.

**Acceptance Scenarios**:

1. **Given** a word whose part of speech is verb and whose mood is participle, **When** it is categorised, **Then** it is in the participle category, not the finite verb category.
2. **Given** a word whose part of speech is particle, **When** it is categorised, **Then** it is in the conjunction/particle category.
3. **Given** a word whose part of speech matches no named category, **When** it is categorised, **Then** it is in the other category.
4. **Given** any category, **When** it is shown in any theme, **Then** it has a colour for that theme and an underline style (solid, double, dotted, dashed or wavy).

---

### User Story 3 - Read polytonic Greek in a typeface I like, offline (Priority: P2)

A user can read Greek in any of four typefaces, each rendering breathing marks, accents and iota subscript correctly, and the fonts never come from a third-party host.

**Why this priority**: Correct Greek rendering is essential, but one typeface already serves the reader if the others fail.

**Independent Test**: Load the app with all third-party hosts blocked and view Greek text in each typeface.

**Acceptance Scenarios**:

1. **Given** the application loaded from its own server with all third-party hosts unreachable, **When** Greek text is shown, **Then** it renders in the selected typeface.
2. **Given** any of the four typefaces, **When** polytonic text is shown, **Then** breathing marks, accents and iota subscript render.

---

### User Story 4 - Recognise the app and reach credits from any page (Priority: P3)

On every page the user sees the application logo, which takes them to the contents page, and a footer link to the credits page.

**Why this priority**: Consistent navigation helps, and credits access supports licence compliance.

**Independent Test**: Visit several pages and confirm the logo link and footer credits link on each.

**Acceptance Scenarios**:

1. **Given** any page, **When** a user views it, **Then** the logo is shown and links to the contents page.
2. **Given** any page, **When** a user views it, **Then** a link to the credits page is visible in the footer.

---

### User Story 5 - Colours switch as one set (Priority: P2)

When the theme changes, every coloured element takes the new theme's value from one named set of colours, with no separate per-theme handling in individual screens, and the same colours are available to drawn graphics as well as page chrome.

**Why this priority**: This keeps every present and future screen consistent, including later arc and bracket drawings.

**Independent Test**: Change theme and check that every element using a named colour shows that colour's value for the new theme.

**Acceptance Scenarios**:

1. **Given** any theme change, **When** it takes effect, **Then** every element using a colour token shows that token's value for the new theme.

### Edge Cases

- A visitor with no stored choice, or an unreadable one: light theme.
- A word's part of speech matches no named category: other category.
- Third-party hosts unreachable: Greek text still renders in the chosen typeface.
- A reader who cannot distinguish colours: underline styles still separate categories and match the legend.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST offer three colour themes: light, dark and sepia.
- **FR-002**: Light MUST be the default for a visitor who has never chosen a theme.
- **FR-003**: The chosen theme MUST apply to every page, not only the reading screen.
- **FR-004**: The chosen theme MUST be in effect before the first paint, so a page never visibly flashes the default theme before switching.
- **FR-005**: All application colours MUST come from named colour tokens whose values are defined once per theme.
- **FR-006**: Switching theme MUST change token values only; components MUST NOT carry per-theme colour logic.
- **FR-007**: The tokens MUST be readable by non-utility-class styling (such as SVG renderers) as well as by the application chrome.
- **FR-008**: The application MUST define eleven part-of-speech categories: finite verb, participle, infinitive, noun, adjective, article, pronoun, preposition, conjunction/particle, adverb, and other (numerals, interjections and anything unmapped).
- **FR-009**: Each category MUST have a colour in every theme.
- **FR-010**: Each category MUST also have an underline style (solid, double, dotted, dashed or wavy) so categories can be told apart, and matched to the legend, without colour.
- **FR-011**: A word MUST be assigned to exactly one category from its part of speech and, for verbs, its mood (a participle is not a finite verb; a particle is a conjunction/particle; an unmapped part of speech is other).
- **FR-012**: The application MUST provide four Greek typefaces: EB Garamond, Gentium Plus, Cardo and GFS Didot, each rendering polytonic Greek including breathing marks, accents and iota subscript.
- **FR-013**: Typefaces MUST be served with the application and MUST NOT be fetched from a third-party host at runtime.
- **FR-014**: Every page MUST show the application logo, linking to the contents page.
- **FR-015**: Every page MUST show a footer with a link to the credits page.

### Key Entities

- **Theme**: One of light, dark or sepia, with one value for every colour token.
- **Colour token**: A named colour defined once per theme and used by chrome and drawn graphics alike.
- **Part-of-speech category**: One of eleven groups with a colour per theme and an underline style.
- **Typeface**: One of four Greek-capable faces served with the application.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor sees the light theme on 100% of pages.
- **SC-002**: A theme chosen once applies on 100% of pages, and the first rendered frame after a reload shows the chosen theme with 0 frames in the default theme.
- **SC-003**: All 11 categories have a colour in each of the 3 themes and use distinct underline styles for any two categories that could otherwise be confused.
- **SC-004**: With all third-party hosts blocked, Greek text renders in each of the 4 typefaces with 0 third-party font requests.
- **SC-005**: The logo link and the footer credits link are present on 100% of pages.
- **SC-006**: A theme switch changes the colour of 100% of token-coloured elements without any per-screen theme handling.

## Assumptions

- The normative look (palette, serif-only type, rubric red as single accent) is defined in `DESIGN.md`; this spec states the user-facing behaviour it must deliver.
- The reader's display menu, its persistence and its legend are specified in `002-greek-reader`.
- Arc and bracket renderers do not exist yet; they will draw from the same tokens.
- Contrast, keyboard and touch requirements follow the project constitution (WCAG 2.2 AA, colour never alone) and are checked there rather than restated per requirement.
