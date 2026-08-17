# ADR 0008: Trust Boundary and Edge-Terminated Auth

Status: accepted  
Date: 2026-08-17

## Context

OpenHarness is deployed behind a reverse proxy (nginx) fronted by Keycloak on a VPS. Authentication and authorization are handled entirely at the edge. The harness process itself has no internal identity or session concept.

This is consistent with ADR 0002 (single harness server process) and the local-first, single-user assumption.

## Decision

The harness **trusts any request that reaches it**.

- The harness has no internal identity, user, or session-authentication concept.
- If the reverse proxy forwards an identity header (e.g. `X-Forwarded-User`), the harness **ignores** it.
- All sessions, projects, and events belong to a single implicit user.
- The security boundary is the reverse proxy + Keycloak. If an unauthenticated request reaches the harness, it is a deployment misconfiguration, not a harness vulnerability.

## Consequences

- No user/identity domain type is needed in v1.
- Budgets and permissions (Stage 7) are per-project or per-agent, not per-user.
- Multi-user support would require a new ADR, a user domain type, and changes to the session/project ownership model.
- The harness must not be exposed directly without the reverse proxy in production.
