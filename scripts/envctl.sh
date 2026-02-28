#!/usr/bin/env bash
set -euo pipefail

# Unified one-command entrypoint for environment operations.
# Examples:
#   ./scripts/envctl.sh stg
#   ./scripts/envctl.sh stg up ./.env.stg
#   ./scripts/envctl.sh stg build ./.env.stg
#   ./scripts/envctl.sh stg logs ./.env.stg linguisticnode-api-stg
#   ./scripts/envctl.sh prod build

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_KIND="${1:-}"
ACTION="${2:-up}"
ENV_FILE="${3:-}"
SERVICE="${4:-}"

compose_for() {
  case "$1" in
    prod) echo "$ROOT_DIR/docker-compose.yml" ;;
    stg) echo "$ROOT_DIR/docker-compose.stg.yml" ;;
    debug) echo "$ROOT_DIR/docker-compose.debug.yml" ;;
    *)
      echo "[ERROR] unsupported environment: $1 (prod|stg|debug)" >&2
      exit 1
      ;;
  esac
}

default_env_file_for() {
  case "$1" in
    prod) echo "$ROOT_DIR/.env" ;;
    stg) echo "$ROOT_DIR/.env.stg" ;;
    debug) echo "$ROOT_DIR/.env" ;;
    *)
      echo "[ERROR] unsupported environment: $1 (prod|stg|debug)" >&2
      exit 1
      ;;
  esac
}

requires_env_file() {
  case "$1" in
    stg) return 0 ;;
    *) return 1 ;;
  esac
}

read_env_value() {
  local env_file="$1"
  local key="$2"

  if [ ! -f "$env_file" ]; then
    return 0
  fi

  awk -F= -v k="$key" '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    {
      line=$0
      sub(/^[[:space:]]+/, "", line)
      sub(/[[:space:]]+$/, "", line)
      if (index(line, "export ") == 1) {
        line=substr(line, 8)
      }
      split(line, parts, "=")
      if (parts[1] != k) {
        next
      }
      value=substr(line, length(k) + 2)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      gsub(/^'\''|'\''$/, "", value)
      print value
      exit
    }
  ' "$env_file"
}

ensure_stg_data_dir() {
  local env_file="$1"
  local data_dir

  data_dir="$(read_env_value "$env_file" "STG_HOST_DATA_DIR")"
  if [ -z "$data_dir" ]; then
    data_dir="./data-stg"
  fi

  if [[ "$data_dir" != /* ]]; then
    data_dir="$ROOT_DIR/${data_dir#./}"
  fi

  if [ -d "$data_dir" ]; then
    return 0
  fi

  echo "[INFO] Creating missing STG_HOST_DATA_DIR: $data_dir"
  mkdir -p "$data_dir"
}

run_compose() {
  local env_kind="$1"
  shift
  local compose_file
  compose_file="$(compose_for "$env_kind")"

  local env_file
  env_file="${ENV_FILE:-$(default_env_file_for "$env_kind")}"

  if [ "$env_kind" = "stg" ] && [ "$1" = "up" -o "$1" = "build" ]; then
    ensure_stg_data_dir "$env_file"
  fi

  if requires_env_file "$env_kind"; then
    if [ ! -f "$env_file" ]; then
      echo "[ERROR] Missing env file: $env_file"
      echo "[INFO] Create .env.stg from .env.sample and set secure values (especially PASSWORD_PEPPER)."
      exit 1
    fi
    docker compose --env-file "$env_file" -f "$compose_file" "$@"
  else
    if [ -f "$env_file" ]; then
      docker compose --env-file "$env_file" -f "$compose_file" "$@"
    else
      docker compose -f "$compose_file" "$@"
    fi
  fi
}

if [ -z "$ENV_KIND" ]; then
  echo "[ERROR] Usage: ./scripts/envctl.sh <prod|stg|debug> [up|down|build|logs|ps|restart] [env_file] [service]"
  exit 1
fi

case "$ACTION" in
  up)
    run_compose "$ENV_KIND" up -d --build
    run_compose "$ENV_KIND" ps
    ;;
  down)
    run_compose "$ENV_KIND" down
    ;;
  build)
    run_compose "$ENV_KIND" build
    ;;
  logs)
    if [ -n "$SERVICE" ]; then
      run_compose "$ENV_KIND" logs -f "$SERVICE"
    else
      run_compose "$ENV_KIND" logs -f
    fi
    ;;
  ps)
    run_compose "$ENV_KIND" ps
    ;;
  restart)
    run_compose "$ENV_KIND" restart
    run_compose "$ENV_KIND" ps
    ;;
  *)
    echo "[ERROR] unsupported action: $ACTION (up|down|build|logs|ps|restart)"
    exit 1
    ;;
esac
