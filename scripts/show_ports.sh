#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-stg}"
ENV_FILE="${2:-}"

"$ROOT_DIR/scripts/envctl.sh" "$TARGET" ports "$ENV_FILE"
