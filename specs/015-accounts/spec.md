# Feature Specification: Accounts and Sign-in

**Feature Branch**: `015-accounts`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Accounts and sign-in: real accounts with sign-in by Google, Microsoft, Apple and email and password, fully buildable and testable on the developer's own computer (local mode) and later published to the internet (live mode) by configuration and deployment, without rewriting; work saved before accounts existed moves to the first account (from the Base44 prototype comparison)"

## Clarifications

### Session 2026-11-16

- Account creation completes when consent and email ownership are confirmed. An earlier unconfirmed signup is a provisional registration, cannot own work and cannot reserve the legacy-work claim. The first account to complete creation in local mode receives all earlier work atomically (FR-021, FR-030). Preserve the settings snapshot from its signup browser even if confirmation opens in another browser. This definition also applies to verified-provider signup; email equality alone never completes creation.

- Ordinary sign-in follows browser-session restoration behavior plus the 12-hour server idle limit; it does not promise detection of every browser close.
- Every valid app-generated export must be importable, including large accounts; batch limits do not cap an account export.
- Confirmed-inbox recovery is always available to existing active accounts independently of configured password/provider choices. It creates no new account and never joins accounts by matching email.
- Proof-link sending failures preserve active state. Completion notices follow successful changes and are retried separately; acceptance for sending does not guarantee inbox delivery.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create an account and sign in with email and password (Priority: P1)

A student opens the app and wants to save their work. They create an account with their email address and a password, agree in plain words to what personal data is kept, and confirm their address by a link sent to it. From then on they sign in with that email and password, see who is signed in in an account menu, and sign out when they are done. On the developer's computer the confirmation email is never really sent: it is captured where the developer can open it, so the whole flow can be tested with no email service.

**Why this priority**: Every other story needs an account to exist, and email and password is the one method that works with no outside provider.

**Independent Test**: In local mode, sign up, open the captured confirmation email, follow its link, sign out, sign in again, and check the account menu and that saving works only after confirmation.

**Acceptance Scenarios**:

1. **Given** the sign-up screen, **When** someone enters an email address and a password, **Then** they are shown, before the account is created, what personal data is kept and why, with links to the privacy policy and terms, and the account is created only once they agree.
2. **Given** a new account, **When** it is created, **Then** a confirmation email with a single-use link is sent to the address (captured locally in local mode, delivered in live mode), and the person is told to check their email.
3. **Given** an account whose address is not yet confirmed, **When** its owner tries to save anything, **Then** saving is refused with a message asking them to confirm their address, and they can ask for the email to be sent again.
4. **Given** the owner follows the confirmation link, **When** it opens, **Then** the address is confirmed and they can save work.
5. **Given** a confirmed account, **When** its owner signs in with the right email and password, **Then** they are signed in and returned to the page they were trying to reach.
6. **Given** a signed-in person, **When** they open the account menu, **Then** it shows their name or email and offers account settings and sign out.
7. **Given** a signed-in person, **When** they sign out, **Then** this browser no longer shows their work or settings in any tab, and the Greek text stays readable.
8. **Given** someone signs up with an address that already has an account, **When** they submit, **Then** the screen says the same as for a new address, and the email sent says an account already exists and how to sign in or reset the password.
9. **Given** someone is not signed in, **When** they open a chapter, its word details or the credits, **Then** they can read them without an account.

---

### User Story 2 - Each account's work is its owner's alone (Priority: P1)

Many people use the same app. Each person sees only their own analyses, diagrams, translations (spec 011), practice attempts (spec 010) and display settings. Nobody can see, list, open, export or change another account's work, including by typing or pasting an address.

**Why this priority**: Once the app can be reached by others, isolation is what keeps work private. It must be right before live mode is ever switched on.

**Independent Test**: Create two accounts, save work in each, then from each account try the list, a direct address to the other's record, its export download and a save, rename and delete against it.

**Acceptance Scenarios**:

1. **Given** accounts A and B each with saved work, **When** A opens the `/work` list, **Then** only A's records appear.
2. **Given** the address of one of B's records, **When** A opens it, **Then** A gets the same "not found" response as for a record that does not exist, and nothing about B's record (title, passage, content or existence) is revealed.
3. **Given** the export address of one of B's records, **When** A or a signed-out visitor requests it, **Then** no file is returned and the response matches the one for a record that does not exist.
4. **Given** A is signed in, **When** a save, rename or delete names one of B's records, **Then** it is refused, B's record is unchanged, and the response matches the one for a record that does not exist.
5. **Given** A makes an analysis, diagram, translation or practice attempt, **When** B is signed in anywhere, **Then** none of it appears in any of B's views, lists, counts or exports.
6. **Given** A and B open the same chapter, **When** they look at the Greek text, word details and credits, **Then** both see the same shared text.

---

### User Story 3 - Work saved before accounts is kept (Priority: P1)

Someone who has used the app on their own computer before accounts existed updates it. The first account created in local mode receives everything they had saved: analyses, diagrams, translations and practice history. Nothing is lost, duplicated or left without an owner.

**Why this priority**: Work is kept (constitution principle V). An upgrade that hid or dropped existing work would be the worst outcome of this feature.

**Independent Test**: Save several records with the current app, upgrade, create the first account in local mode, and compare the `/work` list and each record's content with what was there before.

**Acceptance Scenarios**:

1. **Given** saved work made before accounts existed, **When** the first account is created in local mode, **Then** every record is listed under that account with identical content, title, passage and last-modified time.
2. **Given** saved work made before accounts existed, **When** the upgrade runs, **Then** a backup of the saved work is kept before anything is moved, and if the move fails the app does not start serving and the backup remains.
3. **Given** saved work without an owner, **When** anyone asks for it before the first account exists, **Then** it is neither shown nor changed, and the person is asked to create an account.
4. **Given** display settings chosen in this browser before accounts existed, **When** the first account is created in that browser, **Then** the account starts with those settings.
5. **Given** a store that still holds work without an owner, **When** the app is started in live mode, **Then** it refuses to start and says the work must first be claimed in local mode.

---

### User Story 4 - One app, run locally or published (Priority: P1)

A developer builds and tests every sign-in flow on their own computer in local mode. Later the same app is published to the internet in live mode, by configuration and deployment only. In local mode the app stays reachable only from the computer it runs on, exactly as today. In live mode it refuses to start unless it is safe to: served over a secure (https) address, with production credentials for every sign-in method that is turned on, a working email service if email and password is on, and a privacy policy and terms to show.

**Why this priority**: The user's whole aim is that local and live are two settings of one app. If live mode can start unsafely, or local mode drifts from it, accounts give no protection.

**Independent Test**: Start in local mode and repeat the spec 004 checks; start in live mode with each requirement missing in turn and confirm each refusal; start in live mode with everything present and sign in.

**Acceptance Scenarios**:

1. **Given** local mode, **When** the app starts with default settings, **Then** the local-only protection of spec 004 applies unchanged, including its existing explicit opt-in and warning.
2. **Given** local mode, **When** any email is sent, **Then** it is captured where the developer can read it on the computer and is never delivered to anyone.
3. **Given** live mode without a secure address, **When** the app starts, **Then** it refuses to start and names what is missing.
4. **Given** live mode with a sign-in method turned on but no production credentials for it, or test credentials in place of them, **When** the app starts, **Then** it refuses to start and names the method.
5. **Given** live mode with email and password turned on but no email delivery service set, **When** the app starts, **Then** it refuses to start.
6. **Given** live mode without privacy policy or terms text, **When** the app starts, **Then** it refuses to start.
7. **Given** live mode with every requirement met, **When** a visitor opens the privacy policy or terms page, **Then** it is shown without signing in.
8. **Given** either mode, **When** the operator turns a sign-in method on or off in the configuration, **Then** only the turned-on methods are offered at sign-in, and an account whose only configured method is turned off is offered recovery by a one-use link to its confirmed email address. This recovery signs the owner in even when email and password is turned off; it does not require adding or enabling a password.

---

### User Story 5 - Recover and secure an account (Priority: P2)

A person who forgets their password asks for a reset link by email and chooses a new password. They can change their password, change their email address, and sign out of every browser and device at once, for example after using a library computer. Repeated wrong guesses at a password are slowed so an attacker cannot try many passwords.

**Why this priority**: Needed before live mode, but the first local build can be used without it.

**Independent Test**: In local mode, request a reset, open the captured email, set a new password; change the email address and confirm it; sign in on two browsers and sign out everywhere from one; make repeated wrong guesses and confirm the slowdown.

**Acceptance Scenarios**:

1. **Given** the sign-in screen, **When** someone asks for a password reset for any address, **Then** the screen says the same whether or not an account exists, and only an existing account's address receives a reset link.
2. **Given** a reset link, **When** it is followed within one hour and a new password is set, **Then** the old password stops working, the link cannot be used again, and every other sign-in of that account is ended.
3. **Given** a reset link older than one hour or already used, **When** it is followed, **Then** it is refused and the person can request a new one.
4. **Given** a signed-in account, **When** its owner changes the email address, **Then** the change takes effect only after the new address is confirmed by link, and the old address is told of the change.
5. **Given** an account signed in on two browsers, **When** its owner chooses "sign out everywhere", **Then** both browsers are signed out at their next action, and unsaved changes in either are offered for download.
6. **Given** five wrong passwords in a row for an account, or many failed sign-ins from one source, **When** further attempts are made, **Then** they are slowed for a stated time, the response does not reveal whether the account exists, and the owner can still reset by email.
7. **Given** a signed-in owner whose last sign-in was more than 15 minutes ago, **When** they change their password or email, link or unlink a method, or delete the account, **Then** they must sign in again first.

8. **Given** a signed-out owner whose only configured method has been turned off and email and password is also turned off, **When** they request recovery and use the one-use link sent to their confirmed address, **Then** they receive a normal sign-in to their existing account without adding a disabled password; all other sign-ins are ended and ordinary ownership checks still apply.

---

### User Story 6 - Sign in with Google or Microsoft, and link methods (Priority: P2)

A person signs in with their Google or Microsoft account instead of keeping another password. One person can link several sign-in methods to the same account and sign in with any of them. Matching email addresses are never used to join accounts silently. In local mode both providers work with test credentials.

**Why this priority**: Most people prefer not to keep another password, but email and password already covers every need.

**Independent Test**: In local mode with test credentials, sign up with Google, link Microsoft and a password, sign in with each, unlink one; then try the address-matching cases in the acceptance scenarios.

**Acceptance Scenarios**:

1. **Given** no account, **When** someone signs in with Google or Microsoft, **Then** they are shown what data is kept, and on agreeing a new account is created using the email and name the provider gives.
2. **Given** a signed-in account, **When** its owner links a Google, Microsoft or Apple account, or adds a password, **Then** they can sign in with any linked method afterwards.
3. **Given** an existing account with email E, **When** someone signs in with a provider that reports E, **Then** they are not signed in to the existing account and no account is joined automatically; they are told an account already uses that address and that they can sign in to it and link the provider from account settings.
4. **Given** an email and password sign-up whose address was never confirmed, **When** the real owner of that address signs in with a provider that reports the address as verified, **Then** the unconfirmed sign-up is discarded (it cannot hold any work) and the provider sign-in gets a new account; the unconfirmed password never gains access.
5. **Given** a provider that does not report an address as verified, **When** someone signs in with it, **Then** that address is never used to match, link or confirm any account.
6. **Given** a provider account already linked to account A, **When** B tries to link it, **Then** it is refused.
7. **Given** an account with only one sign-in method, **When** its owner tries to remove it, **Then** it is refused until another method is added.
8. **Given** no internet connection, **When** someone chooses Google or Microsoft, **Then** they are told it needs a connection and are offered email and password, and reading still works.

---

### User Story 7 - Delete an account, export and import (Priority: P2)

A person can export all of their work to one file, import such a file back into an account, and delete their own account and everything in it from inside the app. Deleting offers an export first.

**Why this priority**: People must be able to leave and take their work with them, and Apple requires in-app deletion; but day-to-day study does not depend on it.

**Independent Test**: Export an account, import the file into a second account, then delete the first with and without taking the export, and check that its work and sign-in methods are gone.

**Acceptance Scenarios**:

1. **Given** a signed-in owner, **When** they export their account, **Then** one file is downloaded holding all of their analyses, diagrams, translations, practice history and display settings, and nothing from any other account.
2. **Given** an account export file, **When** it is imported into a signed-in account, **Then** each record passing the same validation as a save (specs 005, 006) is added as a new record, nothing existing is overwritten, and each refused record is listed with its reason.
3. **Given** an owner asks to delete their account, **When** the confirmation appears, **Then** it states how many records will be deleted, offers the export, and requires typing the account's email address to proceed.
4. **Given** the deletion is confirmed, **When** anyone looks afterwards, **Then** the account, its sign-in methods and all its work are gone from every list and address, every sign-in of it is ended, a completion notice is scheduled after successful deletion, sending failures are reported and retried, and no other account is changed.
5. **Given** an account was deleted, **When** the same email address or provider account signs up again, **Then** a new, empty account is created.

---

### User Story 8 - Display settings follow the account (Priority: P3)

Each account keeps its own display settings (theme, text size, line spacing, verse numbers, part-of-speech colouring and the English line of spec 012), wherever its owner signs in. Signed out, the browser's own settings apply as they do today.

**Why this priority**: Comfort, not work, depends on it.

**Independent Test**: Give two accounts different themes and text sizes, sign in to each in turn and on two browsers, and compare.

**Acceptance Scenarios**:

1. **Given** A uses the dark theme, **When** A signs in on another browser, **Then** the dark theme applies there.
2. **Given** a browser switches from A to B, **When** the page shows, **Then** B's settings apply without a reload.
3. **Given** nobody is signed in, **When** someone reads a chapter, **Then** this browser's settings apply (spec 002) and no account's settings change.
4. **Given** an account's stored settings lack a field added later or are unreadable, **When** it signs in, **Then** each missing or invalid field uses its default and the page renders.

---

### User Story 9 - Sign in with Apple (Priority: P3)

A person signs in with their Apple account, including when they choose to hide their real address from the app. This is built last.

**Why this priority**: The lowest priority, and the hardest to test locally (see Assumptions).

**Independent Test**: With a temporary public secure address and Apple developer credentials, sign up with Apple using a hidden address, sign out, sign in again, and send a password reset to the relayed address.

**Acceptance Scenarios**:

1. **Given** Apple sign-in is turned on, **When** someone signs in with Apple, **Then** an account is created or entered under the same rules as Google and Microsoft (User Story 6).
2. **Given** an Apple user hides their address, **When** the account is created, **Then** the relayed address Apple gives is treated as the account's verified email, and emails sent to it reach the person.
3. **Given** Apple sign-in is turned on in a setting where Apple cannot reach the app (no public secure address), **When** the app starts, **Then** it says Apple sign-in cannot work there and leaves Apple out of the sign-in choices.

### Edge Cases

- A tab still open as A after the browser signed in as B: on its next action it shows that the account changed, does not show A's work, does not save A's unsaved edits into B's account, and keeps them with a download offered.
- Two people create the first account at the same moment in local mode: exactly one receives the earlier work.
- Earlier work that fails validation today: still moved to the first account unchanged, never dropped, and reported as needing attention.
- Email addresses that differ only by letter case are the same address.
- A provider changes the email address it reports for a linked account: the account's own email is not changed without the owner confirming it.
- A confirmation, reset or email-change link is opened in a different browser: it works and asks for sign-in where needed.
- A sign-in return address that points outside the app: ignored, and the person lands on the home page.
- A signed-out visitor follows the address of an export or a record: treated as not found, with a sign-in offer.
- A required confirmation, reset or recovery email cannot be accepted for sending in live mode: the person is told it could not be sent and can try again; their active account, credentials and work remain unchanged. Acceptance for sending is not a promise of inbox arrival. A notice about a completed change is sent only after the change succeeds; delivery failures are reported and retried without undoing the change or restoring a deleted account. An aborted change never sends a completion notice.
- The same export imported twice: two separate copies, nothing overwritten.

- An account has more than 10,000 valid records or its export exceeds 50 MiB: its one export file still imports completely, with progress and bounded batches rather than whole-file refusal.
- Work changes or a final database check fails during deletion: nothing is deleted and no completion notice is sent.
- A normal session is restored when reopening the browser: sign-in follows the stated 12-hour idle limit; explicit sign-out still revokes it.
- An export from a newer release with an unrecognised document version: those records are refused with that reason.
- The account is deleted while signed in elsewhere: the other browser is signed out at its next action with unsaved edits offered for download.

## Requirements _(mandatory)_

### Functional Requirements

**Accounts and email and password**

- **FR-001**: The system MUST let a person create an account with an email address and a password, and sign in with them.
- **FR-002**: Before an account is created by any method, the system MUST show in plain words what personal data is kept (email address, the name a provider gives, the work they make, and sign-in records), why, and links to the privacy policy and terms, and MUST create the account only after the person agrees.
- **FR-003**: An email and password account MUST confirm its address by a single-use link before it can save anything; the owner MUST be able to have the link sent again.
- **FR-004**: Sign-up and password-reset responses MUST NOT reveal whether an address already has an account.
- **FR-005**: Passwords MUST be at least 10 characters, MUST be refused if they appear on a list of common passwords held by the app, MUST NOT be stored in any form that reveals them, and MUST never be shown back. Sign-in fields MUST allow password managers and pasting.
- **FR-006**: Email addresses MUST be unique across accounts, ignoring letter case.

**Sign-in, sessions and recovery**

- **FR-007**: After signing in, the system MUST return the person to the page they were trying to reach, and only ever to a page of this app.
- **FR-008**: An account menu MUST show who is signed in and offer account settings and sign out.
- **FR-009**: Signing out MUST stop every tab of that browser from showing the account's work or settings, warning first if changes are unsaved and offering to wait, download or leave.
- **FR-010**: A tab acting after its account changed MUST NOT apply pending changes to the new account; it MUST keep them and offer download or signing back in.
- **FR-011**: Without "keep me signed in" (off by default), the app MUST use a browser-session sign-in and end it after 12 hours without activity. Closing the browser ends it when the browser discards its session data; restoring browser sessions may restore the sign-in within that idle limit, and the app MUST explain this. With "keep me signed in", sign-in MUST end 30 days after it began. These rules MUST be the same in both modes.
- **FR-012**: Changing a password or email, linking or unlinking a method, and deleting the account MUST require a sign-in within the last 15 minutes.
- **FR-013**: An owner MUST be able to sign out everywhere, ending every sign-in of the account at its next action.
- **FR-014**: A person MUST be able to reset a forgotten password by a single-use emailed link that expires after one hour; setting the new password MUST end every other sign-in of the account.
- **FR-015**: A change of email address MUST take effect only when the new address is confirmed by link, and the old address MUST be told of the change.
- **FR-016**: After five wrong passwords in a row for an account, or repeated failures from one source, the system MUST slow further attempts for a stated time, without revealing whether the account exists and without blocking reset by email. Sign-in MUST NOT use a puzzle or timed challenge.

**Providers and linking**

- **FR-017**: The system MUST offer sign-in with Google, Microsoft and Apple, each turned on or off by the deployment's configuration; only turned-on methods are shown.
- **FR-018**: One account MUST be able to hold several sign-in methods (a password and any of the providers) and sign in with any of them; a provider account MUST be linked to at most one account.
- **FR-019**: The system MUST NOT join accounts or sign anyone in to an existing account because their email addresses match. Linking MUST happen only from a signed-in account's settings.
- **FR-020**: An address a provider does not report as verified MUST NOT be used to match, link or confirm any account.
- **FR-021**: An unconfirmed email and password sign-up MUST NOT hold its address: if the address is later confirmed by any route for another account, the unconfirmed sign-up MUST be discarded.
- **FR-022**: Removing an account’s last usable configured sign-in method MUST be refused until another is added. If the operator turns off every configured method linked to an existing account, built-in confirmed-email recovery MUST remain available to sign its owner in.
- **FR-023**: Apple's relayed addresses MUST be accepted as verified email addresses.
- **FR-024**: The system MUST send no saved work, settings or text to any sign-in provider.

**Isolation**

- **FR-025**: Every saved record (analysis, diagram, translation, practice attempt) and every set of display settings MUST belong to exactly one account.
- **FR-026**: An account MUST NOT be able to see, list, count, open, export, save to, rename or delete another account's records through the interface or a typed or pasted address.
- **FR-027**: A request for another account's record, or any record while signed out, MUST get the same response as a request for a record that does not exist.
- **FR-028**: The Greek text, word details, credits, reference material, privacy policy and terms MUST be readable without an account, in both modes.
- **FR-029**: Saving, listing, exporting and importing work MUST require a signed-in account with a confirmed address, in both modes.

**Migration of earlier work**

- **FR-030**: When the first account is created in local mode, the system MUST assign to it every record saved before accounts existed, unchanged and complete, including records that would fail validation today.
- **FR-031**: The system MUST keep a backup before assigning earlier work, and if assignment fails it MUST NOT start serving and MUST keep the backup (as spec 005 FR-020).
- **FR-032**: Display settings held by the browser in which the first account is created MUST become that account's settings.
- **FR-033**: Live mode MUST refuse to start while any saved work has no owner, saying it must be claimed in local mode first.

**Local and live modes**

- **FR-034**: Local and live MUST be two settings of one app, using the same sign-in, account and isolation behaviour; they MUST differ only in configuration (email delivery, credentials, address and network exposure).
- **FR-035**: In local mode the local-only protection of spec 004 MUST apply exactly as it does today, including its existing opt-in and startup warning.
- **FR-036**: In local mode every outgoing email MUST be captured where the person running the app can read it on the computer, and MUST NOT be delivered.
- **FR-037**: In local mode, Google and Microsoft sign-in MUST work with test credentials.
- **FR-038**: Live mode MAY accept requests from the network, and MUST refuse to start unless all of these are present: a secure (https) public address; production credentials for every turned-on sign-in method; an email delivery service when email and password is turned on; privacy policy and terms text. On refusal it MUST name each missing item.
- **FR-039**: Live mode MUST refuse plain (non-secure) requests to any page that signs in or shows account data.

**Settings, export, import and deletion**

- **FR-040**: Display settings (spec 002, including the English line of spec 012) MUST be stored per account and apply wherever its owner signs in; while signed out, the browser's own settings MUST apply.
- **FR-041**: If an account's stored settings are missing, unreadable or lack a later-added field, each missing or invalid field MUST use its default and the page MUST render.
- **FR-042**: An owner MUST be able to export all of their work and settings to one file holding nothing from any other account.
- **FR-043**: An owner MUST be able to import every export file produced by this app, regardless of the account’s total record count or file size; processing MAY use bounded batches. Each record MUST pass the same validation as a save (spec 005), valid records MUST be added as new records without overwriting anything, and each refused record MUST be listed with its reason.
- **FR-044**: An owner MUST be able to delete their own account from inside the app. The confirmation MUST state how many records will be deleted, offer the export, and require typing the account's email address. On confirmation the account, its sign-in methods, its work and its sign-ins MUST be removed and no other account changed. A completion notice MUST be scheduled only after successful deletion; a sending failure MUST be reported and retried without restoring the account.

**Accessibility**

- **FR-045**: Every screen this feature adds (sign-up, sign-in, consent, provider choice, account menu, account settings, recovery, email change, deletion, export, import, privacy policy, terms and startup refusals shown in a page) MUST meet WCAG 2.2 AA, be fully operable by keyboard and by touch alone, announce errors and state changes to screen readers, and follow `DESIGN.md`.

### Key Entities

- **Account**: one person. Email address, whether it is confirmed, display name, display settings, consent given and when, and when it was created.
- **Sign-in method**: a password, or a linked Google, Microsoft or Apple account with the provider's verified address. An account keeps at least one stored method. Confirmed-email recovery is an always-available fallback for existing active accounts, independent of which configured methods are turned on.
- **Sign-in**: one browser's signed-in state for one account, whether "keep me signed in" was chosen, and when it ends.
- **Emailed link**: a single-use confirmation, reset or email-change link with an expiry.
- **Account-owned record**: an analysis or diagram (spec 005), a translation (spec 011) or a practice attempt (spec 010), each belonging to exactly one account.
- **Account export file**: one account's records and settings, each record with passage, edition and document version.
- **Deployment configuration**: the mode (local or live), the turned-on sign-in methods and their credentials, the email delivery setting, the public address, and the privacy policy and terms text.
- **Shared material**: the Greek text, word details, credits and reference material, the same for everyone.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every story except User Story 9 can be run end to end on the developer's computer in local mode; with no internet connection, every story except the provider stories (6 and 9) still runs.
- **SC-002**: In local mode, 0 emails leave the computer, and 100% of sent emails can be read locally.
- **SC-003**: After upgrading an install with 100 saved records, 100% of them appear under the first account with byte-for-byte identical content, and a backup exists from before the move.
- **SC-004**: In tests from account A and from a signed-out visitor against every one of account B's records, 0 lists, opens, exports, saves, renames or deletes succeed, and every response is indistinguishable from the one for a non-existent record.
- **SC-005**: With default settings in local mode, 0 requests from another machine on the network return a page, a sign-in screen or saved work (spec 004 SC-001 unchanged).
- **SC-006**: Live mode refuses to start in 100% of tested starts with any one requirement missing (secure address, production credentials for a turned-on method, email delivery, privacy policy, terms, work without an owner), and names the missing item.
- **SC-007**: In 0 tested cases does a matching email address alone give access to an existing account or join two accounts.
- **SC-008**: A new person can create an account and confirm it in under two minutes; a returning person signs in in under 30 seconds.
- **SC-009**: A forgotten password is reset and the person signed back in within five minutes, with 0 records changed.
- **SC-010**: An account deletion leaves 0 of its records reachable by any address, and 0 records of other accounts changed.
- **SC-011**: Exporting an account and importing the file into an empty account reproduces 100% of its valid records with identical content.
- **SC-012**: Every screen added by this feature passes automated accessibility checks with no violations and can be completed with keyboard only and with touch only.

## Assumptions

- **Local mode also uses sign-in.** Saving needs a confirmed account in both modes. Reasoning: local and live must be one app, and the only way the sign-in, confirmation, reset and isolation flows get tested before live mode is if local mode runs them too. The cost to a lone local user is creating one account once; their earlier work moves to it (User Story 3) and confirmation emails are read from the local capture. Reading never needs an account in either mode.
- Apple sign-in cannot use a plain local address or a non-secure one. Testing it on the developer's computer needs a temporary public secure address that forwards to the computer, and a paid Apple Developer account. Until both are set up, Apple sign-in stays off in local mode.
- Google and Microsoft sign-in need an internet connection at the moment of sign-in, even in local mode. Their test credentials are registered by the developer with each provider.
- The privacy policy and terms wording is written by whoever publishes the app; this feature provides the pages and refuses live mode without the text, but does not write legal content.
- In local mode, accounts keep different people's work apart on one computer but are not protection against someone with access to the computer's files; the app says so in local mode.
- Session lengths, the 15-minute recent-sign-in window, the one-hour link expiry, the 10-character minimum and the five-attempt slowdown are reasonable defaults for an internet service and may be tuned in planning.
- Import of a whole account export lives here; import of a single analysis into the arcing editor remains with spec 007.
- Out of scope: choosing a host, hosting cost, payments, sharing work between accounts, teams or classes, an administration console beyond the startup configuration, and moving the saved-work store to another database engine.
- Sibling specs: 010 (practice attempts) and 011 (translations) store their data per account under FR-025 and are included in export and deletion; 012 adds the English line to the per-account display settings; 013 and 014 add no personal data.
- Existing specs change when this is built: spec 002 FR-017 (settings per browser) becomes per account when signed in; spec 005 FR-022 ("until accounts exist, all saved work is one user's") becomes per account, and its FR-016 export and the `/work` list become owner-only; spec 004 gains live mode as the one route by which network exposure is allowed with accounts, leaving its local behaviour and the existing opt-in unchanged.
- Constitution 1.1.0 is satisfied: principle V (existing work moves to its owner and is not lost) by User Story 3; principle VII (the local-only protection is weakened only by accounts built and reviewed for network use, and work is kept apart in every view, list, export and direct address) by FR-026 to FR-027 and FR-034 to FR-039, provided live mode is not switched on for real use until these accounts have had a security review.
