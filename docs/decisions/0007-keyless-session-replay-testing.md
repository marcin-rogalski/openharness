# ADR 0007: Keyless Session Replay Testing

Status: accepted  
Date: 2026-08-17

## Context

Agent behavior depends on model output, tool execution, policy, sandboxing, and session history. Testing the full runtime against live models is slow, expensive, non-deterministic, and unsuitable for CI.

DeepSeek Harness uses recorded session logs as replay fixtures. The same recorded log can drive a deterministic mock model and serve as the expected output after normalization.

OpenHarness adopts this pattern because the session event log is already the source of truth for model-visible history.

## Decision

OpenHarness uses **keyless session replay tests**.

A replay test:

1. Loads a recorded session event fixture.
2. Derives a deterministic mock agent runtime from the recorded model output.
3. Runs the real application pipeline: usecase, session runtime, tool pipeline, policy, sandbox, and event log.
4. Normalizes volatile fields such as ids and timestamps.
5. Diffs the newly produced session log against the expected fixture.

Recorded fixtures must:

- contain all model-visible events;
- redact secrets and credentials;
- normalize volatile identifiers;
- be committed to the repository when used in CI.

The test harness supports three modes:

- `replay`: run against a committed fixture;
- `record`: capture a new fixture from a controlled run;
- `refresh`: replace an expected fixture after an intentional behavior change.

## Consequences

- CI can test agent/tool/session behavior without API keys.
- Regressions appear as session log diffs.
- The event schema must be stable and normalizable.
- Tests can cover approval, denial, sandbox, steering, and tool result behavior deterministically.
- A test-support package or harness test utility will be needed.
