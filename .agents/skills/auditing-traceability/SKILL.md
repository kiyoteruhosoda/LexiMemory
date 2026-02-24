---
name: auditing-traceability
description: Ensure actions are auditable and traceable (who did what, when, from where). Use when implementing state changes, auth, or any sensitive endpoint.
license: MIT
compatibility: Designed for GitHub Copilot and OpenAI Codex. Requires Python 3.11+, FastAPI environment.
metadata:
  author: LinguisticNode
  version: "1.0"
  category: security-observability
---

# Auditing / Traceability Skill

## When to apply
- Any endpoint that mutates state (create/update/delete)
- Authentication / authorization
- Admin operations
- Data exports / imports

## Audit Event Model (conceptual)
Capture at minimum:
- actor: user_id / subject / system actor
- action: stable action name (e.g., "word.create", "user.login")
- target: target_type + target_id (if applicable)
- timestamp
- request_id
- result: success/failure + error_code
- source: ip, user_agent (if available), client_id (if applicable)

## Implementation guidance
- Prefer append-only audit logs:
  - file-based JSONL (personal project) or DB table if DB exists
- Ensure audit writes happen even on failures where possible.
- Never store secrets in audit records.

## Error + audit
- On failure:
  - record action + failure reason (code)
  - include request_id
- Make audit format stable for later analysis.

## Debug support
- Provide a way to filter audit by:
  - request_id
  - actor
  - date range
  - action prefix
