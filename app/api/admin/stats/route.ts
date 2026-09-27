import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = db.users(); const bots = db.bots(); const sites = db.sites();
  const mrr = users.reduce((a, u) => a + (u.plan === "PRO" ? 29.9 : u.plan === "BASIC" ? 9.9 : 0), 0);
  const profit = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: Math.round((mrr / 30) * (0.6 + Math.random() * 0.8) * 100) / 100 }));
  const nodes = [
    { name: "vps-br-01 (Hostinger)", cpu: 20 + Math.round(Math.random() * 30), ram: 45 + Math.round(Math.random() * 20), containers: bots.length + sites.length },
    { name: "vps-br-02 (Contabo)", cpu: 10 + Math.round(Math.random() * 25), ram: 30 + Math.round(Math.random() * 20), containers: Math.max(0, bots.length - 2) },
  ];
  const enriched = users.map((u) => ({ ...u, usage: `${bots.filter((b) => b.owner === u.id).length} bots · ${bots.filter((b) => b.owner === u.id).reduce((a, b) => a + (b.cpu || 0), 0)}% CPU` }));
  return NextResponse.json({ totals: { users: users.length, bots: bots.length, sites: sites.length, mrr: mrr.toFixed(2) }, profit, nodes, users: enriched, coupons: db.coupons() });
}
