"use client";
import { useEffect, useRef, useState } from "react";
import { getSession, logout } from "@/lib/client-store";
import Link from "next/link";

type Bot = any; type Site = any;

type ZipInfo = { name: string; size: number; files: string[] | null; rt: { t: string; inst: string; start: string; main: string } };

function parseZipNames(buf: ArrayBuffer): string[] | null {
  try {
    const dv = new DataView(buf); const n = dv.byteLength; if (n < 22) return null;
    let eocd = -1; const start = Math.max(0, n - 22 - 65536);
    for (let i = n - 22; i >= start; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return null;
    const count = dv.getUint16(eocd + 10, true); const cdOff = dv.getUint32(eocd + 16, true);
    const names: string[] = []; let p = cdOff;
    const dec = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;
    for (let k = 0; k < count; k++) {
      if (p + 46 > n || dv.getUint32(p, true) !== 0x02014b50) break;
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      let nm = "";
      if (p + 46 + nl <= n) {
        if (dec) nm = dec.decode(new Uint8Array(buf, p + 46, nl));
        else { const raw = new Uint8Array(buf, p + 46, nl); let s = ""; for (let b = 0; b < raw.length; b++) s += String.fromCharCode(raw[b]); nm = s; }
      }
      if (nm && !nm.endsWith("/")) names.push(nm);
      p += 46 + nl + el + cl;
    }
    return names;
  } catch { return null; }
}

function runtimeFromFiles(names: string[] | null, zipName: string) {
  const hay = ((names || []).join("\n") + "\n" + (zipName || "")).toLowerCase();
  const pick = (list: string[]) => { if (!names) return ""; for (const n of names) { const l = n.toLowerCase(); if (list.some((s) => l.endsWith(s))) return n; } return ""; };
  if (hay.includes("package.json")) { const m = pick(["index.js", "main.js", "bot.js"]) || "package.json"; return { t: "Node.js 20", inst: "npm install", start: "npm start", main: m }; }
  if (hay.includes("requirements.txt") || hay.includes(".py")) { const m = pick(["main.py", "bot.py", "index.py", "app.py"]) || "main.py"; return { t: "Python 3.11", inst: "pip install -r requirements.txt", start: "python " + m, main: m }; }
  if (hay.includes("pom.xml") || hay.includes(".jar") || hay.includes(".java")) { const m = pick(["app.jar"]) || "app.jar"; return { t: "Java 17", inst: "mvn package", start: "java -jar " + m, main: m }; }
  if (hay.includes(".php")) { const m = pick(["index.php"]) || "index.php"; return { t: "PHP 8.2", inst: "composer install", start: "php -S 0.0.0.0:8080", main: m }; }
  if (hay.includes(".html")) return { t: "Static HTML", inst: "—", start: "nginx", main: "index.html" };
  return { t: "Node.js 20", inst: "npm install", start: "npm start", main: "" };
}

function fmtSize(b: number) { if (b > 1048576) return (b / 1048576).toFixed(1) + " MB"; if (b > 1024) return Math.round(b / 1024) + " KB"; return b + " B"; }

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [tab, setTab] = useState<"bots"|"sites">("bots");
  const [showNew, setShowNew] = useState<"bot"|"site"|null>(null);
  const [form, setForm] = useState({ name: "meu-bot", repo: "https://github.com/user/meubot", env: "DISCORD_TOKEN=xxx\nPREFIX=!" });
  const [zip, setZip] = useState<ZipInfo | null>(null);
  const [prog, setProg] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [formError, setFormError] = useState("");
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [term, setTerm] = useState<Record<string, string>>({});
  const [termOut, setTermOut] = useState<Record<string, string[]>>({});
  const esRef = useRef<EventSource|null>(null);
  const formRef = useRef<HTMLDivElement|null>(null);

  const load = async (u: any) => {
    if (!u?.id) return;
    try {
      const b = await (await fetch(`/api/bots?owner=${u.id}`)).json();
      const s = await (await fetch(`/api/sites?owner=${u.id}`)).json();
      setBots(b.bots || []); setSites(s.sites || []);
    } catch {}
  };

  useEffect(() => {
    const u = getSession();
    if (!u) { window.location.href = "/login?next=/dashboard"; return; }
    setUser(u); load(u);
    const iv = setInterval(() => load(getSession() || u), 5000);
    return () => { clearInterval(iv); esRef.current?.close(); };
  }, []);

  const openNew = (kind: "bot" | "site") => {
    setFormError(""); setProg([]); setZip(null);
    setShowNew(kind);
    setTab(kind === "bot" ? "bots" : "sites");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const subscribe = (id: string, kind: "bots"|"sites") => {
    esRef.current?.close();
    try {
      const es = new EventSource(`/api/logs/stream?id=${id}&kind=${kind}`);
      es.onmessage = (e) => setLogs((p) => ({ ...p, [id]: [...(p[id] || []).slice(-100), e.data] }));
      es.onerror = () => es.close();
      esRef.current = es;
    } catch {}
  };

  const readZipFile = async (f: File) => {
    const base = f.name.replace(/\.zip$/i, "").replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 30) || "meu-bot";
    setForm((p) => ({ ...p, name: p.name === "meu-bot" || !p.name ? base : p.name }));
    setZip({ name: f.name, size: f.size, files: null, rt: runtimeFromFiles(null, f.name) });
    try {
      const buf = await f.arrayBuffer();
      const names = parseZipNames(buf);
      setZip({ name: f.name, size: f.size, files: names, rt: runtimeFromFiles(names, f.name) });
    } catch {}
  };

  const create = async (kind: "bot"|"site") => {
    const u = getSession() || user;
    if (!u?.id) { window.location.href = "/login?next=/dashboard"; return; }
    const cleanName = form.name.trim();
    if (cleanName.length < 2) { setFormError("Dê um nome ao projeto (mín. 2 letras)."); return; }
    // BOT: só precisa do .zip — sem GitHub, sem env
    if (kind === "bot") {
      if (!zip) { setFormError("Envie o arquivo .zip do bot primeiro. 📦"); return; }
      if (!/\.zip$/i.test(zip.name)) { setFormError("O arquivo precisa ser .zip"); return; }
      setFormError(""); setDeploying(true);
      const steps = [
        "📤 Arquivo recebido: " + zip.name + " (" + fmtSize(zip.size) + ")",
        "📂 Extraindo " + (zip.files ? zip.files.length + " arquivos" : "arquivos") + "…",
        "⚡ Runtime detectado: " + zip.rt.t + (zip.rt.main ? " (" + zip.rt.main + ")" : ""),
        "📦 " + zip.rt.inst + "…",
        "🔌 Ligando o bot…",
      ];
      setProg([]);
      for (const s of steps) { await new Promise((r) => setTimeout(r, 450)); setProg((p) => [...p, "✔ " + s]); }
      try {
        const res = await fetch("/api/bots", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner: u.id, name: cleanName, repo: "zip: " + zip.name + (zip.files ? " (" + zip.files.length + " arquivos)" : ""), env: "", runtime: zip.rt.t, main: zip.rt.main }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) { setFormError(data.error || "Falha no deploy. Tente de novo."); return; }
        setShowNew(null); setZip(null); setProg([]); setTab("bots");
        await load(u);
        setTimeout(() => load(getSession() || u), 3500);
      } catch {
        setFormError("Erro de rede no deploy. Tente de novo.");
      } finally {
        setDeploying(false);
      }
      return;
    }
    if (!form.repo.trim()) { setFormError("Cole o link do GitHub do site."); return; }
    setFormError(""); setDeploying(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: u.id, name: cleanName, repo: form.repo.trim(), env: form.env, framework: "Next.js" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) { setFormError(data.error || "Falha no deploy. Tente de novo."); return; }
      setShowNew(null); setTab("sites");
      await load(u);
      setTimeout(() => load(getSession() || u), 3500);
    } catch {
      setFormError("Erro de rede no deploy. Tente de novo.");
    } finally {
      setDeploying(false);
    }
  };

  const action = async (kind: "bots"|"sites", id: string, act: string) => {
    await fetch(`/api/${kind}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: act }) });
    load(getSession() || user);
  };
  const del = async (kind: "bots"|"sites", id: string) => {
    if (!confirm("Deletar?")) return;
    await fetch(`/api/${kind}/${id}`, { method: "DELETE" }); load(getSession() || user);
  };
  const runTerm = async (id: string) => {
    const cmd = term[id] || "help";
    const r = await (await fetch("/api/terminal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, cmd }) })).json();
    setTermOut((p) => ({ ...p, [id]: [...(p[id] || []), `$ ${cmd}`, r.output] }));
    setTerm((p) => ({ ...p, [id]: "" }));
  };

  if (!user) return <main className="p-20 text-center">Carregando…</main>;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Olá, {user.name} 👋</h1>
          <p className="text-white/60 text-sm">Plano {user.plan} · {user.credits} créditos (1 dia = 1 crédito) · <Link href="/pricing" className="underline text-purple-300">upgrade</Link></p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => openNew("bot")} className="rounded-xl btn-neon px-5 py-2.5 text-sm font-bold">+ Subir Bot</button>
          <button type="button" onClick={() => openNew("site")} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold">+ Subir Site</button>
          <button type="button" onClick={logout} className="rounded-xl px-3 py-2 text-sm text-white/50">Sair</button>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {(["bots", "sites"] as const).map((t) => (
          <button type="button" key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === t ? "btn-neon" : "glass"}`}>{t === "bots" ? `🤖 Meus Bots (${bots.length})` : `🌐 Meus Sites (${sites.length})`}</button>
        ))}
      </div>

      {showNew && (
        <div ref={formRef} className="mt-4 glass rounded-2xl p-5">
          {showNew === "bot" ? (
            <>
              <h3 className="font-bold">Ligar Bot — envie o arquivo .zip</h3>
              <p className="text-xs text-white/55 mt-1">Sem GitHub, sem .env, sem configuração. É só mandar o .zip que a gente liga o bot. ⚡</p>
              <div
                onClick={() => document.getElementById("dz-file")?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) readZipFile(f); }}
                className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-purple-400 bg-purple-500/15 scale-[1.01]" : "border-purple-500/50 bg-purple-500/5"}`}
              >
                <div className="text-4xl">📦</div>
                <div className="font-bold mt-1">Arraste o .zip do bot aqui</div>
                <div className="text-xs text-white/55 mt-1">ou clique para escolher o arquivo</div>
              </div>
              <input id="dz-file" type="file" accept=".zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readZipFile(f); }} />
              {zip && (
                <div className="mt-3 text-sm">
                  <p>📦 <b>{zip.name}</b> · {fmtSize(zip.size)}{zip.files ? ` · ${zip.files.length} arquivos` : " · lendo arquivos…"} ✓</p>
                  <p className="mt-1">⚡ Runtime detectado: <b>{zip.rt.t}</b>{zip.rt.main ? <span className="text-white/55"> · entrada: {zip.rt.main}</span> : null}</p>
                </div>
              )}
              <label className="block text-xs text-white/60 mt-3 mb-1">Nome do bot</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="meu-bot" className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm" />
              {prog.length > 0 && <div className="mt-2 font-mono text-xs text-green-300 leading-6">{prog.map((p, i) => <div key={i}>{p}</div>)}</div>}
              {formError && <p className="mt-2 text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={deploying} onClick={() => create("bot")} className="rounded-lg btn-neon px-5 py-2 text-sm font-bold disabled:opacity-60">
                  {deploying ? "Ligando… ⏳" : "Ligar meu Bot 🚀"}
                </button>
                <button type="button" onClick={() => { setShowNew(null); setFormError(""); setZip(null); setProg([]); }} className="rounded-lg glass px-5 py-2 text-sm">Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-bold">Subir Site — HTML/React/Next/PHP/WordPress</h3>
              <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="nome" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2" />
                <input value={form.repo} onChange={(e) => setForm({ ...form, repo: e.target.value })} placeholder="link do GitHub" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2" />
              </div>
              {formError && <p className="mt-2 text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2">{formError}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={deploying} onClick={() => create("site")} className="rounded-lg btn-neon px-5 py-2 text-sm font-bold disabled:opacity-60">
                  {deploying ? "Subindo… aguarde ⏳" : "Deploy em 1 clique 🚀"}
                </button>
                <button type="button" onClick={() => { setShowNew(null); setFormError(""); }} className="rounded-lg glass px-5 py-2 text-sm">Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        {(tab === "bots" ? bots : sites).map((it: any) => (
          <div key={it.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="font-extrabold">{it.name} <span className="text-xs font-normal text-white/40">{it.runtime || it.framework}</span></div>
              <span className={`text-xs rounded-full px-2.5 py-1 ${it.status === "online" ? "bg-green-500/20 text-green-300" : it.status === "building" ? "bg-yellow-500/20 text-yellow-300" : "bg-white/10 text-white/60"}`}>● {it.status.toUpperCase()}</span>
            </div>
            <div className="mt-2 text-xs text-white/60">🌐 {it.domain} {it.ssl === false ? "(SSL…)" : "🔒"} · RAM {it.ramMB || 512}MB · CPU {it.cpu || 4}% · restarts {it.restarts || 0}</div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${Math.min(100, (it.cpu || 10))}%` }} /></div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => action(tab, it.id, "restart")} className="rounded-lg bg-white/10 px-3 py-1.5">↻ Reiniciar</button>
              <button type="button" onClick={() => action(tab, it.id, it.status === "online" ? "stop" : "start")} className="rounded-lg bg-white/10 px-3 py-1.5">{it.status === "online" ? "⏸ Parar" : "▶ Ligar"}</button>
              <button type="button" onClick={() => subscribe(it.id, tab)} className="rounded-lg bg-white/10 px-3 py-1.5">📜 Logs live</button>
              <button type="button" onClick={() => del(tab, it.id)} className="rounded-lg bg-red-500/20 text-red-300 px-3 py-1.5">🗑 Deletar</button>
            </div>
            <div className="mt-3 rounded-xl bg-black/60 border border-white/10 p-3 h-36 overflow-y-auto scroll-thin logbox text-[11px] text-green-300/90">
              {(logs[it.id] || it.logs || []).map((l: string, i: number) => <div key={i}>{l}</div>)}
              {!((logs[it.id] || it.logs || []).length) && <span className="text-white/30">clique em “Logs live”…</span>}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={term[it.id] || ""} onChange={(e) => setTerm({ ...term, [it.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && runTerm(it.id)} placeholder="terminal online: help, ls, ps, env, restart…" className="flex-1 rounded-lg bg-black/60 border border-white/10 px-3 py-1.5 text-xs font-mono" />
              <button type="button" onClick={() => runTerm(it.id)} className="rounded-lg btn-neon px-3 py-1.5 text-xs font-bold">▶</button>
            </div>
            {(termOut[it.id] || []).length > 0 && <pre className="mt-2 rounded-lg bg-black/60 p-2 text-[11px] font-mono text-cyan-200 whitespace-pre-wrap">{termOut[it.id].join("\n")}</pre>}
          </div>
        ))}
      </div>
      {(tab === "bots" ? bots : sites).length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-12 text-center text-white/50">
          Nada aqui ainda.
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => openNew("bot")} className="rounded-xl btn-neon px-5 py-2.5 text-sm font-bold">Subir Bot ⚡</button>
            <button type="button" onClick={() => openNew("site")} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold">Subir Site</button>
          </div>
        </div>
      )}
    </main>
  );
}
