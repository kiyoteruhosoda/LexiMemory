
# LexiMemory

LexiMemory is a vocabulary learning and spaced-repetition memory app, featuring a FastAPI backend and a React (TypeScript) frontend. The project is fully containerized with Docker.

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

LexiMemory follows a clean layered architecture:

1. **API Layer** (`routers/`): HTTP endpoints, request/response models
2. **Service Layer** (`services.py`): Business logic, framework-agnostic
3. **Storage Layer** (`storage.py`): File I/O, atomic writes, user locks
4. **Security Layer** (`security.py`, `sessions.py`): Auth, password management

This separation ensures testability, maintainability, and clear boundaries.

---

For frontend details, see `frontend/README.md`.
