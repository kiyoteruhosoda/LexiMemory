#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/build_env.sh prod [env_file]
#   ./scripts/build_env.sh stg  [env_file]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-}"
ENV_FILE="${2:-}"

if [ -z "$TARGET" ]; then
  echo "[ERROR] target is required: prod | stg"
  exit 1
fi

"$ROOT_DIR/scripts/envctl.sh" "$TARGET" build "$ENV_FILE"
