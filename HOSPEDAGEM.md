# Hospedagem — `<slug>.sitegenius.com.br` funcionando de verdade

## Status técnico (já pronto no código ✅)
- Cada site publicado gera um arquivo independente em `public/s/<slug>.html`
  (via `node scripts/export-static.mjs "<prompt>" <slug> [template-id]`).
- `public/s/manifest.json` é atualizado automaticamente a cada export.
- O `index.html` tem um **gateway de subdomínios**: ao receber
  `<slug>.sitegenius.com.br`, ele busca o slug no manifesto e injeta o site
  mantendo a URL bonita. Slug inexistente → página 404 amigável.
- `netlify.toml` e `vercel.json` prontos para deploy do `dist/`.
- Testado localmente: `http://<slug>.localhost:4173/` serve o site (o Chrome
  resolve `*.localhost` para 127.0.0.1).

## O que falta (só o dono pode fazer — 15 min, ~R$ 40/ano)
O domínio `sitegenius.com.br` ainda **não existe**. Registrar domínio exige
conta no registro.br com CPF/CNPJ e pagamento — nenhum comando automatizado
pode fazer isso por você:

1. **Comprar o domínio**: https://registro.br → busque `sitegenius.com.br` →
   registre (~R$ 40/ano).
2. **Hospedar grátis**: arraste a pasta `dist/` em `app.netlify.com/drop`
   (ou conecte o GitHub no Netlify/Vercel).
3. **Apontar o DNS** (no registro.br ou no DNS da Netlify):
   - `@` → balanceador da Netlify (ou use o DNS da Netlify nos NS)
   - `*` (wildcard) → `CNAME` para `<seu-site>.netlify.app`
4. **SSL**: automático e gratuito (Let's Encrypt cobre o wildcard).
5. Pronto: `https://italiano-com-cardapio-e-delivery.sitegenius.com.br` abre
   o site, e qualquer novo `public/s/<slug>.html` + `npm run build` publica
   automaticamente `<slug>.sitegenius.com.br`.

> ⚠️ Na Vercel, wildcard (`*`) exige plano Pro; na Netlify funciona no plano
> gratuito. Recomendado: **Netlify**.

## Enquanto o domínio não é comprado
- Dentro do app: **Publicar → Abrir meu site** (`#/site/:slug`, navegador atual).
- Link público imediato e grátis: **Baixar HTML → arrastar em
  `app.netlify.com/drop`** → `https://seusite.netlify.app` no ar em 2 min.
- Levar o site a outro navegador: **Backup/Importar JSON** no dashboard.
