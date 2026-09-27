import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId, plan } = await req.json();
  const u = db.users().find((x) => x.id === userId);
  if (u) { u.plan = plan; u.credits = plan === "PRO" ? 30 : 15; db.upsertUser(u); }
  return NextResponse.json({ ok: true, plan });
}
