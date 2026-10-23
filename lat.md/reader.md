# Greek reader

A static book and chapter browser presents the Greek text, factual word help and persistent display settings without a server or account.

## Navigation and availability

All 27 book pages and 260 chapter shells are exported, while chapter data loads independently in the browser.

[[src/lib/books.ts#BOOKS]] drives contents, chapter lists and static parameters. [[src/lib/books.ts#prevChapter]] and [[src/lib/books.ts#nextChapter]] cross book boundaries and omit terminal links. [[src/lib/corpus/load.ts#loadChapter]] caches chapter promises, prefetches neighbours and maps missing, failed or invalid data to typed unavailable results. Unexpected HTTP or data failures retain passage-specific diagnostics; network and server failures are evicted so a later load can recover. [[src/components/reading/reader.tsx#Reader]] retains [[src/components/reading/chapter-navigation.tsx#ChapterNavigation]] during the [[src/components/reading/chapter-status.tsx#ChapterLoading]] and [[src/components/reading/chapter-status.tsx#ChapterUnavailable]] states.

## Words and display

The reader preserves source order and MACULA word identity, with keyboard-selectable words and factual morphology in an anchored popover.

[[src/components/reading/greek-text.tsx#GreekText]] groups words by verse and applies the selected font, size, spacing and optional verse numbers. [[src/components/reading/word-detail.tsx#WordDetail]] omits absent morphology and never exposes source syntax roles. Radix supplies Escape, outside-click dismissal and focus return; the word bubble becomes a bottom sheet on phones. [[src/lib/pos.ts#wordCategory]] assigns eleven categories, including verb mood distinctions; [[src/lib/pos.ts#categoryStyle]] pairs token colour with underline styling, used by the words and by [[src/components/reading/pos-legend.tsx#PosLegend]], which lists only the enabled categories.

## Browser settings

Settings validate every saved field independently and continue in memory when browser storage fails.

[[src/lib/settings.ts#mergeSettings]] restores defaults for malformed, missing or unknown fields. [[src/lib/settings.ts#useSettingsStore]] persists under the display storage key and hydrates after mount. [[src/components/reading/display-menu.tsx#DisplayMenu]] changes themes, fonts, size, spacing, verse numbers and colour categories immediately. [[src/components/theme-sync.tsx#ThemeSync]] applies the theme globally after hydration; the layout's constant blocking script applies saved themes before first paint.

## Verification

Pure-module tests verify book boundaries, categorisation, malformed settings, storage failures, corpus validation, request caching and licence-safe data.

See [[src/lib/books.test.ts]], [[src/lib/pos.test.ts]], [[src/lib/settings.test.ts]], [[src/lib/corpus/parse.test.ts]] and [[src/lib/corpus/load.test.ts]]. [[src/db/seed.test.ts]] checks the committed corpus files and the store built from them. [[scripts/qa/reader.cjs]] exercises the locally served export and captures desktop and phone evidence for keyboard selection, the saved theme already on `<html>` when the body is first parsed, the phone logo link's name, navigation, credits and blocked storage.

## Component stories

Every reader component and UI primitive has stories beside it, fed by props or by the settings store, so the storybook test project checks each state for crashes, failed interactions and axe violations.

[[src/stories/fixtures.ts#philippians1]] parses the committed Philippians 1 chapter, so no story fetches. [[src/stories/with-settings.ts#resetSettings]] resets the settings store before each story to the defaults plus its `settings` parameter, and restores it afterwards. Dark and sepia story variants set the Theme global so axe also checks those themes. Play functions assert the keyboard and pointer behaviour the specs name: Escape closes the word popover and returns focus to the word, selecting another word moves the popover, a switch toggles, a popover opens and closes by keyboard, chapter links cross book boundaries and stop at Matthew 1 and Revelation 22, and switching a category off removes it from the legend. Theme flash, static routing and the exported build still need the served-export check.
