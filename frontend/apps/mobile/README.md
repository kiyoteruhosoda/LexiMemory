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

## Runtime env

- `EXPO_PUBLIC_MOBILE_STORAGE_RUNTIME=native-async|native-sqlite`
- `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`
- `EXPO_PUBLIC_ACCESS_TOKEN=<jwt access token>`
- `EXPO_PUBLIC_CLIENT_ID=<optional mobile client id>`

## Phase D implemented use-cases

- Words browse/search/filter
- Words create/update
- Study card review (`again/hard/good/easy`)
- Sync status and manual sync trigger

## Phase E hardening status

- Composition root resolves persistence adapter at runtime (`native-async` / `native-sqlite`).
- Mobile sync gateway supports backend `/api/vocab` contract.
- Conflict handling supports both `fetch-server` and `force-local` strategies.
- If sync env is missing, gateway falls back to local-only sync mode for prototype safety.

Architecture notes:
- Application services are resolved via `src/app/mobileCompositionRoot.ts`.
- Infrastructure remains polymorphic (`mobileWordGateway`, `mobileStudyGateway`, `mobileSyncGateway`) via `MobileLearningRepositoryPort`.

## Next production steps

- Add mobile E2E-like regression scenario (`create -> study -> sync`) and CI split job.
- See `../docs/mobile-production-hardening.md` for details.
