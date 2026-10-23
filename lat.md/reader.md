# Greek reader

A static book and chapter browser presents the Greek text, factual word help and persistent display settings without a server or account.

## Navigation and availability

All 27 book pages and 260 chapter shells are exported, while chapter data loads independently in the browser.

[[src/lib/books.ts#BOOKS]] drives contents, chapter lists and static parameters. [[src/lib/books.ts#prevChapter]] and [[src/lib/books.ts#nextChapter]] cross book boundaries and omit terminal links. [[src/lib/corpus/load.ts#loadChapter]] caches chapter promises, prefetches neighbours and maps missing, failed or invalid data to typed unavailable results. Unexpected HTTP or data failures retain passage-specific diagnostics; network and server failures are evicted so a later load can recover. [[src/components/reading/reader.tsx#Reader]] retains navigation during loading and unavailable states.

## Words and display

The reader preserves source order and MACULA word identity, with keyboard-selectable words and factual morphology in an anchored popover.

[[src/components/reading/reader.tsx#GreekText]] groups words by verse and applies the selected font, size, spacing and optional verse numbers. [[src/components/reading/reader.tsx#WordDetail]] omits absent morphology and never exposes source syntax roles. Radix supplies Escape, outside-click dismissal and focus return; the word bubble becomes a bottom sheet on phones. [[src/lib/pos.ts#wordCategory]] assigns eleven categories, including verb mood distinctions; [[src/lib/pos.ts#categoryStyle]] pairs token colour with underline styling and the enabled-category legend.

## Browser settings

Settings validate every saved field independently and continue in memory when browser storage fails.

[[src/lib/settings.ts#mergeSettings]] restores defaults for malformed, missing or unknown fields. [[src/lib/settings.ts#useSettingsStore]] persists under the display storage key and hydrates after mount. [[src/components/reading/display-menu.tsx#DisplayMenu]] changes themes, fonts, size, spacing, verse numbers and colour categories immediately. [[src/components/theme-sync.tsx#ThemeSync]] applies the theme globally after hydration; the layout's constant blocking script applies saved themes before first paint.

## Verification

Pure-module tests verify book boundaries, categorisation, malformed settings, storage failures, corpus validation, request caching and licence-safe data.

See [[src/lib/books.test.ts]], [[src/lib/pos.test.ts]], [[src/lib/settings.test.ts]], [[src/lib/corpus/parse.test.ts]] and [[src/lib/corpus/load.test.ts]]. [[scripts/ingest/test_sample_chapter.py]] verifies extraction and provenance. [[scripts/qa/reader.cjs]] exercises the locally served export and captures desktop and phone evidence for keyboard selection, themes, navigation, credits and blocked storage.
