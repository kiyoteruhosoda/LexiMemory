# Copilot Instructions (Repo)
This is a personal FastAPI-centric Python project.

## Language Rules (Important)
- All responses in chat must be written in Japanese.
- All code comments (inline comments and docstrings) must be written in English.
  - Exception: user-facing messages returned by the API (e.g., error messages) should be Japanese unless explicitly requested otherwise.

## Always follow Project Skills
Follow skill documents under:
- .github/skills/**/SKILL.md

If instructions conflict:
1) .github/copilot-instructions.md wins
2) then the most relevant skill wins
3) else follow existing repository patterns

## Global conventions
- Python 3.11+
- Prefer correctness, readability, testability
- API layer: FastAPI only (no business rules)
- Service/Domain: framework-agnostic
- Raise HTTPException only in API layer
- Never log secrets (tokens/passwords)
