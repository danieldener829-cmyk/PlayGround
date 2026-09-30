#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
RUNTIME_FALLBACK="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"
/usr/bin/time -p test -n "${CAPTURE_URL:-}"
/usr/bin/time -p test -n "${CAPTURE_DIR:-}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "$RUNTIME_FALLBACK/scripts/default-capture.mjs"
/usr/bin/time -p test -f "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -f "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p node -e "const fs=require('fs');const path=require('path');const dir=process.env.CAPTURE_DIR;for(const n of ['final-desktop.png','final-mobile.png']){const p=path.join(dir,n);const b=fs.readFileSync(p);if(b.length<24||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'){console.error('Capture did not produce a PNG: '+n);process.exit(1);}console.log(n+': '+b.length+' bytes');}"
