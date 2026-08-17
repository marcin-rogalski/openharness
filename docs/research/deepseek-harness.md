# DeepSeek Harness Research

Status: research notes  
Date: 2026-08-17

This document records what DeepSeek Harness is, how it compares with OpenHarness, and which patterns are worth adopting.

Related documents:

- [Architecture](../architecture.md)
- [ADR 0001: Plugin Capability Model](../decisions/0001-plugin-capability-model.md)
- [ADR 0003: Plugin-Ready, Not Plugin-First](../decisions/0003-plugin-ready-not-plugin-first.md)
- [Plugin-Ready Runtime Plan](../plans/plugin-ready-runtime.md)

## What DeepSeek Harness Is

DeepSeek Harness (`dsh`) is an open-source agent harness from DeepSeek AI. It is MIT licensed and currently a developer preview with expected breaking changes.

Its central design claim is **everything is a plugin**. The runtime is built on Cordis, a plugin/event-bus framework described by the “spatiotemporal composability” paper. In practice, a running harness is a Cordis context where plugins register services, typed events, and reversible effects. Configuration composes plugins into a working agent.

Reported scale:

- about 219 workspace packages;
- a large TypeScript monorepo, with analyses reporting anywhere from roughly 94k source lines to roughly 453k runtime lines depending on measurement;
- Web UI, CLI/headless, ACP/JSON-RPC, and Python SDK surfaces;
- a vendored Cordis fork with local patches.

Key capability areas include model adapters, filesystem, shell/subprocess/terminal, LSP, web access, skills, subagents, workflows, session persistence, sandboxing, and UI.

## Core Design Ideas

### Cordis as plugin kernel

Cordis acts as a dependency-injection container, event bus, lifecycle manager, and configuration layer at the same time.

A plugin can register:

- services used by other plugins;
- typed events;
- reversible effects that are cleaned up when the plugin unloads.

This makes the runtime highly composable, but also much heavier than a normal application kernel.

### Capability seams

A capability is split into three roles:

1. **Service definition** — the interface.
2. **Service provider** — the implementation.
3. **Consumer** — usually a model-facing tool or runtime component that uses the capability.

For example, a shell capability has an interface for “execute a command”, a local implementation that spawns processes, and a model-facing tool that exposes the capability to the model. Swapping the implementation should not require rewriting the model tool or agent loop.

### Session log as source of truth

DeepSeek Harness treats the session log as the authoritative record of what the model saw.

The invariant is:

> Anything the model can see must be reconstructable from the append-only session log.

User messages, runtime context, model requests, streaming output, tool calls, tool results, compaction events, permission changes, and cancellation reasons are all represented as session events. UI, persistence, resume, fork, telemetry, and replay derive from that log.

### Tool execution pipeline

Tool execution is not a simple “call function, return result” step. Reported pipelines include stages such as:

- pre-policy hooks;
- monotonic safety guards;
- approval prompts;
- execution wrappers for timeout, retry, and metrics;
- filesystem write-intent gates;
- tool-owned session events;
- post-execution hooks;
- normalization;
- a frozen authoritative result.

The goal is to inject policy at every stage without coupling tools to specific policy services.

### Fail-closed sandbox ladder

Sandboxing is treated as infrastructure, not a confirmation dialog.

Reported properties:

- sandbox levels such as `read-only`, `workspace-write`, and explicit full access;
- OS-level backends such as Landlock, bubblewrap, and Seatbelt;
- shared policy across filesystem, Bash, and subprocess execution;
- environment scrubbing for secrets;
- private temp directories;
- symlink safety;
- refusal to run unconfined when a confined mode is requested but no sandbox backend is available.

The important failure mode is fail-closed: if the system cannot confirm isolation, it refuses to run rather than silently degrading.

### Turn and step lifecycle

The agent loop is structured as:

- a **turn** starts from user input or queued work;
- a turn contains zero or more **steps**;
- a step maps to one model request and the tool execution triggered by that request.

The system distinguishes queued messages, injected context, and steering, and tracks whether a given instruction actually reached a specific model request.

### Presets as composition

The Web UI ships presets such as Standard, PTC, Minimal, and Creative. These are not separate agents in the product sense; they are the same harness host loading different tools, prompts, and runtime capabilities.

The Minimal preset is especially useful: it shows that a smaller tool set can be a deliberate product choice because a large tool set is itself a context burden.

## Comparison with OpenHarness

| Area | DeepSeek Harness | OpenHarness |
|---|---|---|
| Plugin model | Full Cordis plugin kernel; almost everything is a plugin. | Plugin capability model: swappable adapters behind stable ports. |
| Agent loop | Agent loop is a plugin. | Session/orchestrator runtime owns the loop in v1. |
| UI | Web UI is a plugin surface. | UI is a separate React client; harness serves built assets. |
| Session log | Authoritative source for model history, replay, fork, and persistence. | Event log for durability, streaming, audit, and UI synchronization. |
| Tools | Multi-stage pipeline with policy, guards, approval, normalization, and frozen results. | Tool registry and execution pipeline are target architecture. |
| Sandbox | Fail-closed ladder with OS-level backends and shared policy. | Sandbox adapter and policy are target architecture. |
| Configuration | Plugin/profile/bundle/patch composition. | Declarative control plane for projects, agents, rules, tools, MCP, memory, sandbox, and budgets. |
| MCP | Consumes MCP servers; client-only in the reported analysis. | Exposes API and MCP surfaces; MCP is also a managed tool source. |
| Scale | Very large monorepo with many capability packages. | Smaller local-first system with a strict UI/backend split. |

OpenHarness is not trying to copy DeepSeek Harness’ full plugin kernel. It is taking the useful capability-seam idea while keeping a lighter, hexagonal, local-first runtime.

## Patterns Worth Adopting

### 1. Model-visible equals logged

Adopt this as an OpenHarness invariant.

Any input or output that the model can see should be reconstructable from the event/session log:

- user messages;
- injected context;
- system/runtime context;
- model requests;
- model output;
- tool calls;
- tool results;
- permission changes;
- sandbox changes;
- cancellation or steering events.

This makes replay, debugging, UI synchronization, and audit much stronger.

OpenHarness mapping:

- event plane owns the log;
- session runtime derives model context from logged events;
- UI derives timeline state from the same event stream;
- future replay tests can compare persisted logs against expected logs.

### 2. Capability seam pattern

Keep the three-role split:

- port/interface;
- adapter/provider;
- consumer/tool.

This matches OpenHarness’ hexagonal architecture and ADR 0001.

OpenHarness mapping:

- `application/ports` defines the capability contract;
- `adapters/driven` implements the capability;
- tool registry or usecase consumes the capability;
- model-facing tool schemas remain separate from provider implementation.

### 3. Tool execution pipeline

Adopt a staged tool pipeline instead of treating tools as plain functions.

A practical v1 pipeline could be:

1. resolve tool definition;
2. validate input;
3. apply policy and permissions;
4. apply sandbox constraints;
5. request approval if required;
6. execute tool;
7. normalize result;
8. record session event;
9. return frozen result to agent runtime.

Later stages can add:

- monotonic deny guards;
- concurrency safety metadata;
- post-execution hooks;
- result redaction;
- budget accounting.

### 4. Fail-closed sandbox ladder

Adopt explicit sandbox levels and fail-closed behavior.

Suggested levels:

- `read-only`;
- `workspace-write`;
- `command-allowlist`;
- `full-access` only as an explicit, dangerous choice.

Rules:

- if a required sandbox backend is unavailable, refuse execution;
- do not silently fall back to unconfined execution;
- share one sandbox policy across file, command, network, and subprocess access;
- record sandbox mode changes as events.

### 5. Keyless transcript replay

Use recorded session logs as test fixtures.

A replay test can:

1. load a recorded session log;
2. derive a deterministic mock model from the recorded assistant output;
3. run the real session/tool/persistence pipeline;
4. diff the newly persisted log against the expected fixture.

This avoids API keys in CI and makes regressions visible as log diffs.

### 6. Turn and step lifecycle

Make the runtime explicit about turns and steps.

Useful distinctions:

- queued user message;
- injected context;
- steering instruction;
- model request;
- tool call;
- tool result;
- final response.

The event log should make it possible to answer: “Which model request actually saw this input?”

### 7. Presets as configuration

Use presets or agent profiles as declarative composition, not as separate runtime implementations.

A preset can select:

- agent configuration;
- tools;
- MCP servers;
- memory access;
- sandbox policy;
- budget;
- model preferences.

This keeps the runtime small while allowing very different product experiences.

## Patterns to Defer or Reject for v1

### Full Cordis-style microkernel

Do not adopt a full plugin kernel where the agent loop, UI, session log, and persistence are all user-replaceable plugins.

It is powerful, but it adds a large framework surface before the core harness is useful.

### UI as backend plugin

Keep the UI separate. OpenHarness’ UI is a client that sends commands and renders events. Making the UI a backend plugin would blur the UI/backend boundary.

### Agent loop as user-replaceable plugin

Keep the agent loop inside the session/orchestrator runtime for v1. Capabilities around the loop can be swappable; the loop itself should remain stable and testable.

### Runtime self-modification of the plugin tree

DeepSeek Harness allows agents to inspect and modify their own plugin tree in some modes. This is interesting, but it is not needed for v1 and increases security and debugging complexity.

### Very large package surface

Do not copy the 200+ package shape. OpenHarness should add packages only when a capability boundary is real.

### Config patch replace semantics

DeepSeek Harness’ config patch behavior reportedly replaces the target plugin’s entire config rather than deep-merging. OpenHarness should choose explicit, documented merge semantics and avoid surprising users by dropping existing fields.

## Implications for OpenHarness

DeepSeek Harness validates several directions already present in OpenHarness:

- capabilities should be swappable adapters;
- tools need a policy-aware execution pipeline;
- sandboxing should be a first-class execution boundary;
- session logs should be durable and model-visible;
- presets/agents should be declarative configuration.

It also suggests the next design tasks:

1. Define the session/event schema with explicit model-visible markers.
2. Define the v1 tool execution pipeline stages.
3. Define sandbox availability errors and fail-closed behavior.
4. Add a replay test harness using recorded session logs.
5. Decide whether agent presets are a first-class configuration entity.

ADR 0001 remains correct: OpenHarness should use a plugin capability model, not a full plugin framework.

The adopted follow-up is the [Plugin-Ready Runtime Plan](../plans/plugin-ready-runtime.md), which ships the needed runtime first and keeps plugins and hooks viable for later.

## Sources

- DeepSeek Harness repository: https://github.com/deepseek-ai/deepseek-harness
- Cordis repository: https://github.com/cordiverse/cordis
- Cordis design paper: https://github.com/cordiverse/paper
- npm package: https://www.npmjs.com/package/@deepseek-ai/dsh
- “DeepSeek Harness Is Open Source: Everything Is a Plugin”: https://dev.to/hunter_g_50e2ec233acd07b5/deepseek-harness-is-open-source-everything-is-a-plugin-579l
- “DeepSeek Harness: Everything Is a Plugin, Even the Agent Loop”: https://duklee.net/blog/2026-08-13-deepseek-harness-plugin-architecture
- “We Read DeepSeek Harness: What 453K Lines of Agent Runtime Actually Say”: https://www.developersdigest.tech/blog/deepseek-harness-dsh-first-look
