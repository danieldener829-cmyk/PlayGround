#!/usr/bin/env bash
set -euo pipefail
# IA Tube Master - static site launcher
# Serves pre-built static output in ./dist on PORT (default 3000) in foreground.
# Writes deployment-output.json for the controller.

# 1) Go to project directory (script dir)
cd "$(dirname "$0")"
/usr/bin/time -p pwd

# 2) Resolve dirs and port
PROJECT_DIR="$(/usr/bin/time -p pwd | tail -n 1)"
# Ensure we have absolute PROJECT_DIR even if time wraps output
PROJECT_DIR="$(pwd)"
PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
SRC_DIR="$PROJECT_DIR/site-ia-youtube"
DIST_DIR="$PROJECT_DIR/dist"

/usr/bin/time -p bash -c "echo PROJECT_DIR=$PROJECT_DIR PORT=$PORT DIST=$DIST_DIR"

/usr/bin/time -p mkdir -p "$DIST_DIR" "$OPENCODE_WEB_DIR"

# 3) Install dependencies when needed (no external deps for this static site)
if [ -f "$PROJECT_DIR/package.json" ]; then
  /usr/bin/time -p bash -c "cd \"$PROJECT_DIR\" && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)"
else
  /usr/bin/time -p echo "no package.json - skipping npm install"
fi

# 4) Build: copy static source into dist (idempotent)
/usr/bin/time -p bash -c "mkdir -p \"$DIST_DIR\" && cp -f \"$SRC_DIR/index.html\" \"$SRC_DIR/admin.html\" \"$SRC_DIR/styles.css\" \"$SRC_DIR/app.js\" \"$SRC_DIR/admin.js\" \"$DIST_DIR/\" && ls -lh \"$DIST_DIR\""

/usr/bin/time -p test -f "$DIST_DIR/index.html"

# 5) Write deployment output for controller (absolute paths inside PROJECT_DIR)
/usr/bin/time -p bash -c "printf '%s' '{\"project\":\"$PROJECT_DIR\",\"directory\":\"$DIST_DIR\"}' > \"$OPENCODE_WEB_DIR/deployment-output.json\" && cat \"$OPENCODE_WEB_DIR/deployment-output.json\" && echo"

# 6) Serve in foreground (controller reuses healthy server on PORT)
/usr/bin/time -p echo "serving $DIST_DIR on 0.0.0.0:$PORT"
exec python3 -m http.server "$PORT" --directory "$DIST_DIR" --bind 0.0.0.0
