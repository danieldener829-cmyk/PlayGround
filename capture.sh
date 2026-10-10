#!/usr/bin/env bash
# Final capture: open $CAPTURE_URL, wait for rendered SPA content, save
# final-desktop.png (1440x900) and final-mobile.png (390x844) into $CAPTURE_DIR.
# Exit 75 = temporary navigation/browser infrastructure failure.
# Exit 1  = script usage or rendering defect. Leaves the app server running.
set -euo pipefail
URL="${CAPTURE_URL:?CAPTURE_URL environment variable must be set}"
OUT="${CAPTURE_DIR:?CAPTURE_DIR environment variable must be set}"
SESSION="omgithub-final-capture"
RUNTIME_PM="${HOME}/.local/share/omgithub-playwright"

/usr/bin/time -p mkdir -p "$OUT"

# Headed-Chromium display (persistent Xvfb), only if not already set.
if [[ -z "${DISPLAY:-}" && -f "$RUNTIME_PM/display" ]]; then
  export DISPLAY=":$(/usr/bin/time -p cat "$RUNTIME_PM/display")"
fi

cleanup() { /usr/bin/time -p playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true; }
trap cleanup EXIT

# Pre-flight HTTP check through the exact public URL.
code="$(/usr/bin/time -p curl --silent --location --max-time 20 --output /dev/null --write-out '%{http_code}' "$URL" 2>/dev/null)" || code="000"
echo "preview HTTP status: $code"
if [[ "$code" == 2* ]]; then
  :
elif [[ "$code" == "000" || "$code" == "408" || "$code" == "429" || "$code" == 5* ]]; then
  echo "Temporary preview/navigation failure (HTTP $code)." >&2
  exit 75
else
  echo "Preview rejected the request (HTTP $code)." >&2
  exit 1
fi

# Desktop: open exact URL (own browser session, system Chrome channel).
# (--browser chrome: uses installed google-chrome; the pinned bundled
# chromium may not be downloaded on this worker.)
/usr/bin/time -p playwright-cli -s="$SESSION" open --browser chrome "$URL" || { echo "Browser open/navigation failed (infra)." >&2; exit 75; }
/usr/bin/time -p playwright-cli -s="$SESSION" resize 1440 900 || { echo "Browser resize failed (infra)." >&2; exit 75; }
/usr/bin/time -p sleep 6
# Wait for SPA render: brand + product cards must appear in the snapshot.
rendered=false
for i in 1 2 3; do
  if /usr/bin/time -p playwright-cli -s="$SESSION" snapshot | grep -qiE "LUMI|card|Ofertas"; then rendered=true; break; fi
  /usr/bin/time -p sleep 4
done
[[ "$rendered" == true ]] || { echo "App rendered no content (rendering defect)." >&2; exit 1; }
/usr/bin/time -p playwright-cli -s="$SESSION" screenshot --filename "$OUT/final-desktop.png" || { echo "Desktop screenshot failed (infra)." >&2; exit 75; }

# Mobile: same URL, narrow viewport, reload for responsive layout.
# (playwright-cli --mobile emulates a device; explicit resize keeps it deterministic.)
/usr/bin/time -p playwright-cli -s="$SESSION" resize 390 844 || { echo "Browser resize failed (infra)." >&2; exit 75; }
/usr/bin/time -p playwright-cli -s="$SESSION" goto "$URL" || { echo "Mobile navigation failed (infra)." >&2; exit 75; }
/usr/bin/time -p sleep 6
/usr/bin/time -p playwright-cli -s="$SESSION" snapshot | grep -qiE "LUMI|card|Ofertas" || { echo "Mobile view rendered no content (rendering defect)." >&2; exit 1; }
/usr/bin/time -p playwright-cli -s="$SESSION" screenshot --filename "$OUT/final-mobile.png" || { echo "Mobile screenshot failed (infra)." >&2; exit 75; }

/usr/bin/time -p test -s "$OUT/final-desktop.png"
/usr/bin/time -p test -s "$OUT/final-mobile.png"
/usr/bin/time -p ls -la "$OUT"
/usr/bin/time -p playwright-cli -s="$SESSION" close
trap - EXIT
echo "Capture complete: $OUT/final-desktop.png + $OUT/final-mobile.png"
