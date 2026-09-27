"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/client-store";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); const h = () => setUser(getSession()); window.addEventListener("hb-auth", h); return () => window.removeEventListener("hb-auth", h); }, []);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl btn-neon text-lg">🤖</span>
          HOST<span className="text-neon">BOTS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <Link href="/pricing" className="hover:text-white">Planos</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/docs" className="hover:text-white">Docs</Link>
          <Link href="/admin" className="hover:text-white">Admin</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-white/60">{user.name} · {user.plan}</span>
              <Link href="/dashboard" className="rounded-lg btn-neon px-4 py-2 text-sm font-bold">Abrir painel</Link>
            </>
          ) : (
            <>
              <Link href="/login?mode=login" className="rounded-lg border border-white/15 px-4 py-2 text-sm">Entrar</Link>
              <Link href="/login?mode=register&next=/dashboard" className="rounded-lg btn-neon px-4 py-2 text-sm font-bold">Começar grátis</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
