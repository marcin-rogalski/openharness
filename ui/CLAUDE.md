# UI Rules

See root [CLAUDE.md](../CLAUDE.md) for project-wide rules.

- UI is React + Vite + SCSS.
- Import SCSS modules as `import * as styles from './Component.module.scss'`.
- Global UI state lives in a React context under `src/service`.
- Global state must be wrapped and validated with Zod.
- UI vertical slices start with mocked data before wiring to the harness API.
- Do not call the harness backend directly from components; use the UI service.
