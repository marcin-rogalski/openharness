# ADR 0005: Staged Tool Execution Pipeline

Status: accepted  
Date: 2026-08-17

## Context

Tools are capabilities that agents can call. Treating tools as plain functions is not enough once OpenHarness supports projects, sandboxing, approvals, MCP servers, budgets, and audit.

DeepSeek Harness uses a multi-stage tool pipeline that separates policy, execution, normalization, and result publication.

OpenHarness needs a similar pipeline, but it should remain an application-level orchestration, not a full plugin framework.

## Decision

Tool execution uses a **staged pipeline**.

The application layer owns a tool execution service that orchestrates driven ports:

- tool registry;
- input validation;
- policy engine;
- sandbox adapter;
- approval service;
- tool executor;
- event log;
- result normalizer.

The v1 pipeline is:

1. Resolve tool definition.
2. Validate tool input.
3. Apply policy and permissions.
4. Resolve sandbox requirements.
5. Request approval if required.
6. Execute the tool through its adapter.
7. Normalize the result.
8. Append tool result events.
9. Return a frozen result to the agent runtime.

A tool result is frozen after normalization. Later hooks can observe it, but they cannot silently rewrite the authoritative result.

## Policy Rules

- Policy and sandbox checks happen before execution.
- A denial is monotonic: once policy or sandbox denies a tool call, later hooks cannot re-allow it.
- Approval is explicit and evented.
- Tool adapters do not directly mutate session state.
- Tool adapters return results to the application layer.

## Hook Points

Internal hooks may observe or guard:

- `tool:beforeExecute`
- `tool:afterExecute`
- `tool:beforePolicy`
- `tool:afterPolicy`
- `tool:beforeSandbox`
- `tool:afterSandbox`
- `tool:beforeApproval`
- `tool:afterApproval`

Hooks receive read-only context and return decisions or annotations. They cannot bypass the monotonic denial rule.

## Consequences

- Built-in, local, and MCP tools can share the same execution path.
- Policy, sandbox, and approval logic stay separate from tool implementations.
- Tool execution becomes testable with fake adapters.
- The pipeline can later expose capability metadata for generated catalogs.
- The runtime avoids coupling individual tools to policy services.
