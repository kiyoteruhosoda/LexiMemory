---
name: backend-integration
description: Standardize FastAPI endpoints, Pydantic schemas, DI, and HTTP error mapping. Use when implementing or changing API routes.
---

# Backend Integration Skill (FastAPI)

## API Design Conventions
- Use APIRouter per feature.
- Use explicit status codes.
- Response models must be declared (`response_model=...`) when stable.
- Avoid returning raw dict for stable APIs; prefer Pydantic models.

## Pydantic Schemas
- Request: validate user input; keep them transport-focused.
- Response: hide internal fields; never leak secrets/paths.
- Use explicit types, avoid Any in public schemas.
- Use consistent naming (snake_case in Python; JSON aliases only if needed).

## Dependency Injection
- Use `Depends()` for services and auth.
- Services should be constructed in a single place (dependency provider) to centralize wiring.
- For personal projects: keep DI simple; avoid over-engineered containers.

## Error Mapping Policy
- API layer may raise HTTPException.
- Service/domain raise custom exceptions:
  - e.g., `DomainError(code="...")`, `NotFoundError`, `ConflictError`.
- Centralize mapping:
  - exception handlers OR helper in API layer.
- Error response shape should be consistent:
  - `{"error": {"code": "...", "message": "...", "request_id": "..."}}`

## IO & Async
- Prefer async endpoints.
- Avoid blocking calls in async path.
- If blocking IO exists, isolate in infra and use threadpool where necessary.

## Minimal endpoint checklist
- AuthZ/AuthN decision documented
- Input validation via schema
- Traceable logs (event + request_id)
- Clear error codes
- Test: happy path + one representative failure

## Time Conversion at API Boundary

- API responses should return UTC timestamps by default unless UI explicitly requires localized time.
- If localized time is returned:
  - timezone must be explicit (e.g., ISO8601 with offset)
  - never overwrite the original UTC value internally

- Conversion to user timezone is considered a presentation concern.

## Internationalization (I18N)

### Principles
- All user-facing text must be externalized to resource files.
- Do not hardcode display strings in code.

### Typical structure (example)
- app/resources/
  - en.json
  - ja.json
  - ...

### Rules
- API layer selects language based on:
  - request header (Accept-Language) or explicit parameter
- Services and domain layers must not depend on specific language strings.
- Error codes are stable; messages are resolved via resources.

### Forbidden
- Inline user-facing messages in business logic
- Language-specific branching in domain/services

## Configuration Management (Container Friendly)

- All runtime configuration must be provided via environment variables.
- Avoid hardcoded paths, ports, credentials, or environment assumptions.
- Provide sane defaults only for local development.

### Recommended pattern
- Centralized settings module (e.g., app/core/settings.py)
- Load via env and validate on startup

### Forbidden
- Reading secrets from files committed to the repository
- Depending on OS-specific behavior
