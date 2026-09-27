import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action } = await req.json();
  const bot = db.bots().find((b) => b.id === params.id);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (action === "restart") { bot.status = "building"; bot.restarts++; bot.logs.push("restart manual…"); db.upsertBot(bot); setTimeout(() => { bot.status = "online"; bot.logs.push("Bot online após restart ✅ (auto-restart 99%)"); db.upsertBot(bot); }, 2000); }
  if (action === "stop") { bot.status = "offline"; bot.logs.push("container parado"); db.upsertBot(bot); }
  if (action === "start") { bot.status = "online"; bot.logs.push("container iniciado"); db.upsertBot(bot); }
  return NextResponse.json({ bot });
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const iv = (global as any)[params.id]; if (iv) clearInterval(iv);
  db.remove("bots", params.id);
  return NextResponse.json({ ok: true });
}
