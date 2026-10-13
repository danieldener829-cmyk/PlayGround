#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd
/usr/bin/time -p bash -c 'echo "capture url=${CAPTURE_URL:?Set CAPTURE_URL} dir=${CAPTURE_DIR:?Set CAPTURE_DIR}"'
: "${CAPTURE_URL:?Set CAPTURE_URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR}"
: "${RUNTIME_DIR:?Set RUNTIME_DIR}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --check "$RUNTIME_DIR/scripts/default-capture.mjs" 2>/dev/null || /usr/bin/time -p echo "node check done"
set +e
/usr/bin/time -p node "$RUNTIME_DIR/scripts/default-capture.mjs"
STATUS=$?
set -e
/usr/bin/time -p ls -lh "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png" || exit $STATUS
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p bash -c 'echo "capture done, app left running"'
exit $STATUS
