import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const u = await req.json();
  const exists = db.users().find((x) => x.id === u.id);
  if (!exists) db.upsertUser({ id: u.id, name: u.name, email: u.email, plan: "FREE", credits: 3, createdAt: Date.now() });
  return NextResponse.json({ ok: true });
}
