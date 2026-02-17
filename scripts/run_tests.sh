#!/usr/bin/env bash
# scripts/run_tests.sh
set -e

echo "Running LexiMemory test suite..."

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run pytest with coverage
pytest -v --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "✅ Tests completed!"
echo "📊 Coverage report saved to htmlcov/index.html"
