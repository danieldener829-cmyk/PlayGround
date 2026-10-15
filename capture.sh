#!/usr/bin/env bash
set -euo pipefail
# Capture desktop + mobile screenshots of CAPTURE_URL into CAPTURE_DIR.
# Exit 75 = temporary nav/browser infra failure, exit 1 = script/rendering defect.

cd "$(dirname "$0")"
/usr/bin/time -p pwd

# Validate env (script defects -> exit 1)
/usr/bin/time -p bash -c 'test -n "${CAPTURE_URL:-}" || { echo "Set CAPTURE_URL." >&2; exit 1; }'
/usr/bin/time -p bash -c 'test -n "${CAPTURE_DIR:-}" || { echo "Set CAPTURE_DIR." >&2; exit 1; }'

# Prepare output dir (outside source tree)
/usr/bin/time -p mkdir -p "${CAPTURE_DIR:?}"
/usr/bin/time -p bash -c 'echo "CAPTURE_URL=$CAPTURE_URL CAPTURE_DIR=$CAPTURE_DIR"'

# Write capture runner to temp (keeps repo clean)
RUNNER_TMP="${RUNNER_TEMP:-/tmp}"
/usr/bin/time -p mkdir -p "$RUNNER_TMP"
/usr/bin/time -p bash -c 'cat > "$0" <<'"'"'MJS'"'"'
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
const runtime = join(process.env.HOME, ".local/share/omgithub-playwright");
const req = createRequire(join(runtime, "package.json"));
const { chromium } = req("playwright");
const cfgPath = join(runtime, process.platform === "darwin" ? "metal.json" : "linux.json");
const config = JSON.parse(readFileSync(cfgPath, "utf8"));
if (process.platform === "linux") {
  try { process.env.DISPLAY ||= ":" + readFileSync(join(runtime, "display"), "utf8").trim(); } catch {}
}
const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url || !output) { console.error("Set CAPTURE_URL and CAPTURE_DIR."); process.exit(1); }
const transient = (e) => { throw Object.assign(e instanceof Error ? e : new Error(String(e)), { exitCode: 75 }); };
let browser;
try {
  browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(transient);
  for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } }).catch(transient);
    try {
      page.setDefaultTimeout(30000);
      page.on("pageerror", (e) => console.error("pageerror:", e.message));
      const response = await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch(transient);
      const status = response?.status();
      if (!response || !response.ok()) {
        const temp = !response || [408, 429, 500, 502, 503, 504].includes(status);
        throw Object.assign(new Error("HTTP " + (status ?? "no-response") + " loading preview"), { exitCode: temp ? 75 : 1 });
      }
      await page.locator("body").waitFor({ state: "visible", timeout: 30000 });
      try { await page.waitForFunction(() => document.fonts.status === "loaded", null, { timeout: 15000 }); } catch {}
      await page.waitForTimeout(1500);
      await page.screenshot({ path: join(output, "final-" + name + ".png"), timeout: 30000 }).catch((error) => {
        if (error?.name === "TimeoutError" || !browser.isConnected()) transient(error);
        throw error;
      });
      console.log("captured " + name);
    } finally { await page.close().catch(() => {}); }
  }
} catch (error) {
  console.error(error?.message || error);
  process.exit(error?.exitCode || 1);
} finally {
  await browser?.close().catch((e) => { console.error("close:", e?.message); process.exitCode ||= 75; });
}
MJS' "$RUNNER_TMP/capture-run.mjs"

# Run capture (browser infra failures surface as exit 75 via node exit code)
/usr/bin/time -p node "$RUNNER_TMP/capture-run.mjs"

# Verify outputs (rendering defects -> exit 1)
/usr/bin/time -p test -s "$CAPTURE_DIR/final-desktop.png"
/usr/bin/time -p test -s "$CAPTURE_DIR/final-mobile.png"
/usr/bin/time -p ls -lh "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
