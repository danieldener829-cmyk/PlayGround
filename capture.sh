#!/usr/bin/env bash
# Capture desktop + mobile screenshots of the preview URL.
# Reads CAPTURE_URL and CAPTURE_DIR from the environment.
# Exit 75 = temporary navigation/browser infrastructure failure.
# Exit 1  = script or rendering defect. Leaves the app running.
set -euo pipefail
time -p cd "$(dirname "$0")"
/usr/bin/time -p test -n "${CAPTURE_URL:?Set CAPTURE_URL.}"
/usr/bin/time -p test -n "${CAPTURE_DIR:?Set CAPTURE_DIR.}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
