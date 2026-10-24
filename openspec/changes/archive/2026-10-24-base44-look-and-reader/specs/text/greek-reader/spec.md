## Purpose

Lets a user browse the Greek New Testament by book and chapter, read a chapter's Greek text, inspect any word's lemma, gloss and parsing, and adjust how the text is displayed. The chapter data format is specified in `text/corpus-store` (`app-server-and-sqlite`), not here.

## ADDED Requirements

### Requirement: Contents and chapter navigation

The contents page SHALL list all 27 New Testament books in canonical order, grouped as Gospels and Acts, Letters, and Revelation, with each book's chapter count.

Each book SHALL have a page listing its chapters, each linking to that chapter's reading screen.

Every book and chapter page SHALL be rendered by the application's server from the corpus store, so a chapter ingested after the build appears without rebuilding.

#### Scenario: Book list complete

- **WHEN** a user opens the contents page
- **THEN** all 27 New Testament books are listed in canonical order with their chapter counts

#### Scenario: Navigating to a chapter

- **WHEN** a user selects Philippians on the contents page and then chapter 1
- **THEN** the reading screen for Philippians 1 opens

#### Scenario: Invalid address

- **WHEN** a user opens a reading-screen address for a book or chapter that does not exist
- **THEN** the application shows a not-found page

### Requirement: Chapter reading screen

The reading screen SHALL show the chapter's Greek text in canonical word order, verse by verse, with each word's following punctuation.

The reading screen SHALL show verse numbers unless the user has turned them off.

The reading screen SHALL provide links to the previous and next chapter, crossing book boundaries, and SHALL omit the link where none exists (before Matthew 1, after Revelation 22).

#### Scenario: Text in word order

- **WHEN** a user opens a chapter whose corpus data is available
- **THEN** every word of the chapter is shown once, in canonical order, grouped under its verse number

#### Scenario: Crossing a book boundary

- **WHEN** a user is reading Matthew 28 and follows the next-chapter link
- **THEN** the reading screen for Mark 1 opens

#### Scenario: No previous chapter at the start

- **WHEN** a user is reading Matthew 1
- **THEN** no previous-chapter link is shown

### Requirement: Unavailable chapter data

When the corpus data for a chapter is not available, because it has not been ingested yet or because the corpus store cannot be read, the reading screen SHALL say the text is not available and SHALL keep the chapter navigation working.

#### Scenario: Chapter not yet ingested

- **WHEN** a user opens a chapter that exists but has not been ingested into the corpus store
- **THEN** the screen states the text is not yet available
- **AND** the previous and next chapter links still work

### Requirement: Word detail

Selecting a word SHALL open a detail popover anchored to that word, showing its surface form, lemma, English gloss, part of speech, and every morphological field that applies to it (person, number, gender, case, tense, voice, mood, degree). Fields that do not apply to the word SHALL be omitted, not shown blank.

The popover SHALL NOT show the word's syntactic role (such as subject or object) or any other interpretive analysis from the source data.

The popover SHALL be dismissible by pressing Escape, by selecting outside it, or by selecting another word, which moves the popover to the new word.

Words SHALL be selectable with the keyboard.

#### Scenario: Verb detail

- **WHEN** a user selects a finite verb
- **THEN** the popover shows its lemma, gloss, person, number, tense, voice and mood
- **AND** does not show case or gender

#### Scenario: Keyboard selection

- **WHEN** a user moves focus to a word with the keyboard and presses Enter
- **THEN** the detail popover opens for that word

#### Scenario: Dismiss with Escape

- **WHEN** the popover is open and the user presses Escape
- **THEN** the popover closes and focus returns to the word

### Requirement: Display settings

The reading screen SHALL provide a display menu with these settings and defaults:

- theme: light, dark or sepia (default light)
- Greek typeface: EB Garamond, Gentium Plus, Cardo or GFS Didot (default EB Garamond), each option label shown in its own typeface
- text size: five steps (default the middle step)
- line spacing: compact, comfortable or spacious (default comfortable)
- verse numbers: on or off (default on)
- part-of-speech colouring: on or off (default off), with each of the eleven categories individually on or off (default all on)

Changing a setting SHALL take effect immediately without reloading.

When part-of-speech colouring is on, the reading screen SHALL show a legend of the enabled categories, each in its own colour and underline style.

#### Scenario: Colouring a subset

- **WHEN** a user turns on part-of-speech colouring and disables every category except participle
- **THEN** only participles are coloured and underlined
- **AND** the legend lists only participle

#### Scenario: Settings take effect immediately

- **WHEN** a user changes the text size
- **THEN** the Greek text resizes without a page reload

### Requirement: Settings persistence

Display settings SHALL persist in the user's browser across reloads and visits, with no account.

If stored settings are missing, unreadable, or lack a field added in a later release, the application SHALL fall back to the default for each missing or invalid field and SHALL NOT fail to render.

#### Scenario: Settings survive reload

- **WHEN** a user sets the typeface to Gentium Plus and reloads the page
- **THEN** the Greek text is still in Gentium Plus

#### Scenario: Browser storage unavailable

- **WHEN** browser storage throws on access
- **THEN** the reading screen renders with default settings

### Requirement: Credits page

The `/credits` page (created by the `app-server-and-sqlite` change) SHALL be presented in the application's theme with the shared page shell, and SHALL name every work whose text or data the application ships, with its licence, a link to the licence, its required attribution statement, and whether it has been modified.

The credits page SHALL build its list from the attribution held in the corpus store, so a dataset added to the corpus appears on the credits page without a separate hand edit.

The credits page SHALL state that the application is not affiliated with or endorsed by the publishers of any source.

#### Scenario: SBLGNT and MACULA credited

- **WHEN** a user opens the credits page
- **THEN** the SBL Greek New Testament and the MACULA Greek Linguistic Datasets are each listed with CC BY 4.0, a link to the licence, and a statement that they have been modified

#### Scenario: Credits follow the metadata

- **WHEN** the corpus store's attribution lists a dataset
- **THEN** that dataset appears on the credits page
