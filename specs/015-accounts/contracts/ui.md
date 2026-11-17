# Contract: Account interface and draft safety

Use the existing page shell and DESIGN.md tokens, serif typography, rubric-red accent and light/dark/sepia treatments. These are interaction requirements, not a separate visual redesign.

## Screens and navigation

Public `/signin`, `/signup`, `/confirm`, `/reset-password`, `/privacy` and `/terms` coexist with public Greek reading/word details/credits/reference. `/account` provides identity, methods, settings, export/import, signout-everywhere and deletion. The shared shell's account menu shows the current name/email or signin; navigation back from authentication preserves a validated in-app passage/view. Local mode states that file-system access is outside account isolation.

Before any completed account creation, show email/name/work/sign-in data, purposes and policy/terms links with an unchecked explicit agreement. Provider consent is bound to a server-side transaction; a callback cannot bypass it. Show only enabled usable methods. Explain unconfirmed signup, capture location locally, resend, expiry/reuse and provider connection failure. Microsoft may require a separate email and confirmation step. Matching verified email never offers an automatic merge: explain signing into the existing account and linking from settings. Disabled-only-method access offers verified-inbox recovery, including a public `/recover-account` landing page; it signs the existing owner in without requiring an enabled password or a prior session. Disabled password controls stay hidden, while recovery remains visible.

## Forms and accessibility

Every input has a persistent visible label and appropriate autocomplete (`email`, `current-password`, `new-password`, `name`). Permit paste/password managers, provide a keyboard-operable show-password control and native form submission. Password rules are visible before submit. Announce errors and successful changes through restrained live regions; focus the error summary after refusal and preserve safe input. Never redisplay secrets after success. Loading disables repeated mutation without trapping focus; throttles show retry time without a puzzle or a timed challenge.

Menus/dialogs support Tab, arrows where appropriate, Enter/Space and Escape, with focus restored to the invoker. Destructive confirmation never depends on colour alone. All controls work by touch without hover and meet WCAG 2.2 target sizing; layouts reflow at narrow width and zoom without losing actions. Storybook tests cover empty, pending, success, expired token, unconfirmed, duplicate, provider unavailable, throttled, email failure and deletion states in all three themes.

## Identity changes and unsaved edits

Before intentional signout show pending-work count and choices to wait for saves, download or leave. Only explicit leave may abandon a recovery buffer. Signout broadcasts to every tab and immediately removes account views/settings; suspended tabs clear before rendering personal content on resume. On remote revocation, account deletion or A→B switch, stop A's autosave/outbox, hide its personal UI, announce the identity change and retain its unsaved work for download or signing back into A. Never offer to silently save it into B. Ignore late A responses in B's view. Anonymous settings resume on signout, B's server settings apply immediately on signin.

Session expiry offers signin while public reading continues; preserve local recovery safely. Persistent signin is unchecked by default with the 30-day explanation. Explain that browser session-restoration settings can restore ordinary session cookies; do not promise an observable browser-close event the server cannot receive.

## Import and deletion

Export is one clearly labelled download. Import streams one file with resumable chunk progress; preview lists counts, paged per-record refusals and a separate unchecked replace-settings choice. Commit shows batch progress/imported/refused totals and a streamed full error report. Large accounts are not refused for whole-file byte/record count; low disk pauses resumably. Unknown versions, malformed files and per-kind invalid records have actionable errors, never silent omissions.

Deletion confirmation shows current counts, export, typed email and recent-signin challenge. A changed record set refreshes the count and requires review. Completion clears account UI in every tab; another signup with the same address is a new empty account. Explain pending external provider disconnection separately if Apple revocation must retry. Policy/terms text belongs to the operator, not generated legal copy in this feature.

Show the completed mutation separately from its notice-delivery status. A rejected/aborted deletion sends no completion notice; a committed deletion remains complete if notice delivery fails. The deleting browser can check its opaque notice-status receipt without recovering account data or sign-in; pending/failed delivery and retry are explicit.

## Acceptance evidence

Automated axe has zero violations for every new story/state; keyboard-only and touch-only real-server runs complete signup, signin, confirmation, recovery, linking, settings, portability and deletion. Include policy pages, account menu and page-rendered startup errors. Test 200% zoom, visible focus, error focus, status announcements and restored focus after dialogs. Automated axe alone does not prove WCAG conformance.
