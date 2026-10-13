#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_ROOT="$(/usr/bin/time -p pwd)"
export PROJECT_ROOT
/usr/bin/time -p bash -c 'echo "boot project=$PROJECT_ROOT port=${PORT:-3000}"'
PORT="${PORT:-3000}"
export PORT
DIST_DIR="$PROJECT_ROOT/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$DIST_DIR" "$WEB_DIR"
/usr/bin/time -p test -f "$DIST_DIR/index.html"
/usr/bin/time -p bash -c 'if test -f package.json; then echo "package.json found"; else echo "no package.json, static only"; fi'
/usr/bin/time -p bash -c 'if test -f package.json; then if test -f package-lock.json; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi; fi'
/usr/bin/time -p bash -c 'if test -f package.json && grep -q "\"build\"" package.json; then npm run build; else echo "no build step"; fi'
/usr/bin/time -p bash -c 'test -f "$1/index.html"' bash "$DIST_DIR"
/usr/bin/time -p bash -c 'PROJECT_ROOT="$1"; DIST_DIR="$2"; WEB_DIR="$3"; printf "{\"project\":\"%s\",\"directory\":\"%s\"}" "$PROJECT_ROOT" "$DIST_DIR" > "$WEB_DIR/deployment-output.json"; cat "$WEB_DIR/deployment-output.json"; echo' bash "$PROJECT_ROOT" "$DIST_DIR" "$WEB_DIR"
/usr/bin/time -p bash -c 'echo "serving $1 on port $2"' bash "$DIST_DIR" "$PORT"
exec /usr/bin/time -p python3 -m http.server "$PORT" --directory "$DIST_DIR" --bind 0.0.0.0
