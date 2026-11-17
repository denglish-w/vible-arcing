# Quickstart: Learning Mode (Parsing Practice)

How to prove the feature works once it is built. Interfaces are in [contracts/](contracts/) and shapes in [data-model.md](data-model.md).

## Prerequisites

- `fnm use`, `npm install`, `npx playwright install chromium` (first time only).
- A corpus store: `npm run db:seed`.
- The new migration applied: `npm run db:migrate` (backs up `app.sqlite` first).

## 1. Automated checks

```sh
npm run lint && npm run typecheck && npm run format:check
npx vitest run --project unit src/lib/learning src/db/attempts.test.ts
npm test                     # unit + every story rendered with axe in all themes
npm run db:generate          # expect no new migration files (CI check)
```

Expected unit coverage:

- `fields.test.ts`: every row of data-model "fieldsFor" (SC-004).
- `grade.test.ts`: participle shortcut, `n/a` against blank source, unanswered fields, accent- and breathing-free lemmas agreeing (SC-006), inflected form differing from the lemma (User Story 1 scenario 7).
- A corpus test: every `pos` and morphology value in `corpus/v1` is in the closed lists (catches drift after re-ingest).
- `translit.test.ts`: Beta Code letters, final sigma, Greek passed through.
- `validate.test.ts`: fields that do not apply, values outside the lists, unknown word ids.
- `attempts.test.ts`: insert-or-ignore by id, latest attempt per word, survival of attempts whose word is missing.

## 2. The answer is not in the page (SC-002)

```sh
npm run build && npm start &
# Switch to Learning mode once in a browser (sets the cookie), or send it directly:
curl -s -H 'Cookie: vible.mode=learning' http://127.0.0.1:3000/read/php/1 > /tmp/learning.html
grep -c '"lemma"\|"gloss"\|"pos"' /tmp/learning.html      # expect 0
grep -c 'εὐχαριστέω' /tmp/learning.html                     # lemma of εὐχαριστῶ (1:3); expect 0
curl -s http://127.0.0.1:3000/read/php/1 | grep -c '"lemma"'   # Reading mode: expect > 0
```

`scripts/qa/reader.cjs` gains the same assertions so CI runs them.

## 3. Manual walk-through

1. Open Philippians 1 with part-of-speech colouring on. Switch to Learning: colouring and legend disappear and the notice appears (User Story 4).
2. Select εὐχαριστῶ (1:3). Type `euxaristew`: it appears as Greek. Choose verb → indicative; the form asks tense, voice, mood, person, number and not case or gender. Choose a wrong tense and check: only tense differs, shown with a word and a symbol, and announced (User Story 1).
3. Restart the server (`npm start` again). Open the chapter in another browser, switch it to Learning and reopen 1:3: the form is pre-filled and says when it was checked and that one field differed, without the source values (User Story 2).
4. Use Next word across the 1:3 → 1:4 boundary, then jump to the last word of the chapter and press Next word: "End of the chapter" offers Philippians 2 (User Story 3).
5. Repeat steps 2 and 4 with keyboard only, with VoiceOver, and in a tablet-sized touch emulation (User Story 5).
6. Make saving fail while checking still works (for example, in the browser's developer tools block only the `recordAttempt` action request, or make `app.sqlite` read-only), check a word: the result shows at once with "Not saved yet — retrying"; unblock: the indicator clears (User Story 2 scenario 5). Then stop the server and check a word: the form keeps the answers, says "Couldn't check this word" and offers "Check again", and shows no source value (spec edge case "the check cannot reach the server").
7. Rebuild the corpus (`npm run db:seed`) and reopen a word checked earlier: it is still pre-filled (SC-005).
8. Download `/api/attempts/export` and confirm it lists the attempts with references, surface forms and edition (FR-028).
9. Switch back to Reading: colouring returns and the display menu shows the same settings as before (SC-009).
