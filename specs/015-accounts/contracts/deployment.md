# Contract: Local and live deployment

The mode controls configuration only. The same identity, authorization, mail interface, work model and tests run in both modes. These names are proposed implementation configuration, not existing commands.

## Configuration

| Variable                            | Contract                                                                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_MODE`                          | `local` by default; only `local` or `live` accepted                                                                                                                  |
| `APP_ORIGIN`                        | Canonical absolute origin, no path/query/userinfo; local defaults to the actual loopback development address, live requires public HTTPS                             |
| `AUTH_SECRET`                       | Required stable high-entropy secret in live; local generates and privately persists a development secret, never a committed fallback                                 |
| `AUTH_TOKEN_ENCRYPTION_KEY`         | Private 32-byte encryption key with key id, required when Apple is enabled; retain rotation key only for re-encryption/expiry                                        |
| `AUTH_METHODS`                      | Explicit enabled subset of password/google/microsoft/apple; at least one usable method; local default password                                                       |
| Provider credentials                | Separate id/secret and, for Apple, team/key/private key and secret expiry; production/test declaration per enabled method                                            |
| `RESEND_API_KEY`, `MAIL_FROM`       | Live HTTPS delivery key and verified sender; required for password signup **and** all recovery, email change and deletion flows, including provider-only deployments |
| `PRIVACY_POLICY_FILE`, `TERMS_FILE` | Readable nonempty operator-authored content; mandatory live, labelled development placeholders local                                                                 |
| `BIND_ADDRESS`                      | Existing loopback default; live requires explicit network binding or trusted ingress; Docker exposure still explicit                                                 |
| Trusted ingress settings            | Explicit trusted proxy addresses and canonical forwarded protocol contract; no global trust of X-Forwarded-*                                                         |
| `DATA_DIR`                          | Existing persistent directory, outside build output; private database/backups/capture/secret files                                                                   |

Existing `ALLOW_UNAUTHENTICATED_NETWORK=1` and `ALLOWED_HOSTS` retain exactly their local-only meaning and startup warning. They neither select live mode nor bypass account ownership. Live permits only the canonical configured host; local host validation remains in proxy and database guards.

AUTH_METHODS controls ordinary signup/signin choices. Confirmed-inbox recovery for existing active accounts is a built-in fallback that cannot be disabled by this list; it issues a normal nonpersistent session without adding/enabling password. Keep password reset/addition/signin disabled when password is not configured. Recovery requires the same local capture/live delivery service, one-use proof and throttles as other email flows.

Requiring mail for provider-only live operation is stricter than FR-038's password minimum and follows FR-015/044 plus the disabled-method recovery scenario. Production credential classification is operator-declared; client ids do not encode a reliably verifiable deployment class. Validate completeness/classification locally and perform real-provider smoke tests before release. Never state that arbitrary test credentials can be detected from their strings.

## Pre-listen validation

A shared Node-compatible preflight is invoked by dev, `scripts/start.sh`, Docker entrypoint and standalone runtime startup, not during `next build`. Keep image COPY dependencies aligned with the script. Validate configuration, legal files, secret, database integrity/migration status, all enabled methods, delivery transport readiness and unowned/failed-claim state. Collect and name all detected missing/invalid requirements in one refusal and exit nonzero before binding. Do not connect to provider services merely to read public corpus pages. Runtime proof-link delivery outages return retryable errors without changing active state. Completion-notice outages report pending/failed delivery and retry after the already committed mutation; do not invalidate reading or restore deleted accounts.

Local preflight retains existing migration backup and warning behavior; outgoing mail is always private file capture regardless of stray delivery environment values. No outbound mail client is instantiated locally. Test with all outbound sockets denied. A pending claim permits only public reading/account setup until completed. Failed claim closes the listener and preserves the pre-claim backup; restarting does not ignore the failure marker.

Live refuses any unowned work. Claim it in local mode with a confirmed account before publishing. Network release additionally requires completed isolation/e2e results and an independent security review of the implemented account boundary; startup checks alone are not that review.

## Transport, hosts and callbacks

Trusted HTTPS ingress must remove client-supplied forwarded headers, set verified scheme/host and prevent direct backend access from untrusted peers. Reject plain HTTP account/auth/personal requests, without redirecting credentials or bearer tokens through HTTP. Do not accept an attacker-supplied `X-Forwarded-Proto: https`. Verify canonical origin at proxy, auth handlers and database access boundary. Public material may also be HTTPS-only live for a simpler policy.

Google/Microsoft use separately registered local test clients and exact loopback callbacks; providers need internet at signin time. Explain outages and retain email/password or recovery and public reading. Apple requires a public HTTPS callback even for local testing. When absent in local mode, log the specific warning and omit Apple; in live mode an enabled unusable Apple method is a startup error. A local tunnel requires the existing local host opt-in, allowed host and warning; it is an explicit testing exception, never the default.

## Email, backups and operations

Capture every local email durably under private `DATA_DIR/mail/`, including duplicate-signup notices and deletion. Show the operator its filesystem location; never expose a public capture page. Live proof-link refusal leaves active account/credential/work state unchanged and the proof request retryable. Completion notifications are enqueued atomically with successful mutations and sent only after commit; refusal cannot undo a committed action. Retain minimal post-deletion notice/status receipts independently of the account cascade, report pending/failed status and retry for seven days. Do not promise that API acceptance proves inbox arrival.

Retain pre-migration/claim backups under existing private backup policy and never prune the only failed-claim backup. Document personal data retained in backups and capture files, retention, operator deletion and secure recovery. A restored older backup must run an explicit recovery procedure that respects deletion receipts; normal app startup must not silently restore deleted work.
