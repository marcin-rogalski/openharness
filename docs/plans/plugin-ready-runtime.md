# Plugin-Ready Runtime Plan

Status: active  
Date: 2026-08-17

This plan describes how OpenHarness will adopt the useful parts of DeepSeek Harness without becoming a plugin-bloat framework.

Related documents:

- [DeepSeek Harness research](../research/deepseek-harness.md)
- [ADR 0001: Plugin Capability Model](../decisions/0001-plugin-capability-model.md)
- [ADR 0003: Plugin-Ready, Not Plugin-First](../decisions/0003-plugin-ready-not-plugin-first.md)
- [ADR 0004: Model-Visible Session Event Log](../decisions/0004-model-visible-session-event-log.md)
- [ADR 0005: Staged Tool Execution Pipeline](../decisions/0005-staged-tool-execution-pipeline.md)
- [ADR 0006: Fail-Closed Sandbox Ladder](../decisions/0006-fail-closed-sandbox-ladder.md)
- [ADR 0007: Keyless Session Replay Testing](../decisions/0007-keyless-session-replay-testing.md)
- [ADR 0008: Trust Boundary and Edge-Terminated Auth](../decisions/0008-trust-boundary-edge-terminated-auth.md)
- [ADR 0009: SQLite-First Storage](../decisions/0009-sqlite-first-storage.md)
- [ADR 0010: SSE for Event Transport](../decisions/0010-sse-event-transport.md)

## Goal

Ship a small, local-first harness that we can use immediately, while keeping the runtime viable for future plugins and hooks.

The system should be:

- small enough to build and debug;
- strong enough to audit agent behavior;
- extensible without rewriting the core;
- safe by default;
- testable without live model API keys.

## Guiding Principles

1. **Ship for us first.** Build the capabilities we need, not a generic framework.
2. **Plugin-ready, not plugin-first.** No external plugin loader in v1.
3. **Hooks before plugins.** Typed internal hooks come first; external plugins later.
4. **Events are truth.** Model-visible history is reconstructed from the session event log.
5. **Tools are pipelines.** Tools are not plain functions; they pass through policy, sandbox, approval, execution, normalization, and logging.
6. **Fail closed.** Missing sandbox or policy support is an error, not a silent fallback.
7. **Test without keys.** Replay tests use recorded session logs and deterministic mock models.

## Non-Goals for v1

- No full Cordis-style microkernel.
- No external plugin loader.
- No UI as a backend plugin.
- No agent loop as a user-replaceable plugin.
- No runtime self-modification of the plugin tree.
- No full event-sourced state reconstruction.
- No Temporal-like durable workflow engine.

## Current Baseline

Stages 1 and 2 are complete:

- UI lists projects and sends a project message.
- Harness exposes health, project listing, config read/update, send-message, approve-tool-call, and deny-tool-call endpoints.
- `SendProjectMessageUsecase` resolves or creates a session, appends user/model events to the event log, and calls `MockAgentRuntimeAdapter`.
- `ToolExecutionService` runs the staged pipeline: resolve tool → policy → approval → execute → freeze result.
- `LocalToolProviderAdapter` exposes one mock tool; `AllowAllPolicyAdapter` and `ManualApprovalAdapter` are in place.
- There is no real model provider, durable storage, sandbox, hooks, replay testing, or MCP gateway yet.

This baseline is intentionally small. The plan evolves it into the target runtime.

## Target Shape

### Domain

The domain will contain plain business types:

- `Project`
- `Session`
- `SessionEvent`
- `Turn`
- `Step`
- `ToolCall`
- `ToolResult`
- `ToolDefinition`
- `SandboxPolicy`
- `Agent`
- `Rule`
- `Budget`
- `Permission`

Domain types depend on nothing outside the domain.

### Application

The application layer owns:

- usecase ports;
- driven adapter ports;
- usecases;
- reusable services.

Expected services:

- `SessionContextService` — derives model-visible context from session events.
- `ToolExecutionService` — runs the staged tool pipeline.
- `EventProjectionService` — projects events into UI/session summaries.
- `HookRegistryService` — invokes typed internal hooks at stable boundaries.

Expected usecases:

- `StartSessionUsecase`
- `SendSessionMessageUsecase`
- `GetSessionUsecase`
- `ListSessionsUsecase`
- `ApproveToolCallUsecase`
- `DenyToolCallUsecase`
- `GetSessionEventsUsecase`
- `UpdateConfigUsecase`

### Infrastructure

Infrastructure will contain adapters:

Driven adapters:

- `InMemoryProjectRepositoryAdapter`
- `InMemorySessionRepositoryAdapter`
- `InMemoryEventLogAdapter`
- `MockAgentRuntimeAdapter`
- `OpenAiAgentRuntimeAdapter`
- `ReplayAgentRuntimeAdapter`
- `LocalToolProviderAdapter`
- `McpToolGatewayAdapter`
- `LogicalPathSandboxAdapter`
- `ProcessSandboxAdapter`
- `JsonConfigRepositoryAdapter`

Driving adapters:

- `HealthEndpoint`
- `ListProjectsEndpoint`
- `StartSessionEndpoint`
- `SendSessionMessageEndpoint`
- `GetSessionEndpoint`
- `GetSessionEventsEndpoint`
- `ApproveToolCallEndpoint`
- `DenyToolCallEndpoint`
- `EventStreamEndpoint`
- `GetConfigEndpoint`
- `UpdateConfigEndpoint`

Boundary DTOs:

- `SessionEventDto`
- `SessionSummaryDto`
- `ToolCallDto`
- `ToolResultDto`
- `SandboxPolicyDto`

### Contracts

`libs/contracts` will own shared API and event schemas:

- `sessions.ts`
- `events.ts`
- `tools.ts`
- `sandbox.ts`
- `agents.ts`
- `rules.ts`

The contracts package is the source of truth for API and event shapes.

## Stage Plan

Each stage ends with docs updated, typecheck passed, lint passed, coverage at least 90%, tests passing, and a git commit.

## Stage 0: Land the Design

Status: in progress.

Tasks:

1. Record DeepSeek Harness research.
2. Create ADRs for plugin readiness, session events, tool pipeline, sandbox, and replay testing.
3. Create this implementation plan.
4. Update architecture documentation.

Acceptance:

- The design is committed.
- The plan is reviewable.
- No runtime behavior has changed yet.

## Stage 1: Session and Event Core

Goal: replace direct timeline entries with a durable session/event model.

Tasks:

1. Add domain types:
   - `Session`
   - `SessionEvent`
   - `Turn`
   - `Step`
2. Add contract schemas:
   - `SessionSchema`
   - `SessionEventSchema`
   - `SessionSummarySchema`
3. Add driven ports:
   - `SessionRepositoryPort`
   - `EventLogPort`
4. Add in-memory adapters:
   - `InMemorySessionRepositoryAdapter`
   - `InMemoryEventLogAdapter`
5. Add `SessionContextService`:
   - derives model-visible messages from events;
   - separates user, model, tool, context, and system entries.
6. Add `EventProjectionService`:
   - projects events into UI timeline entries.
7. Evolve `SendProjectMessageUsecase`:
   - resolve or create a session;
   - append user message event;
   - call agent runtime with derived context;
   - append model/tool events;
   - return session summary or event cursor.
8. Update UI:
   - consume session events or projected timeline;
   - stop depending on the old one-shot `entries` response as the source of truth.

Acceptance:

- A user message is stored as a session event.
- Model output and tool activity are stored as session events.
- The UI timeline can be reconstructed from events.
- No model-visible content exists only in memory.
- Old mock behavior still works through the new event pipeline.

## Stage 2: Tool Registry and Staged Execution

Goal: make tools first-class capabilities with policy, sandbox, approval, and logging.

Tasks:

1. Add domain types:
   - `ToolDefinition`
   - `ToolCall`
   - `ToolResult`
2. Add driven ports:
   - `ToolRegistryPort`
   - `ToolExecutorPort`
   - `PolicyPort`
   - `ApprovalPort`
3. Add `ToolExecutionService`:
   - resolve tool;
   - validate input;
   - apply policy;
   - resolve sandbox;
   - request approval if needed;
   - execute tool;
   - normalize result;
   - append events;
   - return frozen result.
4. Add `LocalToolProviderAdapter`:
   - exposes built-in tools;
   - starts with one mock or read-only tool.
5. Add `AllowAllPolicyAdapter` for local development.
6. Add `ManualApprovalAdapter` for approval flows.
7. Add usecases:
   - `ApproveToolCallUsecase`
   - `DenyToolCallUsecase`
8. Add endpoints:
   - `ApproveToolCallEndpoint`
   - `DenyToolCallEndpoint`
9. Add tests for:
   - successful tool execution;
   - policy denial;
   - approval required;
   - approval granted;
   - approval denied;
   - monotonic denial;
   - frozen result behavior.

Acceptance:

- A model tool call cannot execute directly.
- Every tool call passes through the staged pipeline.
- Tool calls and results are session events.
- A denied tool call cannot be re-allowed by a later hook.
- The agent runtime receives a frozen tool result.

## Stage 3: Real Model Provider

Goal: wire one real model provider end-to-end to validate event/context shapes before building more pipeline stages on top of the mock.

Tasks:

1. Add `openai` config to `HarnessConfig`:
   - `openaiApiKey` (read from environment variable `OPENAI_API_KEY`, not stored in config file);
   - `openaiModel` (default `gpt-4o-mini`);
   - `openaiBaseUrl` (optional override for compatibility endpoints).
2. Add `OpenAiAgentRuntimeAdapter`:
   - implements `AgentRuntimePort`;
   - uses `fetch` to call the OpenAI Chat Completions API;
   - maps `ModelContextMessage[]` to OpenAI messages;
   - parses the response into `AgentRuntimeResponse` (thinking, toolCalls, response);
   - handles API errors as domain errors.
3. Wire the adapter in `composedDriven.ts`:
   - use `OpenAiAgentRuntimeAdapter` when `OPENAI_API_KEY` is set;
   - fall back to `MockAgentRuntimeAdapter` otherwise.
4. Add integration tests:
   - mock the `fetch` call;
   - verify request shape (model, messages, tools);
   - verify response parsing (content, tool_calls, reasoning);
   - verify error handling (API error, timeout, invalid response).
5. Validate end-to-end:
   - send a message through the UI;
   - confirm the real model response is stored as a session event;
   - confirm the UI timeline reflects the real response.

Acceptance:

- A user message produces a real model response stored as a session event.
- The event/context shapes work against the real OpenAI API.
- The mock adapter remains available for development and testing without an API key.
- No API key is stored in the config file; it is read from the environment.

## Stage 4: Fail-Closed Sandbox Ladder

Goal: make project access safe and explicit.

Tasks:

1. Add domain types:
   - `SandboxLevel`
   - `SandboxPolicy`
   - `SandboxDecision`
   - `SandboxUnavailableError`
2. Add `SandboxPort`.
3. Add `LogicalPathSandboxAdapter`:
   - enforces path-based read/write boundaries;
   - supports `read-only` and `workspace-write`;
   - reports availability for logical sandboxing.
4. Add sandbox resolution to `ToolExecutionService`.
5. Add sandbox events:
   - sandbox mode resolved;
   - sandbox denial;
   - sandbox unavailable.
6. Add tests for:
   - read-only denies writes;
   - workspace-write allows workspace writes;
   - workspace-write denies outside paths;
   - missing required backend fails closed;
   - full-access requires explicit configuration.
7. Later, add `ProcessSandboxAdapter` for command execution when needed.

Acceptance:

- File and command tools share one sandbox policy.
- Missing sandbox capability produces a visible error.
- The system never silently falls back to unrestricted execution.
- Sandbox decisions are auditable through session events.

## Stage 5: Internal Hooks

Goal: add extension points without an external plugin loader.

Tasks:

1. Define hook contracts:
   - `SessionHook`
   - `TurnHook`
   - `StepHook`
   - `ToolHook`
   - `PolicyHook`
   - `SandboxHook`
   - `EventHook`
2. Add `HookRegistryService`:
   - registers typed hooks;
   - invokes hooks in stable order;
   - returns annotations or decisions.
3. Add built-in hooks:
   - audit hook that records hook decisions;
   - budget guard hook;
   - secret redaction hook.
4. Add tests proving:
   - hooks can observe events;
   - hooks can annotate results;
   - hooks can deny actions where allowed;
   - hooks cannot directly mutate session state;
   - hooks cannot bypass monotonic denial.
5. Document hook contracts and versioning rules.

Acceptance:

- The runtime has useful extension points.
- No external plugin loader exists.
- Hooks are typed, testable, and versioned.
- A future plugin can implement the same hook contracts.

## Stage 6: Keyless Replay Testing ✅

Goal: make agent/runtime behavior testable without API keys.

Tasks:

1. ✅ Add a test-support area: `harness/src/test-support/`
2. ✅ Add fixture loader: `FixtureLoader.ts` + `FixtureSchema.ts` (Zod validation)
3. ✅ Add normalizer: `Normalizer.ts` (UUID/timestamp/sessionId/projectId normalization, secret redaction)
4. ✅ Add `ReplayAgentRuntimeAdapter`: deterministic model output, fails on underrun
5. ✅ Add replay test runner: `ReplayRunner.ts` (wires real usecase, diffs events)
6. ✅ Add record/refresh tooling: `RecordFixture.ts` (extract turns, build/write/refresh)
7. ✅ Add replay tests: simple-message, tool-call, multi-turn fixtures + integration tests

Acceptance:

- ✅ CI runs replay tests without API keys.
- ✅ A behavior change produces a readable session log diff (`diffEvents`).
- ✅ Committed fixtures contain no secrets (redaction in `RecordFixture`).
- ✅ Replay tests cover the core message and tool-call paths.

## Stage 7: Plugin Readiness

Goal: make external plugins viable without enabling them by default.

Tasks:

1. Add capability metadata:
   - capability id;
   - version;
   - provider name;
   - required permissions;
   - exposed tools;
   - hook subscriptions.
2. Generate a capability catalog from registered adapters.
3. Add `PluginManifestSchema` to contracts.
4. Add `PluginLoaderPort`.
5. Add a disabled local plugin loader stub:
   - reads a manifest;
   - validates it;
   - does not execute untrusted code by default.
6. Add tests with a fake plugin:
   - manifest validates;
   - adapter registers through the composition root;
   - hook subscribes through `HookRegistryService`;
   - loader can be disabled.
7. Keep external plugin loading off by default.

Acceptance:

- A fake plugin can provide a tool adapter and hook without changing domain or application logic.
- The plugin loader is optional and disabled by default.
- The capability catalog lists built-in and loaded capabilities.
- No Cordis-style microkernel is introduced.

## Stage 8: Agent Presets, Rules, Budgets, and Permissions

Goal: make agents, rules, budgets, and permissions declarative product surfaces.

Tasks:

1. Add `Agent` domain type:
   - role;
   - description;
   - tools;
   - MCP access;
   - memory access;
   - sandbox policy;
   - budget;
   - model preferences.
2. Add `Rule` domain type:
   - when;
   - if;
   - then;
   - guard.
3. Add `Budget` domain type:
   - token limit per turn/session;
   - cost limit per turn/session;
   - enforcement point (pre-request or post-response).
4. Add `Permission` domain type:
   - resource (tool, sandbox level, MCP server);
   - action (allow, deny, require_approval);
   - scope (project, agent, session).
5. Add `BudgetPort` and `PermissionPort` driven ports.
6. Add `BudgetGuardHook` and `PermissionPolicyHook` built-in hooks (from Stage 5).
7. Add configuration schemas for agents, rules, budgets, and permissions.
8. Add usecases to list/create/update agents, rules, budgets, and permissions.
9. Add UI configuration surfaces.
10. Add replay tests for preset-selected tools, rule-triggered actions, budget enforcement, and permission checks.

Acceptance:

- An agent is reusable configuration, not a separate runtime implementation.
- A preset can select tools, sandbox policy, memory access, budget, and model preferences.
- Rules can trigger or guard actions through the same policy pipeline.
- Budgets enforce token and cost limits through the hook pipeline.
- Permissions control tool/sandbox/MCP access through the policy pipeline.
- Budgets and permissions are per-project or per-agent, not per-user (ADR 0008).

## Project Reshape

The implementation should move the harness toward this shape:

```text
harness/src/
  domain/
    Project.ts
    Session.ts
    SessionEvent.ts
    Turn.ts
    Step.ts
    ToolCall.ts
    ToolResult.ts
    ToolDefinition.ts
    SandboxPolicy.ts
    Agent.ts
    Rule.ts
    Budget.ts
    Permission.ts

  application/
    ports/
      usecases/
        StartSessionUseCasePort.ts
        SendSessionMessageUseCasePort.ts
        GetSessionUseCasePort.ts
        ApproveToolCallUseCasePort.ts
        DenyToolCallUseCasePort.ts
        GetSessionEventsUseCasePort.ts
      adapters/
        ProjectRepositoryPort.ts
        SessionRepositoryPort.ts
        EventLogPort.ts
        AgentRuntimePort.ts
        ToolRegistryPort.ts
        ToolExecutorPort.ts
        PolicyPort.ts
        SandboxPort.ts
        ApprovalPort.ts
        MemoryStorePort.ts
        EventTransportPort.ts
        BudgetPort.ts
        PermissionPort.ts
    services/
      SessionContextService.ts
      ToolExecutionService.ts
      EventProjectionService.ts
      HookRegistryService.ts
    usecases/
      StartSessionUsecase.ts
      SendSessionMessageUsecase.ts
      GetSessionUsecase.ts
      ApproveToolCallUsecase.ts
      DenyToolCallUsecase.ts
      GetSessionEventsUsecase.ts

  infrastructure/
    driving/
      HealthEndpoint.ts
      ListProjectsEndpoint.ts
      StartSessionEndpoint.ts
      SendSessionMessageEndpoint.ts
      GetSessionEndpoint.ts
      GetSessionEventsEndpoint.ts
      ApproveToolCallEndpoint.ts
      DenyToolCallEndpoint.ts
      EventStreamEndpoint.ts
      GetConfigEndpoint.ts
      UpdateConfigEndpoint.ts
    driven/
      InMemoryProjectRepositoryAdapter.ts
      InMemorySessionRepositoryAdapter.ts
      InMemoryEventLogAdapter.ts
      MockAgentRuntimeAdapter.ts
      OpenAiAgentRuntimeAdapter.ts
      ReplayAgentRuntimeAdapter.ts
      LocalToolProviderAdapter.ts
      McpToolGatewayAdapter.ts
      LogicalPathSandboxAdapter.ts
      ProcessSandboxAdapter.ts
      JsonConfigRepositoryAdapter.ts
    dtos/
      SessionEventDto.ts
      SessionSummaryDto.ts
      ToolCallDto.ts
      ToolResultDto.ts
      SandboxPolicyDto.ts

  composedDriven.ts
  composedUsecases.ts
  composedDriving.ts
  index.ts
```

The UI should move toward:

```text
ui/src/
  service/
    api/
      HarnessApiClient.ts
    session/
      SessionService.ts
      SessionReducer.ts
    config/
      UiConfig.ts
  components/
    SessionView.tsx
    Timeline.tsx
    ToolCallCard.tsx
    ApprovalPrompt.tsx
    SettingsDialog.tsx
```

The contracts package should move toward:

```text
libs/contracts/src/
  projects.ts
  sessions.ts
  events.ts
  tools.ts
  sandbox.ts
  agents.ts
  rules.ts
  config.ts
  health.ts
```

## Execution Order

The recommended order is:

1. Stage 1: Session and Event Core. ✅
2. Stage 2: Tool Registry and Staged Execution. ✅
3. Stage 3: Real Model Provider.
4. Stage 4: Fail-Closed Sandbox Ladder.
5. Stage 5: Internal Hooks.
6. Stage 6: Keyless Replay Testing.
7. Stage 7: Plugin Readiness.
8. Stage 8: Agent Presets, Rules, Budgets, and Permissions.

Stages 5 and 6 can overlap once the tool pipeline and event log are stable.
Stage 3 must complete before Stage 4: the sandbox is built around tool calls, and the tool call shapes need to be validated against a real model first.

## Definition of Done for Each Stage

A stage is complete when:

- docs and ADRs are updated;
- TypeScript checks pass;
- lint passes;
- test coverage remains at least 90%;
- unit and integration tests pass;
- replay tests pass where applicable;
- the change is committed with a clear message.

## Risk Notes

- Event schema changes early are cheaper than later.
- The UI must not become coupled to mock-only timeline shapes.
- Hooks must stay typed and limited, or they become a plugin framework by accident.
- Sandbox logic should start logical and local, then add process/container backends.
- Replay fixtures must normalize volatile data or tests will become flaky.
