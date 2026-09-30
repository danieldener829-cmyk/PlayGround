#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_DIR_FIXED="/home/runner/work/PlayGround/PlayGround"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
RUNTIME_FALLBACK="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
PORT="${PORT:-3000}"
export PORT
/usr/bin/time -p pwd
/usr/bin/time -p test -f index.html
if /usr/bin/time -p test -f package.json; then
  if /usr/bin/time -p test -f package-lock.json; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p test -f vite.config.js -o -f vite.config.ts -o -f next.config.js; then
    /usr/bin/time -p npm run build
  fi
fi
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p /usr/bin/printf '%s' "{\"project\":\"$PROJECT_DIR_FIXED\",\"directory\":\"$PROJECT_DIR_FIXED\"}" > "$WEB_DIR/deployment-output.json"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
/usr/bin/time -p node "$RUNTIME_FALLBACK/scripts/default-start.mjs"
