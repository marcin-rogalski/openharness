# ADR 0006: Fail-Closed Sandbox Ladder

Status: accepted  
Date: 2026-08-17

## Context

OpenHarness will allow agents to operate on project files, commands, network access, and resources. The sandbox is the execution boundary that prevents accidental or harmful escalation.

DeepSeek Harness uses a fail-closed sandbox ladder: if the requested isolation cannot be confirmed, the system refuses to run instead of silently degrading to unrestricted execution.

OpenHarness adopts the same principle.

## Decision

OpenHarness uses explicit sandbox levels and fail-closed behavior.

Sandbox levels:

| Level | Meaning |
|---|---|
| `read-only` | inspect project state, no writes, no commands by default |
| `workspace-write` | write inside the project workspace and permitted temp areas |
| `command-allowlist` | run only explicitly allowed commands |
| `full-access` | explicit dangerous mode for trusted local use |

Rules:

- Every tool call resolves a sandbox requirement.
- The sandbox adapter reports whether the required level is available.
- If a required sandbox backend is unavailable, execution fails with `SandboxUnavailableError`.
- The system never silently falls back to unrestricted execution.
- Filesystem, command, network, environment, and subprocess access share one sandbox policy.
- Sandbox mode changes are recorded as session events.
- `full-access` must be explicitly configured or approved.

## Consequences

- Local development can start with `read-only` or `workspace-write`.
- Missing sandbox support becomes a visible operational error.
- Tool denials can explain why an operation was refused.
- The sandbox adapter becomes a first-class driven port.
- The system avoids split boundaries where one tool is confined but another can bypass the same policy.
