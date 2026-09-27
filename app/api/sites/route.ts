import { NextRequest, NextResponse } from "next/server";
import { db, uid } from "@/lib/db";
import { freeSubdomain, PLANS } from "@/lib/plans";

export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner") || undefined;
  return NextResponse.json({ sites: db.sites(owner) });
}
export async function POST(req: NextRequest) {
  const { owner, name, repo, framework } = await req.json();
  const user = db.users().find((u) => u.id === owner);
  const plan = PLANS[(user?.plan as keyof typeof PLANS) || "FREE"];
  if (db.sites(owner).length >= plan.sites) return NextResponse.json({ error: `Limite do plano: ${plan.sites} sites.` }, { status: 402 });
  const id = uid("site");
  const site = { id, owner, name, framework: framework || "Next.js", status: "building" as const, domain: freeSubdomain(name, "site"), ssl: true, createdAt: Date.now(), logs: [`git clone ${repo}`, "npm install && npm run build", "SSL Let's Encrypt emitido ✅"] };
  db.upsertSite(site);
  setTimeout(() => { const s = db.sites().find((x) => x.id === id); if (s) { s.status = "online"; s.logs.push(`Live em https://${s.domain} ${plan.watermark ? "(marca d'água Free)" : ""}`); db.upsertSite(s); } }, 2500);
  return NextResponse.json({ site });
}
