## Purpose

Keeps a server that has no accounts reachable from the computer it runs on, unless the person running it deliberately opens it to others.

## ADDED Requirements

### Requirement: Reachable from this computer only by default

By default, the server SHALL accept connections only from the computer it runs on, in development, in production and in the documented container run command.

#### Scenario: Another machine on the network

- **WHEN** the server is started with default settings and another machine on the same network tries to open it
- **THEN** the connection is refused or the request is rejected, and no page or saved work is returned

### Requirement: Requests for other hosts rejected

The server SHALL reject any request addressed to a host name other than the local computer's, unless that host has been explicitly allowed. This SHALL apply to pages, server actions and file downloads alike.

#### Scenario: Request from a web page posing as another host

- **WHEN** a request reaches the server carrying a host name that is not local and not explicitly allowed
- **THEN** it is rejected and nothing is read or changed

#### Scenario: Export download from another site

- **WHEN** a page on another site tries to fetch an analysis export through a non-local host name
- **THEN** the request is rejected

### Requirement: Opening to a network is explicit

The server SHALL accept other hosts only when the operator sets an explicit opt-in naming them, and SHALL warn at startup that saved work is then readable and changeable by anyone who can reach it.

#### Scenario: Opt-in set

- **WHEN** the server is started with the opt-in and a list of allowed hosts
- **THEN** requests for those hosts are served and a warning is logged at startup

#### Scenario: Host list without opt-in

- **WHEN** allowed hosts are listed but the opt-in is not set
- **THEN** only local requests are served
