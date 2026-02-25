# apps/mobile (Expo scaffold)

This directory is the future React Native app entrypoint.

It is intentionally lightweight to avoid breaking the current Web production path.
The long-term direction is:

- share domain/application logic via `packages/core`
- share reusable RN components via `packages/ui`
- use platform storage adapters (`AsyncStorage` / `SQLite`) via storage ports
