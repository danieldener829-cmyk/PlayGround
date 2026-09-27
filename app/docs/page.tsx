export default function Docs() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 prose-invert">
      <h1 className="text-4xl font-black">📚 Documentação HOSTBOTS</h1>
      <div className="mt-6 space-y-4 text-sm text-white/70">
        <section className="glass rounded-2xl p-5"><h2 className="font-bold text-white">Subindo um bot (Node/Python/Java)</h2>
        <pre className="mt-2 rounded bg-black/60 p-3 text-xs overflow-x-auto">{`1. Dashboard → Subir Bot → cole o GitHub ou .zip
2. Detectamos: package.json (Node 20) | requirements.txt (Python 3.11) | pom.xml (Java 17)
3. Instalamos: npm install / pip install / mvn package
4. Procfile opcional: worker: node index.js
5. .env criptografado com AES-GCM. URL: seubot.hostbots.com.br`}</pre></section>
        <section className="glass rounded-2xl p-5"><h2 className="font-bold text-white">Subindo um site</h2><p>HTML, React, Next.js, PHP e WordPress. Deploy via GitHub, domínio grátis + SSL automático (Let's Encrypt). Domínio próprio: aponte CNAME para <code>cname.hostbots.com.br</code>.</p></section>
        <section className="glass rounded-2xl p-5"><h2 className="font-bold text-white">OAuth produção</h2><p>Defina DISCORD_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET e NEXTAUTH_URL. Callbacks: <code>/api/auth/discord/callback</code> e <code>/api/auth/google/callback</code>.</p></section>
        <section className="glass rounded-2xl p-5"><h2 className="font-bold text-white">Pagamentos</h2><p>Stripe (STRIPE_SECRET_KEY + webhook /api/payments/stripe-webhook) e Mercado Pago PIX (MP_ACCESS_TOKEN, /api/payments/mp-webhook). Plano Grátis dorme após 30min; Basic/Pro 24/7.</p></section>
        <section className="glass rounded-2xl p-5"><h2 className="font-bold text-white">VPS / Docker</h2><p>Cada bot/site roda em container isolado (ver orchestrator/). Auto-restart garante 99% uptime. Logs via SSE em /api/logs/stream. Terminal em /api/terminal.</p></section>
      </div>
    </main>
  );
}
