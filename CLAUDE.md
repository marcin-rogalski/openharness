# OpenHarness Rules

## Project Rules

### Symlink AGENTS.md to CLAUDE.md

Always symlink `AGENTS.md` files to `CLAUDE.md` files in the same location:
```
ln -s CLAUDE.md AGENTS.md
```

## Coding Rules

### Architecture

- **Strict split between UI and backend.** UI is served via web browser; backend exposes only API and MCP server — no UI.
- **Backend follows hexagonal architecture** (ports & adapters). Domain depends on nothing; application depends only on domain; infrastructure/adapters depend on application ports. See `/hexagonal-architecture` skill for the canonical layout.

### Git-ops & Declarative Design

- **Declarative-driven, git-ops-style project.** Every decision is recorded, every config is documented and stored as config files.
- **API and MCP are spec-driven.** Endpoints and MCP tools are generated from contract/spec config files — the spec is the source of truth, code implements it.

### Test-Driven Development

- **Scaffold first, then implement.** Every new feature starts with a scaffold: business logic signatures and adapter stubs only — no real implementation yet.
- **Tests before code.** Write tests against the scaffold first, then implement to make them pass. Full implementation is test-driven.
- **Minimum 90% test coverage.** All code must maintain at least 90% coverage.

### Documentation

- Always update docs when a change is described in them.

### Step Completion

Every meaningful step is a verifiable unit and must end with:

1. Docs updated for anything the docs describe.
2. TypeScript checks passed (`tsc --noEmit` or the package `typecheck` script).
3. Lint checks passed.
4. Test coverage checked and the minimum 90% threshold maintained.
5. Tests run and returning the expected results for that step. Scaffold steps may record expected failures against mocked/throwing adapters before the implementation step makes them pass.
6. A git commit with a brief description of what changed.

### Vertical Slice Rule

- Implement one thin vertical slice at a time.
- Start each slice from the UI service with mocked data.
- Then implement the corresponding business code in `harness/` using throwing adapters.
- Use TDD for adapter implementations: write tests against the ports first, then replace the throwing adapters with real adapters.

