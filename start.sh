#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
env_file="$project_dir/.env"
[ -f "$env_file" ] || { echo "Missing required file: $env_file" >&2; exit 1; }
load_env_file() {
  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]] && continue
    line="${line#export }"
    key="${line%%=*}"
    value="${line#*=}"
    key="${key//[[:space:]]/}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [ -n "${!key+x}" ] && continue
    if [[ "$value" == \"*\" && "$value" == *\" ]]; then value="${value:1:${#value}-2}"; fi
    if [[ "$value" == \'*\' && "$value" == *\' ]]; then value="${value:1:${#value}-2}"; fi
    export "$key=$value"
  done < "$env_file"
}
load_env_file

: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
: "${DEVICE_CREDENTIAL_HMAC_KEY:?DEVICE_CREDENTIAL_HMAC_KEY is required}"
: "${GIFT_CARD_HMAC_KEY:?GIFT_CARD_HMAC_KEY is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[ "${OPENROUTER_BASE_URL:-}" = "https://openrouter.ai/api/v1" ] || { echo 'Exact OPENROUTER_BASE_URL is required' >&2; exit 1; }
[ "$BACKEND_PORT" = 30944 ] && [ "$FRONTEND_PORT" = 30945 ] || { echo 'Expected assigned ports 30944/30945' >&2; exit 1; }

[ -d "$project_dir/node_modules" ] || { echo 'Backend dependencies are missing' >&2; exit 1; }
[ -d "$project_dir/frontend/node_modules" ] || { echo 'Frontend dependencies are missing' >&2; exit 1; }
[ -f "$project_dir/dist/server.js" ] || { echo 'Backend build is missing' >&2; exit 1; }
[ -f "$project_dir/frontend/dist/index.html" ] || { echo 'Frontend build is missing' >&2; exit 1; }
for app_port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  lsof -nP -iTCP:"$app_port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $app_port is already in use" >&2; exit 1; }
done

children=()
cleanup() {
  trap - EXIT INT TERM HUP
  for pid in "${children[@]}"; do kill -TERM "$pid" 2>/dev/null || true; done
  for pid in "${children[@]}"; do wait "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT INT TERM HUP

cd "$project_dir"
NODE_ENV=production PORT="$BACKEND_PORT" CORS_ORIGIN="http://127.0.0.1:$FRONTEND_PORT" node dist/server.js &
children+=("$!")
API_PROXY_TARGET="http://127.0.0.1:$BACKEND_PORT" npm run preview --prefix frontend -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort &
children+=("$!")

while :; do
  for pid in "${children[@]}"; do
    kill -0 "$pid" 2>/dev/null || { wait "$pid"; exit $?; }
  done
  sleep 1
done
