#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PROJECT_ROOT="$(pwd)"
PORT="${PORT:-3000}"
export PORT
STATIC_DIR="$PROJECT_ROOT"
OUT_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$OUT_DIR"
/usr/bin/time -p test -f "$STATIC_DIR/index.html"
/usr/bin/time -p bash -c 'if [ -f package.json ]; then if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi; fi'
/usr/bin/time -p bash -c 'if [ -f package.json ] && node -e "const p=require(\"./package.json\");process.exit(p.scripts&&p.scripts.build?0:1)"; then npm run build; fi'
/usr/bin/time -p bash -c 'if [ -d dist ] && [ -f dist/index.html ]; then echo dist; elif [ -d build ] && [ -f build/index.html ]; then echo build; else echo .; fi' > "$OUT_DIR/.static-subdir"
SUBDIR="$(cat "$OUT_DIR/.static-subdir")"
if [ "$SUBDIR" = "." ]; then ABS_DIR="$PROJECT_ROOT"; else ABS_DIR="$PROJECT_ROOT/$SUBDIR"; fi
/usr/bin/time -p node -e 'const fs=require("fs");const out=process.env.OUT||process.argv[1];const j={project:process.argv[2],directory:process.argv[3]};fs.writeFileSync(out,JSON.stringify(j));console.log("deployment-output:",JSON.stringify(j))' "$OUT_DIR/deployment-output.json" "$PROJECT_ROOT" "$ABS_DIR"
echo "Serving $ABS_DIR on port $PORT (project $PROJECT_ROOT)"
/usr/bin/time -p python3 -m http.server "$PORT" --directory "$ABS_DIR"
