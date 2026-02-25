# Mobile Production Hardening Plan

## Objective

Move the Expo prototype from a validation setup to a production-ready runtime while preserving DDD boundaries.

## Current state (prototype)

- Application services are shared from `src/core/*`.
- Mobile uses polymorphic gateways with an in-memory repository.
- Basic mobile use-cases are runnable (words/study/sync).

## Target architecture

1. **Application layer (shared)**
   - Keep `WordApplicationService`, `StudyApplicationService`, `SyncApplicationService` unchanged.
2. **Domain/Repository ports**
   - Keep repository behavior abstract behind gateway interfaces.
3. **Infrastructure adapters (mobile)**
   - Provide runtime-selectable persistence adapters (`native-async` / `native-sqlite`).
   - Add server-backed sync gateway implementation.
4. **Composition root (mobile)**
   - Resolve concrete adapters by runtime capability and migration policy.

## Work packages

### WP-1 Persistence replacement
- Replace in-memory repository with persistent repository.
- Use `prepareVersionedStorage` before adapter activation.

### WP-2 Sync production gateway
- Implement authenticated sync against backend API contract.
- Handle conflict strategies in gateway (`fetch-server`, `force-local`).

### WP-3 Mobile regression testing
- Add E2E-like scenario runner for create→study→sync.
- Add CI job isolated from web visual regression.

### WP-4 Operations and traceability
- Add structured logs around adapter selection/fallback/migration version.
- Add lockfile operation guideline for workspace dependency updates.

## Lockfile operation guideline

- Keep dependency update PRs separate from feature PRs whenever possible.
- Use workspace-scoped install/update commands to avoid unrelated lockfile churn.
- If a feature PR requires dependency changes, include only direct dependencies required for that feature and document why each package is necessary.
- Regenerate lockfiles once per PR and avoid reordering caused by mixed npm client versions (pin Node/npm versions in CI and local dev containers).
