// ZapHost — servidor de hospedagem pra bot Discord (zero deps, só Node built-in)
import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, appendFileSync, renameSync } from 'node:fs';
import { join, resolve, extname, basename, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname));
const PUB = join(ROOT, 'public');
const DATA = join(ROOT, 'data');
mkdirSync(DATA, { recursive: true });

const DB = join(DATA, 'bots.json');
const procs = new Map(); // id -> { proc, logs: [], status }
const MAX_LOG = 800;

function loadDB() {
  try { return JSON.parse(readFileSync(DB, 'utf8')); }
  catch { return []; }
}
function saveDB(bots) { writeFileSync(DB, JSON.stringify(bots, null, 2)); }
function getBot(id) { return loadDB().find(b => b.id === id); }
function patchBot(id, patch) {
  const bots = loadDB();
  const i = bots.findIndex(b => b.id === id);
  if (i < 0) return null;
  bots[i] = { ...bots[i], ...patch };
  saveDB(bots);
  return bots[i];
}
function botDir(id) { return join(DATA, id); }
function appDir(id) { return join(DATA, id, 'app'); }
function logFile(id) { return join(DATA, id, 'logs.txt'); }

function pushLog(id, line) {
  line = String(line).replace(/\r/g, '').slice(0, 2000);
  const entry = procs.get(id) || { logs: [] };
  entry.logs = entry.logs || [];
  entry.logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${line}`);
  if (entry.logs.length > MAX_LOG) entry.logs = entry.logs.slice(-MAX_LOG);
  procs.set(id, entry);
  try { appendFileSync(logFile(id), `[${new Date().toISOString()}] ${line}\n`); } catch {}
}
function fullLogs(id) {
  const mem = (procs.get(id)?.logs || []).join('\n');
  let disk = '';
  try {
    const c = readFileSync(logFile(id), 'utf8');
    disk = c.split('\n').slice(-400).join('\n');
  } catch {}
  const merged = (disk + '\n' + mem).slice(-12000);
  return merged.trim();
}
function listFilesRecursive(dir, base = '', out = []) {
  if (out.length > 300) return out;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (out.length > 300) break;
    if (e.name === 'node_modules' || e.name === '__MACOSX' || e.name === '.git') continue;
    const rel = base ? base + '/' + e.name : e.name;
    const full = join(dir, e.name);
    if (e.isDirectory()) listFilesRecursive(full, rel, out);
    else out.push(rel);
  }
  return out;
}
function detectMain(id) {
  const dir = appDir(id);
  const files = listFilesRecursive(dir);
  const has = (n) => files.includes(n);
  // package.json main
  if (has('package.json')) {
    try {
      const p = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      if (p.main && has(p.main)) return { runtime: 'node', main: p.main, files };
      if (p.main && existsSync(join(dir, p.main))) return { runtime: 'node', main: p.main, files };
    } catch {}
  }
  const jsC = ['index.js', 'bot.js', 'main.js', 'app.js', 'src/index.js', 'src/bot.js', 'src/main.js', 'bot/index.js'];
  for (const c of jsC) if (has(c)) return { runtime: 'node', main: c, files };
  const pyC = ['bot.py', 'main.py', 'app.py', 'index.py', 'src/main.py', 'src/bot.py', 'bot/main.py'];
  for (const c of pyC) if (has(c)) return { runtime: 'python', main: c, files };
  const anyJs = files.find(f => f.endsWith('.js') && !f.includes('/') && !f.startsWith('.'));
  if (anyJs) return { runtime: 'node', main: anyJs, files };
  const anyPy = files.find(f => f.endsWith('.py'));
  if (anyPy) return { runtime: 'python', main: anyPy, files };
  return { runtime: 'node', main: '', files };
}
function looksLikePython(s) {
  if (!s) return false;
  const head = s.slice(0, 2000);
  if (/^\s*(from\s+[\w.]+\s+import\s+|import\s+discord\b|from\s+discord\b)/m.test(head)) return true;
  return /^\s*def\s+\w+\s*\(/m.test(head) && /^\s*(import\s+\w+|from\s+\S+\s+import\s+)/m.test(head);
}
function looksLikeJS(s) {
  if (!s) return false;
  return /require\s*\(\s*['"]|module\.exports|console\.log|process\.env|=>/.test(s.slice(0, 2000));
}
const run = (file, args, opts) => new Promise((res, rej) => {
  execFile(file, args, { timeout: 120000, maxBuffer: 8 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
    if (err) rej(Object.assign(err, { stdout, stderr }));
    else res({ stdout, stderr });
  });
});

async function installDeps(id, bot, onLog) {
  const dir = appDir(id);
  const files = listFilesRecursive(dir);
  if (files.includes('package.json') && !existsSync(join(dir, 'node_modules'))) {
    onLog('📦 package.json encontrado — rodando npm install…');
    try {
      const p = await run('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir });
      onLog('✅ dependências Node instaladas.');
      if (p.stderr) onLog(String(p.stderr).slice(-500));
    } catch (e) {
      onLog('⚠️ npm install falhou: ' + (e.stderr || e.message || e).toString().slice(-800));
    }
  }
  if (files.includes('requirements.txt')) {
    onLog('🐍 requirements.txt encontrado — rodando pip install…');
    try {
      const p = await run('python3', ['-m', 'pip', 'install', '-r', 'requirements.txt'], { cwd: dir });
      onLog('✅ dependências Python instaladas.');
      if (p.stderr) onLog(String(p.stderr).slice(-500));
    } catch (e) {
      onLog('⚠️ pip install falhou: ' + (e.stderr || e.message || e).toString().slice(-800));
    }
  }
}

function buildStartCmd(bot) {
  if (bot.startCmd && bot.startCmd.trim()) return { cmd: bot.startCmd.trim(), shell: true };
  const main = bot.main || '';
  if (!main) return null;
  if (main.endsWith('.py')) return { cmd: `python3 "${main}"`, shell: true };
  return { cmd: `node "${main}"`, shell: true };
}

async function startBot(id) {
  let bot = getBot(id);
  if (!bot) throw new Error('Bot não encontrado');
  stopProc(id);
  patchBot(id, { status: 'installing' });
  pushLog(id, '🚀 Iniciando deploy…');
  // auto-detect se necessário
  if (!bot.main) {
    const d = detectMain(id);
    bot = patchBot(id, { runtime: d.runtime, main: d.main, files: d.files });
    pushLog(id, d.main ? `🔍 Detectado: ${d.runtime} → ${d.main}` : '⚠️ Nenhum arquivo principal detectado. Configure manualmente.');
  } else if (!bot.files?.length) {
    const d = detectMain(id);
    bot = patchBot(id, { runtime: bot.runtime || d.runtime, files: d.files });
  }
  if (!bot.main) { patchBot(id, { status: 'offline' }); pushLog(id, '❌ Configure o arquivo principal (ex: index.js ou bot.py).'); return bot; }
  patchBot(id, { status: 'installing' });
  await installDeps(id, bot, (m) => pushLog(id, m));
  bot = getBot(id);
  const sc = buildStartCmd(bot);
  if (!sc) { patchBot(id, { status: 'offline' }); return bot; }
  pushLog(id, `⚡ Rodando: ${sc.cmd}  (cwd=app, DISCORD_TOKEN=${bot.token ? '***definido***' : 'ausente'})`);
  const child = spawn(sc.cmd, {
    cwd: appDir(id),
    shell: true,
    env: { ...process.env, DISCORD_TOKEN: bot.token || '', BOT_TOKEN: bot.token || '', TOKEN: bot.token || '' },
  });
  procs.set(id, { ...(procs.get(id) || {}), proc: child, logs: procs.get(id)?.logs || [] });
  patchBot(id, { status: 'online', startedAt: Date.now() });
  child.stdout?.on('data', (d) => String(d).split('\n').filter(Boolean).forEach(l => pushLog(id, l)));
  child.stderr?.on('data', (d) => String(d).split('\n').filter(Boolean).forEach(l => pushLog(id, 'ERR: ' + l)));
  child.on('exit', (code, sig) => {
    const still = procs.get(id);
    if (still?.proc === child) {
      procs.set(id, { logs: still.logs || [] });
      const cur = getBot(id);
      if (cur && cur.status === 'online') {
        patchBot(id, { status: 'offline' });
        pushLog(id, `⏹ Processo encerrou (code=${code} sig=${sig}). Verifique o token e o código.`);
      }
    }
  });
  return getBot(id);
}
function stopProc(id) {
  const e = procs.get(id);
  if (e?.proc && !e.proc.killed) {
    try { e.proc.kill('SIGTERM'); } catch {}
    setTimeout(() => { try { e.proc?.kill('SIGKILL'); } catch {} }, 2500);
  }
  if (e) procs.set(id, { logs: e.logs || [] });
}

// 🛠️ Auto-reparo: diagnostica problemas comuns, corrige e deixa o bot online
async function repairBot(id) {
  let bot = getBot(id);
  if (!bot) throw new Error('Bot não encontrado');
  const fixes = [];
  stopProc(id);
  patchBot(id, { status: 'installing' });
  pushLog(id, '🛠️ Auto-reparo iniciado…');
  const dir = appDir(id);
  // 1) principal ausente ou apontando p/ arquivo que não existe
  const d = detectMain(id);
  if (!bot.main || !existsSync(join(dir, bot.main))) {
    if (d.main) {
      bot = patchBot(id, { runtime: d.runtime, main: d.main, files: d.files });
      fixes.push(`principal corrigido: ${d.main}`);
      pushLog(id, `🔧 Principal corrigido → ${d.main}`);
    } else {
      bot = patchBot(id, { files: d.files });
      pushLog(id, '❌ Nenhum arquivo principal encontrado. Envie um ZIP com index.js ou bot.py.');
      patchBot(id, { status: 'offline' });
      return { bot: getBot(id), fixes, logs: fullLogs(id) };
    }
  } else if (!bot.files?.length) {
    bot = patchBot(id, { runtime: bot.runtime || d.runtime, files: d.files });
  }
  bot = getBot(id);
  // 2) comando custom quebrado (aponta p/ arquivo inexistente)
  if (bot.startCmd && /\.(js|py)\b/.test(bot.startCmd)) {
    const mref = bot.startCmd.match(/[\w\-./]+\.(js|py)/);
    if (mref && !existsSync(join(dir, mref[0]))) {
      bot = patchBot(id, { startCmd: '' });
      fixes.push('comando custom inválido removido');
      pushLog(id, '🔧 Comando custom apontava p/ arquivo inexistente — removido.');
    }
  }
  // 3) checagem de sintaxe antes de subir (detecta linguagem trocada: Python em .js e vice-versa)
  bot = getBot(id);
  const syntaxFail = (main, e) => {
    const msg = String(e.stderr || e.message || '').split('\n').slice(0, 3).join(' ').slice(0, 300);
    pushLog(id, '❌ Erro de sintaxe em ' + main + ': ' + msg);
    fixes.push('erro de sintaxe em ' + main + ' — veja os logs');
    patchBot(id, { status: 'offline' });
  };
  if (bot.main?.endsWith('.js')) {
    try { await run('node', ['--check', join(dir, bot.main)]); fixes.push('sintaxe JS ok'); }
    catch (e) {
      let content = '';
      try { content = readFileSync(join(dir, bot.main), 'utf8'); } catch {}
      if (looksLikePython(content)) {
        const newMain = bot.main.replace(/\.js$/, '.py');
        try {
          renameSync(join(dir, bot.main), join(dir, newMain));
          bot = patchBot(id, { runtime: 'python', main: newMain });
          fixes.push(`código Python estava em .js — renomeado para ${newMain}`);
          pushLog(id, `🔧 Código Python em arquivo .js — renomeado para ${newMain}.`);
          try { await run('python3', ['-m', 'py_compile', join(dir, newMain)]); fixes.push('sintaxe Python ok'); }
          catch (e2) { syntaxFail(newMain, e2); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
        } catch (err) { syntaxFail(bot.main, e); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
      } else { syntaxFail(bot.main, e); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
    }
  } else if (bot.main?.endsWith('.py')) {
    try { await run('python3', ['-m', 'py_compile', join(dir, bot.main)]); fixes.push('sintaxe Python ok'); }
    catch (e) {
      let content = '';
      try { content = readFileSync(join(dir, bot.main), 'utf8'); } catch {}
      if (looksLikeJS(content)) {
        const newMain = bot.main.replace(/\.py$/, '.js');
        try {
          renameSync(join(dir, bot.main), join(dir, newMain));
          bot = patchBot(id, { runtime: 'node', main: newMain });
          fixes.push(`código JS estava em .py — renomeado para ${newMain}`);
          pushLog(id, `🔧 Código JavaScript em arquivo .py — renomeado para ${newMain}.`);
          try { await run('node', ['--check', join(dir, newMain)]); fixes.push('sintaxe JS ok'); }
          catch (e2) { syntaxFail(newMain, e2); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
        } catch (err) { syntaxFail(bot.main, e); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
      } else { syntaxFail(bot.main, e); return { bot: getBot(id), fixes, logs: fullLogs(id) }; }
    }
  }
  // 3b) requirements.txt com pacotes Node num bot Python (ex: discord.js@...) → reescreve p/ pip
  bot = getBot(id);
  if (bot.runtime === 'python') {
    const reqPath = join(dir, 'requirements.txt');
    if (existsSync(reqPath)) {
      let req = '';
      try { req = readFileSync(reqPath, 'utf8'); } catch {}
      if (!/discord\.py/i.test(req) && /discord\.js|better-sqlite3|dotenv@|@\d+\.\d+/i.test(req)) {
        let mainCode = '';
        try { mainCode = readFileSync(join(dir, bot.main), 'utf8'); } catch {}
        writeFileSync(reqPath, 'discord.py\n' + (/dotenv|load_dotenv/.test(mainCode) ? 'python-dotenv\n' : ''));
        fixes.push('requirements.txt corrigido para Python (discord.py)');
        pushLog(id, '🔧 requirements.txt tinha pacotes Node — reescrito para discord.py.');
        try { rmSync(join(dir, 'node_modules'), { recursive: true, force: true }); } catch {}
      }
    }
  }
  // 3c) token colado no código → passa a vir da env DISCORD_TOKEN (some com o vazamento do disco)
  bot = getBot(id);
  try {
    const mainPath = join(dir, bot.main);
    let code = readFileSync(mainPath, 'utf8');
    if (/[MN][\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/.test(code)) {
      if (bot.main.endsWith('.py')) code = code.replace(/^(\s*TOKEN\s*=\s*)["'][^"'\n]*["']/m, '$1os.getenv("DISCORD_TOKEN", "")');
      else code = code.replace(/^(\s*(?:const|let|var)?\s*(?:TOKEN|token|DISCORD_TOKEN)\s*=\s*)["'][^"'\n]*["']/m, '$1process.env.DISCORD_TOKEN || ""');
      if (!/[MN][\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/.test(code)) {
        writeFileSync(mainPath, code);
        fixes.push('token colado no código movido para DISCORD_TOKEN (env)');
        pushLog(id, '🔒 Token que estava colado no código agora vem da variável DISCORD_TOKEN. Cole o token válido em Config.');
      } else {
        pushLog(id, '⚠️ Achei um token colado no código num formato que não migrei sozinho — revise o arquivo principal.');
      }
    }
  } catch {}
  // bytecode velho pode conter código/token antigo compilado — remove sempre
  try { rmSync(join(dir, '__pycache__'), { recursive: true, force: true }); } catch {}
  // 4) dependência faltando? força reinstalação
  if (/Cannot find module|MODULE_NOT_FOUND|No module named/i.test(fullLogs(id))) {
    try { rmSync(join(dir, 'node_modules'), { recursive: true, force: true }); } catch {}
    fixes.push('dependências serão reinstaladas');
    pushLog(id, '🔧 Módulo faltando — reinstalando dependências…');
  }
  bot = getBot(id);
  if (!bot.token) {
    fixes.push('aviso: sem token (DISCORD_TOKEN ausente)');
    pushLog(id, '⚠️ Sem token — o bot vai subir, mas pode não logar no Discord. Cole o token em Config.');
  }
  // 5) sobe e confere se ficou online
  await startBot(id);
  await new Promise(r => setTimeout(r, 6000));
  const cur = getBot(id);
  const alive = procs.get(id)?.proc && !procs.get(id).proc.killed && cur.status === 'online';
  const logs = fullLogs(id);
  const mi = logs.lastIndexOf('🛠️ Auto-reparo iniciado…');
  const fresh = mi >= 0 ? logs.slice(mi) : logs;
  if (alive && !/❌|Error:|Traceback|Falha no login/i.test(fresh.slice(-2000))) {
    fixes.push('bot online ✅');
    pushLog(id, '✅ Auto-reparo concluído: bot online.');
  } else if (alive) {
    fixes.push('bot rodando com avisos (veja os logs)');
  } else {
    if (/401|Unauthorized/i.test(fresh)) fixes.push('diagnóstico: token inválido (401) — gere um novo no Developer Portal');
    else if (/Token não encontrado/i.test(fresh)) fixes.push('diagnóstico: falta o token — Reset Token no Developer Portal e cole em Config');
    else if (/Cannot find module|No module named/i.test(fresh)) fixes.push('diagnóstico: falta dependência — confira package.json/requirements.txt');
    else if (/SyntaxError|Erro de sintaxe/i.test(fresh)) fixes.push('diagnóstico: erro de código — veja os logs');
    else fixes.push('bot ainda offline — veja os logs');
  }
  return { bot: getBot(id), fixes, logs: fullLogs(id) };
}

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function send(res, code, body, type = 'application/json; charset=utf-8') {
  const buf = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(buf);
}
function readRaw(req, limit = 105 * 1024 * 1024) {
  return new Promise((res, rej) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { rej(new Error('ZIP maior que 100MB')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => res(Buffer.concat(chunks)));
    req.on('error', rej);
  });
}
function sanitizeName(n) {
  return String(n || 'meu-bot').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 40) || 'meu-bot';
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' }); return res.end(); }

    // API
    if (url.pathname === '/api/health') return send(res, 200, { ok: true, time: Date.now() });
    if (url.pathname === '/api/bots' && req.method === 'GET') {
      const bots = loadDB().map(b => ({ ...b, token: undefined, status: procs.get(b.id)?.proc && !procs.get(b.id).proc.killed && b.status === 'online' ? 'online' : b.status, logs: fullLogs(b.id).slice(-4000) }));
      return send(res, 200, bots);
    }
    if (url.pathname === '/api/bots/upload' && req.method === 'POST') {
      const rawName = decodeURIComponent(req.headers['x-bot-name'] || 'meu-bot');
      const name = sanitizeName(rawName);
      const token = decodeURIComponent(req.headers['x-bot-token'] || '');
      const mainHint = decodeURIComponent(req.headers['x-bot-main'] || '');
      const buf = await readRaw(req);
      if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) return send(res, 400, { error: 'Arquivo inválido: envie um .zip de verdade 📦' });
      const id = randomUUID().slice(0, 8);
      const dir = botDir(id), app = appDir(id);
      mkdirSync(app, { recursive: true });
      const zipPath = join(dir, 'source.zip');
      writeFileSync(zipPath, buf);
      try { await run('unzip', ['-o', '-q', zipPath, '-d', app]); }
      catch (e) { return send(res, 400, { error: 'Não consegui extrair o ZIP. Ele está corrompido?' }); }
      // se o zip tem pasta única no topo, "achata"
      try {
        const top = readdirSync(app).filter(n => !n.startsWith('.'));
        if (top.length === 1 && statSync(join(app, top[0])).isDirectory()) {
          const inner = join(app, top[0]);
          const innerFiles = readdirSync(inner);
          if (innerFiles.includes('package.json') || innerFiles.some(f => f.endsWith('.js') || f.endsWith('.py'))) {
            await run('bash', ['-c', `shopt -s dotglob; mv "${inner}"/* "${app}"/`], { cwd: app }).catch(() => {});
            rmSync(inner, { recursive: true, force: true });
          }
        }
  } catch {}
      const d = detectMain(id);
      const bot = { id, name, token, runtime: d.runtime, main: mainHint || d.main, startCmd: '', files: d.files, status: 'offline', createdAt: Date.now() };
      const bots = loadDB(); bots.unshift(bot); saveDB(bots);
      writeFileSync(logFile(id), `[upload] ${name} (${buf.length} bytes) arquivos: ${(d.files || []).length}\n`);
      pushLog(id, `📦 ZIP recebido (${(buf.length / 1024).toFixed(1)} KB), ${(d.files || []).length} arquivos extraídos.`);
      if (d.main) pushLog(id, `🔍 Principal detectado: ${d.main}`);
      else pushLog(id, '⚠️ Não detectei o arquivo principal — configure em Config.');
      return send(res, 200, { ...bot, token: undefined });
    }
    const m = url.pathname.match(/^\/api\/bots\/([^/]+)(?:\/(start|stop|restart|repair|config))?$/);
    if (m) {
      const id = basename(m[1]);
      const action = m[2];
      if (!/^[a-z0-9-]+$/i.test(id) || !existsSync(botDir(id))) return send(res, 404, { error: 'Bot não encontrado' });
      if (req.method === 'GET' && !action) {
        const b = getBot(id);
        return send(res, 200, { ...b, token: undefined, hasToken: !!b.token, logs: fullLogs(id), files: listFilesRecursive(appDir(id)) });
      }
      if (req.method === 'POST' && action === 'start') { const b = await startBot(id); return send(res, 200, { ...b, token: undefined, logs: fullLogs(id) }); }
      if (req.method === 'POST' && (action === 'stop')) { stopProc(id); const b = patchBot(id, { status: 'offline' }); pushLog(id, '⏹ Bot desligado por você.'); return send(res, 200, { ...b, token: undefined, logs: fullLogs(id) }); }
      if (req.method === 'POST' && action === 'restart') { const b = await startBot(id); pushLog(id, '🔄 Reiniciado.'); return send(res, 200, { ...b, token: undefined, logs: fullLogs(id) }); }
      if (req.method === 'POST' && action === 'repair') { const r = await repairBot(id); return send(res, 200, { ...r.bot, token: undefined, fixes: r.fixes, logs: r.logs }); }
      if (req.method === 'PUT' && action === 'config') {
        const body = JSON.parse((await readRaw(req, 1024 * 1024)).toString() || '{}');
        const cur = getBot(id);
        const patch = {};
        if (typeof body.token === 'string' && body.token.trim()) patch.token = body.token.trim();
        if (typeof body.main === 'string') patch.main = body.main.trim();
        if (typeof body.startCmd === 'string') patch.startCmd = body.startCmd.trim();
        const b = patchBot(id, patch);
        pushLog(id, '⚙️ Config atualizada.');
        if (procs.get(id)?.proc && !procs.get(id).proc.killed) await startBot(id);
        return send(res, 200, { ...b, token: undefined, logs: fullLogs(id) });
      }
      if (req.method === 'DELETE' && !action) {
        stopProc(id);
        rmSync(botDir(id), { recursive: true, force: true });
        saveDB(loadDB().filter(b => b.id !== id));
        procs.delete(id);
        return send(res, 200, { ok: true });
      }
    }

    // estático
    let p = decodeURIComponent(url.pathname);
    if (p === '/') p = '/index.html';
    const file = resolve(join(PUB, '.' + p));
    if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
    if (existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      return res.end(readFileSync(file));
    }
    // SPA fallback
    if (!extname(p)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(readFileSync(join(PUB, 'index.html')));
    }
    res.writeHead(404); return res.end('Not found');
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message || 'Erro interno' });
  }
});

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, '0.0.0.0', () => console.log(`ZapHost rodando na porta ${PORT}`));
