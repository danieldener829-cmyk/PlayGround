"use client";
import { useState, useEffect } from "react";
import { setSession, getSession } from "@/lib/client-store";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const r = useRouter();
  const sp = useSearchParams();
  const mode = sp.get("mode") === "register" ? "register" : "login";
  const next = sp.get("next") || "/dashboard";

  useEffect(() => {
    const existing = getSession();
    if (existing) r.replace(next);
  }, [r, next]);

  const login = async (provider: "discord" | "google") => {
    setError("");
    const clean = name.trim() || `${provider}-user`;
    if (clean.length < 2) { setError("Digite seu nome (mín. 2 letras)."); return; }
    setLoading(provider);
    try {
      const user = { id: "u_" + Date.now().toString(36), name: clean, email: `${clean.toLowerCase().replace(/\s+/g, ".")}@${provider}.com`, plan: "FREE", credits: 3, provider };
      setSession(user);
      await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }).catch(() => {});
      r.push(next);
      // fallback garantido: se o router falhar, força navegação
      setTimeout(() => { if (window.location.pathname === "/login") window.location.href = next; }, 800);
    } catch {
      setError("Falha ao entrar. Tente de novo.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 py-20">
      <div className="glass rounded-2xl p-8 text-center shadow-glow">
        <div className="text-4xl">🤖</div>
        <h1 className="text-2xl font-black mt-2">{mode === "register" ? "Criar conta grátis" : "Entrar na HOSTBOTS"}</h1>
        <p className="text-white/60 text-sm mt-1">Login com Discord e Google (OAuth pronto p/ produção)</p>
        <label className="mt-5 block text-left text-xs text-white/60">Seu nome / nome do bot</label>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") login("discord"); }}
          placeholder="ex: daniel" autoFocus
          className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-purple-500"
        />
        {error && <p className="mt-2 text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        <button type="button" disabled={!!loading} onClick={() => login("discord")} className="mt-3 w-full rounded-xl bg-[#5865F2] px-4 py-3 font-bold hover:brightness-110 disabled:opacity-60">
          {loading === "discord" ? "Conectando…" : "Login com Discord"}
        </button>
        <button type="button" disabled={!!loading} onClick={() => login("google")} className="mt-2 w-full rounded-xl bg-white text-black px-4 py-3 font-bold hover:bg-white/90 disabled:opacity-60">
          {loading === "google" ? "Conectando…" : "Login com Google"}
        </button>
        <p className="mt-4 text-sm text-white/50">
          {mode === "register" ? <>Já tem conta? <Link href="/login?mode=login" className="underline text-purple-300">Entrar</Link></> : <>Novo aqui? <Link href="/login?mode=register" className="underline text-purple-300">Criar conta grátis</Link></>}
        </p>
        <p className="mt-2 text-[11px] text-white/40">Para produção, preencha DISCORD_CLIENT_ID/SECRET e GOOGLE_* no .env — callback em /api/auth/[provider]/callback (ver docs).</p>
      </div>
    </main>
  );
}

export default function Login() {
  return <Suspense fallback={<main className="p-20 text-center">Carregando…</main>}><LoginForm /></Suspense>;
}
