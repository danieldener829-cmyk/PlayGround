#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
/usr/bin/time -p pwd
PORT="${PORT:-3000}"
/usr/bin/time -p test "$PORT" -ge 1
PROJECT_ROOT="$(/usr/bin/time -p pwd -P)"
if /usr/bin/time -p test -f package.json; then
  if /usr/bin/time -p test -f package-lock.json; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if /usr/bin/time -p node -e "process.exit(require('./package.json').scripts&&require('./package.json').scripts.build?0:1)"; then
    /usr/bin/time -p npm run build
  fi
fi
/usr/bin/time -p mkdir -p dist
if /usr/bin/time -p test -f index.html; then
  /usr/bin/time -p cp -f index.html dist/index.html
fi
/usr/bin/time -p test -f dist/index.html
/usr/bin/time -p node -e "const fs=require('fs');const path=require('path');const dir=process.env.OPENCODE_WEB_DIR||'/home/runner/work/_temp/omgithub-web';fs.mkdirSync(dir,{recursive:true});const project=process.cwd();const directory=path.join(project,'dist');if(!fs.existsSync(path.join(directory,'index.html')))throw new Error('Missing dist/index.html');fs.writeFileSync(path.join(dir,'deployment-output.json'),JSON.stringify({project,directory}))"
/usr/bin/time -p node -e "const http=require('http');const fs=require('fs');const path=require('path');const root=path.join(process.cwd(),'dist');const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wasm':'application/wasm'};http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(p!==path.resolve(root)&&!p.startsWith(path.resolve(root)+path.sep)){res.writeHead(404);res.end();return;}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');}catch{ p=path.join(root,'index.html'); }res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(fs.readFileSync(p));}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('serving '+root+' on '+ (process.env.PORT||3000)))"
