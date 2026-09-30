#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd
/usr/bin/time -p node --version
PORT="${PORT:-3000}"
export PORT
PROJECT_ROOT="$(/usr/bin/time -p pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$PWD}"
if /usr/bin/time -p test -f package.json; then
  /usr/bin/time -p npm install --no-audit --no-fund
  if /usr/bin/time -p node -e "const p=require('./package.json');process.exit(p.scripts&&p.scripts.build?0:1)"; then
    /usr/bin/time -p npm run build
  fi
fi
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p node -e "const fs=require('fs'),path=require('path');const root=process.cwd();const dir=root;fs.mkdirSync(process.env.OPENCODE_WEB_DIR||'/home/runner/work/_temp/omgithub-web',{recursive:true});fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR||'/home/runner/work/_temp/omgithub-web','deployment-output.json'),JSON.stringify({project:root,directory:dir}))"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-start.mjs"
