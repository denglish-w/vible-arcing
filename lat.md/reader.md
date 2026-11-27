# Greek reader

A server-rendered book and chapter browser presents the Greek text, factual word help and persistent display settings without an account.

## Navigation and availability

Contents, book and chapter pages are server components that read the corpus store per request, so chapters ingested after the build appear and no client loader exists.

[[src/lib/books.ts#BOOKS]] drives the book list, chapter lists and route validation, and [[src/lib/books.ts#prevChapter]] and [[src/lib/books.ts#nextChapter]] cross book boundaries and omit terminal links. Each page calls `await connection()` before its first query, then reads through [[src/app/corpus-store.ts#readCorpus]], which maps a missing or damaged store to null so the page shows an install notice instead of failing. An unknown book or chapter calls `notFound()`; a real chapter missing from the store renders [[src/components/reading/chapter-status.tsx#ChapterUnavailable]], which says the installed corpus is out of date and to run `npm run db:seed`; with the whole New Testament committed, only a stale store reaches it. [[src/components/reading/reader.tsx#Reader]] takes the chapter as props and keeps [[src/components/reading/chapter-navigation.tsx#ChapterNavigation]] visible in every state.

## Words and display

The reader preserves source order and MACULA word identity, with keyboard-selectable words and factual morphology in an anchored popover.

[[src/components/reading/greek-text.tsx#GreekText]] groups words by verse and applies the selected font, size, spacing and optional verse numbers. [[src/components/reading/word-detail.tsx#WordDetail]] omits absent morphology and never exposes source syntax roles. Radix supplies Escape, outside-click dismissal and focus return; the word bubble becomes a bottom sheet on phones. [[src/lib/pos.ts#wordCategory]] assigns eleven categories, including verb mood distinctions; [[src/lib/pos.ts#categoryStyle]] pairs token colour with underline styling, used by the words and by [[src/components/reading/pos-legend.tsx#PosLegend]], which lists only the enabled categories.

## Learning mode

Parsing practice on the reading screen keeps the answers out of the page by construction: the mode is decided on the server and a Learning render carries only each word's text and id.

The reading page reads the `vible.mode` cookie through [[src/lib/learning/mode.ts#parseMode]]; anything but `learning` means Reading. In Learning mode it sends a lean chapter plus the user's latest attempt per word from [[src/db/attempts.ts#latestAttempts]] (their own answers, when, and how many fields differed, never source values). [[src/components/reading/learning/mode-control.tsx#ModeControl]] sets the cookie through `setReadingMode` in [[src/app/read/learning-actions.ts]] and, going into Learning, reloads the document so the Reading render's inline word facts are discarded; going back to Reading the action calls `refresh()`. The actions are passed from the page to the reader as props, so no client module imports server code and stories pass fakes from [[src/stories/learning.ts]].

[[src/components/reading/learning/learning-text.tsx#LearningText]] renders words without part-of-speech styling and opens [[src/components/reading/learning/parsing-form.tsx#ParsingForm]] in the word popover. One module, [[src/lib/learning/fields.ts#fieldsFor]], decides which fields apply, for the form, the grader [[src/lib/learning/grade.ts#grade]] and the validator in [[src/lib/learning/validate.ts]]. "Middle or passive" agrees with either in the present, imperfect, perfect and pluperfect only. `checkParse` grades on the server and is the only way a word's source parsing reaches a Learning page. Latin letters become Greek as typed ([[src/lib/learning/translit.ts#toGreek]]), and lemmas compare without accents, breathings, iota subscript, case or final-sigma form ([[src/lib/learning/grade.ts#normaliseLemma]]). The selected word survives a mode switch through [[src/lib/learning/selection.ts#restoreSelection]], handed over in `sessionStorage` across the reload. In Learning mode the display menu keeps colouring settings editable and says they are paused; switching mode never writes a setting.

## Browser settings

Settings validate every saved field independently and continue in memory when browser storage fails.

[[src/lib/settings.ts#mergeSettings]] restores defaults for malformed, missing or unknown fields. [[src/lib/settings.ts#useSettingsStore]] persists under the display storage key and hydrates after mount. [[src/components/reading/display-menu.tsx#DisplayMenu]] changes themes, fonts, size, spacing, verse numbers and colour categories immediately. [[src/components/theme-sync.tsx#ThemeSync]] applies the theme globally after hydration; the layout's constant blocking script applies saved themes before first paint.

## Verification

Pure-module tests verify book boundaries, categorisation, malformed settings, storage failures, corpus validation and licence-safe data.

See [[src/lib/books.test.ts]], [[src/lib/pos.test.ts]], [[src/lib/settings.test.ts]] and [[src/lib/corpus/format.test.ts]]. [[src/db/seed.test.ts]] checks the committed corpus files and the store built from them. [[scripts/qa/reader.cjs]] exercises the locally served app and captures desktop and phone evidence for keyboard selection, the saved theme already on `<html>` when the body is first parsed, the phone logo link's name, navigation, credits and blocked storage. Its Learning-mode run asserts that a Learning page holds no word facts, then parses a word by keyboard, checks, steps to the next word, reaches the end of the chapter, reloads to see the pre-filled attempt, checks the phone bottom sheet keeps its actions in reach, downloads the history and switches back with settings unchanged. [[src/lib/learning/corpus-values.test.ts]] fails if a re-ingest brings a value the form does not offer.

## Component stories

Every reader component and UI primitive has stories beside it, fed by props or by the settings store, so the storybook test project checks each state for crashes, failed interactions and axe violations.

[[src/stories/fixtures.ts#philippians1]] parses the committed Philippians 1 chapter through `parseChapter()`, so no story fetches or opens a database. [[src/stories/with-settings.ts#resetSettings]] resets the settings store before each story to the defaults plus its `settings` parameter, and restores it afterwards. Dark and sepia story variants set the Theme global so axe also checks those themes. Play functions assert the keyboard and pointer behaviour the specs name: Escape closes the word popover and returns focus to the word, selecting another word moves the popover, a switch toggles, a popover opens and closes by keyboard, chapter links cross book boundaries and stop at Matthew 1 and Revelation 22, and switching a category off removes it from the legend. Theme flash, routing and the server-rendered pages still need the check against `npm start`.
