# ADR 0001: Plugin Capability Model

Status: accepted  
Date: 2026-08-17

## Context

OpenHarness needs extensible capabilities: tools, MCP servers, model providers, memory stores, sandbox adapters, persistence stores, event transports, and rule actions.

The system must stay local-first, testable, and hexagonal. A full Cordis-style microkernel is too heavy for the first version, but the useful idea is correct: capabilities should be swappable adapters behind stable ports.

## Decision

OpenHarness uses a **plugin capability model**, not a full plugin framework.

- The core kernel owns stable ports, lifecycle, policy checks, and event emission.
- Capabilities are adapters that implement ports.
- Built-in capabilities use the same internal contract as external capabilities.
- User-installable plugins are a later surface; v1 registers adapters in the composition root.
- Agents, projects, sessions, rules, and tools are domain/configuration entities, not plugins.
- The UI is a client, not a backend plugin.

First-class capability ports:

| Capability | Port responsibility |
|---|---|
| Tool provider | expose tool definitions and execute validated tool calls |
| Model provider | stream or return model completions for a session |
| Memory store | scoped read/write/search for memory items |
| Sandbox adapter | enforce file, command, network, and resource boundaries |
| Persistence store | durable config, session, event, and memory storage |
| Event transport | deliver events to UI clients |
| Rule action | execute declarative rule effects through policy |

## Invariants

- A capability cannot directly mutate session state; it returns results to the application layer.
- Any capability output that is model-visible or user-visible must produce a session event.
- Policy and sandbox checks happen before execution, not inside individual tools.
- Swapping a vendor or implementation should change an adapter, not domain or application logic.

## Consequences

- Adapters can be tested with mocks before real implementations exist.
- Generated catalogs can later be produced from port and adapter metadata.
- The system avoids a large plugin runtime before the core harness is useful.
- “Plugin” means **swappable capability adapter**, not “every module is independently loadable”.
