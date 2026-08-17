# ADR 0013: Bounded Parallel Tool Execution

Status: accepted  
Date: 2026-08-17

## Context

A model response can contain multiple tool calls. These calls may be independent (e.g., read two files) or dependent (e.g., write then read). The execution strategy affects:

- Latency (parallel is faster).
- Safety (some tools must be sequential, e.g., file writes).
- Determinism (the model expects results in the order it requested them).
- Resource usage (unlimited parallelism can exhaust file handles, CPU, etc.).

DeepSeek Harness uses a bounded rolling pool (default 10 concurrent) with results committed in model order. OpenCode uses Effect's `FiberSet` for parallel tool dispatch.

## Decision

Use a **bounded rolling pool** for parallel tool execution:

- Default concurrency: 10 (configurable per agent via `AgentLoopConfig.maxParallelTools`).
- Results are committed in **model order** regardless of completion order. The results array is indexed by call position, not completion time.
- Tools with `concurrency: 'exclusive'` metadata run sequentially (barrier mode). The pool respects per-tool concurrency metadata.
- Abort: if the session is aborted mid-execution, in-flight tools are cancelled. Uncompleted calls get synthetic error results.

## Execution Flow

```
Model returns toolCalls[0..n]
  → For each call (bounded parallel, max 10 concurrent):
    → ToolExecutionService.execute(call)
      → resolve → validate → policy → sandbox → approval → execute → normalize
  → Results array filled in model order
  → All results appended as session events
  → Next step: context includes tool results
```

## Error Handling

- A tool execution error does not stop the loop. The error is recorded as a `tool_result_received` event with `status: 'error'`.
- The model sees the error in the next step's context and can decide how to proceed.
- If all tools in a step fail, the loop continues (the model may retry or give up).
- A policy/sandbox denial is a terminal error for that specific call but not for the loop.

## Why Not Promise.all

- `Promise.all` has no concurrency limit. A model requesting 50 tool calls would spawn 50 concurrent executions.
- `Promise.all` rejects on the first error. We need all results, including errors.
- A bounded pool provides backpressure and resource control.

## Why Model Order

- The model generated the tool calls in a specific order. It may rely on that order for dependent calls.
- Even with parallel execution, the results must be presented to the model in the order it requested them.
- This matches DeepSeek Harness and OpenCode behavior.

## Consequences

- The pool is a utility in the application layer, not a framework.
- Per-tool concurrency metadata is part of `ToolDefinition`.
- The loop is testable: a replay fixture with multiple tool calls verifies parallel execution and model-order results.
- Future: MCP tools can declare their own concurrency requirements through the same metadata.
