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

The current implementation is a first vertical slice:

- UI lists projects and sends a project message.
- Harness exposes health, project listing, config read/update, and send-message endpoints.
- `SendProjectMessageUsecase` calls `MockAgentRuntimeAdapter`.
- The usecase returns `AgentTimelineEntry` objects directly.
- There is no durable session, event log, tool registry, policy engine, sandbox, approval flow, memory service, or MCP gateway yet.

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

## Stage 3: Fail-Closed Sandbox Ladder

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

## Stage 4: Internal Hooks

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

## Stage 5: Keyless Replay Testing

Goal: make agent/runtime behavior testable without API keys.

Tasks:

1. Add a test-support area:
   - `harness/src/test-support` or `libs/replay`, depending on package needs.
2. Add fixture loader:
   - reads committed session event fixtures;
   - validates fixture schema.
3. Add normalizer:
   - replaces volatile ids and timestamps;
   - redacts secrets.
4. Add `ReplayAgentRuntimeAdapter`:
   - derives deterministic model output from fixture;
   - fails if the fixture is underrun.
5. Add replay test runner:
   - runs the real application pipeline;
   - diffs produced events against expected events.
6. Add record/refresh tooling:
   - record a fixture from a controlled run;
   - refresh an expected fixture after intentional changes.
7. Add replay tests for:
   - simple message;
   - tool call success;
   - tool denial;
   - approval flow;
   - sandbox denial;
   - steering mid-turn.

Acceptance:

- CI runs replay tests without API keys.
- A behavior change produces a readable session log diff.
- Committed fixtures contain no secrets.
- Replay tests cover the core tool and policy paths.

## Stage 6: Plugin Readiness

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

## Stage 7: Agent Presets and Rules

Goal: make agents and rules declarative product surfaces.

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
3. Add configuration schemas for agents and rules.
4. Add usecases to list/create/update agents and rules.
5. Add UI configuration surfaces.
6. Add replay tests for preset-selected tools and rule-triggered actions.

Acceptance:

- An agent is reusable configuration, not a separate runtime implementation.
- A preset can select tools, sandbox policy, memory access, and model preferences.
- Rules can trigger or guard actions through the same policy pipeline.

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

1. Stage 1: Session and Event Core.
2. Stage 2: Tool Registry and Staged Execution.
3. Stage 3: Fail-Closed Sandbox Ladder.
4. Stage 4: Internal Hooks.
5. Stage 5: Keyless Replay Testing.
6. Stage 6: Plugin Readiness.
7. Stage 7: Agent Presets and Rules.

Stages 4 and 5 can overlap once the tool pipeline and event log are stable.

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
