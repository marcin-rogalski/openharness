# Changelog

All notable changes to OpenHarness are documented in this file.

## [Unreleased]

### Added

- Canonical architecture overview in `docs/architecture.md`.
- ADR 0001: plugin capability model.
- ADR 0002: single harness server process.
- ADR 0003: plugin-ready, not plugin-first.
- ADR 0004: model-visible session event log.
- ADR 0005: staged tool execution pipeline.
- ADR 0006: fail-closed sandbox ladder.
- ADR 0007: keyless session replay testing.
- Plugin-Ready Runtime Plan in `docs/plans/plugin-ready-runtime.md`.
- DeepSeek Harness research notes in `docs/research/deepseek-harness.md`.
- Validated Archify runtime diagram source and HTML artifact under `docs/diagrams/`.

### Changed

- Concept document now points to the architecture overview and ADRs.
- Shipping strategy notes that the two-service Compose layout is transitional and the v1 target is a single harness server process.
- Architecture overview now links the plugin-ready runtime plan and DeepSeek Harness research.
