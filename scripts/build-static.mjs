import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");
mkdirSync(out, { recursive: true });

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>HOSTBOTS — Hospede seu Bot do Discord em 5 segundos</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#07070f;color:#e9e9f2;font-family:Inter,system-ui,sans-serif}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(7,7,15,.85);backdrop-filter:blur(16px)}
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 0;gap:10px}
.logo{font-weight:900;font-size:20px;display:flex;gap:8px;align-items:center}
.badge-ic{display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#a855f7,#6366f1,#22d3ee);box-shadow:0 0 30px rgba(168,85,247,.45)}
.logo span.pu{color:#a855f7}
.links{display:flex;gap:22px;font-size:14px;color:rgba(255,255,255,.7)}
.links a:hover{color:#fff}
.btn{background:linear-gradient(135deg,#a855f7,#6366f1 50%,#22d3ee);box-shadow:0 0 30px rgba(168,85,247,.45);border-radius:12px;padding:10px 20px;font-weight:800;font-size:14px;color:#fff;border:0;cursor:pointer}
.btn:hover{filter:brightness(1.15)}
.btn:disabled{opacity:.6;cursor:wait}
.btn-ghost{border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);border-radius:12px;padding:10px 20px;font-weight:700;font-size:14px;cursor:pointer;color:#fff}
.btn-ghost:hover{background:rgba(255,255,255,.12)}
.hero{text-align:center;padding:72px 0 30px;position:relative}
.hero::before{content:"";position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:900px;height:380px;background:rgba(147,51,234,.22);filter:blur(120px);border-radius:50%;pointer-events:none}
.pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:999px;padding:6px 16px;font-size:12px;color:rgba(255,255,255,.8)}
.dot{width:8px;height:8px;border-radius:50%;background:#a3e635;animation:bl 2s infinite}
@keyframes bl{50%{opacity:.4}}
h1{font-size:clamp(38px,6vw,68px);font-weight:900;line-height:1.02;letter-spacing:-2px;max-width:820px;margin:22px auto 0}
.grad{background:linear-gradient(90deg,#c084fc,#818cf8,#67e8f9);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:rgba(255,255,255,.6);font-size:18px;max-width:640px;margin:18px auto 0}
.cta{display:flex;gap:12px;justify-content:center;margin-top:28px;flex-wrap:wrap}
.chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:22px}
.chip{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);border-radius:999px;padding:4px 12px;font-size:12px;color:rgba(255,255,255,.55)}
.term{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);border-radius:16px;overflow:hidden;margin:34px auto 0;max-width:820px;text-align:left;box-shadow:0 0 40px rgba(168,85,247,.25)}
.term-h{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.1);font-size:12px;color:rgba(255,255,255,.5)}
.d{width:12px;height:12px;border-radius:50%}
.on{margin-left:auto;background:rgba(34,197,94,.2);color:#86efac;border-radius:8px;padding:2px 10px;font-size:11px}
pre{padding:20px;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.7;color:rgba(255,255,255,.82);overflow-x:auto}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:50px 0}
.card{border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);border-radius:16px;padding:22px}
.card h3{margin:10px 0 6px;font-size:17px}
.card p{font-size:13.5px;color:rgba(255,255,255,.6)}
.e{font-size:28px}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:10px 0 40px}
.plan{border-radius:18px;padding:28px;text-align:center}
.g{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09)}
.hot{background:linear-gradient(135deg,#a855f7,#6366f1,#22d3ee)}
.price{font-size:30px;font-weight:900;margin-top:6px}
.feat{font-size:13px;opacity:.85;margin-top:8px}
.dash{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.02);border-radius:18px;padding:22px;margin:10px 0 30px}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.k{font-size:12px;background:rgba(255,255,255,.08);border-radius:8px;padding:6px 12px;border:0;color:#fff;cursor:pointer}
.k:hover{background:rgba(255,255,255,.16)}
.k.danger{background:rgba(239,68,68,.18);color:#fca5a5}
.bar{height:8px;border-radius:99px;background:rgba(255,255,255,.1);margin-top:10px;overflow:hidden}
.bar i{display:block;height:100%;background:linear-gradient(90deg,#a855f7,#22d3ee);transition:width .8s}
.logs{background:#000;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;font-family:monospace;font-size:11.5px;color:#86efac;margin-top:12px;line-height:1.8;height:130px;overflow-y:auto}
.tout{background:#000;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;font-family:monospace;font-size:11.5px;color:#67e8f9;margin-top:8px;white-space:pre-wrap}
.badge{font-size:11px;border-radius:999px;padding:3px 10px;font-weight:800}
.b-on{background:rgba(34,197,94,.2);color:#86efac}
.b-off{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6)}
.b-build{background:rgba(234,179,8,.2);color:#fde047}
.inp{width:100%;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 12px;color:#fff;font-size:13px;outline:none}
.inp:focus{border-color:#a855f7}
.lbl{font-size:11px;color:rgba(255,255,255,.55);margin:10px 0 4px;display:block;text-align:left}
.err{background:rgba(239,68,68,.12);color:#fca5a5;font-size:12px;border-radius:10px;padding:8px 12px;margin-top:10px}
.okmsg{color:#67e8f9;font-size:13px;margin-top:12px;text-align:center}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:none;place-items:center;z-index:100;padding:16px}
.modal-bg.open{display:grid}
.modal{width:100%;max-width:400px;border:1px solid rgba(255,255,255,.12);background:#0d0d1a;border-radius:20px;padding:28px;text-align:center;box-shadow:0 0 60px rgba(168,85,247,.35)}
.tabs{display:flex;gap:8px;margin-top:14px}
.profit{display:flex;align-items:flex-end;gap:3px;height:110px;margin-top:12px}
.profit i{flex:1;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#22d3ee,#a855f7);min-height:4px}
table{width:100%;font-size:12px;border-collapse:collapse;margin-top:10px}
th{text-align:left;color:rgba(255,255,255,.4);padding:8px;font-weight:600}
td{padding:8px;border-top:1px solid rgba(255,255,255,.08)}
.sec-t{font-size:26px;font-weight:900;margin:10px 0 4px}
.sec-s{color:rgba(255,255,255,.55);font-size:14px;margin-bottom:14px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dz{border:2px dashed rgba(168,85,247,.55);border-radius:16px;padding:34px 18px;text-align:center;cursor:pointer;background:rgba(168,85,247,.06);transition:.2s;margin-top:12px}
.dz.over{background:rgba(168,85,247,.18);transform:scale(1.01)}
.dz b{font-size:15px}
.prog{font-family:monospace;font-size:12px;color:#86efac;margin-top:10px;line-height:1.9}
footer{border-top:1px solid rgba(255,255,255,.1);padding:30px;text-align:center;font-size:13px;color:rgba(255,255,255,.45)}
@media(max-width:800px){.grid,.plans,.two{grid-template-columns:1fr}.links{display:none}}
</style>
</head>
<body>
<header><div class="wrap nav">
<a class="logo" href="#top"><span class="badge-ic">🤖</span>HOST<span class="pu">BOTS</span></a>
<nav class="links"><a href="#planos">Planos</a><a href="#dash">Dashboard</a><a href="#como">Como funciona</a><a href="#admin">Admin</a></nav>
<div id="authArea" style="display:flex;gap:8px;align-items:center"></div>
</div></header>
<main class="wrap" id="top">
<section class="hero">
<div class="pill"><span class="dot"></span>Uptime 99.9% · <span id="onlineCount">12.400</span> bots online agora</div>
<h1>Hospede seu Bot do Discord em <span class="grad">5 segundos</span> por R$9,90</h1>
<p class="sub">Envie o .zip do seu bot. Detectamos Node, Python ou Java sozinhos, instalamos tudo e ligamos em 5 segundos, online 24/7.</p>
<div class="cta"><button class="btn" onclick="App.ctaBot()">🚀 Subir meu Bot — 1 clique</button><a class="btn-ghost" href="#planos">Ver planos</a></div>
<div class="chips"><span class="chip">Node.js 18/20</span><span class="chip">Python 3.11</span><span class="chip">Java 17</span><span class="chip">Next.js</span><span class="chip">PHP</span><span class="chip">SSL grátis</span><span class="chip">.env criptografado</span></div>
<div class="term"><div class="term-h"><span class="d" style="background:#f87171"></span><span class="d" style="background:#fde047"></span><span class="d" style="background:#4ade80"></span><span style="margin-left:8px">terminal — meubot.hostbots.com.br</span><span class="on">● ONLINE</span></div>
<pre>$ hostbots deploy --zip meubot.zip
✔ Runtime detectado: Node.js 20
✔ npm install (142 pacotes em 8s)
✔ Container isolado: 512MB RAM · SSL ativo
✔ Deploy em https://meubot.hostbots.com.br

[22:01:12] Bot logado como MinhaLoja#1234 ✅
[22:01:13] 14 comandos slash sincronizados
[22:01:14] Uptime monitor: reinício automático ativo</pre></div>
</section>
<section class="grid">
<div class="card"><div class="e">🤖</div><h3>Bots 24/7</h3><p>Node, Python, Java. Procfile e requirements detectados. Se cair, reinicia sozinho.</p></div>
<div class="card"><div class="e">🌐</div><h3>Sites instantâneos</h3><p>HTML, React, Next.js, PHP e WordPress. Domínio grátis + SSL + domínio próprio.</p></div>
<div class="card"><div class="e">📊</div><h3>Observabilidade</h3><p>CPU, RAM, logs em tempo real e terminal no navegador. Reiniciar, parar e deletar em 1 clique.</p></div>
<div class="card"><div class="e">💰</div><h3>Planos justos</h3><p>Grátis para testar, R$9,90 Basic e R$29,90 Pro. PIX ou cartão. 1 dia = 1 crédito.</p></div>
<div class="card"><div class="e">🔐</div><h3>.env criptografado</h3><p>Variáveis protegidas. Nunca expomos seu token do Discord.</p></div>
<div class="card"><div class="e">🛡️</div><h3>Painel Admin</h3><p>Usuários, consumo CPU/RAM, bans, cupons, lucro do mês e Nodes.</p></div>
</section>
<section id="dash" class="dash">
<div class="sec-t">📊 Dashboard</div>
<div class="sec-s">Suba bots e sites, acompanhe CPU/RAM, veja logs ao vivo e use o terminal.</div>
<div id="dashContent"></div>
</section>
<section id="planos">
<div class="sec-t" style="text-align:center">Planos que cabem no bolso</div>
<div class="sec-s" style="text-align:center">1 dia = 1 crédito · cancele quando quiser · PIX ou cartão</div>
<div style="display:flex;gap:8px;justify-content:center;margin-bottom:14px">
<input id="couponInput" class="inp" style="max-width:180px" value="BEMVINDO10" placeholder="cupom"/>
</div>
<div class="plans">
<div class="plan g"><b>Grátis</b><div class="price">R$0</div><div class="feat">1 bot · 256MB · dorme 30min · marca d'água</div><div style="margin-top:14px"><button class="btn-ghost" onclick="App.useFree()">Usar grátis</button></div></div>
<div class="plan hot"><b>⭐ Basic</b><div class="price">R$9,90/mês</div><div class="feat">3 bots · 512MB · 2 sites · 24/7 sem dormir</div><div style="margin-top:14px;display:grid;gap:8px"><button class="btn-ghost" style="background:rgba(0,0,0,.4)" onclick="App.pay('BASIC','pix')">💜 Pagar com PIX</button><button class="btn-ghost" style="background:#fff;color:#000" onclick="App.pay('BASIC','stripe')">💳 Cartão (Stripe)</button></div></div>
<div class="plan g"><b>Pro</b><div class="price">R$29,90/mês</div><div class="feat">10 bots · 2GB · 10 sites · domínio grátis</div><div style="margin-top:14px;display:grid;gap:8px"><button class="btn-ghost" onclick="App.pay('PRO','pix')">💜 Pagar com PIX</button><button class="btn-ghost" onclick="App.pay('PRO','stripe')">💳 Cartão (Stripe)</button></div></div>
</div>
<div id="plansMsg" class="okmsg"></div>
</section>
<section id="admin" class="dash">
<div class="sec-t">🛡️ Painel Admin</div>
<div class="sec-s">Visão do dono: usuários, consumo, lucro do mês, Nodes e cupons.</div>
<div id="adminContent"></div>
</section>
<section id="como" class="card" style="margin-bottom:40px"><h3>Como funciona</h3><p>1. Clique em <b>Entrar</b> e conecte com Discord ou Google → 2. Clique em <b>Subir meu Bot</b> e envie o <b>.zip</b> → 3. A gente detecta tudo e liga o bot com SSL em 5s. Versão completa em Next.js + Docker pronta para VPS: <b>bash deploy-vps.sh</b>.</p></section>
</main>
<footer>HOSTBOTS © 2026 — Feito no Brasil · hostbots.com.br</footer>
<div id="loginModal" class="modal-bg"><div class="modal">
<div style="font-size:36px">🤖</div>
<h2 id="loginTitle">Entrar na HOSTBOTS</h2>
<p style="color:rgba(255,255,255,.6);font-size:13px;margin-top:4px">Login com Discord e Google</p>
<label class="lbl">Seu nome</label>
<input id="loginName" class="inp" placeholder="ex: daniel"/>
<div id="loginError"></div>
<button class="btn" style="width:100%;margin-top:12px;background:#5865F2;box-shadow:none" onclick="App.doLogin('discord')">Login com Discord</button>
<button class="btn-ghost" style="width:100%;margin-top:8px;background:#fff;color:#000" onclick="App.doLogin('google')">Login com Google</button>
<button class="btn-ghost" style="width:100%;margin-top:8px" onclick="App.closeLogin()">Cancelar</button>
</div></div>
<script>
var App = {};
(function(){
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function load(k, fb){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; }catch(e){ return fb; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function uid(p){ return p + "_" + Math.random().toString(36).slice(2,8); }
function now(){ var d = new Date(); return ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)+":"+("0"+d.getSeconds()).slice(-2); }
var PLANS = { FREE:{bots:1,sites:1,ram:256}, BASIC:{bots:3,sites:2,ram:512}, PRO:{bots:10,sites:10,ram:2048} };
var tab = "bots";
var pendingBot = false;
var termOut = {};
function getUser(){ return load("hb-user", null); }
function bots(){ return load("hb-bots", []); }
function sites(){ return load("hb-sites", []); }
function allUsers(){ return load("hb-users", [{id:"admin",name:"Admin",email:"admin@hostbots.com.br",plan:"PRO",credits:999,createdAt:Date.now()}]); }
function coupons(){ return load("hb-coupons", [{code:"BEMVINDO10",pct:10}]); }
function detectRuntime(repo){
  var r = String(repo || "").toLowerCase();
  if(r.indexOf(".py") >= 0 || r.indexOf("requirements") >= 0) return {t:"Python 3.11",inst:"pip install -r requirements.txt",start:"python main.py"};
  if(r.indexOf(".jar") >= 0 || r.indexOf("pom.xml") >= 0) return {t:"Java 17",inst:"mvn package",start:"java -jar app.jar"};
  if(r.indexOf(".php") >= 0) return {t:"PHP 8.2",inst:"composer install",start:"php -S 0.0.0.0:8080"};
  if(r.indexOf(".html") >= 0) return {t:"Static HTML",inst:"—",start:"nginx"};
  return {t:"Node.js 20",inst:"npm install",start:"npm start"};
}
function subdomain(name){ var s = String(name||"app").toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").slice(0,30) || "app"; return s + ".hostbots.com.br"; }
function myBots(){ var u = getUser(); if(!u) return []; return bots().filter(function(b){ return b.owner === u.id; }); }
function mySites(){ var u = getUser(); if(!u) return []; return sites().filter(function(s){ return s.owner === u.id; }); }
App.openLogin = function(){ $("loginModal").classList.add("open"); $("loginError").innerHTML = ""; setTimeout(function(){ $("loginName").focus(); }, 50); };
App.closeLogin = function(){ $("loginModal").classList.remove("open"); };
App.doLogin = function(provider){
  var name = $("loginName").value.trim() || (provider + "-user");
  if(name.length < 2){ $("loginError").innerHTML = '<div class="err">Digite seu nome (mín. 2 letras).</div>'; return; }
  var users = allUsers();
  var banned = users.filter(function(x){ return x.name.toLowerCase() === name.toLowerCase() && x.banned; })[0];
  if(banned){ $("loginError").innerHTML = '<div class="err">Usuário banido. Fale com o suporte.</div>'; return; }
  var u = {id:"u_"+Date.now().toString(36), name:name, email:name.toLowerCase().replace(/\\s+/g,".")+"@"+provider+".com", plan:"FREE", credits:3, provider:provider, createdAt:Date.now()};
  save("hb-user", u);
  var ex = users.filter(function(x){ return x.name.toLowerCase() === name.toLowerCase(); })[0];
  if(ex){ u = ex; save("hb-user", u); } else { users.push(u); save("hb-users", users); }
  App.closeLogin(); renderAll();
  if(pendingBot){ pendingBot = false; document.getElementById("dash").scrollIntoView({behavior:"smooth"}); setTimeout(function(){ App.openDeploy("bot"); }, 400); }
  else { document.getElementById("dash").scrollIntoView({behavior:"smooth"}); }
};
App.logout = function(){ localStorage.removeItem("hb-user"); renderAll(); window.scrollTo({top:0,behavior:"smooth"}); };
App.ctaBot = function(){ var u = getUser(); if(!u){ pendingBot = true; App.openLogin(); return; } document.getElementById("dash").scrollIntoView({behavior:"smooth"}); setTimeout(function(){ App.openDeploy("bot"); }, 300); };
App.useFree = function(){ var u = getUser(); if(!u){ App.openLogin(); return; } $("plansMsg").textContent = "Você já está no plano Grátis ✅"; };
App.setTab = function(t){ tab = t; renderDash(); };
App.openDeploy = function(kind){
  var u = getUser(); if(!u){ pendingBot = (kind === "bot"); App.openLogin(); return; }
  tab = (kind === "bot" ? "bots" : "sites");
  renderDash();
  var box = $("deployBox"); if(!box) return;
  var isBot = (kind === "bot");
  if(isBot){
    window._zip = null;
    box.innerHTML = '<h3 style="margin-bottom:6px">Ligar Bot — envie o arquivo .zip</h3>'
      + '<p style="font-size:12px;color:rgba(255,255,255,.55)">Sem GitHub, sem .env, sem configuração. É só mandar o .zip que a gente liga o bot. ⚡</p>'
      + '<div id="dz" class="dz" onclick="document.getElementById(\\'fZip\\').click()" ondragover="event.preventDefault();this.classList.add(\\'over\\')" ondragleave="this.classList.remove(\\'over\\')" ondrop="App.dropZip(event)"><div style="font-size:34px">📦</div><b>Arraste o .zip do bot aqui</b><div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:4px">ou clique para escolher o arquivo</div></div>'
      + '<input id="fZip" type="file" accept=".zip" style="display:none" onchange="App.zipPicked(this)"/>'
      + '<div id="zipInfo" style="margin-top:10px"></div>'
      + '<label class="lbl">Nome do bot</label><input id="fName" class="inp" value="meu-bot"/>'
      + '<div id="fProg" class="prog"></div>'
      + '<div id="fErr"></div>'
      + '<div class="row"><button id="fGo" class="btn" onclick="App.submitDeploy(\\'bot\\')">Ligar meu Bot 🚀</button><button class="btn-ghost" onclick="App.cancelDeploy()">Cancelar</button></div>';
  } else {
    box.innerHTML = '<h3 style="margin-bottom:6px">Subir Site — HTML/React/Next/PHP/WordPress</h3>'
      + '<label class="lbl">Nome</label><input id="fName" class="inp" value="meu-site"/>'
      + '<label class="lbl">Link do GitHub</label><input id="fRepo" class="inp" value="https://github.com/user/meusite"/>'
      + '<label class="lbl">Framework</label><input id="fFw" class="inp" value="Next.js"/>'
      + '<div id="fErr"></div>'
      + '<div class="row"><button id="fGo" class="btn" onclick="App.submitDeploy(\\'site\\')">Deploy em 1 clique 🚀</button><button class="btn-ghost" onclick="App.cancelDeploy()">Cancelar</button></div>';
  }
  box.scrollIntoView({behavior:"smooth",block:"center"});
};
App.cancelDeploy = function(){ renderDash(); };
function parseZipNames(buf){
  try{
    var dv = new DataView(buf); var n = dv.byteLength; if(n < 22) return null;
    var eocd = -1; var start = Math.max(0, n - 22 - 65536); var i;
    for(i = n - 22; i >= start; i--){ if(dv.getUint32(i, true) === 0x06054b50){ eocd = i; break; } }
    if(eocd < 0) return null;
    var count = dv.getUint16(eocd + 10, true); var cdOff = dv.getUint32(eocd + 16, true);
    var names = []; var p = cdOff; var k;
    var dec = (typeof TextDecoder !== "undefined") ? new TextDecoder() : null;
    for(k = 0; k < count; k++){
      if(p + 46 > n || dv.getUint32(p, true) !== 0x02014b50) break;
      var nl = dv.getUint16(p + 28, true); var el = dv.getUint16(p + 30, true); var cl = dv.getUint16(p + 32, true);
      var nm = "";
      if(p + 46 + nl <= n){ if(dec){ nm = dec.decode(new Uint8Array(buf, p + 46, nl)); } else { var c2; for(c2 = 0; c2 < nl; c2++){ nm += String.fromCharCode(dv.getUint8(p + 46 + c2)); } } }
      if(nm && nm.slice(-1) !== "/") names.push(nm);
      p += 46 + nl + el + cl;
    }
    return names;
  }catch(e){ return null; }
}
function runtimeFromFiles(names, zipName){
  var hay = ((names || []).join("\\n") + "\\n" + String(zipName || "")).toLowerCase();
  var pick = function(list){ if(!names) return ""; for(var i = 0; i < names.length; i++){ var l = names[i].toLowerCase(); for(var j = 0; j < list.length; j++){ if(l.slice(-list[j].length) === list[j]) return names[i]; } } return ""; };
  var main = "";
  if(hay.indexOf("package.json") >= 0){ main = pick(["index.js", "main.js", "bot.js", "index.ts", "main.ts"]) || "package.json"; return {t:"Node.js 20", inst:"npm install", start:"npm start", main:main}; }
  if(hay.indexOf("requirements.txt") >= 0 || hay.indexOf(".py") >= 0){ main = pick(["main.py", "bot.py", "index.py", "app.py"]) || "main.py"; return {t:"Python 3.11", inst:"pip install -r requirements.txt", start:"python " + main, main:main}; }
  if(hay.indexOf("pom.xml") >= 0 || hay.indexOf(".jar") >= 0 || hay.indexOf(".java") >= 0){ main = pick(["app.jar"]) || "app.jar"; return {t:"Java 17", inst:"mvn package", start:"java -jar " + main, main:main}; }
  if(hay.indexOf(".php") >= 0){ main = pick(["index.php"]) || "index.php"; return {t:"PHP 8.2", inst:"composer install", start:"php -S 0.0.0.0:8080", main:main}; }
  if(hay.indexOf(".html") >= 0){ return {t:"Static HTML", inst:"—", start:"nginx", main:"index.html"}; }
  return {t:"Node.js 20", inst:"npm install", start:"npm start", main:""};
}
function fmtSize(b){ b = +b || 0; if(b > 1048576) return (b/1048576).toFixed(1) + " MB"; if(b > 1024) return Math.round(b/1024) + " KB"; return b + " B"; }
function readZip(f){
  window._zip = {name:f.name, size:f.size, files:null, rt:null};
  $("zipInfo").innerHTML = '<p style="font-size:13px">📦 <b>' + esc(f.name) + '</b> · ' + fmtSize(f.size) + ' · lendo arquivos…</p>';
  var base = f.name.replace(/\\.zip$/i, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 30) || "meu-bot";
  var fn = $("fName"); if(fn && (fn.value === "meu-bot" || !fn.value)) fn.value = base;
  var rd = new FileReader();
  rd.onload = function(){
    var names = parseZipNames(rd.result);
    var rt = runtimeFromFiles(names, f.name);
    window._zip.files = names; window._zip.rt = rt;
    var extra = names ? (" · " + names.length + " arquivos") : "";
    $("zipInfo").innerHTML = '<p style="font-size:13px">📦 <b>' + esc(f.name) + '</b> · ' + fmtSize(f.size) + extra + ' ✓</p>'
      + '<p style="font-size:13px;margin-top:6px">⚡ Runtime detectado: <b>' + esc(rt.t) + '</b>' + (rt.main ? ' · <span style="color:rgba(255,255,255,.55)">entrada: ' + esc(rt.main) + '</span>' : '') + '</p>';
  };
  rd.onerror = function(){ var rt2 = runtimeFromFiles(null, f.name); window._zip.rt = rt2; $("zipInfo").innerHTML = '<p style="font-size:13px">📦 <b>' + esc(f.name) + '</b> ✓ · Runtime: <b>' + esc(rt2.t) + '</b></p>'; };
  try{ rd.readAsArrayBuffer(f); }catch(e){ window._zip.rt = runtimeFromFiles(null, f.name); }
}
App.zipPicked = function(input){ var f = input.files && input.files[0]; if(f) readZip(f); };
App.dropZip = function(ev){ ev.preventDefault(); var dz = $("dz"); if(dz) dz.classList.remove("over"); var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]; if(f) readZip(f); };
App.submitDeploy = function(kind){
  var u = getUser(); if(!u){ App.openLogin(); return; }
  var plan = PLANS[u.plan] || PLANS.FREE;
  var err = function(m){ $("fErr").innerHTML = '<div class="err">' + esc(m) + "</div>"; };
  if(kind === "bot"){
    var zf = window._zip;
    if(!zf){ err("Envie o arquivo .zip do bot primeiro. 📦"); return; }
    if(!/\\.zip$/i.test(zf.name)){ err("O arquivo precisa ser .zip"); return; }
    if(myBots().length >= plan.bots){ err("Limite do plano " + u.plan + ": " + plan.bots + " bot(s). Assine o Basic/Pro abaixo. 👇"); return; }
    var cleanName = ($("fName").value || "").trim();
    if(cleanName.length < 2){ err("Dê um nome ao bot (mín. 2 letras)."); return; }
    var go = $("fGo"); go.disabled = true; go.textContent = "Ligando… ⏳";
    var rt = zf.rt || runtimeFromFiles(zf.files, zf.name);
    var steps = ["📤 Arquivo recebido: " + zf.name + " (" + fmtSize(zf.size) + ")", "📂 Extraindo " + (zf.files ? zf.files.length + " arquivos" : "arquivos") + "…", "⚡ Runtime detectado: " + rt.t + (rt.main ? " (" + rt.main + ")" : ""), "📦 " + rt.inst + "…", "🔌 Ligando o bot…"];
    var si = 0;
    var finishBot = function(){
      var all = bots();
      var b = {id:uid("bot"), owner:u.id, name:cleanName, runtime:rt.t, status:"building", repo:"zip: " + zf.name + (zf.files ? " (" + zf.files.length + " arquivos)" : ""), ramMB:plan.ram, cpu:3, restarts:0, domain:subdomain(cleanName), createdAt:Date.now(), logs:["zip recebido: " + zf.name + " (" + fmtSize(zf.size) + (zf.files ? ", " + zf.files.length + " arquivos" : "") + ")", "extraindo…", "runtime detectado: " + rt.t + (rt.main ? " (" + rt.main + ")" : ""), "build: " + rt.inst, "build: container " + plan.ram + "MB isolado"]};
      all.push(b); save("hb-bots", all); renderDash();
      setTimeout(function(){ var a2 = bots(); for(var i=0;i<a2.length;i++){ if(a2[i].id === b.id){ a2[i].status = "online"; a2[i].logs.push("Bot logado com sucesso ✅"); a2[i].logs.push("Deploy em https://" + a2[i].domain); } } save("hb-bots", a2); renderDash(); }, 2200);
    };
    var tickStep = function(){
      var fp = $("fProg");
      if(!fp) return;
      if(si < steps.length){ fp.innerHTML += "✔ " + esc(steps[si]) + "<br/>"; si++; setTimeout(tickStep, 450); }
      else finishBot();
    };
    tickStep();
    return;
  }
  var name = ($("fName").value || "").trim();
  var repo = ($("fRepo").value || "").trim();
  if(name.length < 2){ err("Dê um nome ao projeto (mín. 2 letras)."); return; }
  if(!repo){ err("Cole o link do GitHub do site."); return; }
  if(mySites().length >= plan.sites){ err("Limite do plano " + u.plan + ": " + plan.sites + " site(s). Assine o Basic/Pro abaixo. 👇"); return; }
  var go2 = $("fGo"); go2.disabled = true; go2.textContent = "Subindo… aguarde ⏳";
  setTimeout(function(){
    var fw = ($("fFw") && $("fFw").value) || "Next.js";
    var all2 = sites();
    var s = {id:uid("site"), owner:u.id, name:name, framework:fw, status:"building", domain:subdomain(name), createdAt:Date.now(), logs:["git clone " + repo, "npm install && npm run build", "SSL Let's Encrypt emitido ✅"]};
    all2.push(s); save("hb-sites", all2); renderDash();
    setTimeout(function(){ var a3 = sites(); for(var j=0;j<a3.length;j++){ if(a3[j].id === s.id){ a3[j].status = "online"; a3[j].logs.push("Live em https://" + a3[j].domain); } } save("hb-sites", a3); renderDash(); }, 2500);
  }, 600);
};
App.doAction = function(kind, id, act){
  var list = kind === "bots" ? bots() : sites();
  for(var i=0;i<list.length;i++){ if(list[i].id === id){
    if(act === "restart"){ list[i].status = "building"; list[i].restarts = (list[i].restarts || 0) + 1; list[i].logs.push("restart manual…"); }
    if(act === "stop"){ list[i].status = "offline"; list[i].logs.push("container parado"); }
    if(act === "start"){ list[i].status = "online"; list[i].logs.push("container iniciado"); }
  }}
  save(kind === "bots" ? "hb-bots" : "hb-sites", list); renderDash();
  if(act === "restart"){ setTimeout(function(){ var l2 = kind === "bots" ? bots() : sites(); for(var k=0;k<l2.length;k++){ if(l2[k].id === id && l2[k].status === "building"){ l2[k].status = "online"; l2[k].logs.push("Online após restart ✅ (auto-restart 99%)"); } } save(kind === "bots" ? "hb-bots" : "hb-sites", l2); renderDash(); }, 2000); }
};
App.doDelete = function(kind, id){
  if(!confirm("Deletar?")) return;
  var list = (kind === "bots" ? bots() : sites()).filter(function(x){ return x.id !== id; });
  save(kind === "bots" ? "hb-bots" : "hb-sites", list); renderDash();
};
App.runTerm = function(id){
  var inp = $("term-" + id); var cmd = inp ? (inp.value || "help") : "help";
  var all = bots().concat(sites()); var it = null;
  for(var i=0;i<all.length;i++){ if(all[i].id === id) it = all[i]; }
  var c = cmd.trim().toLowerCase(); var out = "";
  if(c === "help") out = "comandos: ls · ps · env · logs · restart · neofetch";
  else if(c === "ls") out = "index.js  package.json  Procfile  .env  node_modules/";
  else if(c === "ps") out = "PID 1 node index.js · CPU " + (it ? (it.cpu || 12) : 12) + "% · RAM " + (it ? (it.ramMB || 512) : 512) + "MB · uptime 99.9%";
  else if(c === "env") out = "DISCORD_TOKEN=•••••• (criptografado) · PREFIX=!";
  else if(c === "logs") out = it ? it.logs.slice(-5).join("\\n") : "sem logs";
  else if(c === "restart") out = "reiniciando container… online ✅";
  else if(c === "neofetch") out = "HOSTBOTS container\\nruntime: " + (it ? (it.runtime || it.framework) : "?") + "\\ndomain: " + (it ? it.domain : "?") + "\\nssl: ativo";
  else out = "exec: " + cmd + "\\n→ saída simulada no container isolado (Docker)";
  if(!termOut[id]) termOut[id] = [];
  termOut[id].push("$ " + cmd); termOut[id].push(out);
  renderDash();
};
App.pay = function(plan, method){
  var u = getUser(); if(!u){ pendingBot = false; App.openLogin(); return; }
  var base = plan === "PRO" ? 29.9 : 9.9;
  var code = ($("couponInput").value || "").toUpperCase().trim();
  var cs = coupons(); var found = null;
  for(var i=0;i<cs.length;i++){ if(cs[i].code === code) found = cs[i]; }
  var amount = found ? (base * (1 - found.pct / 100)).toFixed(2) : base.toFixed(2);
  $("plansMsg").textContent = (method === "pix" ? "PIX gerado (Mercado Pago demo): R$" + amount + " — confirmando…" : "Stripe demo: sessão criada R$" + amount + " — confirmando…");
  setTimeout(function(){
    var u2 = getUser(); u2.plan = plan; u2.credits = plan === "PRO" ? 30 : 15; save("hb-user", u2);
    var us = allUsers(); for(var k=0;k<us.length;k++){ if(us[k].id === u2.id){ us[k].plan = plan; us[k].credits = u2.credits; } } save("hb-users", us);
    $("plansMsg").textContent = "✅ Plano " + plan + " ativo! Créditos renovados.";
    renderAll();
  }, 1500);
};
App.addCoupon = function(){
  var code = ($("ncCode").value || "").toUpperCase().trim();
  var pct = parseInt($("ncPct").value || "10", 10) || 10;
  if(!code) return;
  var cs = coupons(); cs.push({code:code, pct:pct}); save("hb-coupons", cs); renderAdmin();
};
App.toggleBan = function(id){
  var us = allUsers();
  for(var i=0;i<us.length;i++){ if(us[i].id === id){ us[i].banned = !us[i].banned; } }
  save("hb-users", us); renderAdmin();
};
function badge(st){ if(st === "online") return '<span class="badge b-on">● ONLINE</span>'; if(st === "building") return '<span class="badge b-build">● BUILDING</span>'; return '<span class="badge b-off">● ' + esc(st.toUpperCase()) + "</span>"; }
function botCard(b){
  var logs = b.logs.slice(-30).map(esc).join("<br/>");
  var tout = termOut[b.id] ? '<div class="tout">' + esc(termOut[b.id].join("\\n")) + "</div>" : "";
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>' + esc(b.name) + '</b>' + badge(b.status) + "</div>"
    + '<div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:6px">' + esc(b.runtime || "") + " · 🌐 " + esc(b.domain) + " 🔒 · RAM " + b.ramMB + "MB · CPU " + b.cpu + "% · restarts " + (b.restarts || 0) + "</div>"
    + '<div class="bar"><i style="width:' + Math.min(100, b.cpu || 10) + '%"></i></div>'
    + '<div class="row"><button class="k" onclick="App.doAction(\\'bots\\',\\'' + b.id + '\\',\\'restart\\')">↻ Reiniciar</button>'
    + '<button class="k" onclick="App.doAction(\\'bots\\',\\'' + b.id + '\\',\\'' + (b.status === "online" ? "stop" : "start") + '\\')">' + (b.status === "online" ? "⏸ Parar" : "▶ Ligar") + "</button>"
    + '<button class="k danger" onclick="App.doDelete(\\'bots\\',\\'' + b.id + '\\')">🗑 Deletar</button></div>'
    + '<div class="logs" id="log-' + b.id + '">' + logs + "</div>"
    + '<div class="row"><input id="term-' + b.id + '" class="inp" style="flex:1;font-family:monospace;font-size:12px" placeholder="terminal: help, ls, ps, env, restart…" onkeydown="if(event.key===\\'Enter\\')App.runTerm(\\'' + b.id + '\\')"/>'
    + '<button class="btn" style="padding:8px 14px" onclick="App.runTerm(\\'' + b.id + '\\')">▶</button></div>' + tout + "</div>";
}
function siteCard(s){
  var logs = s.logs.slice(-30).map(esc).join("<br/>");
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>' + esc(s.name) + '</b>' + badge(s.status) + "</div>"
    + '<div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:6px">' + esc(s.framework || "") + " · 🌐 " + esc(s.domain) + " 🔒 SSL</div>"
    + '<div class="row"><button class="k" onclick="App.doAction(\\'sites\\',\\'' + s.id + '\\',\\'restart\\')">↻ Reiniciar</button>'
    + '<button class="k" onclick="App.doAction(\\'sites\\',\\'' + s.id + '\\',\\'' + (s.status === "online" ? "stop" : "start") + '\\')">' + (s.status === "online" ? "⏸ Parar" : "▶ Ligar") + "</button>"
    + '<button class="k danger" onclick="App.doDelete(\\'sites\\',\\'' + s.id + '\\')">🗑 Deletar</button></div>'
    + '<div class="logs">' + logs + "</div></div>";
}
function renderAuth(){
  var u = getUser(); var box = $("authArea");
  if(u){ box.innerHTML = '<span style="font-size:12px;color:rgba(255,255,255,.6)">' + esc(u.name) + " · " + esc(u.plan) + '</span><a class="btn" href="#dash">Abrir painel</a>'; }
  else{ box.innerHTML = '<button class="btn-ghost" onclick="App.openLogin()">Entrar</button><button class="btn" onclick="App.openLogin()">Começar grátis</button>'; }
}
function renderDash(){
  var u = getUser(); var box = $("dashContent");
  if(!u){
    box.innerHTML = '<div class="card" style="text-align:center;padding:36px"><div style="font-size:32px">🔒</div><h3>Entre para gerenciar seus bots</h3><p>Login com Discord ou Google em 1 clique.</p><div class="row" style="justify-content:center"><button class="btn" onclick="App.openLogin()">Entrar</button></div></div>';
    return;
  }
  var list = tab === "bots" ? myBots() : mySites();
  var cards = "";
  for(var i=0;i<list.length;i++){ cards += tab === "bots" ? botCard(list[i]) : siteCard(list[i]); }
  if(!cards){ cards = '<div class="card" style="text-align:center;padding:30px;color:rgba(255,255,255,.5)">Nada aqui ainda. Clique em <b>Subir ' + (tab === "bots" ? "Bot" : "Site") + "</b> e faça deploy em 5 segundos ⚡</div>"; }
  box.innerHTML = '<h2>Olá, ' + esc(u.name) + " 👋</h2>"
    + '<p style="color:rgba(255,255,255,.6);font-size:13px;margin-top:4px">Plano ' + esc(u.plan) + " · " + u.credits + ' créditos (1 dia = 1 crédito) · <a href="#planos" style="text-decoration:underline;color:#c084fc">upgrade</a></p>'
    + '<div class="row"><button class="btn" onclick="App.openDeploy(\\'bot\\')">+ Subir Bot</button><button class="btn-ghost" onclick="App.openDeploy(\\'site\\')">+ Subir Site</button><button class="btn-ghost" onclick="App.logout()">Sair</button></div>'
    + '<div class="tabs"><button class="' + (tab === "bots" ? "btn" : "btn-ghost") + '" onclick="App.setTab(\\'bots\\')">🤖 Meus Bots (' + myBots().length + ')</button><button class="' + (tab === "sites" ? "btn" : "btn-ghost") + '" onclick="App.setTab(\\'sites\\')">🌐 Meus Sites (' + mySites().length + ")</button></div>"
    + '<div id="deployBox" style="margin-top:14px"></div>'
    + '<div class="two" style="margin-top:14px">' + cards + "</div>";
}
function renderAdmin(){
  var us = allUsers(); var bs = bots(); var ss = sites();
  var mrr = 0; for(var i=0;i<us.length;i++){ if(us[i].plan === "PRO") mrr += 29.9; else if(us[i].plan === "BASIC") mrr += 9.9; }
  var bars = ""; for(var d=0; d<30; d++){ var h = 15 + Math.round(Math.random() * 85); bars += '<i style="height:' + h + '%" title="dia ' + (d+1) + '"></i>'; }
  var rows = "";
  for(var k=0;k<us.length;k++){ var x = us[k];
    var nb = 0, cpu = 0; for(var j=0;j<bs.length;j++){ if(bs[j].owner === x.id){ nb++; cpu += (bs[j].cpu || 0); } }
    rows += "<tr><td><b>" + esc(x.name) + "</b>" + (x.banned ? ' <span style="color:#fca5a5">(BANIDO)</span>' : "") + "</td><td>" + esc(x.email || "") + "</td><td>" + esc(x.plan || "FREE") + "</td><td>" + (x.credits || 0) + "</td><td>" + nb + " bots · " + cpu + "% CPU</td>"
    + '<td><button class="k danger" onclick="App.toggleBan(\\'' + x.id + '\\')">' + (x.banned ? "Desbanir" : "Banir") + "</button></td></tr>";
  }
  var cs = coupons(); var cl = "";
  for(var c=0;c<cs.length;c++){ cl += '<span class="k">' + esc(cs[c].code) + " -" + cs[c].pct + "%</span>"; }
  $("adminContent").innerHTML = '<div class="row">'
    + '<div class="card" style="flex:1;min-width:120px">👥 Usuários<div class="price">' + us.length + "</div></div>"
    + '<div class="card" style="flex:1;min-width:120px">🤖 Bots<div class="price">' + bs.length + "</div></div>"
    + '<div class="card" style="flex:1;min-width:120px">🌐 Sites<div class="price">' + ss.length + "</div></div>"
    + '<div class="card" style="flex:1;min-width:120px">💰 MRR<div class="price">R$' + mrr.toFixed(2) + "</div></div></div>"
    + '<div class="two" style="margin-top:14px"><div class="card"><h3>📈 Lucro do mês (R$)</h3><div class="profit">' + bars + "</div></div>"
    + '<div class="card"><h3>🖥 Nodes / VPS</h3><p>vps-br-01 (Hostinger) · CPU ' + (20 + Math.round(Math.random()*30)) + "% · " + (bs.length + ss.length) + ' containers</p><p style="margin-top:6px">vps-br-02 (Contabo) · CPU ' + (10 + Math.round(Math.random()*25)) + "% · " + Math.max(0, bs.length - 2) + " containers</p>"
    + '<h3 style="margin-top:12px">🎟 Cupons</h3><div class="row"><input id="ncCode" class="inp" style="max-width:130px" placeholder="CÓDIGO"/><input id="ncPct" class="inp" style="max-width:70px" type="number" value="20"/><button class="btn" onclick="App.addCoupon()">Criar</button></div><div class="row">' + cl + "</div></div></div>"
    + '<div class="card" style="margin-top:14px;overflow-x:auto"><h3>👥 Usuários, bots e consumo</h3><table><thead><tr><th>Usuário</th><th>Email</th><th>Plano</th><th>Créditos</th><th>Uso</th><th>Ação</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
}
function renderAll(){ renderAuth(); renderDash(); renderAdmin(); }
App.renderAll = renderAll;
renderAll();
setInterval(function(){
  var changed = false;
  var bs = bots();
  for(var i=0;i<bs.length;i++){ var b = bs[i];
    if(b.status === "online"){
      b.cpu = 5 + Math.round(Math.random() * 55);
      b.logs.push("[" + now() + "] bot " + b.name + " · cpu " + b.cpu + "% · mem " + Math.round(b.ramMB * (0.3 + Math.random() * 0.3)) + "MB · alive");
      if(b.logs.length > 200) b.logs = b.logs.slice(-200);
      changed = true;
      var el = document.getElementById("log-" + b.id);
      if(el){ el.innerHTML = b.logs.slice(-30).map(esc).join("<br/>"); el.scrollTop = el.scrollHeight; }
    }
  }
  if(changed){ try{ save("hb-bots", bs); }catch(e){} }
}, 4000);
document.addEventListener("keydown", function(e){ if(e.key === "Escape") App.closeLogin(); });
var lm = document.getElementById("loginModal");
if(lm){ lm.addEventListener("click", function(e){ if(e.target === lm) App.closeLogin(); }); }
var ln = document.getElementById("loginName");
if(ln){ ln.addEventListener("keydown", function(e){ if(e.key === "Enter") App.doLogin("discord"); }); }
})();
</script>
</body>
</html>`;

writeFileSync(join(out, "index.html"), html);
console.log("static built:", join(out, "index.html"));
