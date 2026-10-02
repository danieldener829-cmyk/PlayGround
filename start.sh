#!/usr/bin/env bash
# PS2 HUB preview server: serves the static dist/ page (Android sources live in PS2Hub/).
set -euo pipefail
time -p cd "$(dirname "$0")"
time -p mkdir -p dist
if [[ ! -f dist/index.html ]]; then echo 'dist/index.html missing' >&2; exit 1; fi
# Optional JS build step (no-op for this static preview; kept for projects with package.json).
if [[ -f package.json ]]; then
  time -p npm install --no-audit --no-fund
  time -p npm run build
fi
PORT="${PORT:-3000}"
PROJECT_DIR_ABS="$(time -p pwd)"
DIST_ABS="$PROJECT_DIR_ABS/dist"
WEB_DIR="${OPENCODE_WEB_DIR:-}"
if [[ -n "$WEB_DIR" ]]; then
  time -p mkdir -p "$WEB_DIR"
  time -p node -e 'const fs=require("fs");fs.writeFileSync(process.argv[1],JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' "$WEB_DIR/deployment-output.json" "$PROJECT_DIR_ABS" "$DIST_ABS"
fi
echo "Serving $DIST_ABS on port $PORT (project $PROJECT_DIR_ABS)"
exec time -p node -e '
const http=require("http"),fs=require("fs"),path=require("path");
const root=process.argv[1],port=Number(process.argv[2]);
const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp"};
http.createServer((req,res)=>{
  try{
    const p=new URL(req.url,"http://localhost").pathname;
    let f=path.resolve(root,"."+decodeURIComponent(p));
    if(f!==path.resolve(root)&&!f.startsWith(path.resolve(root)+"/")){res.writeHead(404);res.end();return;}
    if(fs.statSync(f).isDirectory())f=path.join(f,"index.html");
    res.setHeader("Content-Type",mime[path.extname(f)]||"application/octet-stream");
    res.setHeader("Cache-Control","no-cache");
    res.end(fs.readFileSync(f));
  }catch{res.writeHead(404);res.end("Not found");}
}).listen(port,"0.0.0.0",()=>console.log("listening "+port));
' "$DIST_ABS" "$PORT"
