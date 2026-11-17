# Tasks: Accounts and Sign-in

**Input**: Design documents from `/specs/015-accounts/`: [spec](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [contracts](contracts/) and [quickstart](quickstart.md).

**Feature**: `015-accounts`; generated on `main` without checkout. These are unchecked implementation tasks; this command implements no account behavior.

**Tests**: Included because spec 015 expressly requires isolation/startup/accessibility tests and measurable acceptance scenarios (SC-001–SC-012). For each story, write its tests and confirm failure before implementation; test-first foundation work also protects behavior during settings extraction.

**Organization**: Setup → shared foundation → nine story phases in priority order → release checks. Each story lists its prerequisites and independently runnable acceptance criterion; dependent stories use already completed account services or isolated fixtures, never undocumented stubs.

## Format and path conventions

Tasks use `- [ ] Tnnn [P?] [USn?] description with path`. `[P]` means separate-file work may run concurrently in the indicated wave, after earlier prerequisites finish. It does not authorize parallel changes to shared schema/services or skip tests. Paths are repository-relative and new files are implementation targets. Existing single Next.js `src/`, colocated tests, `scripts/` and `drizzle/app/` remain the project layout.

All numeric limits, enum choices and data invariants quoted in tasks come from the data model/contracts. The linked documents remain authoritative for full field shapes and endpoint responses. Do not install extra packages beyond the planned auth pair without explicit authorization; no mail SDK or cryptography implementation is needed.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing project and reconcile the normative account boundary; do not initialize a second application.

- [ ] T001 Reconcile feature 015 with current OpenSpec requirements: create `openspec/changes/accounts-and-sign-in/proposal.md`, `openspec/changes/accounts-and-sign-in/design.md` and account/local-server/saved-work/reader deltas under `openspec/changes/accounts-and-sign-in/specs/`; update affected `specs/002-greek-reader/spec.md`, `specs/004-local-only-server/spec.md` and `specs/005-saved-work/spec.md`, preserving spec 004 local behavior and spec 015’s completed-creation clarification. Validate the OpenSpec change strictly before implementation.
- [ ] T002 Check the selected stable auth release and advisories against `specs/015-accounts/research.md` R1, then add only the planned exact matching Better Auth and Drizzle-adapter pins to `package.json` and `package-lock.json`; retain Node 26.13.1 and existing tooling. Update research only if evidence changes the selected version.
- [ ] T003 [P] Record authentication package licences and the licence/provenance of the bundled offline common-password list in `docs/reference/data-sources.md`; add the licensed list at `src/lib/auth/common-passwords.json`, without external password-checking requests.
- [ ] T004 [P] Create `.env.example` covering `APP_MODE`, `APP_ORIGIN`, secrets, enabled methods, provider credential classes, Resend sender/key, legal files, trusted ingress and DATA_DIR per `specs/015-accounts/contracts/deployment.md`; no real secrets or production credentials.
- [ ] T005 [P] Create the isolated browser QA harness in `scripts/qa/accounts.mjs` using installed Playwright, throwaway DATA_DIR, separate browser contexts, local capture reading, fake-clock/failure controls and outbound-socket denial; document its command in `specs/015-accounts/quickstart.md`.

**Checkpoint**: T001–T005 complete and the phase prerequisites are validated.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete shared contracts, schema and fail-closed guards before implementing any story. Tests in the spec/quickstart require regression and adversarial coverage; write the relevant failing tests before behavior.

- [ ] T006 Add mapped auth schema and migration tests in `src/db/accounts-schema.test.ts`: assert UUID account ids, unique canonical email keys, unique provider identity/password constraints, owner-only new work, pending quarantine, cascades and unchanged corpus.
- [ ] T007 [P] Add shared request/session/mail contract tests in `src/lib/auth/boundary.test.ts` for wrong Host/Origin, CSRF, absent/unconfirmed actors (injected session fixtures), raw-library mutation bypass, token replay and mail acceptance/commit failure ordering. Test real session issuance/rotation in US1, not as a prerequisite for this phase.
- [ ] T008 Map Better Auth user/account/session/verification models in `src/db/schema/app.ts`, including account fields `id`, `email`, `emailKey`, `emailVerifiedAt`, lifecycle, display name, `createdAt`, `authEpoch`, settings/revision and consent version/digest/time. Enforce “UUID `id`”, “unique `emailKey` (trim and lowercase, no provider-specific dot/plus rewriting)”, “lifecycle (`pending`, `active`)” and “Account id is permanent; email is mutable.” Include pending-registration email/hash-or-identity/consent/signup-browser-settings/expiry/nonce fields; pending rows never own work.
- [ ] T009 Add method/session/callback/email-token/throttle tables to `src/db/schema/app.ts`: method id/account FK/kind/issuer/subject/email/provenance/hash/time, session bearer token/account/issued/activity/freshness/expiry/persistent/epoch, callback nonce/intent/browser/session/account/epoch/provider/PKCE/state/return/consent, purpose-bound token digest/subject/target/expiry/used/epoch and throttle key/window/count/block fields. Enforce “kind (`password`, `google`, `microsoft`, `apple`)”, “Unique `(issuer, subject)`”, “one password method per account” and callback “intent (`signin`, `link`, `reauth`)”.
- [ ] T010 Add indexed account foreign-key `owner_id` to existing personal tables plus legacy-claim, operation, mail and import-receipt storage in `src/db/schema/app.ts`; enforce “The only null ownership allowed is the quarantined legacy-claim state”, “All auxiliary rows cascade on deletion” and legacy “singleton state (`pending`, `complete`, `failed`)”. Keep operation keys, prepared payloads, destination/status/expiry, backup identity, claimed account, counts/digests/time explicit; generate and commit migrations/snapshots under `drizzle/app/` through the existing backup runner.
- [ ] T011 [P] Extract existing per-field `mergeSettings` and defaults into browser-safe `src/lib/account/display-settings.ts`, update `src/lib/settings.ts` imports and retain anonymous `vible.display` semantics; write regression tests in `src/lib/account/display-settings.test.ts` before moving logic. Preserve “invalid/missing fields default independently, including later fields.”
- [ ] T012 [P] Implement shared typed results/input envelopes and app-only return-path parsing in `src/lib/auth/contracts.ts` and `src/lib/auth/return-path.ts`; match status/reason mapping in the API contract, reject external/protocol-relative/backslash/credential-bearing paths and fall back to `/`.
- [ ] T013 Implement mapped auth server wiring and endpoint allowlisting in `src/lib/auth/server.ts` and `src/app/api/auth/[...all]/route.ts`; disable stock signup/verification/change/delete bypasses, use documented cookie integration and library hash/OAuth primitives, and keep pending users non-owner-capable. Supply validated loopback/local-password defaults and private local secret loading here so US1 does not depend on the later live-configuration phase. Separate routine library transactions from app lifecycle transactions; never nest auth API calls inside `BEGIN IMMEDIATE`.
- [ ] T014 Implement database-authoritative actor/session and request guards in `src/lib/auth/actor.ts`, `src/lib/auth/request-policy.ts` and `src/db/server.ts`; no authorization cookie cache, no authoritative client owner, confirmed actor required for personal data. Keep existing local Host/Origin policy, conceal direct foreign/missing/signed-out records identically and deny unaudited personal entry points until US2 wires them.
- [ ] T015 Implement purpose-bound proof-link issuance/atomic consumption and staged proof mail in `src/lib/auth/email-tokens.ts`, `src/db/account-operations.ts` and `src/lib/auth/mail.ts`: SHA-256 digests, “One-hour expiry for confirmation/reset/change/recovery”, “GET renders a landing form; POST consumes the token” and “Unsent proof operations expire after one hour”. Immediate proof-send failure preserves active state. Implement a distinct completion-notice outbox committed with mutations, eligible for sending only after commit; rollback emits no notice. No secret logs or public capture route.

**Checkpoint**: T006–T015 complete and the phase prerequisites are validated.

## Phase 3: User Story 1 — Email/password account creation and sign-in (Priority: P1)

**Purpose**: Deliver offline-capable consent, confirmation, signin/menu and multi-tab signout on an empty local store. An upgrade store stays quarantined until US3.

**Independent test**: In local mode with outbound sockets denied, sign up, read the captured email, confirm, sign out/in, submit an owner-scoped save and verify pending/signed-out saves fail; public Greek reading remains available. Test restored and discarded browser sessions against the same idle/revocation policy. Timing: signup/confirmation under two minutes and returning signin under 30 seconds.

- [ ] T016 [P] [US1] Add signup/confirmation/session contract tests in `src/lib/auth/registration.test.ts`, including case-insensitive duplicates, consent, pending signup, one-use cross-browser confirmation, resend, proof-send failure and unsafe returns (FR-001–008, FR-011). Test session restoration enabled/disabled, 12-hour idle expiry and explicit revocation; do not assert unconditional browser-close logout.
- [ ] T017 [P] [US1] Add accessible form/menu interaction and axe stories in `src/components/account/signin-form.stories.tsx` and `src/components/account/account-menu.stories.tsx`, covering pending/invalid/duplicate/success states and password-manager paste without secrets in responses.
- [ ] T018 [US1] Implement `src/lib/auth/passwords.ts` using library salted adaptive scrypt; enforce “Validate 10–128 Unicode characters before hashing”, the licensed common-password list, password-manager/paste support and hash-work limits. Never send passwords to external checks.
- [ ] T019 [US1] Implement provisional signup, consent receipt, generic duplicate-address responses/email and resend in `src/db/accounts.ts` and `src/lib/auth/registration.ts`; use the pending settings snapshot and unique canonical email policy, not an email-only login. Account activation must call the atomic claim coordinator when legacy state is pending; until US3 exists, refuse activation on an upgrade store.
- [ ] T020 [US1] Implement confirmation activation on an empty store in `src/lib/auth/activation.ts` and `src/app/api/account/confirm/route.ts`; consume proof and activate in one app transaction, then issue a session separately. A failed post-commit signin leaves a recoverable active account; no partial account/claim commit.
- [ ] T021 [US1] Implement database sessions and signin/signout/session handlers in `src/lib/auth/sessions.ts`, `src/app/api/account/signin/route.ts`, `src/app/api/account/signout/route.ts` and `src/app/api/account/session/route.ts`; enforce “Nonpersistent sessions have no persistent cookie expiry and expire after 12 hours idle” and “persistent sessions have a fixed 30-day lifetime”, keep-signed-in off by default, token rotation, secure HttpOnly/host-only/SameSite cookies and no-store. Restored browser session cookies remain subject to server idle limits; explicit revocation always wins.
- [ ] T022 [US1] Wire signup/resend endpoints in `src/app/api/account/signup/route.ts` and `src/app/api/account/confirm/resend/route.ts`, plus minimal authenticated create/save in `src/app/(work)/actions.ts` and `src/db/work.ts`; derive owner from actor, require confirmation and check owner before revealing revision/content validation results. Leave other personal routes fail-closed until US2.
- [ ] T023 [US1] Build signup/signin/confirmation/account pages and labelled consent in `src/app/(account)/signup/page.tsx`, `src/app/(account)/signin/page.tsx`, `src/app/(account)/confirm/page.tsx`, `src/app/(account)/account/page.tsx` and `src/components/account/`; create public labelled local-placeholder policy/terms at `src/app/(account)/privacy/page.tsx` and `src/app/(account)/terms/page.tsx` so consent links already work. Include data/purpose/legal links, resend, local capture guidance, enabled-provider slots, safe return path, live errors and no-referrer token landing/history cleanup.
- [ ] T024 [US1] Add the shell account menu and local file-access limitation notice in `src/components/site-shell.tsx` and `src/components/account/account-menu.tsx`; keep reading/word details/credits/reference public and preserve passage/view across authentication.
- [ ] T025 [US1] Implement same-browser identity broadcasts, storage-event fallback and focus/visibility/history-restoration checks in `src/components/account/session-provider.tsx`; on signout clear personal views and account settings in every tab, restore anonymous settings and expose unsaved-work wait/download/leave choices.
- [ ] T026 [US1] Extend `scripts/qa/accounts.mjs` with offline signup/confirmation/signin/signout, session expiry and two-tab public-reading checks; verify captured emails only, confirmed-only save, no duplicate enumeration and the story timing criteria.

**Checkpoint**: T016–T026 complete and the independent test passes.

## Phase 4: User Story 2 — Each account’s work is private (Priority: P1)

**Purpose**: Complete mandatory owner scoping across all current personal entry points and auxiliary state.

**Independent test**: Create A/B work, then compare foreign versus missing record responses as A, B, pending C and signed out across list/count/open/export/save/rename/delete; no cross-owner mutation or content is returned.

- [ ] T027 [P] [US2] Add SQLite owner/revision/invalid-content and auxiliary-row isolation tests in `src/db/work-ownership.test.ts`; cover identical absent/foreign results, forged owners, foreign idempotency ids and conditional-write conflict readbacks (FR-025–029, SC-004).
- [ ] T028 [P] [US2] Add endpoint inventory/response-equivalence tests in `src/lib/auth/personal-routes.test.ts` enumerating current work actions/pages/downloads and any available sibling routes, including count/history/preference/receipt paths and unconfirmed visitors.
- [ ] T029 [US2] Complete required actor parameters and `(owner_id, id)` predicates throughout `src/db/work.ts`, including list/count/get/create/save/rename/delete, preliminary revision checks and final conflict lookup. Enforce “Foreign rows never produce validation or revision details” and conditional writes including expected revision; no unscoped personal helper remains.
- [ ] T030 [US2] Wire owner-only work list/detail/actions/downloads in `src/app/(work)/actions.ts`, `src/app/(work)/work/page.tsx`, `src/app/(work)/analysis/[id]/page.tsx`, `src/app/(work)/diagram/[id]/page.tsx` and `src/app/api/analyses/[id]/export/route.ts`; retain the existing same-origin download policy and portable shapes, identical direct-id 404/signin-offer behavior and private/no-store responses.
- [ ] T031 [US2] Owner-scope available sibling storage/reader additions in `src/db/attempts.ts`, `src/db/translations.ts`, `src/app/read/learning-actions.ts` and their personal export/actions only if present. Enforce translation names “`(owner_id, edition, book, chapter, nameKey)`”, preferences “`(owner_id, edition, book, chapter)`”, scoped recency/creation receipts and attempt idempotency; “Same attempt id from another owner must not be accepted as a successful retry”. For absent siblings, add migration/integration requirements to `specs/010-learning-mode/plan.md` and `specs/011-verse-translation/plan.md` rather than inventing tables/features.
- [ ] T032 [US2] Bind autosave/controllers/in-flight creates/outboxes and response handlers to originating account and opaque generation in `src/lib/autosave.ts`, `src/lib/use-autosave.ts` and `src/components/account/draft-recovery.tsx`; stop old-owner sends on identity switch/revocation, retain download/sign-back-in recovery and never retry A’s draft into B. Integrate any available sibling queues without implementing absent editors.
- [ ] T033 [US2] Extend `scripts/qa/accounts.mjs` with the full endpoint isolation matrix, cache/history checks and delayed A→B create/save races; exercise valid and invalid foreign writes and assert no account detail, revision or saved text leaks.

**Checkpoint**: T027–T033 complete and the independent test passes.

## Phase 5: User Story 3 — Preserve work saved before accounts (Priority: P1)

**Purpose**: Claim every legacy row exactly once for the first completed local account, without content validation or rewriting.

**Independent test**: Upgrade a fixture containing 100 saved records including invalid raw payloads, confirm two accounts concurrently, and verify exactly one receives every byte/metadata field unchanged, with a private backup and fail-closed recovery on injected faults.

- [ ] T034 [P] [US3] Add legacy upgrade/claim tests in `src/db/legacy-claim.test.ts` covering 100-row raw-byte fixtures, invalid old documents, reverse-order concurrent confirmations, signup-browser settings confirmed elsewhere, WAL-consistent backups, failure/restart and live refusal (FR-030–033, SC-003/006).
- [ ] T035 [US3] Extend backup/migration quarantine in `src/db/migrate.ts` and `src/db/legacy-claim.ts`; preserve existing integrity/backup behavior, store legacy counts/digests/backup identity and serve only public reading/account setup while pending. Never prune the sole failed-claim backup or permit new unowned work.
- [ ] T036 [US3] Implement the serialized claim coordinator in `src/db/legacy-claim.ts`: private SQLite-consistent backup before transaction, recheck candidate state inside `BEGIN IMMEDIATE`, activate account/consume proof/assign all unowned rows atomically, verify counts/digests and mark complete. Preserve “ids, titles, passages, raw document strings, revisions and timestamps”, including invalid legacy content; later accounts get no legacy work.
- [ ] T037 [US3] Wire pending legacy activation and originating-browser settings into `src/lib/auth/activation.ts` and `src/db/accounts.ts`; an abandoned unconfirmed signup never reserves ownership and a claim failure rolls back all work/account activation, persists failure status outside rollback, closes the listener and requires repair/restart.
- [ ] T038 [US3] Integrate pending/failed claim checks in `src/lib/auth/startup.ts`, `src/instrumentation.ts` and account-setup notices in `src/components/account/legacy-work-notice.tsx`; live names the local-claim requirement, failed claim never silently resumes and invalid migrated work is reported as needing attention without being dropped.
- [ ] T039 [US3] Extend `scripts/qa/accounts.mjs` with the byte-for-byte upgrade race, backup/failure injection and first-browser settings checks; rerun against all personal kinds available at implementation time.

**Checkpoint**: T034–T039 complete and the independent test passes.

## Phase 6: User Story 4 — One app in local or live mode (Priority: P1)

**Purpose**: Enforce configuration-only deployment differences without enabling real network release before later gates.

**Independent test**: Retest local default bind/Host/Origin/opt-in warning unchanged, then reject each missing live prerequisite before listening; with valid disposable HTTPS configuration, the same account flows run.

- [ ] T040 [P] [US4] Add configuration/launch refusal tests in `src/lib/auth/config.test.ts` and `src/lib/auth/startup.test.ts`, including all missing requirements together, credentials class declarations, legal text, delivery, owner state and no startup DB access during build (FR-034–039, SC-005/006).
- [ ] T041 [P] [US4] Add Host/HTTPS/trusted-ingress regression tests in `src/lib/host.test.ts` and `src/proxy.test.ts`; reject forged forwarded headers/direct insecure account access while retaining every existing local opt-in scenario.
- [ ] T042 [US4] Implement validated deployment config and transport selection in `src/lib/auth/config.ts`: “only `local` or `live` accepted”, enabled “password/google/microsoft/apple”, at least one usable method, canonical origin without path/query/userinfo, stable secret and production credential declarations, legal files and private DATA_DIR. Local defaults to password/loopback; require live mail for provider-only recovery/deletion too.
- [ ] T043 [US4] Implement live mail delivery in `src/lib/auth/mail-resend.ts` with built-in fetch, verified sender, persisted UUID and immutable request body. Service deduplication lasts 24 hours; persist local results and stop ambiguous automatic retries after that window. Dispatch prepared proof messages while their links are inert, then finalize proof operations only after acceptance; dispatch completion notices only from committed outbox rows; retry postcommit notices for seven days with capped backoff, then report failure without rolling back mutations. Local never constructs an outbound transport.
- [ ] T044 [US4] Implement shared pre-listen validation in `src/lib/auth/startup.ts` and `scripts/auth-preflight.ts`, wire `package.json` dev, `scripts/start.sh`, `scripts/docker-entrypoint.sh` and `src/instrumentation.ts`, and update `Dockerfile` runtime COPY dependencies. Aggregate detectable errors before binding; skip build-time startup work and keep existing local warning exactly.
- [ ] T045 [US4] Wire mode-aware canonical Host/HTTPS/trusted-peer checks in `src/lib/host.ts`, `src/proxy.ts` and `src/db/server.ts`; preserve local behavior, reject plain live personal/auth requests and spoofed X-Forwarded headers, and document the backend/ingress trust boundary in `docs/accounts-deployment.md`.
- [ ] T046 [US4] Extend the existing local-placeholder pages with public operator-content privacy/terms in `src/app/(account)/privacy/page.tsx` and `src/app/(account)/terms/page.tsx`; local placeholders are labelled, live refuses missing/empty/unreadable text and account UI offers only configured usable methods. Reserve the disabled-only-method recovery link for US5.
- [ ] T047 [US4] Extend `scripts/qa/accounts.mjs` and `.github/workflows/ci.yml` with dev/standalone/Docker local and disposable-live refusal/HTTPS tests; preserve existing foreign-Host smoke checks, distinguish declared versus provider-verified production credentials and keep real network release gated until US5–US8 plus review.

**Checkpoint**: T040–T047 complete and the independent test passes.

## Phase 7: User Story 5 — Recover and secure an account (Priority: P2)

**Purpose**: Deliver reset, fresh authentication, password/email changes, throttling and global revocation.

**Independent test**: Reset via local capture within five minutes, reject reused/expired proofs, confirm email changes, revoke two browsers and verify cooldown. With password and the only linked provider disabled, inbox recovery signs a fresh browser into the same account without adding password.

- [ ] T048 [P] [US5] Add recovery/proof-purpose/expiry/session-revocation/recent-auth tests in `src/lib/auth/recovery.test.ts`, including a signed-out Google-only account when only Microsoft is enabled and password/Google are disabled. Inbox recovery must issue a normal session without adding password, revoke old sessions, reject replay, and retry interrupted issuance only through its five-minute one-use receipt. Cover independent proof-send failures and postcommit notification failures (FR-012–016).
- [ ] T049 [P] [US5] Add account/source throttle fake-clock tests in `src/lib/auth/throttle.test.ts` for unknown-address equivalence, reset independence and trusted source identity; add recovery/reauth/error/slowdown stories in `src/components/account/recovery-form.stories.tsx`.
- [ ] T050 [US5] Implement persistent throttling in `src/lib/auth/throttle.ts` and signin integration in `src/lib/auth/sessions.ts`: “Five consecutive account failures trigger a 60-second cooldown, doubled on further failed windows up to 15 minutes”; “20 failures per source in five minutes triggers the same schedule”; reset has an “independent five-per-hour destination/source limit”; retain counters “at most 24 hours”. No puzzle/timed challenge or account-existence disclosure.
- [ ] T051 [US5] Implement password reset and separate built-in inbox recovery in `src/lib/auth/recovery.ts`, `src/app/api/account/password/reset-request/route.ts`, `src/app/api/account/password/reset/route.ts`, `src/app/api/account/recovery/request/route.ts` and `src/app/api/account/recovery/complete/route.ts`. Password reset/addition requires password enabled. Recovery is available independently of AUTH_METHODS only for an existing active account’s confirmed inbox: generic request, one-hour account/email/epoch-bound proof, atomic consume/revoke and a five-minute browser-bound session-issuance receipt. Redeem after commit for one fresh nonpersistent ordinary session, idempotently returning that same session on a lost-response retry without prior session/password/new account/linking; expired handoff requires fresh recovery.
- [ ] T052 [US5] Implement reauthentication, password change and global signout in `src/lib/auth/reauth.ts`, `src/app/api/account/reauth/route.ts`, `src/app/api/account/password/change/route.ts` and `src/app/api/account/signout-all/route.ts`; enforce “Reauthentication rotates the token and updates fresh-authentication time” and the spec’s 15-minute limit, same-account proof and required other-session revocation.
- [ ] T053 [US5] Implement staged new-address proof and final email change in `src/lib/auth/email-change.ts` and `src/app/api/account/email/change/route.ts`; bind account/target/epoch and recheck uniqueness/freshness inside commit. Keep old email until proof; atomically change/revoke other sessions/enqueue old-address completion notice, and send it only after commit. Rollback sends no completion notice; delivery outage reports notice pending/failed without undoing the email change.
- [ ] T054 [US5] Build reset/recovery/fresh-auth/security forms in `src/app/(account)/reset-password/page.tsx`, `src/app/(account)/recover-account/page.tsx` and `src/components/account/security-settings.tsx`; accessible generic messages, cooldown/resend/expiry/capture guidance, no lost drafts and separate mutation/notice status. Disabled-only-provider users can recover from a signed-out browser while disabled password controls stay hidden.
- [ ] T055 [US5] Extend `scripts/qa/accounts.mjs` with offline reset timing, session-restoration on/off, global revocation/draft download, fresh-auth expiry, postcommit notices, cooldowns and the exact password-disabled/only-linked-provider-disabled inbox recovery matrix. Assert same existing owner/work, no password insertion/implicit linking, one-use proof and five-minute handoff expiry/retry.

**Checkpoint**: T048–T055 complete and the independent test passes.

## Phase 8: User Story 6 — Google/Microsoft and explicit method linking (Priority: P2)

**Purpose**: Add providers under the same consent, activation, proof and account-isolation policy.

**Independent test**: With local test clients, create via Google, link Microsoft/password, sign in through each and unlink safely; verified-email collisions never merge accounts and unverified Microsoft email requires app proof.

- [ ] T056 [P] [US6] Add provider callback/linking contract fixtures in `src/lib/auth/providers.test.ts` for issuer/audience/state/nonce/PKCE, replay, email collision, pending signup replacement, missing/unverified Microsoft email, changed provider email, existing links and cross-account reauth (FR-017–024, SC-007).
- [ ] T057 [P] [US6] Add provider-choice/email-proof/method-management keyboard/axe stories in `src/components/account/signin-methods.stories.tsx`; cover unavailable/offline and last-enabled-method refusal.
- [ ] T058 [US6] Implement provider transaction storage/consent binding in `src/lib/auth/provider-transactions.ts`; enforce “short-lived, single-use nonce”, “intent (`signin`, `link`, `reauth`)” and “Expire transactions after ten minutes”, binding link/reauth to initiating session/account/epoch and sanitized return path.
- [ ] T059 [US6] Implement Google/Microsoft validation and staged identity completion in `src/lib/auth/providers.ts` and auth route integration in `src/app/api/auth/[...all]/route.ts`; disable implicit linking, identify Microsoft tenant/subject stably, discard Google/Microsoft provider tokens after validation and request identity scopes only. Unverified provider email cannot match/link/confirm accounts; use app email proof before completion.
- [ ] T060 [US6] Implement atomic verified-provider creation/pending-password replacement in `src/lib/auth/activation.ts` and `src/db/accounts.ts`; confirmed email collisions require existing-account signin then explicit linking, provisional rows/credentials/tokens are discarded safely, and new activation shares the US3 claim transaction rather than a post-create hook.
- [ ] T061 [US6] Implement explicit link/unlink/add-password operations in `src/lib/auth/methods.ts` and `src/app/api/account/methods/route.ts`; require same-account fresh auth/email proof, unique `(issuer, subject)` and at least one enabled usable method checked transactionally. Provider email changes never silently change account email.
- [ ] T062 [US6] Integrate provider buttons and method/settings UI in `src/components/account/provider-choice.tsx` and `src/components/account/signin-methods.tsx`; omit disabled methods, explain offline fallback, request consent before completed creation and expose no implicit-link or owner-selecting client option.
- [ ] T063 [US6] Extend `scripts/qa/accounts.mjs` and `docs/accounts-deployment.md` with real Google/Microsoft local test-client smoke instructions/results, explicit linking/disabled-method recovery and no-provider-work disclosure assertions. Offline fixtures prove rejection policy; do not claim real interoperability without the credentialed run.

**Checkpoint**: T056–T063 complete and the independent test passes.

## Phase 9: User Story 7 — Account export, import and deletion (Priority: P2)

**Purpose**: Provide complete owner-only portability and irreversible local account removal with explicit confirmation.

**Independent test**: Export A as one streamed file (including >50 MiB and >10,000 records), import into B with settings selected and compare valid content/new ids; retry/resume without duplication. Delete A and prove no false precommit notice, unchanged B and independent postcommit notice retry.

- [ ] T064 [P] [US7] Add streamed export/import tests in `src/lib/account/portability.test.ts` and `src/db/account-portability.test.ts`: one valid file over 50 MiB and 10,000 records round-trips, bounded-memory chunk/line/batch parsing, digest/version/framing checks, report pagination, resume/idempotency/disk errors, invalid records, unavailable siblings and settings conflicts (FR-042–043, SC-011).
- [ ] T065 [P] [US7] Add deletion transaction/notification race tests in `src/db/account-deletion.test.ts`: changed preview or failed final commit deletes nothing and emits no completion notice; successful deletion and notice enqueue commit atomically. Delivery failure/crash after commit leaves account deleted with pending/failed notice status and idempotent retry; cover typed email/fresh auth/cascades/stale sessions/unchanged B (FR-044, SC-010).
- [ ] T066 [US7] Define streamed account-file validation in `src/lib/account/export-format.ts`: one UTF-8 NDJSON file with header “`format: "vible-account-export"`”, “`formatVersion: 1`”, settings/exportedAt/all four kinds; bounded record lines carrying kind/source id/edition/doc version/anchors/timestamps/content; final counts and SHA-256 of preceding bytes/line endings. Use standard per-line JSON parsing with limits derived from shared save validators; exclude account/auth/session/token/consent/delivery data, preserve escaped user newlines and never impose a whole-file cap.
- [ ] T067 [US7] Implement owner-consistent streaming export in `src/db/account-portability.ts` and `src/app/api/account/export/route.ts`: one `application/x-ndjson` attachment, all valid records without aggregate count/byte limit, invalid legacy raw content retained with annotations, absent-kind counts zero, same-origin/no-store/nosniff and snapshot-consistent header/trailer digest.
- [ ] T068 [US7] Implement private staged streaming preview/import in `src/lib/account/import.ts` and `src/db/account-portability.ts`: “uploads are sequential chunks of at most 8 MiB”, no aggregate byte/count rejection, one bounded line at a time, full header/version/count/digest preview before work writes and paged report storage. Commit “at most 1,000 records per bounded transaction/savepoint batch”, with independent record receipts, “fresh UUID and revision 1”, shared save validators, owner-local names and historical practice snapshot validation. Invalid/unavailable records get indexed refusals; low disk pauses resumably. Delete abandoned stages/reports after seven days and cascade on account deletion.
- [ ] T069 [US7] Implement chunk upload, preview, report and commit endpoints in `src/app/api/account/import/upload/route.ts`, `src/app/api/account/import/preview/route.ts`, `src/app/api/account/import/report/route.ts` and `src/app/api/account/import/route.ts`: actor/generation-bound operation, offset/digest/identical-chunk retries, sealed preview, batches and resumable receipts. Return bounded totals/cursors, reports of at most 100 entries plus streamed full download, never unbounded result arrays. Same operation does not duplicate records; new operation creates copies. Keep settings by default; selected settings apply once after final batch with revision conflict reporting.
- [ ] T070 [US7] Implement deletion preview/final commit in `src/db/account-deletion.ts`, `src/app/api/account/deletion-preview/route.ts` and `src/app/api/account/delete/route.ts`; inside one transaction recheck typed email/freshness/owner/preview fingerprint, cascade personal/auth rows and enqueue a minimal account-independent completion notice. No send before commit; rollback/mismatched preview emits none. After commit return deletion complete and separate notice status with a short-lived opaque status receipt; retry notices for seven days without resurrection. Exclude this minimal notice from account cascades, expire terminal delivery/status receipts after seven days and preserve the US9 provider-revocation seam.
- [ ] T071 [US7] Build streaming portability/import-report/deletion UI and stories in `src/components/account/portability.tsx`, `src/components/account/portability.stories.tsx`, `src/components/account/delete-account.tsx` and `src/components/account/delete-account.stories.tsx`: chunk/batch progress/resume, read-only preview, paged/refusal report and streamed download, settings unchecked, export before typed-email confirmation. Changed counts require review; deletion complete and pending/failed notice delivery are distinct states, with opaque status polling that reveals no removed work.
- [ ] T072 [US7] Extend `scripts/qa/accounts.mjs` with single-file >50 MiB/>10,000-record round trip, bounded memory/report/chunk/batch resume, repeat-versus-retry/settings and concurrent-deletion-finalization/no-false-notice checks. Test postcommit notice outage/restart/idempotency without account restoration. Document private staging/notice/capture/backup retention and recovery in `docs/accounts-deployment.md`.

**Checkpoint**: T064–T072 complete and the independent test passes.

## Phase 10: User Story 8 — Account display settings (Priority: P3)

**Purpose**: Make validated display settings follow each active account without contaminating anonymous preferences.

**Independent test**: Set different A/B themes/text sizes across two browsers, switch without reload, sign out to original anonymous settings and corrupt stored fields to verify independent defaults.

- [ ] T073 [P] [US8] Add account settings ownership/revision/defaulting tests in `src/db/account-settings.test.ts` and browser state-switch stories in the existing Storybook Chromium project at `src/components/account/settings-sync.stories.tsx`; cover invalid JSON, missing/later fields and stale A responses (FR-040–041).
- [ ] T074 [US8] Implement owner/revision-aware settings persistence and GET/PATCH handlers in `src/db/account-settings.ts` and `src/app/api/account/settings/route.ts`, using the shared pure validator. Enforce “Account settings are server-authoritative with revision-checked updates” and missing/invalid per-field defaults.
- [ ] T075 [US8] Implement immediate account/anonymous settings switching in `src/components/account/settings-sync.tsx`, `src/lib/settings.ts` and `src/components/account/session-provider.tsx`; account responses cannot overwrite another identity’s state, signed-out changes stay browser-only and failed account writes retain an accessible retry state.
- [ ] T076 [US8] Integrate existing display controls and available English-line fields in `src/components/reading/display-menu.tsx`; preserve each current setting and default, add 012 fields only when implemented, and update future integration requirements in `specs/012-english-line/plan.md` only if that artifact exists, otherwise `specs/015-accounts/quickstart.md`.
- [ ] T077 [US8] Extend `scripts/qa/accounts.mjs` with two-account/two-browser settings, no-reload switch, anonymous restoration and corrupted/later-field tests; add all-theme settings states to `src/components/reading/display-menu.stories.tsx`.

**Checkpoint**: T073–T077 complete and the independent test passes.

## Phase 11: User Story 9 — Apple sign-in (Priority: P3, built last)

**Purpose**: Extend the proven provider policy to Apple relay identities and bounded provider disconnection.

**Independent test**: Using developer credentials and an explicit secure public callback, sign up with hidden email, sign out/in, deliver relay recovery mail and delete/disconnect; without prerequisites Apple is omitted locally with a warning.

- [ ] T078 [P] [US9] Add Apple callback/relay/revocation/key-rotation tests in `src/lib/auth/apple.test.ts` and `src/db/provider-revocation.test.ts`, including form-post transient state, returning missing name, unavailable local callback and revocation outage (FR-023, US9).
- [ ] T079 [US9] Add encrypted Apple revocation columns/independent queue migration in `src/db/schema/app.ts` and `drizzle/app/`, plus `src/lib/auth/provider-secrets.ts`; enforce “Node AES-256-GCM under `AUTH_TOKEN_ENCRYPTION_KEY`”, stored key id/random nonce/authentication tag and deployment’s “Private 32-byte encryption key with key id”. No export/logging of ciphertext or credentials; rotate/re-encrypt or expire old-key material.
- [ ] T080 [US9] Implement Apple provider identity/relay handling in `src/lib/auth/apple.ts` and existing provider wiring in `src/lib/auth/providers.ts`; same consent/proof/linking rules, verified relay accepted, expiring client-secret rotation and documented form-post transient callback mechanism without weakening the main session cookie.
- [ ] T081 [US9] Implement deletion-time revocation/queue processing in `src/db/provider-revocation.ts`, `src/lib/auth/apple.ts` and `src/db/account-deletion.ts`; “retry for at most seven days or until successful/expired, then erase ciphertext and account reference”. Local deletion/method/session removal completes despite provider outage; queued credentials cannot sign in and disconnection status is shown separately.
- [ ] T082 [US9] Integrate Apple prerequisites/omission/warnings and key-expiry checks in `src/lib/auth/config.ts`, `src/lib/auth/startup.ts` and `src/components/account/provider-choice.tsx`; local missing secure callback omits Apple, enabled unusable live Apple refuses startup, and local tunnel use requires existing explicit host opt-in/warning.
- [ ] T083 [US9] Extend `scripts/qa/accounts.mjs` and `docs/accounts-deployment.md` with real Apple HTTPS callback/hidden-email/relay/recovery/signin/disconnection validation and key rotation; record actual credentialed evidence without claiming fixtures prove interoperability.

**Checkpoint**: T078–T083 complete and the independent test passes.

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Complete all release gates; P1/demo success never grants network-release approval.

- [ ] T084 Run every account/consent/menu/recovery/provider/settings/import/deletion/legal/startup-error state through automated axe in all themes and keyboard-only/touch-only real-server journeys in `scripts/qa/accounts.mjs`; fix focus/reflow/zoom/live-announcement/target-size issues in `src/components/account/` and `src/app/(account)/` (FR-045, SC-012).
- [ ] T085 Run and record all SC-001–SC-012 scenarios from `specs/015-accounts/quickstart.md`, including outbound-denied local operation, timed signup/signin/reset, isolation, migration races, portability, live startup/refusal and actual configured-provider runs; distinguish unavailable credential evidence from completed tests.
- [ ] T086 Reconcile final implemented behavior across `specs/015-accounts/`, affected sibling specs and `openspec/changes/accounts-and-sign-in/`; update `PRODUCT.md`, `CLAUDE.md`, `.env.example` and `docs/accounts-deployment.md` with real configuration, recovery, retention and limitations. Preserve unrelated current edits; validate the OpenSpec change strictly.
- [ ] T087 Update implemented architecture/reader/work/security/test documentation in `lat.md/architecture.md`, `lat.md/reader.md` and focused account/test sections under `lat.md/`; load the lat-md skill before editing, use precise source-symbol links and describe only implemented state, not this task history.
- [ ] T088 Run `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build`, `npm run build-storybook`, CI migration-drift/Docker smoke checks and `lat check`; fix failures and record concise evidence in `specs/015-accounts/quickstart.md`. Preserve build-without-data behavior and verify runtime-copy dependencies.
- [ ] T089 Obtain independent code and security review of the immutable implemented diff, including raw auth endpoints, owner predicates, migration/claim failure, forwarded-header trust, token/link races, credentials/retention and provider deletion; resolve findings and record results in `specs/015-accounts/quickstart.md` before real network exposure. Keep unavailable provider or review gates explicitly incomplete; do not deploy as part of task generation.

**Checkpoint**: T084–T089 complete and the phase prerequisites are validated.

## Dependencies & Execution Order

### Phase and story dependencies

The graph below is expressed as a compact adjacency table; arrows denote prerequisites, not optional ordering. Run story phases in the listed order for one implementer. Shared files require serialized integration even when two stories have no semantic dependency.

| Work                              | Prerequisites                                                     | Stop/validation boundary                                                                        |
| --------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Setup → Foundation                | Setup complete; foundation tests first                            | No story begins before foundation                                                               |
| Foundation → US1                  | Shared schema/auth/mail/request guards                            | US1 demo uses an empty local store; upgrade activation remains refused until US3                |
| US1 → US2                         | Confirmed accounts, own create/save                               | Full owner-boundary matrix passes before ordinary work routes are enabled                       |
| US1 + US2 → US3                   | Activation seam and owner schema/guards                           | Exactly-one legacy claim, backup and fail-closed failure proven                                 |
| US1 + US2 + US3 → US4             | Shared account flow and completed ownership claim                 | Disposable live validation only; no production release                                          |
| US1 + US2 + US4 → US5             | Session/mail/request policies                                     | Recovery, revocation, fresh auth and throttles proven                                           |
| US1 + US2 + US3 + US4 + US5 → US6 | Activation/claim, provider config, fresh auth                     | Real Google/Microsoft smoke plus callback fixtures                                              |
| US1 + US2 + US3 + US5 → US7       | Owner storage, inbox recovery/fresh auth, committed notice outbox | Owner-only round trip and transactional deletion proven                                         |
| US1 + US2 → US8                   | Shared pure settings validator and identity signals               | Two-browser defaults/switching proven; US7 uses same shared settings service                    |
| US1–US8 → US9                     | Generic providers, deletion and settings complete                 | Apple built last; prerequisites unavailable means keep method disabled and evidence outstanding |
| US1–US9 → Final checks            | All supported-method work integrated                              | Required quality/security/accessibility evidence before real network use                        |

US4’s real provider/disabled-method recovery acceptance is finalized by US5/US6/US9, not falsely declared complete at the P1 configuration checkpoint. US7’s Apple disconnection extension is finalized by US9. If 010/011/012 land later, their owner/settings integration requirements remain mandatory at their own release; their absence does not block account work for implemented kinds.

### Within each phase

Tests precede implementation; schemas precede dependent services; services precede routes/UI integration; story verification comes last. Foundation schema edits are sequential. The two test tasks at the start of a story may run together because they have different files and depend only on completed prerequisites. Implementation tasks without `[P]` are serialized by default, particularly edits to `src/db/schema/app.ts`, `src/db/accounts.ts`, `src/lib/auth/activation.ts` and `scripts/qa/accounts.mjs`.

### Parallel examples by story

Each pair below is a concrete safe test-authoring wave after the story’s prerequisites; neither waits for the other’s file. Run them before the story implementation. US3 has a separate read-only fixture-review lane; US8/US9 use independent test cases in distinct listed files; split ownership explicitly and integrate before touching shared production code.

- **US1**: T016 and T017 can run together; then continue T018–T026 sequentially.
- **US2**: T027 and T028 can run together; then continue T029–T033 sequentially.
- **US3**: T034 owns `src/db/legacy-claim.test.ts`; in parallel a separate reviewer can prepare the no-write fixture inventory from `specs/015-accounts/quickstart.md`. Production tasks T035–T039 remain sequential; no independent production-edit pair is claimed.
- **US4**: T040 and T041 can run together; then continue T042–T047 sequentially.
- **US5**: T048 and T049 can run together; then continue T050–T055 sequentially.
- **US6**: T056 and T057 can run together; then continue T058–T063 sequentially.
- **US7**: T064 and T065 can run together; then continue T066–T072 sequentially.
- **US8**: Split T073 into distinct-file test ownership (`src/db/account-settings.test.ts` versus `src/components/account/settings-sync.stories.tsx`); neither implementation may start until both contracts agree. T074–T077 are sequential.
- **US9**: Split T078 into distinct-file test ownership (`src/lib/auth/apple.test.ts` versus `src/db/provider-revocation.test.ts`), after US1–US8; T079–T083 remain sequential.

## Implementation Strategy

### MVP first

The recommended usable **local MVP is Setup + Foundation + US1–US3**: email/password accounts, complete isolation and safe legacy migration. US1 alone is an internal empty-store signup/signin demonstration with unaudited personal paths still refused. Neither is a public-release milestone. Complete US4 configuration gates next; P2 recovery/portability and independent review are required before real exposure. Do not deploy during this task-generation command.

### Incremental delivery

After the local MVP, deliver deployment validation, recovery, Google/Microsoft, portability/deletion and account settings, validating each story independently. Build Apple last and enable it only with genuine callback/relay evidence. Missing real credentials can leave that method disabled, but cannot be presented as a completed provider test. Tests with fixtures remain useful and separately reported.

### Parallel implementation

Use only the marked separate-file setup/foundation/test waves. US7 and US8 are logically separable after prerequisites but both touch account settings/QA integration, so serialize shared-file changes or agree explicit ownership. Do not treat story priority as permission to omit required isolation, migration, consent, export, deletion or network review.

## Coverage and completion summary

| Scope                         | Tasks  |
| ----------------------------- | ------ |
| Setup/foundation/final checks | 21     |
| US1 (T016–T026)               | 11     |
| US2 (T027–T033)               | 7      |
| US3 (T034–T039)               | 6      |
| US4 (T040–T047)               | 8      |
| US5 (T048–T055)               | 8      |
| US6 (T056–T063)               | 8      |
| US7 (T064–T072)               | 9      |
| US8 (T073–T077)               | 5      |
| US9 (T078–T083)               | 6      |
| **Total**                     | **89** |

21 tasks carry `[P]`; split-file examples above describe additional bounded test authoring without declaring shared implementation files parallel.

| Requirements / outcomes    | Primary coverage                                                  |
| -------------------------- | ----------------------------------------------------------------- |
| FR-001–011, SC-001/002/008 | US1 plus foundation/session/mail contracts                        |
| FR-012–016, SC-009         | US5 with session/identity safety                                  |
| FR-017–024, SC-007         | US6 and US9, disabled-method recovery in US5                      |
| FR-025–029, SC-004         | US2 and owner guards; each later personal endpoint repeats checks |
| FR-030–033, SC-003         | US3 backed-up atomic migration and activation                     |
| FR-034–039, SC-005/006     | US4, foundation local capture and US3 ownership preflight         |
| FR-040–041                 | US8, shared settings validation and signup snapshot               |
| FR-042–044, SC-010/011     | US7; Apple revocation extension in US9                            |
| FR-045, SC-012             | Every UI phase’s stories plus final keyboard/touch/axe checks     |

All tasks begin unchecked. Mark completion only after the named behavior and applicable tests pass. Current-state Lat documentation is updated with implementation, while `lat check` also runs after this documentation-only task-generation command.
