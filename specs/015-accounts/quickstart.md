# Quickstart Validation: Accounts and Sign-in

This guide describes acceptance after implementation. Account routes/configuration below are planned and do not work in the current app. Use a throwaway private DATA_DIR, never the developer's real work store. See [deployment](contracts/deployment.md), [account APIs](contracts/account-api.md) and [the data model](data-model.md) for authoritative shapes.

## Prerequisites and baseline

Use Node 26.13.1 and the committed npm lockfile. Install existing tools and Chromium:

```sh
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run format:check
npm test
lat check
```

During implementation, add focused account unit/integration tests to the existing Vitest `unit` project and colocated UI stories to its `storybook` project. Run `npx vitest run --project unit` for targeted database/auth tests and `npm test` for the complete suite. Use the installed Playwright with a real server for the scenarios below; add a documented `scripts/qa/accounts.mjs` runner and invoke `node scripts/qa/accounts.mjs` once it exists. Do not claim those scenarios passed merely because this document exists.

## Local offline signup and recovery — SC-001/002/008/009

Create a temporary directory with `mktemp -d`, set its absolute path as DATA_DIR and create a local `.env.local` from the implementation's `.env.example` (never commit secrets). Set `APP_MODE=local`, canonical `APP_ORIGIN=http://127.0.0.1:3000` and `AUTH_METHODS=password`. Seed the canonical corpus and start:

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Deny outbound sockets in the test harness. Create A and B with explicit consent, read captured messages in `DATA_DIR/mail/`, confirm on the landing form, sign out/in and time the operations. Before confirmation every save/list/export/import is refused; public reading works. Password minimum/common-list refusal and paste/password-manager use work offline. No outgoing HTTP mail request occurs even if production mail variables were accidentally set.

Request reset for existing and nonexistent addresses: identical visible responses, only the existing account gets a captured link. Consume once in a different browser; reuse and virtual-clock expiry past one hour fail. Change password/email with and without 15-minute fresh auth, verify old/new notifications and session revocation. Inject proof-link capture/delivery refusal: active account/credential/work state remains unchanged, errors are announced and retry is idempotent. Separately fail completion-notice delivery after a successful mutation: the mutation stays complete, pending/failed status is visible and retries do not duplicate it. Five wrong passwords produce stated slowdown; source throttles also apply to nonexistent emails, while reset still works.

Test the exact disabled-method configuration: create A via Google, sign out, enable only Microsoft in AUTH_METHODS (password and Google disabled), request recovery, open the captured link in a fresh browser and complete it. A receives a fresh ordinary session with its existing work; no password method, account or implicit link is created. Other sessions are revoked, one-use replay fails, and interrupted session handoff retries only within its five-minute receipt lifetime. Password signin/reset remains unavailable; unknown addresses get the generic response.

## Isolation matrix — SC-004/007

In separate browser contexts create work under A and B. Enumerate every registered personal data route/action, including count/preference/receipt/history APIs and every directly callable auth-library endpoint. Repeat as A, B, unconfirmed C and signed out. Compare foreign vs nonexistent ids for status, body/redirect, headers and absence of titles/passages/revisions. Test save/rename/delete with invalid content as well as valid content so early validation cannot reveal foreign records. Try cross-origin mutation/download requests, forged owner fields and unsafe return URLs. Assert no foreign rows change.

Create analyses/diagrams and, when available, translations and attempts; assert owner scoping of names, recency, active selection, idempotency and exports. If a sibling is absent, its export count is zero and import gives explicit per-record unsupported-kind refusals. Later sibling implementation must rerun this matrix before release.

## Upgrade, concurrency and failure — SC-003/006

Build a pre-account database fixture with 100 records across available kinds, including raw JSON that current validation refuses. Capture ids, raw document bytes, titles, passages, revision and timestamps. Start the new version locally: a private pre-migration backup exists, unowned work is inaccessible and public setup is available. Complete first account confirmation and compare every byte/field except owner. Browser settings from the creating browser become this account's settings; later accounts receive no legacy rows.

Race two completed account creations; exactly one gets all old records. Abandon a pending signup and complete a verified provider signup with the same email: discarded credentials cannot access the new account. Inject failures before backup, during assignment, before commit and after restart. There is no partial ownership; failed claim stops serving, the backup survives and live refuses the store. Never “fix” an invalid legacy document during assignment.

## Sessions, settings and drafts — SC-001/010

Open two tabs as A and another browser as A. Sign out in one tab; every local tab clears personal UI/settings immediately, including back/forward-cache restoration. Revoke everywhere and delete from the other browser; each client stops at its next action. With fake clocks, test 12-hour idle/session-cookie and fixed 30-day persistent expiry, rotation and one-use credentials. Test browser close/reopen with session restoration both disabled and enabled: discarded session cookies require signin; restored cookies may remain valid only within the 12-hour idle limit. Explicit signout/revocation must reject both cases, including restored tabs. Never claim browser close is a server-observable revocation event.

Queue A edits with an in-flight create and delayed response, switch to B, then release the response/retries. Nothing is written as B or shown in B's view; retained A drafts offer download or signing back into A. Repeat offline and after deletion. Configure different settings for A/B on two browsers; they apply on signin without reload. Signed out, original anonymous preferences return. Corrupt settings JSON and individual fields, including later English-line fields; rendering uses per-field defaults.

## Portability and deletion — SC-010/011

Export A; verify snapshot includes only A's study content/settings and excludes credentials, provider tokens and account/session identity. Import into empty B with settings explicitly selected: study content and valid historical attempt timestamps/source snapshots match, with fresh record ids. Repeat with a new import operation: separate copies. Retry the same transport operation: no duplicates. Include malformed records, unavailable kinds, newer document/header versions, naming collisions, unsupported edition/words and per-record limit violations; inspect paged indexed refusals and stream the full report. Preview makes no work changes and refuses invalid framing/trailer digest before commit. Generate one valid export containing over 10,000 records and over 50 MiB, import it fully with 8 MiB chunks and at most 1,000 records per commit call, and compare every valid record. Measure bounded memory/report pagination, retry identical chunks, resume interrupted batches and simulate low disk without declaring the file invalid.

Deletion preview counts every personal kind, offers export and requires typed email plus recent signin. Alter a record after preview and inject a final transaction failure: confirmation refreshes or fails, no work is deleted and no completion notice is emitted. Delete A and verify all work, auxiliary rows, methods, settings, links and sessions are gone, B unchanged, notice enqueued in the same commit and captured only afterward. Reject notice delivery after commit: A stays deleted, status shows pending/failed and retry is idempotent. Crash after mutation commit/before send, restart and verify delivery resumes without duplicate deletion or a false precommit notice. Same email/provider can create a new empty account. Test Apple revocation failure separately from local deletion. Document export and operator-backup retention boundaries.

## Provider interoperability — SC-001/007

Register Google/Microsoft test credentials and exact callback origins, enable only those configured, then test signup, explicit linking/unlinking and fresh authentication in real browsers. Test verified-email collision, provider already linked elsewhere, missing/unverified Microsoft email and provider email changes. The app must confirm Microsoft email itself before account completion/linking; a matching claim never joins accounts. Offline, show a provider connection failure and retain public reading/email fallback.

Adversarial fixtures additionally reject state/nonce/PKCE/issuer/audience failures, replay, changed link intent and cross-account reauth. Fixtures do not replace live provider smoke evidence. For Apple use developer credentials, a secure public callback, relay-sender registration and the explicit local host opt-in. Test hidden email, returning signin (including absent repeat name), secret rotation, relay delivery and account-deletion disconnection. Without prerequisites Apple is omitted locally with a warning; no other story is blocked.

## Local and live refusal matrix — SC-005/006

Retest spec 004's default bind, foreign Host rejection, Host-only allowlist without opt-in, allowed-host opt-in/warning and cross-origin exports in local mode. Another machine with default config receives no page/signin/work. Repeat dev, standalone production and Docker entrypoints.

For live use a disposable store and an HTTPS test ingress configured according to the deployment contract. Remove each requirement individually and several together: canonical secure origin, secret, each enabled production credential/class declaration, delivery transport, privacy/terms, clean ownership and valid store. Each startup exits nonzero before listening and names all detected missing items. Plain requests and forged forwarded HTTPS/Host headers cannot reach auth/personal data. Valid configuration serves public policy/terms and runs the same account suite. A fake string labelled “production” is not provider validation; require real-provider smoke evidence and independent security review before real exposure.

## Accessibility and final implementation gates — SC-012

Run all account stories through axe in light/dark/sepia, then complete every flow with keyboard only and touch only. Include consent, resend, provider selection, menu, fresh authentication, import report, deletion and legal/startup-error pages. Check focus, live announcements, zoom/reflow and meaningful non-colour cues. Measure timed success criteria using local capture and report provider/network timing separately.

```sh
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
npm run build-storybook
lat check
```

Use the existing CI migration-drift and Docker smoke checks with account-aware assertions, plus the new real-server account runner. Update implemented Lat sections and obtain independent code/security review. Passing config checks or a P1 local milestone alone is insufficient evidence to release accounts on a network.
