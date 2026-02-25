
# LinguisticNode

LinguisticNode is a vocabulary learning and spaced-repetition memory app, featuring a FastAPI backend and a React (TypeScript) frontend. The project is fully containerized with Docker.

## Project Structure

```
app/
  __init__.py
  main.py              # FastAPI app creation and middleware
  settings.py          # Configuration and environment variables
  models.py            # Pydantic models for API and data
  security.py          # Password hashing and validation
  sessions.py          # Session management
  storage.py           # File-based data storage
  services.py          # Business logic layer
  deps.py              # Dependency injection (auth, etc.)
  routers/             # API endpoint modules
    __init__.py
    auth.py            # Authentication endpoints
    words.py           # Word CRUD endpoints
    study.py           # Spaced-repetition study endpoints
    io.py              # Import/export endpoints
  middleware.py        # Request logging
  middleware_bodylog.py
  errors.py            # Error handling utilities
  logging_setup.py     # Structured logging configuration

tests/                 # Test suite (pytest)
  __init__.py
  conftest.py          # Test fixtures and configuration
  test_auth.py         # Authentication tests
  test_words.py        # Word management tests
  test_study.py        # Study flow tests
  test_io.py           # Import/export tests

data/                  # User data (not tracked by git)
  users/
    users.json
  vault/
    u_<userId>/
      words.json
      memory.json
      settings.json

frontend/src/          # React frontend
  api/                 # API client modules
  auth/                # Authentication context
  pages/               # Page components
  components/          # Reusable UI components

scripts/
  bump_version.sh      # Version management script

docker-compose.yml     # Container orchestration
Dockerfile             # Backend container definition
requirements.txt       # Python dependencies
pytest.ini             # Pytest configuration
```

## Setup & Build

```sh
cd /work/project/03.LexiMemory
./scripts/bump_version.sh && sudo docker compose up -d --build
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /healthz` - Health check (no auth required)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/words` - List user's words
- `POST /api/words` - Create new word
- `PUT /api/words/{id}` - Update word
- `DELETE /api/words/{id}` - Delete word
- `GET /api/study/next` - Get next card for review
- `POST /api/study/grade` - Grade a card (again/hard/good/easy)
- `GET /api/io/export` - Export user data
- `POST /api/io/import` - Import user data (overwrite/merge)

## Testing

Run the test suite:

```sh
# Install dependencies (if not using Docker)
pip install -r requirements.txt

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html
```

## API Health Check

```sh
curl http://localhost:8000/healthz
```

The `/healthz` endpoint returns API status, app version, and git commit hash.

## Features

- **FastAPI Backend**: Modern async Python framework with automatic OpenAPI docs
- **User Authentication**: Secure password hashing with Argon2, session-based auth
- **Vocabulary Management**: Full CRUD operations for vocabulary entries
- **Spaced Repetition**: SM-2 algorithm for optimized learning
- **Data Isolation**: Per-user data storage with file-based persistence
- **Import/Export**: Backup and restore user data in JSON format
- **Structured Logging**: Request correlation, audit trails, observability
- **Comprehensive Tests**: Unit and integration tests with pytest
- **Docker Support**: Containerized deployment with docker-compose

## Development

### Running Locally (without Docker)

```sh
# Backend
cd /work/project/03.LexiMemory
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables

Key environment variables (see `.env.sample`):

- `VOCAB_DATA_DIR` - Data storage directory (default: `./data`)
- `VOCAB_WEB_ORIGIN` - CORS allowed origin
- `VOCAB_COOKIE_SECURE` - Use secure cookies (true in production)
- `VOCAB_SESSION_TTL_SECONDS` - Session lifetime

## Requirements

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)

## Architecture

LinguisticNode follows a clean layered architecture:

1. **API Layer** (`routers/`): HTTP endpoints, request/response models
2. **Service Layer** (`services.py`): Business logic, framework-agnostic
3. **Storage Layer** (`storage.py`): File I/O, atomic writes, user locks
4. **Security Layer** (`security.py`, `sessions.py`): Auth, password management

This separation ensures testability, maintainability, and clear boundaries.

---

For frontend details, see `frontend/README.md`.

### Frontend CI-equivalent commands

- `cd frontend && npm run lint`
- `cd frontend && npm run typecheck`
- `cd frontend && npm run test`
- `cd frontend && npm run build`
- `cd frontend && npm run test:e2e`

### Frontend routing summary

- Router: `react-router-dom` BrowserRouter (`frontend/src/App.tsx`)
- `/login`: login/register
- `/words`: word list (root redirect target)
- `/words/create`: create word
- `/words/:id`: word details
- `/study`: study flow
- `/examples`: examples testing


## Import/Export

### Export

User data can be exported as JSON for backup or data migration:

```sh
GET /api/io/export
```

**Response format:**
- `schemaVersion`: Data format version (currently 1)
- `exportedAt`: ISO 8601 timestamp
- `words`: Array of complete word entries (with IDs and timestamps)
- `memory`: Array of memory states for spaced-repetition

### Import

Data can be imported in two modes:

```sh
POST /api/io/import?mode=merge   # Default: merge with existing data
POST /api/io/import?mode=overwrite  # Replace all data
```

#### Flexible Input Format

The import endpoint accepts JSON in **two formats**:

**1. Exported data format (complete):**
- Includes all fields: `id`, `createdAt`, `updatedAt`, `dueAt`
- Perfect for restoring previous exports

**2. Manually-created format (flexible):**
- Can omit optional fields: `id`, `createdAt`, `updatedAt`, `examples`, `tags`, `memory`
- Missing IDs are auto-generated as UUIDs
- Missing timestamps are set to current time
- Perfect for quick manual data entry

#### Merge Logic (mode=merge)

When importing with merge mode, **existing words are compared by ID**:

| Situation | Behavior |
|-----------|----------|
| **New ID (not in existing data)** | ✅ Added as new word |
| **Existing ID + older timestamp** | ⏸️ Existing data preserved (import ignored) |
| **Existing ID + newer timestamp** | 🔄 Overwritten with import data |

**Key points:**
- If you omit `id` in manual files → UUID auto-generated → Always added as new
- If you specify `id` → Compared with existing data → May merge/overwrite
- Timestamp comparison prevents accidental downgrades

#### Overwrite Logic (mode=overwrite)

Completely replaces all data:
```sh
POST /api/io/import?mode=overwrite
```

**All existing words and memory states are deleted** and replaced with import data.

#### Examples

**Minimal manual file (only required fields - guaranteed to add as new):**
```json
{
  "schemaVersion": 1,
  "words": [
    {
      "headword": "improve",
      "pos": "verb",
      "meaningJa": "改善する"
    }
  ]
}
```
- ✅ ID auto-generated (UUID)
- ✅ Timestamps auto-generated (current time)
- ✅ Added as new word guaranteed (no duplicates)

**File with custom ID (will merge with existing data):**
```json
{
  "schemaVersion": 1,
  "words": [
    {
      "id": "my-custom-id",
      "headword": "test",
      "pos": "verb",
      "meaningJa": "テスト"
    }
  ]
}
```
- ✅ ID explicitly specified
- ✅ Timestamps auto-generated
- ⚠️ May merge with existing ID (timestamp decides)

**Complete exported data (all fields):**
```json
{
  "schemaVersion": 1,
  "exportedAt": "2024-01-15T10:30:45Z",
  "words": [
    {
      "id": "uuid-123",
      "headword": "improve",
      "pos": "verb",
      "meaningJa": "改善する",
      "memo": "進捗",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T09:00:00Z",
      "examples": [
        {
          "id": "ex-uuid-1",
          "en": "I want to improve my skills.",
          "ja": "スキルを向上させたい。"
        }
      ],
      "tags": ["work", "growth"]
    }
  ],
  "memory": [
    {
      "wordId": "uuid-123",
      "easiness": 2.5,
      "interval": 10,
      "repetitions": 5,
      "dueAt": "2024-02-10T08:00:00Z"
    }
  ]
}
```
- ✅ All fields preserved
- ✅ Merge logic applies (timestamp comparison)

**Typical workflow:**
1. Export from LinguisticNode → get complete format
2. Create manually → use minimal format
3. Merge imports → existing data + new data
4. Overwrite imports → full replacement
