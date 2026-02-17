---
name: security
description: Apply baseline security for FastAPI apps (input validation, secret handling, auth, safe errors). Use when adding auth, handling user data, or logging.
---

# Security Skill (Baseline)

## Secrets & Sensitive Data
- Never log: passwords, tokens, API keys, session cookies, full Authorization headers.
- Avoid logging raw request bodies; if needed, redact sensitive keys.

## Input Validation
- Use Pydantic models for all external input.
- Prefer allowlist validation where possible (enums, regex).

## Auth & Authorization (if applicable)
- Auth decisions should be explicit in routers (Depends).
- Authorization should be checked in service layer (business policy).
- Deny by default if uncertain.

## Error Responses
- Return safe messages only.
- Include request_id for support.
- Do not leak internal file paths or stack traces to clients.

## Dependency hygiene
- Pin dependencies.
- Avoid insecure crypto; use established libraries.
