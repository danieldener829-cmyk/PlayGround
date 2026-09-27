#!/usr/bin/env bash
# ZapHost — start.sh
# Sobe o servidor Node (frontend + API de hospedagem) em foreground na $PORT.
set -euo pipefail
cd "$(dirname "$0")"

/usr/bin/time -p mkdir -p data public
if [[ -n "${OPENCODE_WEB_DIR:-}" ]]; then
  /usr/bin/time -p mkdir -p "$OPENCODE_WEB_DIR"
  /usr/bin/time -p node -e "const fs=require('fs');const path=require('path');const project=process.env.PROJECT_DIR||process.cwd();const dir=path.join(project,'public');fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR,'deployment-output.json'),JSON.stringify({project,directory:dir}))"
fi

PORT="${PORT:-3000}"
export PORT
echo "ZapHost ouvindo em http://0.0.0.0:${PORT}"
exec /usr/bin/time -p node server.mjs
