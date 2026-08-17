# ADR 0003: Plugin-Ready, Not Plugin-First

Status: accepted  
Date: 2026-08-17

## Context

DeepSeek Harness demonstrates that a full plugin kernel can make almost every runtime capability replaceable. That approach is powerful, but it also adds a large framework surface before the core product is useful.

OpenHarness needs to ship for our own use first. We want the ability to add plugins and hooks later without redesigning the runtime.

## Decision

OpenHarness is **plugin-ready, not plugin-first**.

- v1 registers capabilities in the composition root.
- v1 does not ship an external plugin loader.
- Capabilities remain adapters behind stable ports.
- The runtime exposes typed internal hooks at lifecycle boundaries.
- External plugins, if added later, implement the same ports and hook contracts.
- Agents, projects, sessions, rules, and tools remain domain/configuration entities, not plugins.
- The UI remains a client, not a backend plugin.

Internal hooks are allowed at stable boundaries such as:

- session start and end;
- turn start and end;
- step start and end;
- tool pre-execution;
- tool post-execution;
- policy decision;
- sandbox decision;
- event append;
- memory read/write.

Hooks cannot directly mutate session state. They observe context and return effects or decisions that the application layer applies.

## Plugin Readiness Rules

To keep a future plugin surface viable:

1. Capability contracts live in `application/ports/adapters`.
2. Concrete adapters are named only in the composition root.
3. Tool, model, memory, sandbox, persistence, and event capabilities use the same internal contract whether built-in or external.
4. Hook signatures are versioned and documented.
5. Capability metadata can later be used to generate catalogs.
6. A future plugin loader must not require changes to domain or application logic.

## Consequences

- The system stays small and testable while remaining extensible.
- Hooks can be introduced before any external plugin system exists.
- A later plugin loader can be added as an infrastructure concern.
- The project avoids Cordis-style framework complexity in v1.
- “Plugin” remains a distribution/packaging concept, not the core execution model.
