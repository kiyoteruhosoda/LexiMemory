---
name: debugging-troubleshooting
description: Provide a repeatable debugging workflow (repro steps, log queries, toggles). Use when investigating bugs, flaky behavior, or production-like issues.
---

# Debugging / Troubleshooting Skill

## Debug workflow (repeatable)
1) Identify symptom and scope:
   - endpoint, status code, frequency, affected users
2) Reproduce:
   - minimal request (curl/httpie) with captured request_id
3) Observe:
   - logs filtered by request_id
   - confirm error_code and failure point (router/service/infra)
4) Narrow:
   - disable non-essential features (feature flags if present)
   - isolate external dependencies (mock or stub)
5) Fix:
   - minimal patch
   - add regression test
6) Verify:
   - happy path + failure path
   - ensure logs/audit still correct

## Logging requirements for troubleshooting
- Unexpected exceptions must include stack trace on server logs.
- Include duration_ms and status for all requests.
- Ensure request_id is returned to client.

## Debug toggles (safe)
- Use environment variables for:
  - log level
  - feature flags
  - enabling extra debug fields (never secrets)

## Output expectations
When asked to debug, respond with:
- Hypotheses ranked
- Required evidence/logs
- Minimal reproduction command
- Proposed fix and a test case
