#!/usr/bin/env bash
# LUMIÈRE Store — startup: install deps, build static dist/, publish
# deployment-output.json, serve Express (API + static) in foreground on PORT.
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p bash -c 'echo "project-root: $(pwd)"'
PROJECT_ROOT="$(/usr/bin/time -p pwd)"
PORT="${PORT:-3000}"
export PORT
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DIST_DIR="$PROJECT_ROOT/dist"

/usr/bin/time -p test -f package.json
/usr/bin/time -p test -f server.js
/usr/bin/time -p test -f public/index.html

# Dependencies (only when missing/stale).
if [[ ! -d "$PROJECT_ROOT/node_modules/express" ]]; then
  /usr/bin/time -p npm install --no-audit --no-fund
else
  /usr/bin/time -p bash -c 'echo "dependencies up to date, skipping npm install"'
fi

# Build: static source public/ -> dist/ (kept inside PROJECT_DIR).
/usr/bin/time -p rm -rf "$DIST_DIR"
/usr/bin/time -p mkdir -p "$DIST_DIR"
/usr/bin/time -p cp -r "$PROJECT_ROOT/public/." "$DIST_DIR/"
/usr/bin/time -p test -f "$DIST_DIR/index.html"

/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p bash -c 'printf "{\"project\":\"%s\",\"directory\":\"%s\"}" "$0" "$1" > "$2"' \
  "$PROJECT_ROOT" "$DIST_DIR" "$WEB_DIR/deployment-output.json"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"

echo "Serving ${PROJECT_ROOT} on PORT=${PORT} (static dist + API via server.js)"
exec node "$PROJECT_ROOT/server.js"
