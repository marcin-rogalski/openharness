# Agent Loop Research

Status: research notes  
Date: 2026-08-17

This document analyzes agent loop implementations from DeepSeek Harness, OpenCode, and npm libraries to inform the OpenHarness agent loop design.

Related documents:

- [Architecture](../architecture.md)
- [DeepSeek Harness research](deepseek-harness.md)
- [Plugin-Ready Runtime Plan](../plans/plugin-ready-runtime.md)
- [ADR 0004: Model-Visible Session Event Log](../decisions/0004-model-visible-session-event-log.md)
- [ADR 0005: Staged Tool Execution Pipeline](../decisions/0005-staged-tool-execution-pipeline.md)

## Scope

The agent loop is the core execution cycle:

1. Send context to the model.
2. Receive a response (text, tool calls, or both).
3. If tool calls are present, execute them.
4. Append results to context.
5. Repeat until the model produces a final response or a termination condition is met.

This document covers:

- How DeepSeek Harness structures the loop (turn/step model, parallel tool execution, hook pipeline).
- How OpenCode structures the loop (Effect-based, nested while, durable events).
- How npm libraries (Vercel AI SDK, Anthropic SDK, LangChain.js, OpenAI) handle the loop.
- A synthesized canonical loop for OpenHarness.
- A recommendation on build-in-house vs library vs hybrid.

## 1. DeepSeek Harness

Source: `deepseek-ai/deepseek-harness` (MIT, ~149k stars, 219 packages)

### 1.1 Turn and Step Model

The loop is structured as a state machine with explicit phases:

```
idle → maintenance → running → (completed | error | aborted | blocked)
```

- A **turn** starts from user input or queued work.
- A turn contains zero or more **steps**.
- A **step** maps to one model request and the tool execution triggered by that request.

The `ReactLoopAgent` class (`packages/core/agent-loop/src/agent.ts`) owns the state machine. It is event-sourced: every transition appends a session event.

### 1.2 Core Loop

```typescript
// Simplified from packages/core/agent-loop/src/agent.ts
while (true) {
  // 1. Build request from session-derived messages
  const request = session.deriveMessages()

  // 2. Fire pre-step hooks (waterfall: agent/pre-step, agent/request)
  const hookResult = await hooks.runWaterfall('agent/pre-step', request)
  if (hookResult.rejected) {
    transition('blocked')
    break
  }

  // 3. Stream from LLM
  const stream = llm.stream(request)
  const blocks = await assembleBlocks(stream)

  // 4. Classify response
  if (!blocks.hasToolCalls) {
    // Final response — no tool calls
    transition('completed')
    break
  }

  if (blocks.finishReason === 'max_tokens') {
    // Sticky: once max-tokens hits, the turn ends
    transition('completed')
    break
  }

  if (aborted) {
    transition('aborted')
    break
  }

  // 5. Execute tool calls (bounded parallel)
  const results = await executeToolCalls(blocks.toolCalls)

  // 6. Append results to session, loop continues
  session.appendToolResults(results)
}
```

Key properties:

- **Single `while(true)` loop** — no nested loops. The turn is the loop.
- **Termination conditions**: no tool calls, max-tokens (sticky), aborted, error, blocked (pre-step reject).
- **Hook pipeline**: waterfall events at `agent/pre-step`, `agent/request`, `agent/request-error`, `agent/turn-stopping`. A hook can reject (block) or annotate.
- **Event-sourced**: every transition and every block is a session event.

### 1.3 Parallel Tool Execution

`packages/core/agent-loop/src/tool-calls.ts` implements a bounded rolling pool:

```typescript
// Simplified from packages/core/agent-loop/src/tool-calls.ts
async function executeToolCalls(
  calls: ToolCall[],
  options: { maxParallel: number } // default 10
): Promise<ToolResult[]> {
  const results = new Array(calls.length)
  const pool = createBoundedPool(options.maxParallel)

  // Two modes:
  // - "parallel": all calls dispatched immediately, bounded by pool
  // - "exclusive" (barrier): calls run one at a time in model order

  for (const [index, call] of calls.entries()) {
    await pool.add(async () => {
      results[index] = await executeSingleTool(call)
    })
  }

  await pool.drain()
  return results
}
```

Key properties:

- **Bounded rolling pool** (default 10 concurrent).
- **Results committed in model order** regardless of completion order. The model sees results in the order it requested them.
- **Abort handling**: if the session is aborted mid-execution, in-flight tools are cancelled and synthetic error results are recorded for uncompleted calls.
- **Exclusive/barrier mode**: some tools (e.g., file writes) may require sequential execution. The pool respects per-tool concurrency metadata.

### 1.4 LLM Port

`packages/llm/llm/src/types.ts` defines the provider-agnostic contract:

```typescript
interface GenerateOptions {
  model: string
  messages: Message[]
  tools?: ToolSchema[]
  temperature?: number
  maxTokens?: number
  // ...
}

type StreamChunk =
  | { type: 'block-start'; blockId: string; kind: 'text' | 'reasoning' | 'tool-call' }
  | { type: 'text-delta'; blockId: string; text: string }
  | { type: 'reasoning-delta'; blockId: string; text: string }
  | { type: 'tool-call-delta'; blockId: string; name?: string; arguments?: string }
  | { type: 'block-end'; blockId: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'finish'; reason: FinishReason }

type FinishReason = 'stop' | 'tool_calls' | 'max_tokens' | 'content_filter' | 'error'

interface ToolSchema {
  name: string
  description: string
  parameters: JSONSchema
}

interface LlmFailure {
  code: string
  message: string
  retryable: boolean
}
```

The adapter (`packages/llm/llm-deepseek/src/adapter.ts`) is transport-only:

```typescript
class DeepSeekAdapter implements LlmPort {
  stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    // fetch + SSE parsing, maps provider events to StreamChunk
  }
}
```

The adapter knows nothing about turns, steps, tools, or session state. It translates HTTP/SSE into the `StreamChunk` union.

### 1.5 Hook Pipeline

Hooks are waterfall events: each hook receives the current state and can return a decision (allow, reject, annotate). The pipeline runs hooks in registration order.

```
agent/pre-step → agent/request → [LLM call] → agent/request-error (on failure) → agent/turn-stopping
```

A hook can:

- **Reject**: the step is blocked, the turn ends with a `blocked` status.
- **Annotate**: add metadata to the request or response.
- **Observe**: read-only, no effect.

## 2. OpenCode

Source: `anomalyco/opencode` (MIT, ~198k stars)

### 2.1 Nested While Loop

OpenCode uses a **nested loop** structure built on Effect:

```typescript
// Simplified from packages/core/src/session/runner/llm.ts
while (shouldRun) {
  // Outer loop: drains queued work (user messages, steering)
  while (needsContinuation) {
    // Inner loop: continues while the model wants tool calls
    await runTurnAttempt()
  }
}
```

- The **outer loop** handles queued messages and steering instructions. It runs while there is pending work.
- The **inner loop** (`needsContinuation`) runs while the model's last response contained tool calls. Each iteration is one model request + tool execution.

### 2.2 runTurnAttempt

```typescript
// Simplified from packages/core/src/session/runner/llm.ts
async function runTurnAttempt() {
  // 1. Resolve agent, model, system prompt
  const { agent, model, system } = resolveAgent()

  // 2. Materialize tools with permissions
  const tools = await tools.materialize(permissions)

  // 3. Build LLM request
  const request = LLM.request({
    model,
    system,
    messages: session.deriveMessages(),
    tools: tools.toDefinitions(),
  })

  // 4. Compaction check (context window management)
  await compaction.compactIfNeeded(request)

  // 5. Stream from LLM
  const stream = llm.stream(request)

  // 6. Process events
  for await (const event of stream) {
    publish(event) // emit to event stream

    switch (event.type) {
      case 'tool-call':
        // Dispatch tool execution via FiberSet (parallel)
        fiberSet.fork(() => settleToolCall(event))
        break
      case 'tool-result':
        // Tool completed, result appended to session
        break
      case 'finish':
        // Turn complete
        break
    }
  }

  // 7. Wait for all in-flight tools
  await fiberSet.joinAll()
}
```

Key properties:

- **Effect-based**: the entire runner is an Effect program. Errors, cancellation, and concurrency are handled by the Effect runtime.
- **FiberSet for parallel tools**: tool calls are dispatched as fibers (lightweight concurrent tasks). They run in parallel and results are collected.
- **Compaction**: before each request, `compaction.compactIfNeeded` checks if the context exceeds the model's window and summarizes older messages.
- **Durable events**: every `LLMEvent` is published to the event stream and persisted.

### 2.3 LLM Port

`packages/llm/src/llm.ts`:

```typescript
interface LLM {
  request(input: LLMRequestInput): LLMRequest
  stream(request: LLMRequest): Stream<LLMEvent>
  generate(request: LLMRequest): Promise<LLMResponse>
}
```

`LLMEvent` is a tagged union (`packages/llm/src/schema/events.ts`):

```typescript
type LLMEvent =
  | { type: 'step-start' }
  | { type: 'text-start'; id: string }
  | { type: 'text-delta'; id: string; text: string }
  | { type: 'text-end'; id: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; text: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'tool-input-start'; id: string; name: string }
  | { type: 'tool-input-delta'; id: string; text: string }
  | { type: 'tool-input-end'; id: string }
  | { type: 'tool-call'; id: string; name: string; arguments: unknown }
  | { type: 'tool-result'; id: string; result: unknown }
  | { type: 'tool-error'; id: string; error: string }
  | { type: 'step-finish'; finishReason: FinishReason }
  | { type: 'finish'; finishReason: FinishReason }
  | { type: 'provider-error'; error: ProviderError }
```

### 2.4 Tool Definition

`packages/llm/src/tool.ts`:

```typescript
function Tool.make<TInput, TOutput>(config: {
  description: string
  parameters: EffectSchema<TInput> | JSONSchema
  success: EffectSchema<TOutput>
  execute?: (input: TInput) => Effect<TOutput, ToolError>
  toModelOutput?: (output: TOutput) => string
}): Tool<TInput, TOutput>

function toDefinitions(tools: Tool[]): ToolDefinition[]
```

Tools are type-safe: input and output schemas are validated at the type level. `toDefinitions` converts the tool set into the provider-agnostic `ToolDefinition[]` format.

### 2.5 Providers

`packages/llm/src/providers/` contains one module per provider:

- `anthropic.ts`
- `openai.ts`
- `google.ts`
- `xai.ts`
- `cloudflare.ts`
- `azure.ts`
- `bedrock.ts`
- `openrouter.ts`
- `openai-compatible.ts`
- `github-copilot.ts`

Each provider implements a protocol mapper (`packages/llm/src/protocols/`) that translates between the provider's wire format and the `LLMEvent` union.

### 2.6 Context Compaction

`packages/core/src/session/compaction.ts`:

- Before each model request, checks if the derived messages exceed the model's context window.
- If over budget, summarizes older messages into a compact summary.
- The summary replaces the older messages in the context.
- This is transparent to the agent loop — it happens inside `runTurnAttempt` before the request.

## 3. npm Library Comparison

### 3.1 Vercel AI SDK (`ai` package)

- **License**: Apache 2.0
- **Loop mechanism**: `generateText` / `streamText` with `stopWhen: isStepCount(n)`
- **Tool definition**: `tool({ description, inputSchema (Zod), execute })`
- **Callbacks**: `onStepEnd({ toolResults })`, `onFinish`
- **Provider**: `createOpenAICompatible({ name, apiKey, baseURL })`, `createProviderRegistry`
- **Loop ownership**: The library owns the loop. You call `generateText` once; it internally loops until `stopWhen` is satisfied.
- **Streaming**: `streamText` returns a `ReadableStream` of `TextStreamPart` / `ToolCallStreamPart`.
- **Context management**: No built-in compaction. You manage messages yourself.
- **Parallel tools**: Executes all tool calls in a step in parallel (Promise.all).
- **Max iterations**: `stopWhen: isStepCount(n)` — hard limit on steps.
- **Interruption**: AbortController passed to `generateText`.

```typescript
// Vercel AI SDK pattern
const result = await generateText({
  model: createOpenAICompatible({ name: 'my-model', apiKey, baseURL }),
  messages,
  tools: { readFile: tool({ description, inputSchema, execute }) },
  stopWhen: isStepCount(10),
  onStepEnd: ({ toolResults }) => { /* observe */ },
})
```

### 3.2 Anthropic SDK (`@anthropic-ai/sdk`)

- **License**: MIT
- **Loop mechanism**: No built-in loop in core. Manual pattern:

```typescript
// Anthropic manual loop
let messages = [{ role: 'user', content: prompt }]
while (true) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages,
    tools: toolDefinitions,
  })
  if (response.stop_reason === 'end_turn') break
  if (response.stop_reason === 'tool_use') {
    const results = []
    for (const block of response.content.filter(b => b.type === 'tool_use')) {
      const result = await executeTool(block.name, block.input)
      results.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: results })
  }
}
```

- **toolRunner helper**: `client.messages.toolRunner(params)` with `max_iterations` — a thin wrapper around the manual loop.
- **Streaming**: `client.messages.stream(...)` returns an async iterable of events.
- **Parallel tools**: You control this. The SDK returns all tool_use blocks; you execute them however you want.
- **Context management**: No built-in compaction.

### 3.3 LangChain.js

- **License**: MIT
- **Loop mechanism**: `createReactAgent` / `createDeepAgent` — graph-based (LangGraph).
- **Loop ownership**: The graph owns the loop. Each node is a step; edges define the flow.
- **Max iterations**: `recursionLimit` (default 25).
- **Tool definition**: `tool(fn, { name, description, schema (Zod) })`
- **Streaming**: `agent.stream(input)` yields node outputs.
- **Context management**: No built-in compaction. You can add a summarization node.
- **Weight**: Brings LangGraph, LangChain core, and their dependencies. Significant bundle size.
- **Flexibility**: High — you can add conditional edges, parallel branches, human-in-the-loop nodes.

### 3.4 OpenAI npm (`openai`)

- **License**: MIT
- **Loop mechanism**: No built-in loop. Manual:

```typescript
// OpenAI manual loop
let messages = [{ role: 'user', content: prompt }]
while (true) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools: toolDefinitions,
  })
  const choice = response.choices[0]
  if (choice.finish_reason === 'stop') break
  if (choice.finish_reason === 'tool_calls') {
    const results = []
    for (const tc of choice.message.tool_calls) {
      const result = await executeTool(tc.function.name, JSON.parse(tc.function.arguments))
      results.push({ role: 'tool', tool_call_id: tc.id, content: result })
    }
    messages.push(choice.message)
    messages.push(...results)
  }
}
```

- **Responses API** (newer): `client.responses.create` — similar pattern, different wire format.
- **Streaming**: `stream: true` returns SSE events.
- **Parallel tools**: You control this.

### 3.5 Comparison Table

| Feature | DeepSeek Harness | OpenCode | Vercel AI SDK | Anthropic SDK | LangChain.js | OpenAI SDK |
|---|---|---|---|---|---|---|
| Loop ownership | Application (explicit) | Application (Effect) | Library (hidden) | Developer (manual) | Graph (LangGraph) | Developer (manual) |
| Loop structure | Single while | Nested while | Internal for | Manual while | Graph edges | Manual while |
| Parallel tools | Bounded pool (10) | FiberSet | Promise.all | Developer-controlled | Graph parallelism | Developer-controlled |
| Result ordering | Model order | Model order | Model order | Developer-controlled | Graph order | Developer-controlled |
| Max iterations | Configurable | `agent.info?.steps` | `isStepCount(n)` | `max_iterations` | `recursionLimit` | Developer-controlled |
| Streaming | StreamChunk union | LLMEvent union | ReadableStream | AsyncIterable | Node stream | SSE |
| Compaction | Session-derived | `compactIfNeeded` | None | None | None | None |
| Hook/policy pipeline | Waterfall hooks | Effect middleware | Callbacks | None | Graph nodes | None |
| Event sourcing | Yes (session log) | Yes (durable events) | No | No | No | No |
| Provider-agnostic | Yes (LlmPort) | Yes (LLM port) | Yes (provider registry) | No (Anthropic only) | Yes (model registry) | No (OpenAI only) |
| Bundle weight | Heavy (monorepo) | Heavy (Effect) | Light (core) | Light | Heavy (LangGraph) | Light |
| License | MIT | MIT | Apache 2.0 | MIT | MIT | MIT |

## 4. Canonical Agent Loop for OpenHarness

### 4.1 Design Constraints

From the existing architecture and ADRs:

1. **Hexagonal**: The loop lives in the application layer. It orchestrates driven ports (AgentRuntimePort, ToolExecutionService, EventLogPort).
2. **Event-sourced**: Every step produces session events. The loop is reconstructable from the event log.
3. **Staged tool pipeline**: Tool calls pass through `ToolExecutionService` (resolve → validate → policy → sandbox → approval → execute → normalize → log).
4. **Provider-agnostic**: The `AgentRuntimePort` is the boundary. The loop does not know which provider is behind it.
5. **No external plugin framework**: The loop is stable and testable. Extension is through typed hooks, not plugin loading.
6. **Single process**: The loop runs in the harness server process. No distributed execution.

### 4.2 Loop Structure

OpenHarness should use a **single flat loop** (like DeepSeek Harness), not a nested loop (like OpenCode). Rationale:

- The nested loop in OpenCode exists because it handles queued messages and steering within the same structure. OpenHarness handles queued messages at the usecase level (the usecase is called per user message).
- A single loop is simpler to test, reason about, and event-source.
- The turn/step model maps cleanly: one turn = one usecase invocation, one step = one model request + tool execution.

```typescript
// Application layer: AgentLoopService (or embedded in SendSessionMessageUsecase)
class AgentLoopService {
  constructor(
    private readonly agentRuntime: AgentRuntimePort,
    private readonly toolExecution: ToolExecutionService,
    private readonly eventLog: EventLogPort,
    private readonly contextService: SessionContextService,
    private readonly hooks: HookRegistryService,
    private readonly config: AgentLoopConfig,
  ) {}

  async run(session: Session, project: Project): Promise<void> {
    const turnId = crypto.randomUUID()
    let step = 0

    while (step < this.config.maxSteps) {
      step++

      // 1. Pre-step hooks (can reject → blocked)
      const preStep = await this.hooks.runWaterfall('agent/pre-step', {
        sessionId: session.id,
        turnId,
        step,
      })
      if (preStep.rejected) {
        await this.eventLog.append(blockedEvent(session, turnId, step, preStep.reason))
        return
      }

      // 2. Derive context from session events
      const events = await this.eventLog.listBySession(session.id)
      const context = this.contextService.deriveContext(events)

      // 3. Build request
      const request: AgentRuntimeRequest = {
        sessionId: session.id,
        projectId: project.id,
        turnId,
        step,
        context,
        tools: this.toolExecution.getToolDefinitions(),
      }

      // 4. Call model
      const response = await this.agentRuntime.handle(request)

      // 5. Record model output event
      await this.eventLog.append(modelOutputEvent(session, turnId, step, response))

      // 6. No tool calls → turn complete
      if (response.toolCalls.length === 0) {
        return
      }

      // 7. Execute tool calls (bounded parallel)
      const results = await this.executeToolCalls(session, turnId, step, response.toolCalls)

      // 8. Record tool results events
      for (const result of results) {
        await this.eventLog.append(toolResultEvent(session, turnId, step, result))
      }

      // 9. Loop continues: next step sends updated context to model
    }

    // 10. Max steps reached
    await this.eventLog.append(maxStepsEvent(session, turnId, step))
  }

  private async executeToolCalls(
    session: Session,
    turnId: string,
    step: number,
    calls: ToolCall[],
  ): Promise<ToolResult[]> {
    const results = new Array(calls.length)
    const pool = createBoundedPool(this.config.maxParallelTools)

    for (const [index, call] of calls.entries()) {
      await pool.add(async () => {
        results[index] = await this.toolExecution.execute(session, turnId, step, call)
      })
    }

    await pool.drain()
    return results
  }
}
```

### 4.3 Port Changes

The current `AgentRuntimePort` needs to evolve:

```typescript
// Current (single request/response, no tools in request)
interface AgentRuntimePort {
  handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse>
}

// Target (tools in request, streaming optional)
interface AgentRuntimePort {
  handle(request: AgentRuntimeRequest): Promise<AgentRuntimeResponse>
  // Optional: streaming variant for real-time UI updates
  stream?(request: AgentRuntimeRequest): AsyncIterable<AgentRuntimeStreamChunk>
}

interface AgentRuntimeRequest {
  sessionId: string
  projectId: string
  turnId: string
  step: number
  context: ModelContextMessage[]
  tools: ToolDefinition[]  // NEW: tool schemas for the model
}

interface AgentRuntimeResponse {
  thinking: string | null
  toolCalls: ToolCall[]    // Changed: proper ToolCall domain type
  response: string
  finishReason: FinishReason  // NEW: stop | tool_calls | max_tokens | error
  usage: TokenUsage          // NEW: input/output tokens
}

type FinishReason = 'stop' | 'tool_calls' | 'max_tokens' | 'content_filter' | 'error'

interface TokenUsage {
  inputTokens: number
  outputTokens: number
}
```

### 4.4 Tool Call Flow

```
Model returns toolCalls[]
  → AgentLoopService.executeToolCalls()
    → For each call (bounded parallel):
      → ToolExecutionService.execute()
        → 1. Resolve tool definition (ToolRegistryPort)
        → 2. Validate input (Zod/JSON Schema)
        → 3. Policy check (PolicyPort) — can deny
        → 4. Sandbox resolve (SandboxPort) — can deny
        → 5. Approval check (ApprovalPort) — can pause
        → 6. Execute (ToolExecutorPort)
        → 7. Normalize result
        → 8. Return frozen ToolResult
  → Results appended as session events
  → Next step: context includes tool results
```

### 4.5 Termination Conditions

| Condition | Detection | Event |
|---|---|---|
| No tool calls | `response.toolCalls.length === 0` | `turn_completed` |
| Max steps | `step >= config.maxSteps` | `max_steps_reached` |
| Pre-step reject | Hook returns `rejected` | `turn_blocked` |
| Model error | `agentRuntime.handle` throws | `turn_error` |
| Abort | `AbortSignal` fired | `turn_aborted` |
| Max tokens | `finishReason === 'max_tokens'` | `turn_completed` (sticky) |

### 4.6 Parallel Tool Execution

- **Bounded rolling pool** (default 10 concurrent, configurable per agent).
- **Results committed in model order**: the array is indexed by call position, not completion time.
- **Abort**: if the session is aborted, in-flight tools are cancelled. Uncompleted calls get synthetic error results.
- **Exclusive tools**: tools with `concurrency: 'exclusive'` metadata run sequentially (barrier mode).

### 4.7 Streaming Tradeoffs

**Option A: Non-streaming (v1)**

- `agentRuntime.handle()` returns the complete response.
- The loop processes the full response, executes tools, loops.
- UI updates via events after each step completes.
- Simpler, testable, no partial state.

**Option B: Streaming (v2)**

- `agentRuntime.stream()` yields `AgentRuntimeStreamChunk` events.
- The loop processes chunks in real-time: text deltas are emitted to the UI immediately, tool calls are buffered until complete.
- More responsive UI, but adds complexity:
  - Partial tool call accumulation (name + arguments arrive in deltas).
  - Error recovery mid-stream.
  - Backpressure handling.

**Recommendation**: Start with Option A. The event log already provides step-level granularity. Add streaming in a later stage when the UI needs real-time text rendering.

### 4.8 Context Window Management

**v1: No compaction.**

- The context is derived from all session events.
- For short sessions (the expected v1 use case), this is sufficient.
- The `maxSteps` limit provides a hard bound on context growth.

**v2: Compaction service.**

- A `CompactionService` checks token usage before each request.
- If over budget, summarizes older messages.
- The summary replaces older messages in the derived context.
- This is a service in the application layer, injected into the loop.

```typescript
// Future: CompactionService
class CompactionService {
  async compactIfNeeded(
    context: ModelContextMessage[],
    model: ModelInfo,
  ): Promise<ModelContextMessage[]> {
    const estimatedTokens = estimateTokens(context)
    if (estimatedTokens < model.contextWindow * 0.8) {
      return context // under budget
    }
    // Summarize older messages, keep recent ones
    const summary = await this.summarize(context.slice(0, -5))
    return [{ role: 'system', content: summary }, ...context.slice(-5)]
  }
}
```

## 5. Recommendation

### 5.1 Build In-House (Recommended)

**Build the agent loop in the application layer.** Do not use a library's loop.

Rationale:

1. **The loop is the core of the harness.** It is not a utility; it is the product. OpenHarness' value is in the loop's integration with events, tools, policy, sandbox, and hooks. A library loop hides this integration.

2. **Hexagonal architecture requires it.** The loop must orchestrate driven ports (AgentRuntimePort, ToolExecutionService, EventLogPort, HookRegistryService). A library loop would either bypass these ports or require awkward adapters.

3. **Event sourcing requires it.** Every step must produce session events. A library loop does not know about OpenHarness' event schema.

4. **The loop is small.** The core is ~100 lines. The complexity is in the surrounding services (tool execution, policy, sandbox, hooks), which are already planned.

5. **Testability.** A in-house loop can be tested with a mock AgentRuntimePort and replay fixtures. A library loop requires mocking the library's internals.

6. **Provider-agnosticism.** The `AgentRuntimePort` is the boundary. The loop does not care which provider is behind it. A library like Vercel AI SDK couples you to its provider abstraction.

### 5.2 What to Borrow

| From | What | How |
|---|---|---|
| DeepSeek Harness | Turn/step model, bounded parallel pool, waterfall hooks | Direct pattern adoption |
| OpenCode | LLMEvent tagged union, compaction service, provider protocol mappers | Design reference for stream chunks and provider adapters |
| Vercel AI SDK | `tool()` helper shape, `isStepCount` pattern | API ergonomics for tool definition |
| Anthropic SDK | Manual loop pattern, `toolRunner` helper | Validation that the manual loop is the standard pattern |

### 5.3 What to Avoid

| Anti-pattern | Why |
|---|---|
| Using Vercel AI SDK's `generateText` as the loop | Hides the loop, couples to its provider abstraction, no event sourcing |
| Using LangChain's `createReactAgent` | Brings LangGraph dependency, graph-based loop is overkill, no event sourcing |
| Nested while loops (OpenCode style) | Unnecessary complexity for OpenHarness' usecase-per-message model |
| Library-owned tool execution | Bypasses the staged tool pipeline (ADR 0005) |
| No max step limit | Risk of infinite loops, cost explosion |

### 5.4 Implementation Plan

The agent loop fits into the existing stage plan:

**Stage 3 (Real Model Provider)** — evolve the port:

1. Add `tools: ToolDefinition[]` to `AgentRuntimeRequest`.
2. Add `finishReason` and `usage` to `AgentRuntimeResponse`.
3. Change `toolCalls` from `AgentRuntimeToolCall[]` to the domain `ToolCall[]`.
4. Update `OpenAiAgentRuntimeAdapter` to send tools and parse `finish_reason`.
5. Update `MockAgentRuntimeAdapter` to support tool call responses.

**Stage 3.5 (Agent Loop)** — new stage between 3 and 4:

1. Create `AgentLoopService` in `application/services/`.
2. Move the loop logic from `SendProjectMessageUsecase` into `AgentLoopService`.
3. Add `AgentLoopConfig` (maxSteps, maxParallelTools).
4. Add bounded parallel pool utility.
5. Add termination condition events.
6. Add abort support (AbortSignal).
7. Update `SendProjectMessageUsecase` to call `AgentLoopService.run()`.
8. Add replay tests for multi-step tool call scenarios.
9. Add unit tests for:
   - Single step (no tools) → completed.
   - Multi-step (tool calls) → completed after N steps.
   - Max steps → `max_steps_reached` event.
   - Pre-step reject → `turn_blocked` event.
   - Model error → `turn_error` event.
   - Abort → `turn_aborted` event.
   - Parallel tool execution → results in model order.
   - Tool error → synthetic error result, loop continues.

**Stage 4+** — the loop is stable; add:

- Streaming (Option B).
- Compaction service.
- Budget enforcement (token/cost limits per turn).
- Context window tracking.

### 5.5 File Layout

```
harness/src/
  application/
    services/
      AgentLoopService.ts          # NEW: the loop
      AgentLoopService.unit.test.ts
      SessionContextService.ts     # evolves: tool results in context
      ToolExecutionService.ts      # existing: staged pipeline
      HookRegistryService.ts       # existing: waterfall hooks
    ports/
      adapters/
        AgentRuntimePort.ts        # evolves: tools, finishReason, usage
        ToolRegistryPort.ts        # existing
        ToolExecutorPort.ts        # existing
        PolicyPort.ts              # existing
        SandboxPort.ts             # existing
        ApprovalPort.ts            # existing
        EventLogPort.ts            # existing
    usecases/
      SendProjectMessageUsecase/
        index.ts                   # evolves: calls AgentLoopService
  infrastructure/
    driven/
      OpenAiAgentRuntimeAdapter.ts # evolves: tools, finish_reason
      MockAgentRuntimeAdapter.ts   # evolves: tool call responses
      ReplayAgentRuntimeAdapter.ts # evolves: multi-step replay
  domain/
    ToolCall.ts                    # existing
    ToolResult.ts                  # existing
    ToolDefinition.ts              # existing
    FinishReason.ts                # NEW
    TokenUsage.ts                  # NEW
    AgentLoopConfig.ts             # NEW
```

## Sources

- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
  - `packages/core/agent-loop/src/agent.ts` — ReactLoopAgent
  - `packages/core/agent-loop/src/tool-calls.ts` — bounded parallel pool
  - `packages/llm/llm/src/types.ts` — LLM port
  - `packages/llm/llm-deepseek/src/adapter.ts` — provider adapter
- OpenCode: https://github.com/anomalyco/opencode
  - `packages/core/src/session/runner/llm.ts` — session runner
  - `packages/llm/src/llm.ts` — LLM port
  - `packages/llm/src/schema/events.ts` — LLMEvent union
  - `packages/llm/src/tool.ts` — Tool.make
  - `packages/core/src/session/compaction.ts` — compaction
- Vercel AI SDK: https://sdk.vercel.ai/docs/ai-sdk-core/generating-text
- Anthropic SDK: https://docs.anthropic.com/en/api/client-libraries
- LangChain.js: https://js.langchain.com/docs/concepts/agents
- OpenAI SDK: https://platform.openai.com/docs/guides/function-calling
