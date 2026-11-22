#!/usr/bin/env bash
# Cloud Agent / local boot: bring up API (:8000) + Control Tower (:3000).
# Safe to re-run. Uses SQLite by default (no Docker/Postgres required for demo).
#
# Security: demo auth is loopback-only. Do not expose this stack to untrusted networks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Cursor Cloud build workdir may place the repo under /agent/repos/luxor9
if [ -d /agent/repos/luxor9 ]; then
  ROOT=/agent/repos/luxor9
fi
cd "$ROOT"

API_DIR="$ROOT/apps/api"
UI_DIR="$ROOT/apps/control-tower"
LOCK_DIR="${TMPDIR:-/tmp}/luxor9-cloud-start.lock"
API_HOST="${LUXOR9_API_HOST:-127.0.0.1}"
UI_HOST="${LUXOR9_UI_HOST:-127.0.0.1}"
# Browser-reachable API URL for Control Tower (override when using port forwarding).
API_PUBLIC_BASE="${LUXOR9_API_PUBLIC_BASE:-http://127.0.0.1:8000}"
CURL=(curl -sf --connect-timeout 1 --max-time 2)

cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

acquire_lock() {
  local attempts=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "luxor9 cloud-start: could not acquire lock at $LOCK_DIR" >&2
      exit 1
    fi
    sleep 1
  done
  trap cleanup_lock EXIT
}

require_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is required for cloud-start.sh (install tmux, then re-run)" >&2
    exit 1
  fi
}

api_ready() {
  local body
  body="$("${CURL[@]}" http://127.0.0.1:8000/health 2>/dev/null || true)"
  [[ "$body" == *"luxor9-api"* && "$body" == *"\"status\":\"ok\""* ]]
}

ui_ready() {
  local code
  code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ 2>/dev/null || true)"
  [[ "$code" == "200" || "$code" == "304" ]]
}

start_api() {
  if api_ready; then
    return 0
  fi
  tmux has-session -t luxor9_api 2>/dev/null && tmux kill-session -t luxor9_api || true
  # Bind demo-auth API to loopback by default (override LUXOR9_API_HOST only in trusted sandboxes).
  tmux new-session -d -s luxor9_api \
    "cd '$API_DIR' && AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development exec .venv/bin/uvicorn app.main:app --host '$API_HOST' --port 8000"
}

start_ui() {
  if ui_ready; then
    return 0
  fi
  tmux has-session -t luxor9_ui 2>/dev/null && tmux kill-session -t luxor9_ui || true
  tmux new-session -d -s luxor9_ui \
    "cd '$UI_DIR' && NEXT_PUBLIC_API_BASE_URL='$API_PUBLIC_BASE' AGUI_CMO_URL='$API_PUBLIC_BASE/api/v1/agui/cmo' exec npm run dev -- --hostname '$UI_HOST' --port 3000"
}

if [ ! -x "$API_DIR/.venv/bin/uvicorn" ]; then
  echo "API venv missing — run: make api-install" >&2
  exit 1
fi
if [ ! -d "$UI_DIR/node_modules" ]; then
  echo "Control Tower node_modules missing — run: make ui-install" >&2
  exit 1
fi

require_tmux
acquire_lock
start_api
start_ui

for _ in $(seq 1 90); do
  if api_ready && ui_ready; then
    echo "luxor9 ready — API :8000 ($API_HOST), Control Tower :3000 ($UI_HOST)"
    echo "browser API base: $API_PUBLIC_BASE"
    exit 0
  fi
  sleep 1
done

echo "luxor9 api or control tower did not become ready" >&2
tmux capture-pane -pt luxor9_api -S -80 2>/dev/null || true
tmux capture-pane -pt luxor9_ui -S -80 2>/dev/null || true
exit 1
