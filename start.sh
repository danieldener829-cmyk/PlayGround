#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p bash -c 'PORT="${PORT:-3000}"; echo "HOSTBOTS start: PORT=$PORT"'
# Install dependencies when needed (preview is static; Next.js deps optional)
/usr/bin/time -p bash -c 'if [ -f package.json ] && [ ! -d node_modules ]; then npm install --no-audit --no-fund; else echo "deps ok (node_modules present or not required)"; fi'
# Build static preview when needed
/usr/bin/time -p bash -c 'if [ ! -f dist/index.html ]; then node scripts/build-static.mjs; else echo "dist ok"; fi'
# Publish deployment output (controller reads this)
/usr/bin/time -p bash -c 'OUT_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"; mkdir -p "$OUT_DIR"; printf "%s" "{\"project\":\"/home/runner/work/PlayGround/PlayGround\",\"directory\":\"/home/runner/work/PlayGround/PlayGround/dist\"}" > "$OUT_DIR/deployment-output.json"; cat "$OUT_DIR/deployment-output.json"; echo'
# Serve the static directory in the foreground on PORT (default 3000)
/usr/bin/time -p node scripts/serve-static.mjs
