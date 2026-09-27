#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p bash -c 'echo "capture: URL=${CAPTURE_URL:-unset} DIR=${CAPTURE_DIR:-unset}"; test -n "${CAPTURE_URL:-}" && test -n "${CAPTURE_DIR:-}" || { echo "Set CAPTURE_URL and CAPTURE_DIR." >&2; exit 1; }'
/usr/bin/time -p mkdir -p "${CAPTURE_DIR:?}"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
