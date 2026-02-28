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

run_compose() {
  local env_kind="$1"
  shift
  local compose_file
  compose_file="$(compose_for "$env_kind")"

  local env_file
  env_file="${ENV_FILE:-$(default_env_file_for "$env_kind")}"

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
