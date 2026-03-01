#!/usr/bin/env bash
set -euo pipefail

# Unified one-command entrypoint for environment operations.
# Examples:
#   ./scripts/envctl.sh stg
#   ./scripts/envctl.sh stg up ./.env.stg
#   ./scripts/envctl.sh stg build ./.env.stg
#   ./scripts/envctl.sh stg logs ./.env.stg linguisticnode-api-stg
#   ./scripts/envctl.sh stg errors ./.env.stg linguisticnode-api-stg
#   ./scripts/envctl.sh stg probe ./.env.stg nolumia.com
#   ./scripts/envctl.sh stg nginx-logs ./.env.stg
#   ./scripts/envctl.sh stg ports ./.env.stg
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


resolve_web_port() {
  local env_kind="$1"
  local env_file="$2"

  case "$env_kind" in
    stg)
      local port
      port="$(read_env_value "$env_file" "STG_WEB_PORT")"
      echo "${port:-18080}"
      ;;
    prod)
      local port
      port="$(read_env_value "$env_file" "WEB_PORT")"
      echo "${port:-8080}"
      ;;
    debug)
      local port
      port="$(read_env_value "$env_file" "FRONTEND_DEV_PORT")"
      echo "${port:-5173}"
      ;;
  esac
}

probe_web_endpoint() {
  local env_kind="$1"
  local env_file="$2"
  local host="${3:-localhost}"

  local web_port
  web_port="$(resolve_web_port "$env_kind" "$env_file")"

  local http_url="http://$host:$web_port"
  local https_url="https://$host:$web_port"

  echo "[INFO] Probing HTTP endpoint: $http_url"
  if ! curl -sS -I --max-time 10 "$http_url" | sed -n '1,10p'; then
    echo "[WARN] HTTP probe failed (service may be down or blocked)."
  fi

  echo
  echo "[INFO] Probing HTTPS endpoint: $https_url"
  if ! curl -k -sS -I --max-time 10 "$https_url" | sed -n '1,10p'; then
    echo "[WARN] HTTPS probe failed. This endpoint may be HTTP-only."
  fi

  echo
  echo "[INFO] Checking redirect response for /api (expect possible 307/308 depending upstream route policy)"
  if ! curl -sS -I --max-time 10 "$http_url/api" | sed -n '1,10p'; then
    echo "[WARN] /api probe failed (service may be down or blocked)."
  fi
}


resolve_api_port() {
  local env_kind="$1"
  local env_file="$2"

  case "$env_kind" in
    stg)
      local port
      port="$(read_env_value "$env_file" "STG_API_PORT")"
      echo "${port:-18000}"
      ;;
    prod)
      echo "8000"
      ;;
    debug)
      local port
      port="$(read_env_value "$env_file" "API_DEBUG_PORT")"
      echo "${port:-8000}"
      ;;
  esac
}

resolve_debugpy_port() {
  local env_file="$1"
  local port
  port="$(read_env_value "$env_file" "DEBUGPY_PORT")"
  echo "${port:-5678}"
}

resolve_frontend_dev_port() {
  local env_file="$1"
  local port
  port="$(read_env_value "$env_file" "FRONTEND_DEV_PORT")"
  echo "${port:-5173}"
}

web_service_for() {
  case "$1" in
    stg) echo "linguisticnode-web-stg" ;;
    prod) echo "linguisticnode-web" ;;
    debug) echo "linguisticnode-web-debug" ;;
  esac
}

show_ports() {
  local env_kind="$1"
  local env_file="$2"

  local compose_file
  compose_file="$(compose_for "$env_kind")"

  echo "[INFO] Environment: $env_kind"
  echo "[INFO] Compose file: $compose_file"
  echo "[INFO] Env file: $env_file"
  if [ ! -f "$env_file" ]; then
    echo "[WARN] Env file does not exist. Defaults from compose variables are used."
  fi

  local api_port
  local web_port
  api_port="$(resolve_api_port "$env_kind" "$env_file")"
  web_port="$(resolve_web_port "$env_kind" "$env_file")"

  echo "[INFO] Resolved host ports"
  echo "  - API host port: $api_port"
  echo "  - Web host port: $web_port"

  case "$env_kind" in
    stg)
      echo "[INFO] Mapping (docker-compose.stg.yml)"
      echo '  - API: "${STG_API_PORT:-18000}:8000"'
      echo '  - WEB: "${STG_WEB_PORT:-18080}:80"'
      ;;
    prod)
      echo "[INFO] Mapping (docker-compose.yml)"
      echo '  - API: "8000:8000"'
      echo '  - WEB: "${WEB_PORT}:80"'
      ;;
    debug)
      local debugpy_port
      local frontend_dev_port
      debugpy_port="$(resolve_debugpy_port "$env_file")"
      frontend_dev_port="$(resolve_frontend_dev_port "$env_file")"
      echo "[INFO] Mapping (docker-compose.debug.yml)"
      echo '  - API: "${API_DEBUG_PORT:-8000}:8000"'
      echo '  - DEBUGPY: "${DEBUGPY_PORT:-5678}:5678"'
      echo '  - WEB DEV: "${FRONTEND_DEV_PORT:-5173}:5173"'
      echo "[INFO] Resolved extra debug ports"
      echo "  - Debugpy host port: $debugpy_port"
      echo "  - Frontend dev host port: $frontend_dev_port"
      ;;
  esac

  echo "[INFO] Sources"
  echo "  1) docker-compose*.yml mapping syntax"
  echo "  2) env file values (.env / .env.stg)"
  echo "  3) shell fallback defaults in compose (:-...)"
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
  echo "[ERROR] Usage: ./scripts/envctl.sh <prod|stg|debug> [up|down|build|logs|errors|probe|nginx-logs|ports|ps|restart] [env_file] [service]"
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
  errors)
    if [ -n "$SERVICE" ]; then
      run_compose "$ENV_KIND" logs --since 30m "$SERVICE" | rg -i "error|exception|traceback|failed|fatal|panic|crypto\.randomUUID"
    else
      run_compose "$ENV_KIND" logs --since 30m | rg -i "error|exception|traceback|failed|fatal|panic|crypto\.randomUUID"
    fi
    ;;
  probe)
    probe_web_endpoint "$ENV_KIND" "${ENV_FILE:-$(default_env_file_for "$ENV_KIND")}" "$SERVICE"
    ;;
  nginx-logs)
    local_web_service="${SERVICE:-$(web_service_for "$ENV_KIND")}"
    run_compose "$ENV_KIND" logs -f "$local_web_service"
    ;;
  ports)
    show_ports "$ENV_KIND" "${ENV_FILE:-$(default_env_file_for "$ENV_KIND")}"
    ;;
  ps)
    run_compose "$ENV_KIND" ps
    ;;
  restart)
    run_compose "$ENV_KIND" restart
    run_compose "$ENV_KIND" ps
    ;;
  *)
    echo "[ERROR] unsupported action: $ACTION (up|down|build|logs|errors|probe|nginx-logs|ports|ps|restart)"
    exit 1
    ;;
esac
