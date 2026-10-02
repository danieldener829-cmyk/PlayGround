#!/usr/bin/env bash
# Capture desktop + mobile screenshots of CAPTURE_URL into CAPTURE_DIR.
# Exit 75 = transient infra failure; exit 1 = script/rendering defect.
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p test -n "${CAPTURE_URL:?Set CAPTURE_URL}"
time -p test -n "${CAPTURE_DIR:?Set CAPTURE_DIR}"
time -p mkdir -p "$CAPTURE_DIR"
RUN_TMP="${RUNNER_TEMP:-/tmp}"
time -p mkdir -p "$RUN_TMP"
time -p cat > "$RUN_TMP/ps2hub-capture.cjs" <<'EOF'
const { mkdirSync } = require("fs");
const { join } = require("path");
const RUNTIME = join(process.env.HOME, ".local/share/omgithub-playwright");
const { createRequire } = require("module");
const need = createRequire(join(RUNTIME, "package.json"));
const { chromium } = need("playwright");
const url = process.env.CAPTURE_URL, out = process.env.CAPTURE_DIR;
if (!url || !out) { console.error("Set CAPTURE_URL and CAPTURE_DIR."); process.exit(1); }
mkdirSync(out, { recursive: true });
const transient = (e) => { const err = e instanceof Error ? e : new Error(String(e)); err.exitCode = 75; throw err; };
(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] }).catch(transient);
    for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
      const page = await browser.newPage({ viewport: { width: w, height: h } }).catch(transient);
      page.setDefaultTimeout(30000);
      const resp = await page.goto(url, { waitUntil: "load", timeout: 45000 }).catch(transient);
      const status = resp ? resp.status() : 0;
      if (!resp || !resp.ok()) {
        const code = (!resp || [408, 429, 500, 502, 503, 504].includes(status)) ? 75 : 1;
        const err = new Error("HTTP " + status + " loading preview");
        err.exitCode = code; throw err;
      }
      await page.locator("body").waitFor({ state: "visible" }).catch(transient);
      await page.waitForFunction(() => document.fonts.status === "loaded").catch(() => {});
      const text = await page.evaluate(() => document.body.innerText.slice(0, 4000)).catch(() => "");
      if (!/PS2 HUB/i.test(text)) { console.error("Render check failed: PS2 HUB not found. Got: " + text.slice(0, 200)); process.exitCode = 1; await page.close().catch(()=>{}); continue; }
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(out, "final-" + name + ".png"), timeout: 30000 }).catch((e) => {
        if (e.name === "TimeoutError") transient(e);
        throw e;
      });
      console.log("captured " + name);
      await page.close();
    }
  } catch (e) { console.error(e && e.message ? e.message : e); process.exitCode = (e && e.exitCode) || 1; }
  finally { await browser?.close().catch((e) => { console.error(e); process.exitCode = process.exitCode || 75; }); }
})();
EOF
time -p node "$RUN_TMP/ps2hub-capture.cjs"
