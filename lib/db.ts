import fs from "fs";
import path from "path";

export type Bot = { id: string; owner: string; name: string; runtime: string; status: "online"|"offline"|"building"|"sleeping"; repo?: string; ramMB: number; cpu: number; envEnc: string; createdAt: number; logs: string[]; restarts: number; domain: string; port: number; };
export type Site = { id: string; owner: string; name: string; framework: string; status: "online"|"offline"|"building"; domain: string; customDomain?: string; ssl: boolean; createdAt: number; logs: string[]; };
export type User = { id: string; name: string; email: string; plan: string; credits: number; banned?: boolean; createdAt: number };
export type Coupon = { code: string; pct: number; uses: number };

const DATA = path.join("/tmp", "hostbots-db.json");
function load(): { bots: Bot[]; sites: Site[]; users: User[]; coupons: Coupon[] } {
  try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
  catch { return { bots: [], sites: [], users: [{ id: "admin", name: "Admin", email: "admin@hostbots.com.br", plan: "PRO", credits: 999, createdAt: Date.now() }], coupons: [{ code: "BEMVINDO10", pct: 10, uses: 100 }] }; }
}
function save(d: any) { try { fs.writeFileSync(DATA, JSON.stringify(d)); } catch {} }
export const db = {
  all() { return load(); },
  bots(owner?: string) { const d = load(); return owner ? d.bots.filter((b) => b.owner === owner) : d.bots; },
  sites(owner?: string) { const d = load(); return owner ? d.sites.filter((s) => s.owner === owner) : d.sites; },
  users() { return load().users; },
  coupons() { return load().coupons; },
  upsertBot(b: Bot) { const d = load(); const i = d.bots.findIndex((x) => x.id === b.id); i >= 0 ? (d.bots[i] = b) : d.bots.push(b); save(d); return b; },
  upsertSite(s: Site) { const d = load(); const i = d.sites.findIndex((x) => x.id === s.id); i >= 0 ? (d.sites[i] = s) : d.sites.push(s); save(d); return s; },
  upsertUser(u: User) { const d = load(); const i = d.users.findIndex((x) => x.id === u.id); i >= 0 ? (d.users[i] = u) : d.users.push(u); save(d); return u; },
  upsertCoupon(c: Coupon) { const d = load(); const i = d.coupons.findIndex((x) => x.code === c.code); i >= 0 ? (d.coupons[i] = c) : d.coupons.push(c); save(d); },
  remove(kind: "bots"|"sites", id: string) { const d = load(); (d as any)[kind] = (d as any)[kind].filter((x: any) => x.id !== id); save(d); },
  pushLog(kind: "bots"|"sites", id: string, line: string) {
    const d = load(); const arr = (d as any)[kind] as any[];
    const it = arr.find((x) => x.id === id); if (!it) return;
    it.logs = [...(it.logs || []).slice(-200), `[${new Date().toISOString().slice(11,19)}] ${line}`];
    if (kind === "bots") { it.cpu = Math.round(5 + Math.random() * 60); }
    save(d);
  },
};
export const uid = (p: string) => p + "_" + Math.random().toString(36).slice(2, 8);
