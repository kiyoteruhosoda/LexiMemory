# apps/web

This directory is now the Web runtime entrypoint for gradual monorepo migration.

## Implemented in Phase C

- Dedicated app entry files:
  - `apps/web/index.html`
  - `apps/web/src/main.tsx`
  - `apps/web/src/App.tsx`
- Dedicated Vite config: `apps/web/vite.config.ts`
- Dedicated typecheck config: `apps/web/tsconfig.json`

The feature modules still live in `frontend/src` and are imported from this entrypoint.
This preserves existing behavior while allowing progressive migration.
