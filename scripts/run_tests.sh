#!/usr/bin/env bash
# scripts/run_tests.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

log() { echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*"; }

log "========================================"
log "LinguisticNode FULL TEST SUITE START"
log "Root: $ROOT_DIR"
log "========================================"

########################################
# Backend (Python)
########################################
cd "$ROOT_DIR"

if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source ".venv/bin/activate"
fi

if ! command -v python >/dev/null 2>&1; then
  echo "python not found."
  exit 1
fi

if ! python -c "import pytest" >/dev/null 2>&1; then
  echo "pytest not found in this Python environment. Please install backend dependencies."
  exit 1
fi

log "Running backend tests with coverage..."
python -m pytest -v \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=html

log "Backend coverage report:"
log "  $ROOT_DIR/htmlcov/index.html"

########################################
# Frontend (React + TypeScript)
########################################
if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

cd "$FRONTEND_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  log "Installing frontend dependencies (npm ci)..."
  npm ci
fi

log "Running frontend lint..."
npm run lint

log "Running TypeScript build (includes type-check)..."
npx tsc -b

log "Running frontend tests with coverage..."
npm run test:coverage

log "Frontend coverage report directory:"
log "  $FRONTEND_DIR/coverage"

########################################
# Done
########################################
log "========================================"
log "LinguisticNode FULL TEST SUITE SUCCESS"
log "========================================"