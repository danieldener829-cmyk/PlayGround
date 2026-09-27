import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { id, cmd } = await req.json();
  const bot = db.bots().find((b) => b.id === id) || db.sites().find((s: any) => s.id === id) as any;
  if (!bot) return NextResponse.json({ output: "container não encontrado" });
  const c = (cmd || "").trim().toLowerCase();
  let out = "";
  if (c === "help") out = "comandos: ls · ps · env (mascarado) · logs · restart · neofetch";
  else if (c === "ls") out = "index.js  package.json  Procfile  .env  node_modules/";
  else if (c === "ps") out = `PID 1 node index.js · CPU ${bot.cpu || 12}% · RAM ${bot.ramMB || 512}MB · uptime 99.9%`;
  else if (c === "env") out = "DISCORD_TOKEN=•••••• (AES-GCM criptografado) · PREFIX=!";
  else if (c === "logs") out = (bot.logs || []).slice(-5).join("\n");
  else if (c === "restart") { out = "reiniciando container… online ✅"; }
  else if (c === "neofetch") out = `HOSTBOTS container\nruntime: ${bot.runtime || bot.framework}\ndomain: ${bot.domain}\nssl: ativo`;
  else out = `exec: ${cmd}\n→ saída simulada no container isolado (Docker)`;
  db.pushLog("bots", id, `$ ${cmd} → ok`);
  return NextResponse.json({ output: out });
}
