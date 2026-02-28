#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.stg}"
SERVICE="${2:-}"

"$ROOT_DIR/scripts/envctl.sh" stg errors "$ENV_FILE" "$SERVICE"
