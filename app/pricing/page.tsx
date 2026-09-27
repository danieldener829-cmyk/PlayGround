"use client";
import { useState } from "react";
import { getSession, setSession } from "@/lib/client-store";

const PLANS = [
  { id: "FREE", n: "Grátis", p: "R$0", f: ["1 bot · 256MB RAM", "1 site com marca d'água", "Dorme após 30min", "Suporte comunidade"] },
  { id: "BASIC", n: "Basic", p: "R$9,90/mês", f: ["3 bots · 512MB RAM", "2 sites sem marca", "Online 24/7, sem dormir", "Logs + terminal"], hot: true },
  { id: "PRO", n: "Pro", p: "R$29,90/mês", f: ["10 bots · 2GB RAM", "10 sites + domínio grátis", "Suporte prioritário", "SSL + .env cripto"] },
];

export default function Pricing() {
  const [coupon, setCoupon] = useState("BEMVINDO10");
  const [msg, setMsg] = useState("");
  const pay = async (plan: string, method: "stripe" | "pix") => {
    const u = getSession(); if (!u) { location.href = "/login"; return; }
    const r = await (await fetch("/api/payments/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, method, coupon, email: u.email, userId: u.id }) })).json();
    setMsg(method === "pix" ? `PIX gerado: ${r.qr || "qr-code"} — ${r.amount} (demo). Confirmando…` : `Stripe session ${r.sessionId} — ${r.amount} (demo). Confirmando…`);
    setTimeout(async () => {
      await fetch("/api/payments/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id, plan }) });
      const nu = { ...u, plan }; setSession(nu); setMsg(`✅ Plano ${plan} ativo! Créditos renovados.`);
    }, 1500);
  };
  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <h1 className="text-4xl font-black text-center">Planos que <span className="text-purple-400">cabem no bolso</span></h1>
      <p className="text-center text-white/60 mt-2">1 dia = 1 crédito · cancele quando quiser · PIX ou cartão</p>
      <div className="mt-4 flex justify-center gap-2 text-sm">
        <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="cupom" className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 w-44" />
        <span className="text-white/40 text-xs self-center">tente BEMVINDO10</span>
      </div>
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <div key={p.id} className={`rounded-2xl p-7 ${p.hot ? "btn-neon shadow-glow scale-[1.03]" : "glass"}`}>
            {p.hot && <div className="text-xs font-bold bg-black/40 inline-block rounded-full px-3 py-1">⭐ MAIS POPULAR</div>}
            <div className="font-bold mt-2">{p.n}</div>
            <div className="text-3xl font-black">{p.p}</div>
            <ul className="mt-4 space-y-2 text-sm opacity-90">{p.f.map((f) => <li key={f}>✓ {f}</li>)}</ul>
            {p.id !== "FREE" && (
              <div className="mt-5 space-y-2">
                <button onClick={() => pay(p.id, "pix")} className="w-full rounded-xl bg-black/40 py-2.5 text-sm font-bold">💜 Pagar com PIX (Mercado Pago)</button>
                <button onClick={() => pay(p.id, "stripe")} className="w-full rounded-xl bg-white text-black py-2.5 text-sm font-bold">💳 Cartão (Stripe)</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {msg && <p className="mt-6 text-center text-sm text-cyan-300">{msg}</p>}
    </main>
  );
}
