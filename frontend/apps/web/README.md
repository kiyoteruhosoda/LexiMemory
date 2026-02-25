# apps/web (scaffold)

This directory is the future home of the Web application runtime.

Current strategy keeps compatibility by running the existing `frontend/` app as the source of truth.
`apps/web` is intentionally added as a migration seam so that route/UI modules can be moved incrementally.

## Planned migration flow

1. Move entry points (`main.tsx`, `App.tsx`) into `apps/web`.
2. Keep feature modules in `src/*` during transition.
3. Gradually replace imports to `packages/core` and `packages/ui`.
4. Use this directory as the final Vite app root.
