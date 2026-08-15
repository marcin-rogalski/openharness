# Shipping Strategy

## Recommendation

Use **Docker Compose first** as the integration and shipping surface.

Use a **local process composer later** for a faster dev loop.

Consider **Tauri later as an optional desktop wrapper**, not as the first shipping target.

## Rationale

OpenHarness is an always-on, API-controlled harness with a browser UI. The backend is the durable product surface: it owns projects, agent sessions, MCP/API contracts, and the tunnel boundary.

Docker Compose is the right first step because:

- it gives vertical slices a stable integration environment;
- it packages the harness and UI as reproducible services;
- it can mount a host projects directory;
- it fits always-on machine deployment;
- it keeps the backend reachable by multiple UI clients;
- it avoids embedding a long-lived agent runtime inside a desktop shell.

A local composer is still useful later because:

- `make watch` can run the real dev loop without Docker.
- `make start` can run the production build artifacts locally.
- tests, dev mode, and production mode can share the same source and environment model.
- Docker is not required just to inspect local behavior.

Tauri is useful later if users want a local desktop app. It can wrap the UI and start the harness as a sidecar. It should not be the first shipping target because OpenHarness is primarily a remote, multi-client, always-on system.

## Phases

### Phase 1: Docker Compose integration and shipping

- `harness` service runs the built harness.
- `ui` service serves the built UI and proxies `/api` to the harness.
- `~/.openharness/projects` is mounted into the harness as `/projects`.
- environment variables are injected from the host.
- the harness remains the only component with project and agent access.
- `make check` runs the `integration` package: Vitest compose integration tests plus Playwright browser E2E tests against the built Compose services.

### Phase 2: local composer

- `make watch` runs UI dev mode and harness dev mode.
- `make start` builds production artifacts and runs them locally.
- `.env` and `.env.example` define ports and `PROJECTS_DIR`.
- `PROJECTS_DIR` defaults to `~/.openharness/projects`.

### Phase 3: optional Tauri desktop shell

- Tauri hosts the UI.
- the harness runs as a local sidecar process.
- the UI talks to the local harness API.
- this is a convenience wrapper, not the canonical server deployment.

## Parity Rule

Dev mode and production mode must use the same:

- source packages;
- environment variable names;
- project directory resolution;
- API contracts;
- test expectations.

`make watch` may use source watchers, but `make start` must run built artifacts. `make check` starts the built harness and built UI through Docker Compose, then runs Vitest API/proxy integration tests and Playwright browser E2E tests that verify the same user-visible behavior covered by unit tests.
