# ADR 0009: SQLite-First Storage

Status: accepted  
Date: 2026-08-17

## Context

ADR 0004 defines the session event log as "durable, append-only." The current implementation uses in-memory maps (`InMemorySessionRepositoryAdapter`, `InMemoryEventLogAdapter`), which lose all data on restart. Config is the only durable state (`JsonConfigRepositoryAdapter` writes to disk).

The concept doc lists "Storage choice: SQLite first, Postgres later?" as an open question. This ADR resolves it.

## Decision

OpenHarness uses **SQLite** as its primary storage engine.

- One SQLite database file per harness deployment.
- Sessions, events, projects, and tool calls are stored in SQLite tables.
- The event log is append-only at the application level: events are inserted, never updated or deleted.
- The `better-sqlite3` package is used for synchronous, zero-config access (fits the single-process model from ADR 0002).
- In-memory adapters remain for unit tests and development.

Postgres is not ruled out for future multi-process or multi-node deployments, but is not planned for v1.

## Consequences

- A `SqliteSessionRepositoryAdapter`, `SqliteEventLogAdapter`, and `SqliteProjectRepositoryAdapter` will replace the in-memory adapters in production.
- The database file path is a config value (`dbPath` in `HarnessConfig`).
- Schema migrations are managed with a simple versioned migration script (no ORM).
- The single-process assumption from ADR 0002 is a prerequisite: SQLite's write locking is fine for one writer.
- Backup is a file copy; no separate database server to maintain.
