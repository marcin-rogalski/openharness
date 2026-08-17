# ADR 0002: Single Harness Server Process

Status: accepted  
Date: 2026-08-17

## Context

The current Docker Compose layout runs two services:

- `harness`: API and future MCP/event surface.
- `ui`: static UI server that proxies `/api` to the harness.

OpenHarness is a local-first, always-on, multi-client system. The tunnel should expose one application endpoint, not a separate static UI service and backend service.

The UI must remain a separate client package. Merging deployment does not mean merging UI logic into the backend.

## Decision

Target v1 deployment uses **one harness server process**.

That process serves:

- the command API;
- the MCP server surface;
- the event stream;
- the built UI static assets.

The UI remains a separate React package. The harness only serves the built bundle as static files; it does not execute UI logic or agent logic inside the browser.

Development may still use Vite dev mode with a proxy. Production Docker Compose should collapse to a single `harness` service.

A separate UI deployment remains optional for teams that want CDN hosting or a distinct static server.

## Consequences

- One tunneled endpoint is enough for remote access.
- Same-origin API access removes the need for a UI-side `/api` proxy in the default deployment.
- The harness needs a static-file driving adapter for the built UI.
- The current two-service Compose layout is transitional.
- The security boundary remains explicit: static file serving is not agent execution.
