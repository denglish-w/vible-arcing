# app/visual-theme Specification

## Purpose
Gives the application one consistent visual identity (palette, themes, typefaces and page chrome) that every screen, and later the arc and bracket renderers, draw from.
## Requirements
### Requirement: Selectable colour themes

The application SHALL offer three colour themes: light, dark and sepia.

Light SHALL be the default for a visitor who has never chosen a theme.

The chosen theme SHALL apply to every page, not only the reading screen.

The chosen theme SHALL be in effect before the first paint, so a page never visibly flashes the default theme before switching.

#### Scenario: First visit uses light

- **WHEN** a visitor with no stored preference opens any page
- **THEN** the page renders in the light theme

#### Scenario: Theme choice applies everywhere

- **WHEN** a user selects the dark theme on the reading screen and then opens the contents page
- **THEN** the contents page renders in the dark theme

#### Scenario: No theme flash on load

- **WHEN** a user who chose sepia reloads a page
- **THEN** the first rendered frame already uses the sepia theme

### Requirement: Themeable colour tokens

All application colours SHALL come from named colour tokens whose values are defined once per theme.

Switching theme SHALL change token values only; components SHALL NOT carry per-theme colour logic.

The tokens SHALL be readable by non-utility-class styling (such as SVG renderers) as well as by the application chrome.

#### Scenario: Theme switch recolours without re-rendering logic

- **WHEN** the theme changes
- **THEN** every element using a colour token shows that token's value for the new theme

### Requirement: Part-of-speech colour categories

The application SHALL define eleven part-of-speech categories for colouring Greek words: finite verb, participle, infinitive, noun, adjective, article, pronoun, preposition, conjunction/particle, adverb, and other (numerals, interjections and anything unmapped).

Each category SHALL have a colour in every theme.

Each category SHALL also have an underline style (solid, double, dotted, dashed or wavy), so a reader who cannot distinguish the colours can still tell categories apart from each other and from the legend.

A word SHALL be assigned to exactly one category from its part of speech, and for verbs, its mood.

#### Scenario: Participle categorised by mood

- **WHEN** a word's part of speech is verb and its mood is participle
- **THEN** it is in the participle category, not the finite verb category

#### Scenario: Particles grouped with conjunctions

- **WHEN** a word's part of speech is particle
- **THEN** it is in the conjunction/particle category

#### Scenario: Unmapped part of speech

- **WHEN** a word's part of speech matches no named category
- **THEN** it is in the other category

### Requirement: Typefaces with polytonic Greek

The application SHALL provide four Greek typefaces: EB Garamond, Gentium Plus, Cardo and GFS Didot. Each SHALL render polytonic Greek, including breathing marks, accents and iota subscript.

Typefaces SHALL be served with the application and SHALL NOT be fetched from a third-party host at runtime.

#### Scenario: Fonts available offline from third parties

- **WHEN** the application is loaded from its own server with all third-party hosts unreachable
- **THEN** Greek text renders in the selected typeface

### Requirement: Shared page chrome

Every page SHALL show the application logo, which links to the contents page.

Every page SHALL show a footer with a link to the credits page.

#### Scenario: Credits reachable from any page

- **WHEN** a user is on any page of the application
- **THEN** a link to the credits page is visible in the footer

