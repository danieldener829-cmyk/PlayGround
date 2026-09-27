import { NextRequest, NextResponse } from "next/server";
import { db, uid } from "@/lib/db";
import { detectRuntime, freeSubdomain, PLANS } from "@/lib/plans";
import { encryptEnv } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner") || undefined;
  return NextResponse.json({ bots: db.bots(owner) });
}

function runtimeInfo(runtime: string, main?: string) {
  const m = main || "";
  if (runtime.includes("Python")) return { runtime, install: "pip install -r requirements.txt", start: `python ${m || "main.py"}` };
  if (runtime.includes("Java")) return { runtime, install: "mvn package", start: `java -jar ${m || "app.jar"}` };
  if (runtime.includes("PHP")) return { runtime, install: "composer install", start: "php -S 0.0.0.0:8080" };
  if (runtime.includes("Static")) return { runtime, install: "—", start: "nginx" };
  return { runtime: "Node.js 20", install: "npm install", start: "npm start" };
}

export async function POST(req: NextRequest) {
  const { owner, name, repo, env, runtime, main } = await req.json();
  if (!owner || !name) return NextResponse.json({ error: "owner/name obrigatórios" }, { status: 400 });
  const user = db.users().find((u) => u.id === owner);
  const plan = PLANS[(user?.plan as keyof typeof PLANS) || "FREE"];
  if (db.bots(owner).length >= plan.bots) return NextResponse.json({ error: `Limite do plano ${plan.id}: ${plan.bots} bots. Faça upgrade.` }, { status: 402 });
  // runtime vem detectado do conteúdo do .zip; fallback: detecta pelo nome
  const det = runtime ? runtimeInfo(runtime, main) : detectRuntime([repo || "", "package.json", "index.js"]);
  const id = uid("bot");
  const bot = { id, owner, name, runtime: det.runtime, status: "building" as const, repo, ramMB: plan.ramPerBot, cpu: 3, envEnc: await encryptEnv(env || ""), createdAt: Date.now(), logs: [`zip recebido: ${repo}`, `runtime detectado: ${det.runtime}${main ? ` (${main})` : ""}`, `build: ${det.install}`, `build: container ${plan.ramPerBot}MB isolado`], restarts: 0, domain: freeSubdomain(name, "bot"), port: 3000 + Math.floor(Math.random() * 5000) };
  db.upsertBot(bot);
  // simulate async build → online + auto-restart loop
  setTimeout(() => { const b = db.bots().find((x) => x.id === id); if (b) { b.status = "online"; b.logs.push("Bot logado com sucesso ✅"); b.logs.push(`Deploy em https://${b.domain}`); db.upsertBot(b); } }, 2500);
  const iv = setInterval(() => {
    const b = db.bots().find((x) => x.id === id);
    if (!b) return clearInterval(iv);
    if (b.status === "online") { db.pushLog("bots", id, `heartbeat ok · cpu ${b.cpu}% · ram ${Math.round(b.ramMB * 0.4)}MB`); }
  }, 15000);
  (global as any)[id] = iv;
  return NextResponse.json({ bot });
}
