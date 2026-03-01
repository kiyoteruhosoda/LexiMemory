#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-$ROOT_DIR/.env.stg}"

"$ROOT_DIR/scripts/envctl.sh" stg up "$ENV_FILE"
