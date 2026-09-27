import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="grid-bg relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="mx-auto max-w-7xl px-5 pt-20 pb-14 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-lime animate-pulseGlow" /> Uptime 99.9% · 12.400 bots online agora
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl md:text-7xl font-black leading-[1.02] tracking-tight">
            Hospede seu Bot do Discord em <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">5 segundos</span> por R$9,90
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/60 text-lg">Envie o .zip do seu bot. Detectamos Node, Python ou Java sozinhos, instalamos tudo e ligamos em 5 segundos, online 24/7.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-xl btn-neon px-7 py-3.5 font-bold">🚀 Subir meu Bot — 1 clique</Link>
            <Link href="/pricing" className="rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-bold hover:bg-white/10">Ver planos</Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-white/50">
            {["Node.js 18/20", "Python 3.11", "Java 17", "Next.js", "PHP", "WordPress", "SSL grátis", ".env criptografado"].map((t) => (
              <span key={t} className="rounded-full glass px-3 py-1">{t}</span>
            ))}
          </div>
        </div>
        {/* terminal mock */}
        <div className="mx-auto max-w-4xl px-5 pb-10">
          <div className="glass rounded-2xl overflow-hidden shadow-glow animate-float">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs text-white/50">
              <span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-yellow-300" /><span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-2">terminal — meubot.hostbots.com.br</span>
              <span className="ml-auto rounded bg-green-500/20 px-2 py-0.5 text-green-300">● ONLINE</span>
            </div>
            <pre className="logbox p-5 text-[13px] leading-6 text-white/80 overflow-x-auto">
{`$ hostbots deploy --zip meubot.zip
✔ Runtime detectado: Node.js 20
✔ npm install (142 pacotes em 8s)
✔ Container isolado: 512MB RAM · SSL ativo
✔ Deploy em https://meubot.hostbots.com.br

[22:01:12] Bot logado como MinhaLoja#1234 ✅
[22:01:13] 14 comandos slash sincronizados
[22:01:14] Uptime monitor: reinício automático ativo`}
            </pre>
          </div>
        </div>
      </section>

      {/* marquee */}
      <div className="overflow-hidden border-y border-white/10 bg-white/[.02] py-3">
        <div className="flex w-max gap-10 animate-marquee text-sm text-white/50 whitespace-nowrap">
          {Array(2).fill(["⚡ Deploy em 5s", "🔒 SSL grátis", "📜 Logs WebSocket", "🐳 Docker isolado", "💜 PIX via Mercado Pago", "💳 Stripe", "🌙 Nunca dorme no Pro", "🧠 Auto-restart 99%"]).flat().map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* features */}
      <section className="mx-auto max-w-7xl px-5 py-16 grid md:grid-cols-3 gap-4">
        {[
          ["🤖", "Bots 24/7", "Node, Python, Java. Procfile, requirements.txt e package.json detectados. Se cair, reinicia sozinho."],
          ["🌐", "Sites instantâneos", "HTML, React, Next.js, PHP e WordPress. Domínio meubot.hostbots.com.br + SSL grátis + domínio próprio."],
          ["📊", "Observabilidade", "CPU, RAM, logs em tempo real via WebSocket e terminal no navegador. Reiniciar, parar e deletar em 1 clique."],
          ["💰", "Planos justos", "Grátis para testar, R$9,90 Basic e R$29,90 Pro. PIX ou cartão. 1 dia = 1 crédito."],
          ["🔐", ".env criptografado", "Variáveis AES-GCM. Nunca expomos seu token do Discord."],
          ["🛡️", "Painel Admin", "Usuários, consumo CPU/RAM, bans, cupons, lucro do mês e gerenciamento de Nodes/VPS."],
        ].map(([e, t, d]) => (
          <div key={t} className="glass rounded-2xl p-6 hover:border-purple-500/50 transition">
            <div className="text-3xl">{e}</div>
            <h3 className="mt-3 font-extrabold text-lg">{t}</h3>
            <p className="mt-1 text-sm text-white/60">{d}</p>
          </div>
        ))}
      </section>

      {/* pricing teaser */}
      <section className="mx-auto max-w-6xl px-5 pb-16 grid md:grid-cols-3 gap-4">
        {[
          ["Grátis", "R$0", "1 bot · 256MB · dorme 30min · marca d'água"],
          ["Basic", "R$9,90/mês", "3 bots · 512MB · 2 sites · 24/7 sem dormir ⭐"],
          ["Pro", "R$29,90/mês", "10 bots · 2GB · 10 sites · domínio grátis"],
        ].map(([n, p, d]) => (
          <div key={n} className={`rounded-2xl p-6 text-center ${n === "Basic" ? "btn-neon" : "glass"}`}>
            <div className="font-bold">{n}</div>
            <div className="text-3xl font-black mt-1">{p}</div>
            <div className="text-sm opacity-80 mt-1">{d}</div>
            <Link href="/pricing" className={`mt-4 inline-block rounded-lg px-5 py-2 text-sm font-bold ${n === "Basic" ? "bg-black/40" : "bg-white/10"}`}>Assinar</Link>
          </div>
        ))}
      </section>

      {/* how */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="text-3xl font-black text-center">Como funciona</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
          {[["1. Conecte", "Login com Discord ou Google em 1 clique."], ["2. Envie o .zip", "Arraste o arquivo do seu bot. Sem GitHub, sem .env."], ["3. Bot ligado", "Detectamos o runtime, instalamos as dependências e ligamos com SSL."]].map(([t, d]) => (
            <div key={t} className="glass rounded-2xl p-5"><div className="font-bold">{t}</div><p className="text-white/60 mt-1">{d}</p></div>
          ))}
        </div>
        <div className="text-center mt-8"><Link href="/dashboard" className="rounded-xl btn-neon px-8 py-3.5 font-bold inline-block">Abrir dashboard →</Link></div>
      </section>
    </main>
  );
}
