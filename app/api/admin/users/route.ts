import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  const u = db.users().find((x) => x.id === id);
  if (u) { (u as any).banned = !(u as any).banned; db.upsertUser(u as any); }
  return NextResponse.json({ ok: true });
}
