# Feature Specification: Local-Only Server

**Source**: Mirrors `openspec/specs/app/local-only-server/spec.md` (OpenSpec stays authoritative).

**Feature Branch**: `004-local-only-server`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description: "Keep a server with no accounts reachable only from the computer it runs on unless the operator deliberately opens it (ported from the OpenSpec spec at openspec/specs/app/local-only-server)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Only this computer can reach the app (Priority: P1)

A student runs the app on their own computer. Nobody else on their network can open it or see or change their saved work, whether it was started for development, in production, or with the documented container command.

**Why this priority**: There are no accounts, so reachability is the only protection for saved work.

**Independent Test**: Start with default settings and try to open it from another machine on the network.

**Acceptance Scenarios**:

1. **Given** the server started with default settings, **When** another machine on the same network tries to open it, **Then** the connection is refused or the request is rejected, and no page or saved work is returned.

---

### User Story 2 - Requests for other hosts are rejected (Priority: P1)

A web page that tricks the browser into sending requests to the app under a different host name gets nothing. This holds for pages, saved-work actions and file downloads alike.

**Why this priority**: Without accounts, a request posing as another host could read or change all saved work.

**Independent Test**: Send requests carrying a non-local host name to a page, an action and an export download.

**Acceptance Scenarios**:

1. **Given** a request carrying a host name that is not local and not explicitly allowed, **When** it reaches the server, **Then** it is rejected and nothing is read or changed.
2. **Given** a page on another site, **When** it tries to fetch an analysis export through a non-local host name, **Then** the request is rejected.

---

### User Story 3 - The operator opens it to a network on purpose (Priority: P3)

Someone running the app for a trusted group can open it to named hosts by an explicit opt-in. They are warned at startup that saved work is then readable and changeable by anyone who can reach it.

**Why this priority**: A deliberate, informed way to share is needed, but is secondary to safe defaults.

**Independent Test**: Start with the opt-in and a host list, and again with a host list but no opt-in.

**Acceptance Scenarios**:

1. **Given** the server started with the opt-in and a list of allowed hosts, **When** requests arrive for those hosts, **Then** they are served and a warning is logged at startup.
2. **Given** allowed hosts listed but the opt-in not set, **When** requests arrive, **Then** only local requests are served.

### Edge Cases

- A host list set without the opt-in: ignored, local only.
- A request with a missing or unreadable host: not treated as local, so rejected (current behaviour).
- A forwarded-host header sent by a page: ignored, since only the host the request was addressed to counts (current behaviour).
- Static files and saved-work actions get the same check as pages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: By default, the server MUST accept connections only from the computer it runs on, in development, in production and in the documented container run command.
- **FR-002**: The server MUST reject any request addressed to a host name other than the local computer's, unless that host has been explicitly allowed.
- **FR-003**: The host check MUST apply to pages, server actions and file downloads alike.
- **FR-004**: The server MUST accept other hosts only when the operator sets an explicit opt-in naming them (`ALLOW_UNAUTHENTICATED_NETWORK=1` with `ALLOWED_HOSTS`).
- **FR-005**: When the opt-in is set, the server MUST warn at startup that saved work is then readable and changeable by anyone who can reach it.
- **FR-006**: Allowed hosts listed without the opt-in MUST have no effect: only local requests are served.

### Key Entities

- **Local host names**: `localhost`, `127.0.0.1` and `[::1]`, on any port.
- **Opt-in**: The operator's explicit setting plus the named list of additional allowed hosts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With default settings, 0 of the requests sent from another machine on the network return a page or saved work.
- **SC-002**: A request with a non-local, non-allowed host name is rejected in 100% of cases across a page, a saved-work action and an export download.
- **SC-003**: With the opt-in and a host list, requests for each listed host are served and exactly one startup warning appears.
- **SC-004**: With a host list but no opt-in, 0 requests for the listed hosts are served.
- **SC-005**: The documented container command publishes the port on the local interface only, and a request with a foreign host to the running container is rejected.

## Assumptions

- Single user, local use only; there are no accounts, so this feature is the only protection for saved work. It must not be weakened without a change that adds accounts.
- The server listens on the local interface unless the operator sets an address; a non-loopback listening address also prints a warning.
- Settings are read from the environment at request time, not fixed at build time.
- Only the host the request was addressed to is trusted; forwarded-host headers are not.
- Out of scope: accounts, authentication and publishing the image.
