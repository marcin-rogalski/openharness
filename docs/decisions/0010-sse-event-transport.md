# ADR 0010: SSE for Event Transport

Status: accepted  
Date: 2026-08-17

## Context

The harness needs to push session events to the UI in real time. The two standard options are Server-Sent Events (SSE) and WebSocket.

The deployment target is a single-process harness behind an nginx reverse proxy on a VPS (ADR 0002). The UI is a single-page React app that needs to receive events for the active session.

## Decision

OpenHarness uses **Server-Sent Events (SSE)** for the event stream.

- The `EventStreamEndpoint` driving adapter emits `text/event-stream` responses.
- Events are pushed as they are appended to the session event log.
- The client uses the native `EventSource` API (no WebSocket library needed).
- Reconnection is handled by the browser's built-in `EventSource` retry with a `Last-Event-ID` header for resumption.

## Rationale

- SSE works over plain HTTP; no `Upgrade`/`Connection` header forwarding in nginx.
- No sticky sessions required; any proxy config that handles long-lived HTTP connections works.
- The event flow is unidirectional (server → client), which matches SSE's design.
- Client → server communication uses regular POST requests (send message, approve/deny tool call).
- Simpler nginx config: `proxy_buffering off` and a long `proxy_read_timeout` are sufficient.
- Fits the single-process, single-user model: one active session per client, no need for full-duplex.

## Consequences

- The `EventStreamEndpoint` uses `Content-Type: text/event-stream` and `Cache-Control: no-cache`.
- Each event is emitted as `id: <event-id>\ndata: <json>\n\n`.
- The UI `SessionService` opens an `EventSource` connection when a session is active and closes it when the session ends or the user navigates away.
- WebSocket is not excluded for future use cases (e.g. collaborative editing), but is not needed for v1.
