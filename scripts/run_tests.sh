#!/usr/bin/env bash
# scripts/run_tests.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "========================================"
echo "LexiMemory FULL TEST SUITE START"
echo "Root: $ROOT_DIR"
echo "========================================"

########################################
# Backend (Python)
########################################

cd "$ROOT_DIR"

if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

if ! command -v pytest >/dev/null 2>&1; then
  echo "pytest not found. Please install backend dependencies."
  exit 1
fi

echo "Running backend tests with coverage..."
pytest -v \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=html

echo "Backend coverage report:"
echo "  $ROOT_DIR/htmlcov/index.html"

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

# node_modulesがなければインストール（CI対応）
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm ci
fi

echo "Running TypeScript type check..."
npx tsc --noEmit

echo "Running frontend tests with coverage..."
npm run test:coverage

echo "Frontend coverage report directory:"
echo "  $FRONTEND_DIR/coverage"

########################################
# Done
########################################

echo "========================================"
echo "LexiMemory FULL TEST SUITE SUCCESS"
echo "========================================"
