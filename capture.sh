#!/usr/bin/env bash
# ZapHost — capture.sh
# Aceita CAPTURE_URL e CAPTURE_DIR, gera final-desktop.png e final-mobile.png.
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
