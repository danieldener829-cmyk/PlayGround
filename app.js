/* BRHost — lógica da plataforma .com.br (demonstração, tudo local) */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const BRL = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2800);
}

/* ---------- PLANOS ---------- */
let annual = true;
const PLANS = [
  { id: 'pessoal', name: 'Pessoal', desc: 'Para o primeiro site ou blog', m: 14.90, a: 9.90, feat: ['1 site', '10 GB NVMe', '5 e-mails @seudominio', 'SSL grátis', 'Backup semanal'], cta: 'Começar' },
  { id: 'profissional', name: 'Profissional', desc: 'Para empresas e lojas', m: 34.90, a: 24.90, feat: ['Sites ilimitados*', '100 GB NVMe', 'E-mails ilimitados', 'SSL + CDN grátis', 'Backup diário', 'Domínio .com.br grátis 1º ano'], cta: 'Assinar', featured: true },
  { id: 'empresarial', name: 'Empresarial', desc: 'Performance máxima', m: 69.90, a: 49.90, feat: ['Tudo do Profissional', '200 GB NVMe', 'Staging + Cache avançado', 'Suporte prioritário', 'Migração VIP'], cta: 'Escalar' },
  { id: 'vps', name: 'VPS Brasil', desc: 'Para devs e alto tráfego', m: 99.90, a: 79.90, feat: ['4 vCPU • 8 GB RAM', '160 GB NVMe', 'Root + SSH', 'IP dedicado BR', 'Snapshots'], cta: 'Contratar VPS' },
];

function renderPlans() {
  const grid = $('#plansGrid');
  grid.innerHTML = PLANS.map(p => {
    const price = annual ? p.a : p.m;
    const cycle = annual ? '/mês no anual' : '/mês';
    return `<div class="plan ${p.featured ? 'featured' : ''}">
      ${p.featured ? '<span class="flag">⭐ MAIS CONTRATADO</span>' : ''}
      <h3>${p.name}</h3><p class="sub" style="margin:0">${p.desc}</p>
      <div class="price">${BRL(price)} <small>${cycle}</small></div>
      <small class="tiny">${annual ? `(${BRL(price*12)} / ano)` : 'sem fidelidade'}</small>
      <ul>${p.feat.map(f => `<li>✅ ${f}</li>`).join('')}</ul>
      <button class="btn ${p.featured ? 'primary' : 'ghost'}" onclick="addPlan('${p.id}')">${p.cta}</button>
    </div>`;
  }).join('');
}
window.addPlan = (id) => {
  const p = PLANS.find(x => x.id === id);
  const price = annual ? p.a * 12 : p.m;
  const cart = store.get('brhost_cart', []);
  cart.push({ kind: 'plan', id: p.id + (annual ? '-anual' : '-mensal'), label: `Hospedagem ${p.name} (${annual ? 'anual' : 'mensal'})`, price });
  store.set('brhost_cart', cart);
  renderCart(); openCart();
  toast(`Plano ${p.name} adicionado!`);
};

/* ---------- DOMÍNIOS .com.br ---------- */
const TAKEN = ['google','facebook','instagram','amazon','microsoft','netflix','globo','uol','mercadolivre','americanas','magalu','apple','samsung','nubank','itau','bradesco','whatsapp','youtube','tiktok','shopee','nike','nike123'];
function normalizeDomain(raw) {
  return (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\.com\.br.*$/, '').replace(/\.br.*$/, '')
    .replace(/[^a-z0-9-]/g, '').trim();
}
function validateDomain(name) {
  if (!name) return 'Digite um nome para o domínio.';
  if (name.length < 2) return 'Mínimo de 2 caracteres (regra Registro.br).';
  if (name.length > 26) return 'Máximo de 26 caracteres (regra Registro.br).';
  if (/^-|-$/.test(name)) return 'Não pode começar ou terminar com hífen.';
  if (!/^[a-z0-9-]+$/.test(name)) return 'Use apenas letras, números e hífen.';
  return null;
}
function isAvailable(name) {
  if (TAKEN.includes(name)) return false;
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 100;
  if (name.length <= 3) return h % 3 !== 0;
  return h % 10 < 7; // ~70% disponíveis (simulação)
}
function domainResultHTML(name) {
  const full = `${name}.com.br`;
  const err = validateDomain(name);
  if (err) return `<div>❌ <b>${err}</b><br><span class="tiny">Exemplo válido: <b>minhaempresa</b> → www.minhaempresa.com.br</span></div>`;
  const free = isAvailable(name);
  if (free) {
    return `<div><span class="ok">✅ Disponível!</span> <b>www.${full}</b> — <b>${BRL(49.90)}/ano</b>
      <br><span class="tiny">+ hospedagem Profissional com domínio grátis no 1º ano. Registro oficial via Registro.br incluso na contratação.</span>
      <div class="btn-row">
        <button class="btn primary sm" onclick="addDomain('${name}')">Registrar + hospedar</button>
        <button class="btn ghost sm" onclick="addDomainOnly('${name}')">Só registrar (${BRL(49.90)})</button>
      </div></div>`;
  }
  const alts = [`${name}online`, `${name}brasil`, `meu${name}`, `${name}-oficial`].filter(a => isAvailable(a)).slice(0, 3);
  return `<div><span class="bad">❌ Indisponível.</span> <b>www.${full}</b> já está registrado.
    <br><span class="tiny">Confira o titular real em <a href="https://registro.br/tecnologia/ferramentas/whois/" target="_blank" rel="noopener">registro.br/whois</a>.</span>
    ${alts.length ? `<br><br><b>Tente:</b><div class="btn-row">${alts.map(a => `<button class="btn ghost sm" onclick="fillDomain('${a}')">www.${a}.com.br ✅</button>`).join('')}</div>` : ''}</div>`;
}
window.fillDomain = (n) => { $('#domainInput').value = n; $('#domainInput2').value = n; runSearch(n); $('#heroUrl').textContent = `www.${n}.com.br`; document.getElementById('dominios').scrollIntoView({ behavior: 'smooth' }); };
function runSearch(raw) {
  const name = normalizeDomain(raw);
  const boxes = [$('#domainResult'), $('#domainResult2')];
  boxes.forEach(b => { b.classList.remove('hidden'); b.innerHTML = '⏳ Consultando disponibilidade...'; });
  setTimeout(() => boxes.forEach(b => { b.innerHTML = domainResultHTML(name); }), 600);
}
window.addDomain = (name) => {
  const cart = store.get('brhost_cart', []);
  cart.push({ kind: 'domain+plan', id: 'dom-' + name, label: `Domínio www.${name}.com.br (1 ano) + Hospedagem Profissional`, price: 24.90 * 12 });
  store.set('brhost_cart', cart); renderCart(); openCart();
};
window.addDomainOnly = (name) => {
  const cart = store.get('brhost_cart', []);
  cart.push({ kind: 'domain', id: 'dom-only-' + name, label: `Domínio www.${name}.com.br (1 ano)`, price: 49.90 });
  store.set('brhost_cart', cart); renderCart(); openCart();
};

/* ---------- CARRINHO / CHECKOUT ---------- */
function renderCart() {
  const cart = store.get('brhost_cart', []);
  $('#cartCount').textContent = cart.length;
  const box = $('#cartItems');
  if (!cart.length) { box.innerHTML = '<p class="sub">Seu carrinho está vazio. Busque um <b>.com.br</b> ou escolha um plano. 🇧🇷</p>'; }
  else box.innerHTML = cart.map((it, i) => `<div class="cart-item"><div><b>${it.label}</b><br><span class="tiny">${BRL(it.price)}</span></div><button class="icon-btn" onclick="removeCart(${i})">✕</button></div>`).join('');
  $('#cartTotal').textContent = BRL(cart.reduce((s, i) => s + i.price, 0));
  $('#payTotal').textContent = $('#cartTotal').textContent;
}
window.removeCart = (i) => { const c = store.get('brhost_cart', []); c.splice(i, 1); store.set('brhost_cart', c); renderCart(); };
function openCart() { $('#cartDrawer').classList.remove('hidden'); $('#drawerOverlay').classList.remove('hidden'); }
function closeCart() { $('#cartDrawer').classList.add('hidden'); $('#drawerOverlay').classList.add('hidden'); }

/* ---------- PUBLICADOR DE SITES ---------- */
const TEMPLATES = {
  loja: (n, d, c) => `<header style="background:${c};color:#fff;padding:28px 20px;text-align:center"><h1 style="margin:0">🛍️ ${n}</h1><p>${d || 'Sua loja online no .com.br'}</p><a href="#" style="background:#fff;color:${c};padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Ver ofertas</a></header><section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:20px;max-width:800px;margin:auto">${['Produto 1<br>R$ 49,90','Produto 2<br>R$ 79,90','Produto 3<br>R$ 99,90'].map(p => `<div style="border:1px solid #eee;border-radius:12px;padding:18px;text-align:center"><div style="font-size:2rem">📦</div><p>${p}</p><button style="background:${c};color:#fff;border:0;border-radius:999px;padding:8px 16px">Comprar</button></div>`).join('')}</section><footer style="text-align:center;color:#777;padding:20px">📍 São Paulo • 📲 WhatsApp • © 2026 ${n}</footer>`,
  institucional: (n, d, c) => `<nav style="display:flex;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #eee"><b>${n}</b><span style="color:#666">Início • Sobre • Serviços • Contato</span></nav><section style="background:${c};color:#fff;padding:50px 24px;text-align:center"><h1>${n}</h1><p>${d || 'Soluções profissionais para empresas brasileiras.'}</p></section><section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;padding:28px;max-width:900px;margin:auto">${['✅ Qualidade','⚡ Agilidade','🤝 Confiança'].map(t => `<div style="border:1px solid #eee;border-radius:12px;padding:20px;text-align:center"><h3>${t}</h3><p style="color:#666">Atendemos todo o Brasil.</p></div>`).join('')}</section><footer style="background:#111;color:#fff;text-align:center;padding:18px">contato@${n.toLowerCase().replace(/[^a-z0-9]/g,'')}.com.br • (11) 4000-0000</footer>`,
  portfolio: (n, d, c) => `<header style="padding:50px 24px;text-align:center"><div style="width:90px;height:90px;border-radius:50%;background:${c};color:#fff;display:grid;place-items:center;font-size:2rem;margin:auto">🎨</div><h1>${n}</h1><p style="color:#666">${d || 'Designer & desenvolvedor • São Paulo'}</p></header><section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;padding:20px;max-width:900px;margin:auto">${[1,2,3,4,5,6].map(i => `<div style="height:120px;border-radius:12px;background:linear-gradient(135deg,${c},#002776)"></div>`).join('')}</section>`,
  blog: (n, d, c) => `<header style="background:#111;color:#fff;padding:30px;text-align:center"><h1>✍️ ${n}</h1><p>${d || 'Notícias, dicas e novidades.'}</p></header><main style="max-width:680px;margin:auto;padding:24px">${['Como criar um site .com.br','SEO para negócios locais','Por que ter e-mail profissional?'].map((t,i) => `<article style="border-bottom:1px solid #eee;padding:18px 0"><span style="background:${c};color:#fff;font-size:.75rem;padding:3px 10px;border-radius:999px">Post ${i+1}</span><h2>${t}</h2><p style="color:#555">Conteúdo de exemplo gerado pelo criador BRHost. Edite no painel.</p></article>`).join('')}</main>`,
  landing: (n, d, c) => `<section style="min-height:60vh;display:grid;place-items:center;background:linear-gradient(135deg,${c},#002776);color:#fff;text-align:center;padding:40px"><div><h1 style="font-size:2.4rem">⚡ ${n}</h1><p>${d || 'A oferta que você esperava. Só hoje.'}</p><div style="display:flex;gap:10px;justify-content:center"><input placeholder="Seu e-mail" style="padding:12px;border-radius:999px;border:0;width:220px"/><button style="background:#ffdf00;border:0;border-radius:999px;padding:12px 22px;font-weight:bold">Quero agora</button></div></div></section>`,
  custom: (n, d, c, custom) => custom || `<h1>${n}</h1><p>${d || ''}</p>`,
};
function buildHTML() {
  const n = $('#siteName').value.trim() || 'Meu Site';
  const t = $('#siteTemplate').value;
  const c = $('#siteColor').value;
  const d = $('#siteDesc').value.trim();
  const custom = $('#siteCustomHtml').value.trim();
  const body = TEMPLATES[t](escapeHtml(n), escapeHtml(d), c, custom);
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(n)}</title><style>body{margin:0;font-family:Arial,sans-serif}</style></head><body>${body}</body></html>`;
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function refreshPreview() {
  const html = buildHTML();
  $('#livePreview').srcdoc = html;
  const dom = normalizeDomain($('#siteDomain').value) || 'seusite';
  $('#liveUrl').textContent = `www.${dom}.com.br`;
  $('#heroUrl').textContent = `www.${dom}.com.br`;
}

function renderSites() {
  const sites = store.get('brhost_sites', []);
  const box = $('#sitesList');
  if (!sites.length) {
    box.innerHTML = '<div class="card"><b>Nenhum site ainda.</b><p class="sub">Use o criador acima para publicar seu primeiro site .com.br em segundos. 🚀</p></div>';
  } else {
    box.innerHTML = sites.map(s => `<div class="site-item">
      <h4>${s.icon || '🌐'} ${s.name}</h4>
      <div class="url">🔒 www.${s.domain}.com.br <span class="tag">simulado • só abre aqui</span></div>
      <div class="meta">Modelo: ${s.template} • Publicado em ${new Date(s.createdAt).toLocaleString('pt-BR')} • ${Math.round(s.html.length/1024)} KB • SSL ativo</div>
      <p class="tiny" style="background:#fffbeb;border:1px solid #fde68a;padding:8px 10px;border-radius:8px">⚠️ Não digite esse endereço no navegador — ele <b>não existe no DNS real</b> (por isso dá <code>DNS_PROBE_FINISHED_NXDOMAIN</code>). Use o botão <b>👁 Ver site</b> abaixo.</p>
      <div class="row">
        <button class="btn primary sm" onclick="viewSite('${s.id}')">👁 Ver site</button>
        <button class="btn ghost sm" onclick="downloadSite('${s.id}')">⬇ Baixar HTML</button>
        <button class="btn danger sm" onclick="deleteSite('${s.id}')">Excluir</button>
      </div></div>`).join('');
  }
  const orders = store.get('brhost_orders', []);
  $('#ordersList').innerHTML = orders.length ? `<h3 style="margin-top:20px">🧾 Meus pedidos (${orders.length})</h3>` + orders.map(o => `<div class="site-item"><h4>Pedido ${o.id}</h4><div class="meta">${o.date} • ${o.pay} • ${o.items.map(i=>i.label).join(' + ')}</div><div class="url">${BRL(o.total)} — ✅ Ativo</div></div>`).join('') : '';
}
window.viewSite = (id) => {
  const s = store.get('brhost_sites', []).find(x => x.id === id); if (!s) return;
  // Usa Blob URL (mais confiável que document.write e não depende de DNS)
  const blob = new Blob([s.html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) { toast('Permita pop-ups para ver o site, ou use Baixar HTML.'); window.location.href = url; }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
window.downloadSite = (id) => {
  const s = store.get('brhost_sites', []).find(x => x.id === id); if (!s) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([s.html], { type: 'text/html' }));
  a.download = `${s.domain}.com.br.html`; a.click();
};
window.deleteSite = (id) => {
  if (!confirm('Excluir este site hospedado?')) return;
  store.set('brhost_sites', store.get('brhost_sites', []).filter(x => x.id !== id));
  renderSites(); toast('Site excluído.');
};

/* ---------- EVENTOS ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderPlans(); renderCart(); renderSites(); refreshPreview();

  $('#hamburger').onclick = () => $('#navLinks').classList.toggle('open');
  $('#billingToggle').onclick = (e) => { annual = !annual; e.currentTarget.classList.toggle('annual', annual); renderPlans(); };

  const onSearch = (e) => { e.preventDefault(); const v = e.target.querySelector('input').value; runSearch(v); };
  $('#domainSearchForm').addEventListener('submit', onSearch);
  $('#domainSearchForm2').addEventListener('submit', onSearch);
  $$('[data-suggest]').forEach(b => b.onclick = () => { $('#domainInput').value = b.dataset.suggest; runSearch(b.dataset.suggest); });
  $('#domainInput').addEventListener('input', (e) => { const d = normalizeDomain(e.target.value) || 'seusite'; $('#heroUrl').textContent = `www.${d}.com.br`; });

  $('#btnCartNav').onclick = openCart;
  $('#btnCloseCart').onclick = closeCart;
  $('#drawerOverlay').onclick = closeCart;
  $('#btnClearCart').onclick = () => { store.set('brhost_cart', []); renderCart(); };
  $('#btnCheckout').onclick = () => {
    const cart = store.get('brhost_cart', []);
    if (!cart.length) return toast('Carrinho vazio!');
    $('#checkoutSummary').innerHTML = cart.map(i => `• ${i.label} — <b>${BRL(i.price)}</b>`).join('<br>') + `<br><b>Total: ${BRL(cart.reduce((s,i)=>s+i.price,0))}</b>`;
    $('#checkoutModal').classList.remove('hidden'); $('#checkoutSuccess').classList.add('hidden'); $('#checkoutForm').classList.remove('hidden');
  };
  $('#btnCancelCheckout').onclick = () => $('#checkoutModal').classList.add('hidden');
  $('#checkoutForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const cart = store.get('brhost_cart', []);
    const total = cart.reduce((s, i) => s + i.price, 0);
    const id = 'BR-' + Math.floor(100000 + Math.random() * 900000);
    const orders = store.get('brhost_orders', []);
    orders.unshift({ id, date: new Date().toLocaleString('pt-BR'), pay: $('#coPay').value, total, items: cart, name: $('#coName').value });
    store.set('brhost_orders', orders);
    // se comprou domínio, cria entrada de domínio como site placeholder
    cart.filter(i => i.kind.startsWith('dom')).forEach(i => {
      const m = i.label.match(/www\.(.+?)\.com\.br/);
      if (m) { const sites = store.get('brhost_sites', []); if (!sites.some(s => s.domain === m[1])) sites.unshift({ id: 's' + Date.now() + Math.random().toString(16).slice(2), name: m[1], domain: m[1], template: 'institucional', createdAt: Date.now(), html: `<!DOCTYPE html><html lang="pt-BR"><body style="font-family:Arial;text-align:center;padding:60px"><h1>www.${m[1]}.com.br</h1><p>Domínio registrado! Publique seu site no criador acima.</p></body></html>` }); store.set('brhost_sites', sites); }
    });
    store.set('brhost_cart', []); renderCart(); renderSites();
    $('#checkoutForm').classList.add('hidden');
    const ok = $('#checkoutSuccess'); ok.classList.remove('hidden');
    ok.innerHTML = `🎉 <b>Pedido ${id} confirmado!</b><br>Total ${BRL(total)} via ${$('#coPay').value}.<br>Domínio reservado + hospedagem ativada (demonstração).<br>DNS: <code>ns1.brhost.com.br</code> / <code>ns2.brhost.com.br</code><br><br><button class="btn primary sm" onclick="document.getElementById('checkoutModal').classList.add('hidden');document.getElementById('painel').scrollIntoView({behavior:'smooth'})">Ver meus sites →</button>`;
  });

  // Publicador
  ['siteName','siteDomain','siteTemplate','siteColor','siteDesc','siteCustomHtml'].forEach(id => document.getElementById(id)?.addEventListener('input', refreshPreview));
  $('#siteTemplate').addEventListener('change', (e) => $('#customHtmlWrap').classList.toggle('hidden', e.target.value !== 'custom'));
  $('#btnRefreshPreview').onclick = refreshPreview;
  $('#btnCopyHtml').onclick = async () => { try { await navigator.clipboard.writeText(buildHTML()); toast('HTML copiado! 📋'); } catch { toast('Não foi possível copiar.'); } };
  $('#publishForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = normalizeDomain($('#siteDomain').value);
    const err = validateDomain(raw);
    if (err) return toast('❌ ' + err);
    const sites = store.get('brhost_sites', []);
    if (sites.some(s => s.domain === raw)) return toast('❌ Este .com.br já está hospedado aqui. Escolha outro.');
    const icons = { loja: '🛍️', institucional: '🏢', portfolio: '🎨', blog: '✍️', landing: '⚡', custom: '🧑‍💻' };
    sites.unshift({ id: 's' + Date.now(), name: $('#siteName').value.trim() || raw, domain: raw, template: $('#siteTemplate').value, icon: icons[$('#siteTemplate').value], createdAt: Date.now(), html: buildHTML() });
    store.set('brhost_sites', sites); renderSites();
    toast(`🎉 www.${raw}.com.br publicado!`);
    document.getElementById('painel').scrollIntoView({ behavior: 'smooth' });
  });

  // Painel: export/import/clear
  $('#btnExport').onclick = () => {
    const data = { sites: store.get('brhost_sites', []), orders: store.get('brhost_orders', []), exportedAt: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'brhost-backup.json'; a.click(); toast('Backup exportado! 💾');
  };
  $('#importFile').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); if (d.sites) store.set('brhost_sites', d.sites); if (d.orders) store.set('brhost_orders', d.orders); renderSites(); toast('Backup importado! ✅'); } catch { toast('Arquivo inválido.'); } };
    r.readAsText(f);
  });
  $('#btnClear').onclick = () => { if (confirm('Apagar todos os sites e pedidos locais?')) { localStorage.removeItem('brhost_sites'); localStorage.removeItem('brhost_orders'); renderSites(); } };

  // Suporte
  $('#supportForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#proto').textContent = 'BR-' + Math.floor(10000 + Math.random() * 90000);
    $('#supOk').classList.remove('hidden'); e.target.reset();
  });
});
