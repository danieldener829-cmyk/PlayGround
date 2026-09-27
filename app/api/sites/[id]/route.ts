import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action, customDomain } = await req.json();
  const s = db.sites().find((x) => x.id === params.id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (action === "restart") { s.status = "building"; setTimeout(() => { s.status = "online"; db.upsertSite(s); }, 1500); }
  if (action === "stop") s.status = "offline";
  if (action === "start") s.status = "online";
  if (customDomain) { (s as any).customDomain = customDomain; s.logs.push(`domínio próprio ${customDomain} + SSL ✅`); }
  db.upsertSite(s);
  return NextResponse.json({ site: s });
}
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  db.remove("sites", params.id);
  return NextResponse.json({ ok: true });
}
