# ADR 0004: Model-Visible Session Event Log

Status: accepted  
Date: 2026-08-17

## Context

The current slice returns timeline entries directly from the message usecase. That is enough for a mock UI, but it is not enough for durable sessions, replay, debugging, approvals, steering, or multi-client synchronization.

DeepSeek Harness uses a strong invariant: anything the model can see must be reconstructable from the session log.

OpenHarness already plans an event log for durability, streaming, audit, and UI synchronization. This ADR makes the event log the source of truth for model-visible session history.

## Decision

OpenHarness uses a **model-visible session event log**.

- A session is an execution context for a project.
- Session activity is recorded as append-only session events.
- Any input or output that the model can see must be represented as a session event.
- Model context is derived from the session event log, not from hidden in-memory state.
- UI timelines are projections of the same event log.
- User-visible events and model-visible events are explicitly marked.

Minimum event categories:

- session created;
- user message received;
- context injected;
- steering received;
- turn started;
- step started;
- model request sent;
- model output received;
- tool call requested;
- tool execution started;
- tool result produced;
- approval requested;
- approval decided;
- sandbox mode changed;
- error occurred;
- turn ended;
- session ended.

Each event has at least:

- event id;
- session id;
- project id;
- turn id when applicable;
- step id when applicable;
- timestamp;
- actor;
- type;
- payload;
- visibility: `user`, `model`, or `both`.

## Invariants

- No model-visible message, tool result, context injection, or permission change exists only in runtime memory.
- The model request context can be derived from logged events.
- The UI can reconstruct the visible timeline from logged events.
- Replay, resume, fork, and debugging derive from the same event log.

## Consequences

- The event schema becomes a core contract, not an implementation detail.
- The agent runtime must receive derived session context rather than constructing private history.
- Tool execution must emit events for calls and results.
- The current `AgentTimelineEntry` shape will evolve into session/event projections.
- Replay testing becomes possible.
- The system becomes more auditable and easier to debug.
