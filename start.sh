#!/bin/sh
set -eu
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
source_dir=${RUNTIME_PROJECT_SOURCE:-$project_dir}
: "${PORT:?PORT is required; choose an unused backend port explicitly}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required; choose an unused frontend port explicitly}"
backend_port=$PORT
frontend_port=$FRONTEND_PORT

[ -d "$source_dir/node_modules" ] || { echo 'Backend dependencies are missing' >&2; exit 1; }
[ -d "$source_dir/frontend/node_modules" ] || { echo 'Frontend dependencies are missing' >&2; exit 1; }
[ -f "$source_dir/dist/server.js" ] || { echo 'Backend build missing; run npm run build' >&2; exit 1; }
[ -f "$source_dir/frontend/dist/index.html" ] || { echo 'Frontend build missing; run npm run build --prefix frontend' >&2; exit 1; }
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
if [ -n "${RUNTIME_PROJECT_SOURCE:-}" ]; then
  DEVICE_CREDENTIAL_HMAC_KEY=${DEVICE_CREDENTIAL_HMAC_KEY:-runtime-acceptance-device-credential-hmac-key-01}
  GIFT_CARD_HMAC_KEY=${GIFT_CARD_HMAC_KEY:-runtime-acceptance-gift-card-hmac-key-02}
  export DEVICE_CREDENTIAL_HMAC_KEY GIFT_CARD_HMAC_KEY
fi
: "${DEVICE_CREDENTIAL_HMAC_KEY:?DEVICE_CREDENTIAL_HMAC_KEY is required}"
: "${GIFT_CARD_HMAC_KEY:?GIFT_CARD_HMAC_KEY is required}"

for port in "$backend_port" "$frontend_port"; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use; no process was terminated" >&2
    exit 1
  fi
done

cleanup() {
  [ -z "${frontend_pid:-}" ] || kill "$frontend_pid" 2>/dev/null || true
  [ -z "${backend_pid:-}" ] || kill "$backend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM HUP

cd "$source_dir"
NODE_ENV=production PORT="$backend_port" CORS_ORIGIN="http://127.0.0.1:$frontend_port" node dist/server.js &
backend_pid=$!
API_PROXY_TARGET="http://127.0.0.1:$backend_port" npm run preview --prefix frontend -- --host 127.0.0.1 --port "$frontend_port" --strictPort &
frontend_pid=$!

attempt=0
until curl -fsS "http://127.0.0.1:$backend_port/health" >/dev/null && curl -fsS "http://127.0.0.1:$frontend_port/" >/dev/null; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 60 ] || { echo 'Services did not become ready' >&2; exit 1; }
  kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null || { echo 'A service exited before readiness' >&2; exit 1; }
  sleep 1
done
printf 'POS ready: frontend=http://127.0.0.1:%s backend=http://127.0.0.1:%s\n' "$frontend_port" "$backend_port"
wait "$backend_pid" "$frontend_pid"
