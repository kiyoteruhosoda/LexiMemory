# apps/mobile

This directory is the React Native / Expo application entrypoint.

## Implemented in Phase B/C

- Storage adapters:
  - AsyncStorage adapter: `src/storage/mobileAsyncStorageAdapter.ts`
  - SQLite adapter: `src/storage/mobileSqliteStorageAdapter.ts`
- Runnable Expo scaffold:
  - `App.tsx`
  - `app.config.ts`

The mobile app currently connects shared modules from:
- `packages/core` (Storage Port)
- `packages/ui` (RN-compatible UI primitives)

## Commands

- `npm run start --workspace @leximemory/apps-mobile`
- `npm run android --workspace @leximemory/apps-mobile`
- `npm run ios --workspace @leximemory/apps-mobile`
- `npm run web --workspace @leximemory/apps-mobile`
- `npm run android:prebuild --workspace @leximemory/apps-mobile`
- `npm run android:bundle --workspace @leximemory/apps-mobile`
- `npm run android:submit --workspace @leximemory/apps-mobile`
- `npm run test:mobile:regression`

## Runtime env

- `EXPO_PUBLIC_MOBILE_STORAGE_RUNTIME=native-async|native-sqlite`
- `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`
- `EXPO_PUBLIC_ACCESS_TOKEN=<jwt access token>`
- `EXPO_PUBLIC_CLIENT_ID=<optional mobile client id>`

## Android store distribution readiness

The project is now configured for Google Play release workflow with EAS Build.

### Required setup

1. Login: `npx eas login`
2. Link project once: `npx eas init`
3. Set project id to env: `EXPO_PUBLIC_EAS_PROJECT_ID=<project-id>`
4. Set Android package name when needed: `EXPO_PUBLIC_ANDROID_APPLICATION_ID=com.yourcompany.leximemory`

### Build and submit

1. Build Play Store bundle (AAB):
   - `npm run android:bundle --workspace @leximemory/apps-mobile`
2. Submit to Google Play internal track:
   - `npm run android:submit --workspace @leximemory/apps-mobile`

EAS manages signing credentials and automatically increments Android version code in `production` profile.

### Architecture consistency (DDD + polymorphism)

- Application service composition remains in `src/app/mobileCompositionRoot.ts`.
- Infrastructure gateways remain polymorphic (`mobileWordGateway`, `mobileStudyGateway`, `mobileSyncGateway`) through `MobileLearningRepositoryPort`.
- Store-distribution settings are isolated in configuration (`app.config.ts`, `eas.json`) to keep domain/application layers clean.

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

## Next production steps

- Stabilize production auth token provisioning for device/runtime environments.
- Add offline replay/telemetry around sync retry and conflict recovery.
- See `../../plan.md` (Phase E) for details.
