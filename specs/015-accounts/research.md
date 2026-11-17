# Research: Accounts and Sign-in

Research completed 2026-11-16 against the current repository and primary upstream documentation. All technical choices below are resolved design decisions; implementation must verify the selected library's hooks against these contracts.

## R1 — Authentication infrastructure

**Decision**: Propose exact pins `better-auth@1.7.25` and `@better-auth/drizzle-adapter@1.7.25`, using the SQLite adapter and App Router handler. No package is installed by this plan. Recheck stable release/advisories at implementation and document any changed pin.

**Rationale**: The existing stack is Next 16.4.6/React 19.3, Drizzle 0.45.4, better-sqlite3 and Node 26.13.1. Better Auth supplies password lifecycle, database sessions and explicit provider linking. Its current peer ranges cover this stack; the adapter is a separate package. Use the documented Next cookie integration for server actions, not hand-written cookie copying. Version 1.7.25 follows the upstream fixes for unverified OAuth email, email-change binding and OAuth state confusion.

**Alternatives considered**: Auth.js `next-auth@4.24.15` is established for OAuth, but its Credentials reference restricts credentials to JWT sessions and leaves password lifecycle to the app. Hand-built OAuth/password cryptography adds unnecessary risk. A hosted auth service prevents offline email flows and adds an out-of-scope service.

**Sources**: [stable release](https://github.com/better-auth/better-auth/releases/tag/v1.7.25), [registry peer metadata](https://registry.npmjs.org/better-auth/latest), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Next.js integration](https://better-auth.com/docs/integrations/next), [Auth.js Credentials](https://authjs.dev/reference/core/providers/credentials), [email verification advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-9hm7-xhfp-cx58), [email change advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-hwq2-v29r-p69r).

## R2 — Identity proof, linking and consent

**Decision**: Disable implicit linking with `account.accountLinking.disableImplicitLinking: true`; retain explicit authenticated linking. Bind identity to issuer/subject (Microsoft tenant/subject context included), never email. Stage provider identity until consent and email proof are complete. Missing/unverified provider email triggers app confirmation; only after that may it become a confirmed method. Microsoft requires this path. Google/Apple verified claims may prove their reported address; provider email changes never mutate account email automatically.

**Rationale**: FR-019–021 forbid email-based takeover and unconfirmed-address squatting. Signup remains provisional until proof; first completed creation claims legacy work. A verified same-email provider replaces only a pending password registration, never a confirmed account. Existing linked provider subjects can sign in without matching email again. Generic signup/reset responses and duplicate-address mail prevent registration enumeration.

**Alternatives considered**: A trusted-provider email bypass, automatic merging and marking Microsoft email verified are rejected. Requiring every provider user to create a password first defeats provider signup. An unconfirmed owner of legacy work violates the no-work provisional-registration rule.

**Sources**: [linking controls](https://better-auth.com/docs/concepts/users-accounts), [Microsoft provider](https://better-auth.com/docs/authentication/microsoft), [Microsoft claims](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference). The first-completed-creation definition is recorded in spec.md Clarifications to reconcile FR-021/030; it is not a library guarantee. Preserve the signup-browser settings snapshot across cross-browser confirmation.

## R3 — Sessions, passwords and recovery

**Decision**: Database-authoritative sessions using the actual library bearer-token schema and private database/backup protection, without authorization cookie caching; explicit 12-hour idle/session-cookie or fixed 30-day persistent policy; recent authentication 15 minutes. Use library scrypt, minimum ten characters, maximum 128 and an offline common-password list. Purpose-bound links expire after one hour, are consumed atomically on POST and invalidate credentials/sessions as specified. Separate built-in confirmed-inbox recovery signs an existing active account in with a fresh nonpersistent session even if password is absent from AUTH_METHODS. Consume one-use recovery proof and revoke old sessions atomically; a five-minute one-use issuance receipt lets a signed-out browser obtain its session after commit without requiring an initiating session. Password reset/addition remains available only when password is enabled. No new account or email-based account linking occurs.

**Rationale**: Library defaults are not product requirements: the documented password minimum is eight and session freshness is longer. Account/source throttles must be persistent and identical for unknown emails. Same-browser logout signals clear personal state immediately; server rechecks enforce cross-browser revocation at the next action. Browser session restore can preserve session cookies; tests must cover browser-close semantics on supported browsers rather than promising detection that HTTP cannot provide.

**Alternatives considered**: Stateless JWT authorization delays revocation; an account id from the client is not an actor; external password checking sends user secrets outside the app. No additional password-hash package is warranted.

**Integration**: Use documented Drizzle model mappings, keep pending library users non-owner-capable, and use app-owned confirmation/activation/claim transactions. Do not assume hooks share library transaction scope. Disable stock email verification and other mutating routes that bypass app policy: its signed-JWT confirmation is repeatable. App-issued purpose-bound opaque tokens provide the required one-use refusal. Session issuance follows activation commit separately.

**Sources**: [database mapping/hooks](https://better-auth.com/docs/concepts/database), [pinned email-verification implementation](https://github.com/better-auth/better-auth/blob/v1.7.25/packages/better-auth/src/api/routes/email-verification.ts), [sessions and revocation](https://better-auth.com/docs/concepts/session-management), [email/password and scrypt](https://better-auth.com/docs/authentication/email-password). Browser-close caveat is a web-platform constraint, to be disclosed in the keep-signed-in help.

## R4 — Preserve work at the database boundary

**Decision**: Add explicit owner predicates to existing work functions and all sibling auxiliary tables. Preserve current revision/error ordering within the actor's rows. Introduce a quarantined legacy phase, SQLite-consistent backups and one atomic first-confirmed local claim; never deserialize or reserialize legacy documents merely to assign ownership.

**Rationale**: `src/db/work.ts` currently has unscoped preliminary revision and conflict readbacks as well as final mutations. Guarding only pages would leak revisions and export content. `src/db/migrate.ts` already backs up before migrations, checks integrity and retains failed backups; reuse these mechanisms for claim. Two-phase schema/claim supports first signup while live refuses unowned work.

**Alternatives considered**: Global default owner, filtering lists only, revalidating away old data, file-copying an active WAL database and moving to Postgres are rejected. New sibling migrations must include owners if they land after this feature.

**Evidence**: `src/db/schema/app.ts`, `src/db/work.ts`, `src/db/migrate.ts`, `src/db/server.ts`, specs 010/011 data models. Backup/claim race and failure injection are required acceptance tests.

## R5 — One deployment model and trustworthy network metadata

**Decision**: Default `APP_MODE=local`; same auth services in both modes. Local keeps spec 004 checks exactly, including explicit network opt-in/warning. Live uses one configured HTTPS origin and trusted ingress; reject insecure requests and forged forwarded protocol/host. Validate launch configuration before listening in development, standalone and Docker.

**Rationale**: An HTTPS URL alone does not establish request transport security. OAuth strings also do not intrinsically identify test versus production credentials. Require operator declaration of production credential class plus provider smoke-test evidence. Name all detectable configuration failures together; do not claim cryptographic proof of credential provenance.

**Alternatives considered**: Reusing the unauthenticated-network flag as live mode, trusting arbitrary X-Forwarded headers and building separate local/live account logic are rejected. Local Apple tunnel testing uses the existing explicit host opt-in and warning; default local isolation remains unchanged.

**Evidence**: `src/lib/host.ts`, `src/proxy.ts`, `src/instrumentation.ts`, startup scripts, current OpenSpec local-only-server requirements. See the [deployment contract](contracts/deployment.md).

## R6 — Email acceptance and transactional state

**Decision**: One mail interface, private durable file capture locally and Resend HTTPS API delivery through built-in Node fetch live. Proof-link operations require transport acceptance before proof finalization; immediate send failure preserves active account/credential/work state and unfinalized links remain inert. Completion notices use the opposite ordering: final validation, mutation and outbox enqueue commit atomically, then send the notice. Failed/aborted mutations emit no completion notice. After-commit delivery failures expose separate pending/failed status and retry for seven days, without undoing the change. Capture files and backups are not served as app routes.

**Rationale**: The spec requires local offline flows and visible send failures. Remote mail delivery and SQLite cannot commit atomically; acceptance means the transport accepted responsibility, not that an inbox received the message. A crash can produce an inert message; an operation receipt prevents repeated mutations on retry. Real provider/email credentials remain deployment inputs, not blockers to local implementation.

**Sources**: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys). Persist immutable message payloads with UUID idempotency keys; remote deduplication lasts 24 hours, so keep local receipts and stop automatic ambiguous retries after that window. No mail SDK or SMTP implementation is needed.

**Alternatives considered**: Console-only capture loses mail across restarts; sending through a test SMTP server risks accidental delivery. Precommit completion notices can falsely announce an aborted deletion; synchronous delivery cannot share the database transaction. Separate proof delivery from postcommit notifications and report mutation/delivery statuses independently, as clarified in the spec.

## R7 — Export, import and account settings

**Decision**: One versioned, streamed NDJSON account file: header/settings, per-record lines and a counts/digest trailer. Owner-consistent snapshot, all four work kinds, no aggregate byte/record cap; 8 MiB resumable upload chunks, at most 1,000 records per commit batch and paged/streamed validation reports bound resource use. Reuse standard JSON parsing per bounded line rather than introducing a parser dependency. New record identities on import; reuse each kind's shared save validation, preserve historical practice snapshots via shared historical-record validation, report each rejected entry. Keep destination settings unless explicitly selected in preview. Split pure settings validation out of the current client-only module and use separate anonymous/account state.

**Rationale**: Existing `mergeSettings` already defaults fields independently, but cannot be imported into Node unchanged because its module uses client/Zustand state. Specs 010/011 are not prerequisites; absent kinds have zero counts, unavailable kinds are explicit import refusals. Every valid app-generated export, including over 10,000 records or 50 MiB, must round-trip; disk exhaustion pauses resumably rather than redefining the file as invalid. Owner-scope translation uniqueness, preferences, recency and idempotency receipts, not just document rows.

**Alternatives considered**: A 50 MiB/10,000-record whole-file rejection conflicts with the unbounded export guarantee. Whole-file JSON parsing/report arrays consume unbounded memory. Unvalidated import, silently ignoring unimplemented kinds, regrading historical practice and copying account settings into anonymous storage are also rejected.

## R8 — Apple and release evidence

**Decision**: Apple last, disabled when callback prerequisites are unavailable. Require HTTPS public callback, developer credentials, expiring client-secret rotation, relay sender configuration and provider disconnection/token revocation on account deletion. Store the minimum encrypted provider revocation material needed for that operation; it is excluded from account exports and erased with the method.

**Rationale**: A local HTTP callback is insufficient. Local testing needs the documented public secure tunnel and explicit host opt-in. Library logout does not itself demonstrate provider revocation. Deletion must still remove local data if provider revocation is temporarily unavailable; queue a bounded private revocation retry and disclose the outstanding disconnection status.

**Alternatives considered**: Advertising a nonworking Apple button, treating relay email as unverified merely because it is private, and claiming provider interoperability solely from fixtures are rejected.

**Source**: [Apple provider configuration](https://better-auth.com/docs/authentication/apple). Real Apple/relay validation is required before enabling that method for users; other stories remain locally testable without it.
