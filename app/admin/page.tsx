"use client";
import { useEffect, useState } from "react";

export default function Admin() {
  const [data, setData] = useState<any>(null);
  const [coupon, setCoupon] = useState({ code: "", pct: 20 });
  const load = async () => setData(await (await fetch("/api/admin/stats")).json());
  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, []);
  const ban = async (id: string) => { await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load(); };
  const newCoupon = async () => { await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coupon) }); setCoupon({ code: "", pct: 20 }); load(); };
  if (!data) return <main className="p-20 text-center">Carregando admin…</main>;
  const max = Math.max(1, ...data.profit.map((p: any) => p.value));
  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <h1 className="text-3xl font-black">🛡️ Painel Admin <span className="text-xs font-normal text-white/40">(só você vê)</span></h1>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        {[["👥 Usuários", data.totals.users], ["🤖 Bots", data.totals.bots], ["🌐 Sites", data.totals.sites], ["💰 MRR", `R$${data.totals.mrr}`], ["🖥 Nodes", data.nodes.length]].map(([k, v]) => (
          <div key={k as string} className="glass rounded-xl p-4"><div className="text-xs text-white/50">{k}</div><div className="text-2xl font-black">{v as string}</div></div>
        ))}
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold">📈 Lucro do mês (R$)</h3>
          <div className="mt-3 flex items-end gap-1.5 h-32">{data.profit.map((p: any) => <div key={p.day} title={`dia ${p.day}: R$${p.value}`} className="flex-1 rounded-t bg-gradient-to-t from-purple-600 to-cyan-400" style={{ height: `${(p.value / max) * 100}%` }} />)}</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold">🖥 Nodes / VPS</h3>
          {data.nodes.map((n: any) => (
            <div key={n.name} className="mt-2 text-sm"><div className="flex justify-between text-xs text-white/60"><span>{n.name} · {n.containers} containers</span><span>CPU {n.cpu}% · RAM {n.ram}%</span></div>
            <div className="h-2 rounded bg-white/10 mt-1"><div className="h-full rounded bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${n.cpu}%` }} /></div></div>
          ))}
          <h3 className="font-bold mt-4">🎟 Cupons</h3>
          <div className="flex gap-2 mt-2 text-sm"><input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="CÓDIGO" className="rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 w-32" />
          <input type="number" value={coupon.pct} onChange={(e) => setCoupon({ ...coupon, pct: +e.target.value })} className="rounded-lg bg-black/40 border border-white/10 px-2 py-1.5 w-20" />
          <button onClick={newCoupon} className="rounded-lg btn-neon px-3 font-bold">Criar</button></div>
          <div className="mt-2 text-xs text-white/60">{data.coupons.map((c: any) => <span key={c.code} className="mr-2 rounded bg-white/10 px-2 py-0.5">{c.code} -{c.pct}%</span>)}</div>
        </div>
      </div>
      <div className="mt-4 glass rounded-2xl p-5 overflow-x-auto">
        <h3 className="font-bold">👥 Todos os usuários, bots e consumo</h3>
        <table className="mt-3 w-full text-xs">
          <thead><tr className="text-white/40 text-left"><th className="p-2">Usuário</th><th>Email</th><th>Plano</th><th>Créditos</th><th>Bots/CPU/RAM</th><th>Ação</th></tr></thead>
          <tbody>{data.users.map((u: any) => (
            <tr key={u.id} className="border-t border-white/10"><td className="p-2 font-bold">{u.name} {u.banned && <span className="text-red-400">(BANIDO)</span>}</td><td>{u.email}</td><td>{u.plan}</td><td>{u.credits}</td><td>{u.usage}</td>
            <td><button onClick={() => ban(u.id)} className="rounded bg-red-500/20 text-red-300 px-2 py-1">{u.banned ? "Desbanir" : "Banir"}</button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </main>
  );
}
