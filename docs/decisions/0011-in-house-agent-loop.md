# ADR 0011: In-House Agent Loop

Status: accepted  
Date: 2026-08-17

## Context

The agent loop is the core execution cycle: send context to the model, receive a response (text, tool calls, or both), execute tool calls if present, append results to context, and repeat until the model produces a final response or a termination condition is met.

Several npm libraries provide agent loop functionality:

- **Vercel AI SDK** (`ai`): library-owned loop via `generateText` with `stopWhen: isStepCount(n)`.
- **LangChain.js**: graph-based loop via `createReactAgent` (LangGraph).
- **Anthropic SDK** / **OpenAI SDK**: no built-in loop; manual `while` pattern.

DeepSeek Harness and OpenCode both implement the loop in-house in the application layer.

OpenHarness constraints:

- Hexagonal architecture: the loop must orchestrate driven ports (`AgentRuntimePort`, `ToolExecutionService`, `EventLogPort`, `HookRegistryService`).
- Event sourcing: every step must produce session events. The loop is reconstructable from the event log.
- Staged tool pipeline (ADR 0005): tool calls pass through policy, sandbox, approval, execution, normalization.
- Provider-agnostic: the `AgentRuntimePort` is the boundary. The loop does not know which provider is behind it.
- Replay testing (ADR 0007): the loop must be testable with deterministic fixtures.

## Decision

Build the agent loop in-house in the application layer (`AgentLoopService`). Do not use a library's loop.

Rationale:

1. **The loop is the product.** OpenHarness' value is in the loop's integration with events, tools, policy, sandbox, and hooks. A library loop hides this integration.
2. **Hexagonal architecture requires it.** The loop must orchestrate driven ports. A library loop would either bypass these ports or require awkward adapters.
3. **Event sourcing requires it.** Every step must produce session events. A library loop does not know about OpenHarness' event schema.
4. **The loop is small.** The core is ~100 lines. The complexity is in the surrounding services (tool execution, policy, sandbox, hooks), which are already built.
5. **Testability.** An in-house loop can be tested with a mock `AgentRuntimePort` and replay fixtures. A library loop requires mocking the library's internals.
6. **Provider-agnosticism.** The `AgentRuntimePort` is the boundary. A library like Vercel AI SDK couples you to its provider abstraction.

## What to Borrow

| From | What |
|---|---|
| DeepSeek Harness | Turn/step model, bounded parallel pool, waterfall hooks |
| OpenCode | LLMEvent tagged union (for future streaming), compaction service pattern |
| Vercel AI SDK | `tool()` helper ergonomics, `isStepCount` termination pattern |
| Anthropic SDK | Validation that the manual loop is the standard pattern |

## What to Avoid

| Anti-pattern | Why |
|---|---|
| Vercel AI SDK's `generateText` as the loop | Hides the loop, couples to its provider abstraction, no event sourcing |
| LangChain's `createReactAgent` | Brings LangGraph dependency, graph-based loop is overkill, no event sourcing |
| Library-owned tool execution | Bypasses the staged tool pipeline (ADR 0005) |
| No max step limit | Risk of infinite loops, cost explosion |

## Consequences

- The loop is a service in `application/services/AgentLoopService.ts`.
- It is testable with `ReplayAgentRuntimeAdapter` and in-memory adapters.
- Adding a new provider requires only a new `AgentRuntimePort` adapter.
- The loop is stable and auditable; every iteration is a session event.
- Future streaming (v2) adds an optional `stream()` method to `AgentRuntimePort` without changing the loop structure.
