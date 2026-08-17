# ADR 0012: Turn/Step Model and Event-Sourced Loop

Status: accepted  
Date: 2026-08-17

## Context

The agent loop needs a clear temporal model. DeepSeek Harness uses a turn/step state machine:

- A **turn** starts from user input.
- A turn contains zero or more **steps**.
- A **step** maps to one model request and the tool execution triggered by that request.

OpenCode uses a nested while loop (outer: queued work, inner: tool-call continuation). This exists because it handles queued messages and steering within the same structure.

OpenHarness handles queued messages at the usecase level: `SendProjectMessageUsecase` is called per user message. The loop within one usecase invocation is a single turn.

The event-sourcing requirement (ADR 0004) means every transition and every block must be a session event. The turn must be fully reconstructable from the event log.

## Decision

Use a **single flat loop** with an explicit turn/step model:

- One turn = one `SendProjectMessageUsecase` invocation.
- One step = one model request + the tool execution triggered by that request.
- The loop is a single `while` in `AgentLoopService.run()`.
- Every step produces session events: `model_output_received`, `tool_call_executed`, `tool_result_received`, and termination events.

Turn states:

```
running → (completed | blocked | error | aborted | max_steps)
```

Termination conditions:

| Condition | Detection | Event |
|---|---|---|
| No tool calls | `response.toolCalls.length === 0` | `turn_completed` |
| Max steps | `step >= config.maxSteps` | `max_steps_reached` |
| Pre-step reject | Hook returns `rejected` | `turn_blocked` |
| Model error | `agentRuntime.handle` throws | `turn_error` |
| Abort | `AbortSignal` fired | `turn_aborted` |
| Max tokens | `finishReason === 'max_tokens'` | `turn_completed` (sticky) |

## Why Not a Nested Loop

- OpenCode's nested loop exists because it handles queued messages and steering within the same structure. OpenHarness handles queued messages at the usecase level.
- A single loop is simpler to test, reason about, and event-source.
- The turn/step model maps cleanly: the usecase owns the turn, the service owns the steps.

## Event Schema

Each step produces:

1. `model_output_received` — the model's response (thinking, toolCalls, response, finishReason, usage).
2. For each tool call: `tool_call_executed` — the tool name, input, and execution status.
3. For each tool result: `tool_result_received` — the frozen result.
4. On termination: one of `turn_completed`, `max_steps_reached`, `turn_blocked`, `turn_error`, `turn_aborted`.

The turn is reconstructable: given the session events, you can replay the exact sequence of model calls and tool executions.

## Consequences

- The turn is the unit of replay testing. A replay fixture defines the sequence of model responses for one turn.
- The step is the unit of observability. UI can show "step 3 of 5" progress.
- The loop is deterministic given the same fixture: same events in, same events out.
- Context compaction (v2) operates at the step boundary: before each model request, the context can be compacted without breaking the event log.
