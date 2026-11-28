#!/usr/bin/env bash
# Cloud Agent / local boot: bring up API (:8000) + Control Tower (:3000).
# Safe to re-run. Uses SQLite by default (no Docker/Postgres required for demo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Cursor Cloud build workdir may place the repo under /agent/repos/luxor9
if [ -d /agent/repos/luxor9 ]; then
  ROOT=/agent/repos/luxor9
fi
cd "$ROOT"

API_DIR="$ROOT/apps/api"
UI_DIR="$ROOT/apps/control-tower"

if [ ! -x "$API_DIR/.venv/bin/uvicorn" ]; then
  echo "API venv missing — run: make api-install" >&2
  exit 1
fi
if [ ! -d "$UI_DIR/node_modules" ]; then
  echo "Control Tower node_modules missing — run: make ui-install" >&2
  exit 1
fi

if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  tmux has-session -t luxor9_api 2>/dev/null && tmux kill-session -t luxor9_api || true
  tmux new-session -d -s luxor9_api "cd '$API_DIR' && AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000"
fi

if ! curl -sf -o /dev/null http://127.0.0.1:3000/; then
  tmux has-session -t luxor9_ui 2>/dev/null && tmux kill-session -t luxor9_ui || true
  tmux new-session -d -s luxor9_ui "cd '$UI_DIR' && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 AGUI_CMO_URL=http://127.0.0.1:8000/api/v1/agui/cmo exec npm run dev -- --hostname 0.0.0.0 --port 3000"
fi

for _ in $(seq 1 90); do
  if curl -sf http://127.0.0.1:8000/health >/dev/null && curl -sf -o /dev/null http://127.0.0.1:3000/; then
    echo "luxor9 ready — API :8000, Control Tower :3000"
    exit 0
  fi
  sleep 1
done

echo "luxor9 api or control tower did not become ready" >&2
tmux capture-pane -pt luxor9_api -S -80 2>/dev/null || true
tmux capture-pane -pt luxor9_ui -S -80 2>/dev/null || true
exit 1
