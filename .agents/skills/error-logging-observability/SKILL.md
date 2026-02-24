---
name: error-logging-observability
description: Define structured logging, request correlation, metrics mindset, and error handling conventions. Use when adding logs, exceptions, middleware, or troubleshooting behavior.
license: MIT
compatibility: Designed for GitHub Copilot and OpenAI Codex. Requires Python 3.11+, FastAPI environment, Docker.
metadata:
  author: LinguisticNode
  version: "1.0"
  category: observability
---

# Error / Logging / Observability Skill

## Principles
- Logs are for debugging + audit + operations, not just printing messages.
- Every request must be traceable end-to-end using `request_id`.
- Never log secrets (tokens/passwords), and avoid full request bodies by default.

## Structured Logging Standard
Use consistent keys (example set):
- event: stable event name (string)
- request_id: correlation id
- method, path, status, duration_ms
- user_id / username (if available)
- err_type, error_code, detail (safe), stacktrace (server-side only)

## Request Correlation
- Add middleware that:
  - reads `X-Request-Id` if present, else generates UUID
  - sets response header `X-Request-Id`
  - attaches request_id to log context
- Services should accept `request_id` explicitly or via context injection (keep simple).

## Error Handling
- Do not swallow exceptions.
- For expected failures:
  - raise domain/service exception with stable error_code
  - map to HTTP response in API layer
- For unexpected failures:
  - log ERROR with exception info
  - return 500 with safe message and request_id

## Debuggability Guidelines
- Log at boundaries:
  - router start/end
  - service start/end + key decisions
  - infra external calls (without sensitive payload)
- Prefer logs that answer: who/what/when/where/why.

## Operational readiness checklist (per feature)
- Failure mode produces:
  - stable error_code
  - safe user message
  - request_id surfaced to client
  - server logs contain enough context to reproduce

## Time Standard for Logs and Audits

- All log timestamps must be in UTC.
- All audit records must store UTC timestamps only.
- Never log localized time values.

### Reason
- Enables accurate correlation across services and environments
- Prevents timezone drift issues in investigations

## Container Logging

- All logs must be written to stdout/stderr.
- Do not log directly to rotating files inside containers.
- Log aggregation is assumed to be handled by container platform.

### Benefits
- Works with Docker logs, Kubernetes, cloud logging systems
- Simplifies debugging and monitoring

## OpenAPI Error Visibility

- Stable error response structures must be documented in OpenAPI.
- Error codes and their meanings should be discoverable via Swagger UI.

### Benefit
- Faster debugging
- Clear operational contracts
