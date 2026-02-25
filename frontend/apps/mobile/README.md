# apps/mobile

This directory is the React Native / Expo application entrypoint.

## Implemented in Phase B/C

- Storage adapters:
  - AsyncStorage adapter: `src/storage/mobileAsyncStorageAdapter.ts`
  - SQLite adapter: `src/storage/mobileSqliteStorageAdapter.ts`
- Runnable Expo scaffold:
  - `App.tsx`
  - `app.json`

The mobile app currently connects shared modules from:
- `packages/core` (Storage Port)
- `packages/ui` (RN-compatible UI primitives)

## Commands

- `npm run start --workspace @leximemory/apps-mobile`
- `npm run android --workspace @leximemory/apps-mobile`
- `npm run ios --workspace @leximemory/apps-mobile`
- `npm run web --workspace @leximemory/apps-mobile`
