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
LOCK_PID_FILE="$LOCK_DIR/pid"
API_HOST="${LUXOR9_API_HOST:-127.0.0.1}"
UI_HOST="${LUXOR9_UI_HOST:-127.0.0.1}"
# Probe bind-all hosts via loopback; otherwise probe the configured bind address.
API_PROBE_HOST="$API_HOST"
UI_PROBE_HOST="$UI_HOST"
if [ "$API_HOST" = "0.0.0.0" ] || [ "$API_HOST" = "::" ]; then
  API_PROBE_HOST="127.0.0.1"
fi
if [ "$UI_HOST" = "0.0.0.0" ] || [ "$UI_HOST" = "::" ]; then
  UI_PROBE_HOST="127.0.0.1"
fi
# Browser-reachable API URL for Control Tower (override when using port forwarding).
API_PUBLIC_BASE="${LUXOR9_API_PUBLIC_BASE:-http://127.0.0.1:8000}"
# Optional browser-facing UI origin for CORS when using port forwarding.
UI_PUBLIC_ORIGIN="${LUXOR9_UI_PUBLIC_ORIGIN:-}"
CURL=(curl -sf --connect-timeout 1 --max-time 2)

is_loopback_host() {
  case "$1" in
    127.0.0.1|localhost|::1) return 0 ;;
    *) return 1 ;;
  esac
}

cleanup_lock() {
  rmdir "$LOCK_DIR" 2>/dev/null || true
}

acquire_lock() {
  local attempts=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    if [ -f "$LOCK_PID_FILE" ]; then
      local holder
      holder="$(cat "$LOCK_PID_FILE" 2>/dev/null || true)"
      if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
        echo "luxor9 cloud-start: clearing stale lock from pid $holder" >&2
        rm -rf "$LOCK_DIR"
        continue
      fi
    else
      # Empty/orphaned lock dir with no pid — treat as stale.
      rm -rf "$LOCK_DIR"
      continue
    fi
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "luxor9 cloud-start: could not acquire lock at $LOCK_DIR" >&2
      exit 1
    fi
    sleep 1
  done
  echo "$$" >"$LOCK_PID_FILE"
  trap 'rm -f "$LOCK_PID_FILE"; cleanup_lock' EXIT
}

require_tmux() {
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is required for cloud-start.sh (install tmux, then re-run)" >&2
    exit 1
  fi
}

api_ready() {
  local body
  body="$("${CURL[@]}" "http://${API_PROBE_HOST}:8000/health" 2>/dev/null || true)"
  [[ "$body" == *"luxor9-api"* && "$body" == *"\"status\":\"ok\""* ]]
}

ui_ready() {
  local code
  code="$("${CURL[@]}" -o /dev/null -w '%{http_code}' "http://${UI_PROBE_HOST}:3000/" 2>/dev/null || true)"
  [[ "$code" == "200" || "$code" == "304" ]]
}

start_api() {
  if api_ready; then
    return 0
  fi
  # Demo auth must stay loopback-only.
  if ! is_loopback_host "$API_HOST"; then
    echo "LUXOR9_API_HOST=$API_HOST rejected: demo auth requires loopback (127.0.0.1/localhost)" >&2
    exit 1
  fi
  local cors_prefix=""
  if [ -n "$UI_PUBLIC_ORIGIN" ]; then
    cors_prefix="API_CORS_ORIGINS='${UI_PUBLIC_ORIGIN},http://localhost:3000,http://127.0.0.1:3000' "
  fi
  tmux has-session -t luxor9_api 2>/dev/null && tmux kill-session -t luxor9_api || true
  tmux new-session -d -s luxor9_api \
    "cd '$API_DIR' && ${cors_prefix}AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development exec .venv/bin/uvicorn app.main:app --host '$API_HOST' --port 8000"
}

start_ui() {
  if ui_ready; then
    return 0
  fi
  if ! is_loopback_host "$UI_HOST" && [ "$UI_HOST" != "0.0.0.0" ]; then
    echo "LUXOR9_UI_HOST=$UI_HOST rejected for demo boot (use 127.0.0.1 or 0.0.0.0)" >&2
    exit 1
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
    if [ -n "$UI_PUBLIC_ORIGIN" ]; then
      echo "CORS UI origin: $UI_PUBLIC_ORIGIN"
    fi
    exit 0
  fi
  sleep 1
done

echo "luxor9 api or control tower did not become ready" >&2
tmux capture-pane -pt luxor9_api -S -80 2>/dev/null || true
tmux capture-pane -pt luxor9_ui -S -80 2>/dev/null || true
exit 1
