---
name: architecture
description: Enforce FastAPI project layering and dependency direction. Use when creating new modules, adding features, or refactoring architecture.
---

# Architecture Skill (FastAPI Personal)

## Goals
- Keep architecture simple but strict: API / Service / Domain / Infra separation.
- Prevent coupling that makes debugging and operations harder.
- Ensure code is testable and observable.

## Layering Rules
### Allowed dependencies (top -> down only)
- api -> services -> domain
- services -> domain, infra (via interfaces/ports preferred)
- infra -> domain (for types), core (for settings/logging)
- domain -> (no FastAPI / no Infra / no HTTP) ✅

### Forbidden
- domain importing fastapi/pydantic/httpx/sqlalchemy/etc.
- services importing fastapi (HTTP concerns stay in API layer)
- infra calling FastAPI dependencies directly

## Recommended structure
- app/api/routers/<feature>.py
- app/api/schemas/ (request/response DTO)
- app/services/<feature>_service.py
- app/domain/ (entities, value objects, policies, exceptions)
- app/infra/ (repositories, external clients, file/db adapters)
- app/core/ (settings, logging, constants)

## Patterns
- Prefer "thin router, thick service": router validates + dispatches; service owns use-case orchestration.
- Domain exceptions: stable, code-based. Map to HTTP at API boundary.
- Use explicit interfaces when IO exists (repository/client), to simplify tests.

## Deliverables when creating a new feature
- Router + request/response models
- Service function/class with clear input/output types
- Domain types (if rules exist)
- Infra adapter (only if IO is needed)
- Tests: domain + service + API smoke (minimum)

## Time Handling (Persistence Rule)

### Canonical Time Standard
- All persisted timestamps MUST be stored in UTC.
- No local timezone values are allowed in databases, files, or audit logs.

### Allowed
- Convert UTC → local timezone only at UI or presentation boundary.
- Use timezone-aware datetime objects internally where possible.

### Forbidden
- Storing local time (JST, PST, etc.) in persistence layer
- Mixing naive and timezone-aware datetimes

### Rationale
- Consistent auditing
- Correct cross-region operations
- Simplified debugging and log correlation

## Execution Environment (Docker First)

### Development Environment
- All development must run inside Docker containers.
- Local host execution is optional and not assumed.

### Production Model
- The application is released and deployed as a Docker image.
- Containers are treated as immutable.

### Implications
- No reliance on host-specific paths or tools.
- No mutable state stored inside container filesystem (except temporary files if unavoidable).
- All configuration must be injectable via environment variables.

### Rationale
- Environment parity between dev and prod
- Reproducible builds
- Easier debugging and rollback

## API Contract Discipline

- API behavior must be driven by OpenAPI schema.
- Breaking changes require:
  - explicit version bump
  - schema update
  - backward compatibility plan when possible

### Rationale
- Enables reliable client integration
- Simplifies debugging and testing
- Supports auditability of API evolution
