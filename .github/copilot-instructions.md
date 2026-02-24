# Copilot Instructions (Repo)
This is a personal FastAPI-centric Python project.

## Language Rules (Important)
- All responses in chat must be written in Japanese.
- All code comments (inline comments and docstrings) must be written in English.
  - Exception: user-facing messages returned by the API (e.g., error messages) should be Japanese unless explicitly requested otherwise.

## Always follow Project Skills
Follow skill documents under:
- .agents/skills/**/SKILL.md

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

## Quality Gate (Required)
- After making changes, always verify by running tests for both backend and frontend with no errors.

### Backend (FastAPI / Python)
- Ensure the virtual environment (.venv) is activated before running any backend commands.
- Run the full Python test suite (e.g., pytest).
- Resolve all test failures and runtime errors before considering the change complete.

### Frontend (React)
- Run the frontend test suite (e.g., vitest or jest).
- Run TypeScript type checking (e.g., tsc --noEmit).
- Ensure the production build succeeds if a build step exists (e.g., vite build).

## UI Language (Important)
- All user-facing UI strings must be in English.
  - This includes labels, buttons, headings, placeholders, validation messages shown in the UI, and toast/modal messages.
  
