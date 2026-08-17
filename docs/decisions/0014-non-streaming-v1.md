# ADR 0014: Non-Streaming V1

Status: accepted  
Date: 2026-08-17

## Context

Model providers support streaming responses (SSE, chunked text deltas, partial tool call accumulation). Streaming provides:

- Real-time text rendering in the UI.
- Lower perceived latency (first token visible immediately).
- Progress feedback during long generations.

However, streaming adds significant complexity to the agent loop:

- Partial tool call accumulation (name + arguments arrive in deltas across multiple chunks).
- Error recovery mid-stream (what if the connection drops after a partial tool call?).
- Backpressure handling (the UI may not consume as fast as the model produces).
- State management (the loop must track which blocks are open, which tool calls are complete).
- Event sourcing with streaming is harder: you either emit partial events (which complicates the event schema) or buffer until complete (which defeats the purpose).

DeepSeek Harness and OpenCode both support streaming, but both also support non-streaming as a fallback.

## Decision

V1 uses **non-streaming** model calls. The `AgentRuntimePort.handle()` method returns the complete response.

Rationale:

1. **The event log already provides step-level granularity.** Each step produces a `model_output_received` event. The UI can show "step 2: model is thinking..." while the step is in progress.
2. **Simplicity.** No partial state, no chunk accumulation, no mid-stream error recovery.
3. **Testability.** Non-streaming responses are trivially testable with replay fixtures.
4. **The loop is the same.** Adding streaming later is an additive change: an optional `stream()` method on `AgentRuntimePort`. The loop structure does not change.

## V2 Streaming Plan

When the UI needs real-time text rendering:

1. Add `stream?(request: AgentRuntimeRequest): AsyncIterable<AgentRuntimeStreamChunk>` to `AgentRuntimePort`.
2. Define `AgentRuntimeStreamChunk` as a tagged union (inspired by OpenCode's `LLMEvent`):
   - `text-delta`, `reasoning-delta`, `tool-call-delta`, `block-end`, `usage`, `finish`.
3. The loop processes chunks in real-time: text deltas are emitted to the UI immediately, tool calls are buffered until complete.
4. The event log records the complete response (not partial chunks). Streaming is a transport concern, not an event concern.
5. The `OpenAiAgentRuntimeAdapter` implements `stream()` using SSE parsing.

## UI Implications for V1

- The UI shows a "thinking" indicator while a step is in progress.
- When the step completes, the full response appears (text + tool calls + results).
- SSE (ADR 0010) can be used to notify the UI that a step has completed, without streaming the model's text token-by-token.

## Consequences

- V1 is simpler to build, test, and debug.
- The perceived latency is higher (user waits for the full response before seeing anything).
- Adding streaming in v2 is an additive change that does not break the event schema or the loop.
- The `AgentRuntimePort` interface is designed to accommodate streaming without breaking changes.
