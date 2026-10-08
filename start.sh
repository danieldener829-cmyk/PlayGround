#!/usr/bin/env bash
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p pwd
PROJECT_DIR="$(pwd)"
/usr/bin/time -p mkdir -p "$PROJECT_DIR/dist"
/usr/bin/time -p cp -f "$PROJECT_DIR/iptv-app/index.html" "$PROJECT_DIR/dist/index.html"
/usr/bin/time -p ls -l "$PROJECT_DIR/dist/index.html"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p printf '%s' "{\"project\":\"$PROJECT_DIR\",\"directory\":\"$PROJECT_DIR/dist\"}" > "$WEB_DIR/deployment-output.json"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
/usr/bin/time -p echo "serving dist on port ${PORT:-3000}"
PORT="${PORT:-3000}"
/usr/bin/time -p python3 --version
exec /usr/bin/time -p python3 -m http.server "$PORT" --directory "$PROJECT_DIR/dist"
