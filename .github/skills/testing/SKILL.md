---
name: testing
description: Define test strategy for domain/service/API including regression tests for bugs and observability assertions. Use when adding features or fixing bugs.
---

# Testing Skill (pytest)

## Test pyramid
- Domain: fast unit tests for rules/policies (primary)
- Service: unit/integration depending on IO boundaries
- API: minimal smoke + representative failure case

## Conventions
- Use pytest fixtures for setup.
- Deterministic tests (no network, no real external services).
- For time: freeze/patch time provider where needed.

## Regression discipline
- Every bug fix must add a test that fails before the fix.
- Prefer asserting:
  - output correctness
  - error_code stability
  - status code correctness
  - request_id presence (API responses)

## Observability tests (lightweight)
- For critical endpoints:
  - ensure structured error payload includes request_id
  - ensure error_code is stable
