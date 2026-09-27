import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function POST(req: NextRequest) {
  const { code, pct } = await req.json();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  db.upsertCoupon({ code: code.toUpperCase(), pct: +pct || 10, uses: 100 });
  return NextResponse.json({ ok: true });
}
