/* LUMIÈRE Store — SPA */
const $ = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => [...e.querySelectorAll(s)];
const BRL = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const api = async (url, opt = {}) => {
  const t = localStorage.getItem('token');
  const r = await fetch(url, { ...opt, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}), ...(opt.headers || {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro || 'Erro inesperado.');
  return j;
};
const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800); };
const cart = { get: () => JSON.parse(localStorage.getItem('cart') || '[]'), set: (c) => { localStorage.setItem('cart', JSON.stringify(c)); renderCart(); } };
let CFG = {}, CATS = [], CUPOM = null, FRETE = 0;

function stars(m, t) { if (!t) return '<span class="stars">☆☆☆☆☆ novo</span>'; const f = Math.round(m); return `<span class="stars">${'★'.repeat(f)}${'☆'.repeat(5 - f)} ${m} (${t})</span>`; }
function card(p) {
  const img = (p.imagens && p.imagens[0]) || '🛍️';
  const off = p.preco_promo ? `<span class="off">-${Math.round((1 - p.preco_promo / p.preco) * 100)}%</span>` : '';
  return `<article class="card"><div class="pimg">${img}</div><div class="bd">
    <span class="cat">${p.cat_nome || ''}</span><h3><a href="#/produto/${p.slug}">${p.nome}</a></h3>
    ${stars(p.media, p.total)}
    <div class="price">${p.preco_promo ? `<span class="old">${BRL(p.preco)}</span><b>${BRL(p.preco_promo)}</b>${off}` : `<b>${BRL(p.preco)}</b>`}</div>
    <div class="rowbtn"><button class="btn primary sm" onclick="addCart(${p.id},1)">Adicionar</button>
    <a class="btn ghost sm" href="#/produto/${p.slug}">Ver</a></div></div></article>`;
}
window.addCart = async (id, qtd = 1) => {
  const c = cart.get(); const ex = c.find((i) => i.id === id);
  if (ex) ex.qtd = Math.min(99, ex.qtd + qtd); else c.push({ id, qtd });
  cart.set(c); toast('Adicionado ao carrinho 🛒'); openDrawer();
};
function totals(list) { const sub = list.reduce((s, i) => s + i.preco * i.qtd, 0); const d = CUPOM ? Math.min(CUPOM.desconto, sub) : 0; return { sub, d, total: sub - d + FRETE }; }

async function renderCart() {
  const c = cart.get();
  let list = [];
  for (const i of c) { try { const p = await api('/api/products/' + i.id); list.push({ ...i, nome: p.nome, preco: p.preco_final, img: (p.imagens || ['🛍️'])[0], estoque: p.estoque }); } catch { } }
  const t = totals(list);
  $('#cartCount').textContent = c.reduce((s, i) => s + i.qtd, 0);
  $('#cartTotal').textContent = BRL(t.total);
  $('#cartItems').innerHTML = list.length ? list.map((i) => `<div class="citem"><div class="e">${i.img}</div>
    <div><b style="font-size:13px">${i.nome}</b><br><small>${BRL(i.preco)} un.</small>
    <div class="qty"><button onclick="chQ(${i.id},-1)">−</button>${i.qtd}<button onclick="chQ(${i.id},1)">+</button>
    <button onclick="rmI(${i.id})" style="border:0;background:none;cursor:pointer">🗑️</button></div></div>
    <b>${BRL(i.preco * i.qtd)}</b></div>`).join('') : '<p>Seu carrinho está vazio. Que tal ver as <a href="#/ofertas">ofertas</a>? ✨</p>';
  $('#totais').innerHTML = `<span>Subtotal: <b style="float:right">${BRL(t.sub)}</b></span>
    <span>Desconto: <b style="float:right">${BRL(t.d)}</b></span><span>Frete: <b style="float:right">${FRETE ? BRL(FRETE) : 'Grátis 🎉'}</b></span>
    <span style="font-size:17px">Total: <b style="float:right">${BRL(t.total)}</b></span>`;
  window._cartFull = list;
}
window.chQ = (id, d) => { const c = cart.get(); const it = c.find((i) => i.id === id); if (it) { it.qtd += d; if (it.qtd < 1) c.splice(c.indexOf(it), 1); cart.set(c); } };
window.rmI = (id) => cart.set(cart.get().filter((i) => i.id !== id));
function openDrawer() { $('#drawer').hidden = false; } function closeDrawer() { $('#drawer').hidden = true; }
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
$('#btnCart').onclick = openDrawer;
$('#btnCupom').onclick = async () => {
  const code = $('#cupom').value.trim(); if (!code) return;
  try { const sub = (window._cartFull || []).reduce((s, i) => s + i.preco * i.qtd, 0); const r = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ codigo: code, subtotal: sub }) }); CUPOM = r; toast(`Cupom ${r.cupom} aplicado! 🎉`); renderCart(); }
  catch (e) { toast(e.message); }
};

/* ---------- ROUTER ---------- */
const routes = { '/': home, '/ofertas': ofertas, '/lancamentos': lanc, '/produto': prod, '/checkout': checkout, '/conta': conta, '/pedidos': pedidos, '/favoritos': favs, '/admin': adminPage, '/contato': contato, '/faq': faq, '/privacidade': priv, '/termos': termos, '/trocas': trocas, '/sobre': sobre };
window.addEventListener('hashchange', render);
async function render() {
  closeDrawer();
  const h = location.hash.slice(1) || '/';
  const [_, base, param] = h.split('/');
  const fn = routes['/' + (base || '')] || home;
  $('#conteudo').innerHTML = '<p>Carregando… ✨</p>';
  try { await fn(param, new URLSearchParams(location.hash.split('?')[1] || '')); } catch (e) { $('#conteudo').innerHTML = `<div class="note">⚠️ ${e.message}</div>`; }
  window.scrollTo(0, 0);
}

async function boot() {
  try { CFG = await api('/api/settings'); $('#topbar').textContent = CFG.banner_topo; $('#zap').href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent('Olá! Preciso de ajuda com meu pedido ✨')}`; $('#fZap').href = $('#zap').href; $('#sInsta').href = CFG.instagram; $('#sFace').href = CFG.facebook; $('#sTtk').href = CFG.tiktok; document.title = `${CFG.store_name} — Loja Virtual Premium`; } catch { }
  CATS = await api('/api/categories').catch(() => []);
  $('#fCat').innerHTML = '<option value="">Todas</option>' + CATS.map((c) => `<option value="${c.slug}">${c.nome}</option>`).join('');
  $('#catnav').innerHTML = `<a href="#/" data-h>🏠 Início</a><a href="#/ofertas">🔥 Ofertas</a><a href="#/lancamentos">✨ Lançamentos</a>` + CATS.map((c) => `<a href="#/?cat=${c.slug}">${c.imagem || '🏷️'} ${c.nome}</a>`).join('');
  const me = await api('/api/auth/me').catch(() => null);
  if (me) $('#userName').textContent = me.name.split(' ')[0];
  try { const f = await api('/api/favorites'); $('#favCount').hidden = !f.length; $('#favCount').textContent = f.length; } catch { }
  await renderCart(); render();
}
$('#btnBusca').onclick = () => { location.hash = `#/?q=${encodeURIComponent($('#busca').value)}&cat=${$('#fCat').value}`; render(); };
$('#busca').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btnBusca').click(); });
$('#btnMenu').onclick = () => { const m = $('#mobilenav'); m.hidden = !m.hidden; };

async function filtersHTML(qs) {
  return `<div class="filters"><input id="fq" placeholder="Buscar…" value="${qs.get('q') || ''}">
  <select id="fsort"><option value="novidades">Novidades</option><option value="populares">Mais vendidos</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="nome">A–Z</option></select>
  <input id="fmin" type="number" placeholder="Min R$" style="width:100px"><input id="fmax" type="number" placeholder="Max R$" style="width:100px">
  <button class="btn primary sm" id="fgo">Filtrar</button></div><div class="grid" id="grid"></div>`;
}
async function loadGrid(base, qs) {
  const q = $('#fq').value, sort = $('#fsort').value, min = $('#fmin').value, max = $('#fmax').value;
  const url = `/api/products?${base}&q=${encodeURIComponent(q)}&sort=${sort}&min=${min}&max=${max}`;
  const list = await api(url);
  $('#grid').innerHTML = list.length ? list.map(card).join('') : '<p>Nenhum produto encontrado. 😕</p>';
}
async function home(_, qs) {
  const banners = await api('/api/banners').catch(() => []);
  const dest = await api('/api/products?dest=1').catch(() => []);
  const of = await api('/api/products?ofertas=1').catch(() => []);
  const lc = await api('/api/products?lanc=1').catch(() => []);
  const b = banners[0] || { titulo: 'Nova Coleção', subtitulo: 'Até 40% OFF', imagem: '🌸' };
  $('#conteudo').innerHTML = `
  <section class="hero"><div class="slide"><small>🔥 ${b.titulo}</small><h1>${b.subtitulo}</h1>
    <p>Parcele em até 12x • Pix com aprovação rápida • Troca fácil em 7 dias</p>
    <a class="btn grad" href="#/ofertas">Ver ofertas</a> <a class="btn ghost" style="color:#fff;border-color:#fff" href="#/lancamentos">Lançamentos</a></div>
    <div class="side"><div class="minicard">🚚 <b>Frete grátis</b><br><small>acima de ${BRL(CFG.frete_gratis_acima || 299)}</small></div>
    <div class="minicard">🎟️ <b>Cupom BEMVINDO10</b><br><small>10% OFF na primeira compra</small></div>
    <div class="minicard">💬 <b>Suporte humano</b><br><small>no WhatsApp, 9h–18h</small></div></div></section>
  <div class="sec"><h2>⭐ Destaques</h2><a href="#/ofertas">ver tudo →</a></div><div class="grid">${dest.slice(0, 4).map(card).join('')}</div>
  <div class="sec"><h2>🔥 Ofertas da semana</h2><a href="#/ofertas">ver tudo →</a></div><div class="grid">${of.slice(0, 4).map(card).join('')}</div>
  <div class="sec"><h2>✨ Lançamentos</h2><a href="#/lancamentos">ver tudo →</a></div><div class="grid">${lc.slice(0, 4).map(card).join('')}</div>
  <div class="sec"><h2>🛍️ Explorar catálogo</h2></div>${await filtersHTML(qs)}`;
  $('#fsort').value = 'novidades';
  $('#fgo').onclick = () => loadGrid(qs.get('cat') ? `cat=${qs.get('cat')}` : '', qs);
  await loadGrid(qs.get('cat') ? `cat=${qs.get('cat')}` : '', qs);
}
async function ofertas(_, qs) { $('#conteudo').innerHTML = `<div class="sec"><h2>🔥 Ofertas</h2></div>${await filtersHTML(qs)}`; $('#fgo').onclick = () => loadGrid('ofertas=1', qs); await loadGrid('ofertas=1', qs); }
async function lanc(_, qs) { $('#conteudo').innerHTML = `<div class="sec"><h2>✨ Lançamentos</h2></div>${await filtersHTML(qs)}`; $('#fgo').onclick = () => loadGrid('lanc=1', qs); await loadGrid('lanc=1', qs); }

async function prod(slugId) {
  const p = await api('/api/products/' + slugId);
  const rel = await api(`/api/products?cat=${''}`).catch(() => []);
  const revs = await api(`/api/products/${p.id}/reviews`).catch(() => []);
  const img = (p.imagens || ['🛍️'])[0];
  $('#conteudo').innerHTML = `<p><a href="#/">← voltar</a></p><div class="prod">
    <div class="big">${img}<p style="font-size:13px;color:#666">${p.estoque > 0 ? `✅ ${p.estoque} em estoque` : '❌ Esgotado'}</p></div>
    <div><span class="cat">${p.cat_nome || ''}</span><h1 style="font-family:'Playfair Display';margin:6px 0">${p.nome}</h1>
    ${stars(p.media, p.total)}
    <div class="price" style="font-size:24px;margin:10px 0">${p.preco_promo ? `<span class="old">${BRL(p.preco)}</span> <b>${BRL(p.preco_promo)}</b> <span class="off">OFERTA</span>` : `<b>${BRL(p.preco)}</b>`}</div>
    <p style="font-size:12px;color:#666">em até 12x de ${BRL(p.preco_final / 12)} • ${BRL(p.preco_final * 0.95)} no Pix (5% OFF)</p>
    <p>${p.descricao}</p>
    <div style="display:flex;gap:8px;margin:12px 0"><div class="qty"><button onclick="pq(-1)">−</button><b id="pqtd">1</b><button onclick="pq(1)">+</button></div>
    <button class="btn grad" onclick="addCart(${p.id},Number(document.getElementById('pqtd').textContent))" ${p.estoque ? '' : 'disabled'}>Adicionar ao carrinho</button>
    <button class="btn ghost" onclick="fav(${p.id})">♡</button></div>
    <div class="note">🚚 Frete calculado no checkout • 🔄 Troca grátis em 7 dias • 🔒 Compra 100% segura</div>
    <h3>Avaliações (${revs.length})</h3><div id="revs">${revs.map((r) => `<div class="review">⭐ ${r.nota} — <b>${r.autor}</b><br>${r.comentario}</div>`).join('') || '<p>Seja a primeira pessoa a avaliar! 💬</p>'}</div>
    <div class="frm"><label>Sua avaliação</label><select id="rnota"><option value="5">⭐⭐⭐⭐⭐</option><option value="4">⭐⭐⭐⭐</option><option value="3">⭐⭐⭐</option><option value="2">⭐⭐</option><option value="1">⭐</option></select>
    <textarea id="rcom" placeholder="Conte o que achou…"></textarea><button class="btn primary" onclick="sendRev(${p.id})">Enviar avaliação</button></div>
    </div></div>`;
  window.pq = (d) => { const e = $('#pqtd'); e.textContent = Math.max(1, Math.min(p.estoque || 1, Number(e.textContent) + d)); };
  window.fav = async (id) => { try { await api('/api/favorites/' + id, { method: 'POST' }); toast('Salvo nos favoritos ♡'); } catch (e) { toast('Faça login para favoritar'); location.hash = '#/conta'; } };
  window.sendRev = async (id) => { try { await api(`/api/products/${id}/reviews`, { method: 'POST', body: JSON.stringify({ nota: Number($('#rnota').value), comentario: $('#rcom').value }) }); toast('Obrigado pela avaliação!'); render(); } catch (e) { toast(e.message); } };
}

async function checkout() {
  await renderCart();
  const list = window._cartFull || [];
  if (!list.length) { $('#conteudo').innerHTML = '<div class="note">Carrinho vazio. <a href="#/">Voltar à loja</a></div>'; return; }
  const t = totals(list);
  const me = await api('/api/auth/me').catch(() => null);
  const addrs = me ? await api('/api/addresses').catch(() => []) : [];
  $('#conteudo').innerHTML = `<div class="sec"><h2>💳 Checkout seguro</h2></div>
  ${CFG.pagamento_configurado ? '' : '<div class="note">⚠️ <b>Modo demonstração:</b> provedor de pagamento ainda não configurado (defina <code>MP_ACCESS_TOKEN</code> ou <code>STRIPE_SECRET_KEY</code> no servidor). O pedido será registrado como <b>aguardando pagamento</b> e <b>não</b> será marcado como pago automaticamente.</div>'}
  <div class="check"><div class="frm">
    <h3>1️⃣ Seus dados</h3>
    <div class="two"><input id="cNome" placeholder="Nome completo" value="${me ? me.name : ''}"><input id="cEmail" placeholder="E-mail" value="${me ? me.email : ''}"></div>
    ${me ? `<label>Endereço salvo</label><select id="cAddrSel"><option value="">— digitar novo —</option>${addrs.map((a) => `<option value='${JSON.stringify(a).replace(/'/g, '')}'>${a.label}: ${a.rua}, ${a.cidade}</option>`).join('')}</select>` : '<small>💡 <a href="#/conta">Crie uma conta</a> para salvar endereços — ou compre como visitante.</small>'}
    <h3>2️⃣ Entrega</h3>
    <div class="two"><input id="cCep" placeholder="CEP 00000-000"><input id="cRua" placeholder="Rua / Avenida"></div>
    <div class="two"><input id="cNum" placeholder="Número"><input id="cComp" placeholder="Complemento"></div>
    <div class="two"><input id="cBairro" placeholder="Bairro"><input id="cCid" placeholder="Cidade"></div>
    <input id="cUf" placeholder="UF" maxlength="2">
    <button class="btn ghost" id="btnFrete">📦 Calcular frete</button><small id="freteInfo"></small>
    <h3>3️⃣ Pagamento</h3>
    <select id="cPag"><option value="pix">💠 Pix (aprovação rápida)</option><option value="cartao">💳 Cartão de crédito</option><option value="boleto">🧾 Boleto bancário</option></select>
    <select id="cParc">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}x de ${BRL(t.total / (i + 1))}</option>`).join('')}</select>
  </div><div class="summary"><h3>Resumo do pedido</h3>
    ${list.map((i) => `<p>${i.img} ${i.nome} × ${i.qtd} <b style="float:right">${BRL(i.preco * i.qtd)}</b></p>`).join('')}
    <p>Subtotal <b style="float:right">${BRL(t.sub)}</b></p><p>Desconto <b style="float:right">−${BRL(t.d)}</b></p><p>Frete <b style="float:right" id="sFrete">${FRETE ? BRL(FRETE) : 'Grátis'}</b></p>
    <h2>Total <span style="float:right" id="sTotal">${BRL(t.total)}</span></h2>
    <button class="btn grad big" id="btnPay">Confirmar pedido • <span id="sTotal2">${BRL(t.total)}</span></button>
    <small>🔒 Dados criptografados • LGPD • Nota fiscal emitida</small></div></div>`;
  $('#btnFrete').onclick = async () => {
    const r = await api('/api/shipping/quote', { method: 'POST', body: JSON.stringify({ cep: $('#cCep').value, subtotal: t.sub - t.d }) });
    FRETE = r.frete; $('#freteInfo').textContent = `Frete ${r.frete ? BRL(r.frete) : 'GRÁTIS'} • ${r.prazo}`; renderCart();
    const nt = totals(list); $('#sFrete').textContent = FRETE ? BRL(FRETE) : 'Grátis'; $('#sTotal').textContent = BRL(nt.total); $('#sTotal2').textContent = BRL(nt.total);
  };
  $('#btnPay').onclick = async () => {
    const body = { items: list.map((i) => ({ id: i.id, qtd: i.qtd })), pagamento: $('#cPag').value, parcelas: Number($('#cParc').value), cupom: CUPOM ? CUPOM.cupom : '', convidado: { nome: $('#cNome').value, email: $('#cEmail').value }, address: { rua: $('#cRua').value, numero: $('#cNum').value, complemento: $('#cComp').value, bairro: $('#cBairro').value, cidade: $('#cCid').value, uf: $('#cUf').value, cep: $('#cCep').value } };
    if (!body.convidado.nome || !body.convidado.email) return toast('Informe nome e e-mail.');
    if (!body.address.rua || !body.address.cidade || !body.address.cep) return toast('Endereço incompleto.');
    try {
      const r = await api('/api/checkout', { method: 'POST', body: JSON.stringify(body) });
      cart.set([]); CUPOM = null; FRETE = 0;
      $('#conteudo').innerHTML = `<div class="frm" style="max-width:640px"><h2>✅ Pedido ${r.pedido.codigo} criado!</h2>
        <p>Status: <b>${r.pedido.status}</b> • Total: <b>${BRL(r.pedido.total)}</b> • Pagamento: ${r.pedido.pagamento}</p>
        <div class="note">${r.pagamento_info.aviso}</div>
        <a class="btn primary" href="#/pedidos?email=${encodeURIComponent(body.convidado.email)}&codigo=${r.pedido.codigo}">Acompanhar pedido →</a>
        <a class="btn ghost" href="#/">Voltar à loja</a></div>`;
    } catch (e) { toast(e.message); }
  };
}

async function conta() {
  const me = await api('/api/auth/me').catch(() => null);
  if (!me) {
    $('#conteudo').innerHTML = `<div class="check"><div class="frm"><h2>👤 Entrar</h2><input id="lEmail" placeholder="E-mail" value="cliente@loja.com"><input id="lPass" type="password" placeholder="Senha" value="cliente123"><button class="btn primary" id="btnL">Entrar</button><button class="btn ghost" id="btnF">Esqueci a senha</button></div>
    <div class="frm"><h2>✨ Criar conta</h2><input id="rName" placeholder="Nome completo"><input id="rEmail" placeholder="E-mail"><input id="rPass" type="password" placeholder="Senha (mín. 6)"><button class="btn grad" id="btnR">Cadastrar grátis</button><small>Ao cadastrar você concorda com os <a href="#/termos">Termos</a> e a <a href="#/privacidade">Privacidade (LGPD)</a>.</small></div></div>`;
    $('#btnL').onclick = async () => { try { const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#lEmail').value, password: $('#lPass').value }) }); localStorage.setItem('token', r.token); toast(`Bem-vinda(o), ${r.user.name}!`); boot(); } catch (e) { toast(e.message); } };
    $('#btnR').onclick = async () => { try { const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: $('#rName').value, email: $('#rEmail').value, password: $('#rPass').value }) }); localStorage.setItem('token', r.token); toast('Conta criada! 🎉'); boot(); } catch (e) { toast(e.message); } };
    $('#btnF').onclick = async () => { const r = await api('/api/auth/forgot', { method: 'POST', body: JSON.stringify({ email: $('#lEmail').value }) }); toast(r.token_demo ? `Token demo: ${r.token_demo}` : r.aviso); if (r.token_demo) { const np = prompt('Digite a nova senha:'); if (np) { await api('/api/auth/reset', { method: 'POST', body: JSON.stringify({ token: r.token_demo, password: np }) }); toast('Senha alterada! Faça login.'); } } };
    return;
  }
  const addrs = await api('/api/addresses').catch(() => []);
  $('#conteudo').innerHTML = `<div class="sec"><h2>Olá, ${me.name} ✨ ${me.is_admin ? '<a class="btn primary sm" href="#/admin">Painel admin</a>' : ''}</h2><button class="btn ghost sm" id="btnOut">Sair</button></div>
  <div class="tabs"><button class="on">📦 Pedidos</button></div><div id="mped"></div>
  <h3>📍 Endereços</h3><div class="grid">${addrs.map((a) => `<div class="minicard">${a.label}<br><small>${a.rua}, ${a.numero} — ${a.cidade}/${a.uf}<br>CEP ${a.cep}</small></div>`).join('') || '<p>Nenhum endereço salvo.</p>'}</div>
  <div class="frm"><h3>＋ Novo endereço</h3><div class="two"><input id="aRua" placeholder="Rua"><input id="aNum" placeholder="Número"></div><div class="two"><input id="aCid" placeholder="Cidade"><input id="aCep" placeholder="CEP"></div><div class="two"><input id="aBairro" placeholder="Bairro"><input id="aUf" placeholder="UF"></div><button class="btn primary" id="btnA">Salvar endereço</button></div>`;
  $('#btnOut').onclick = () => { localStorage.removeItem('token'); boot(); };
  $('#btnA').onclick = async () => { try { await api('/api/addresses', { method: 'POST', body: JSON.stringify({ rua: $('#aRua').value, numero: $('#aNum').value, cidade: $('#aCid').value, cep: $('#aCep').value, bairro: $('#aBairro').value, uf: $('#aUf').value }) }); toast('Endereço salvo!'); conta(); } catch (e) { toast(e.message); } };
  const orders = await api('/api/orders').catch(() => []);
  $('#mped').innerHTML = orders.length ? `<table class="tbl"><tr><th>Código</th><th>Total</th><th>Status</th><th>Data</th></tr>${orders.map((o) => `<tr><td><a href="#/pedidos">${o.codigo}</a></td><td>${BRL(o.total)}</td><td><span class="pill ${o.status}">${o.status}</span></td><td>${(o.criado_em || '').slice(0, 10)}</td></tr>`).join('')}</table>` : '<p>Você ainda não fez pedidos. <a href="#/ofertas">Ver ofertas →</a></p>';
}

async function pedidos(_, qs) {
  let list = [];
  try { list = await api('/api/orders'); }
  catch { const email = qs.get('email') || prompt('E-mail usado na compra:'); const codigo = qs.get('codigo') || prompt('Código do pedido:'); if (email && codigo) list = await api(`/api/orders?email=${encodeURIComponent(email)}&codigo=${codigo}`); }
  $('#conteudo').innerHTML = `<div class="sec"><h2>📦 Meus pedidos</h2></div>${list.length ? await Promise.all(list.map(async (o) => {
    const d = await api('/api/orders/' + o.id + (o.convidado_email ? `?email=${encodeURIComponent(o.convidado_email)}` : '')).catch(() => o);
    return `<div class="minicard" style="margin-bottom:12px"><b>${o.codigo}</b> — <span class="pill ${o.status}">${o.status}</span> — <b>${BRL(o.total)}</b>
    <br><small>${(o.criado_em || '').slice(0, 10)} • ${o.pagamento} • Rastreio: <b>${o.rastreio || 'aguardando postagem'}</b></small>
    <br><small>${(d.itens || []).map((i) => `${i.nome} ×${i.qtd}`).join(' • ')}</small></div>`; })).then((x) => x.join('')) : '<p>Nenhum pedido encontrado.</p>'}`;
}
async function favs() {
  try {
    const f = await api('/api/favorites');
    $('#conteudo').innerHTML = `<div class="sec"><h2>♡ Favoritos (${f.length})</h2></div><div class="grid">${f.map(card).join('') || '<p>Nada por aqui ainda. 💔</p>'}</div>`;
  } catch { location.hash = '#/conta'; }
}

/* ---------- ADMIN ---------- */
async function adminPage() {
  const me = await api('/api/auth/me').catch(() => null);
  if (!me?.is_admin) { $('#conteudo').innerHTML = `<div class="frm"><h2>🔐 Painel administrativo</h2><p>Use <code>admin@loja.com / admin123</code></p><input id="aE" placeholder="E-mail"><input id="aP" type="password" placeholder="Senha"><button class="btn primary" id="btnAL">Entrar como admin</button></div>`; $('#btnAL').onclick = async () => { try { const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#aE').value, password: $('#aP').value }) }); localStorage.setItem('token', r.token); adminPage(); } catch (e) { toast(e.message); } }; return; }
  const d = await api('/api/admin/dashboard');
  $('#conteudo').innerHTML = `<div class="sec"><h2>📊 Dashboard</h2><a class="btn ghost sm" href="/api/admin/reports/sales.csv">⬇ Exportar CSV</a></div>
  <div class="kpis"><div class="kpi">💰 Faturamento<b>${BRL(d.faturamento)}</b></div><div class="kpi">🧾 Pedidos<b>${d.vendas}</b></div><div class="kpi">🎯 Ticket médio<b>${BRL(d.ticket)}</b></div><div class="kpi">⚠️ Estoque baixo<b>${d.estoqueBaixo.length}</b></div></div>
  <div class="tabs"><button class="on" data-t="ped">Pedidos</button><button data-t="prod">Produtos</button><button data-t="cup">Cupons</button><button data-t="ban">Banners</button><button data-t="cfg">Configurações</button></div><div id="adm"></div>`;
  const adm = $('#adm');
  async function show(t) {
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    if (t === 'ped') adm.innerHTML = `<table class="tbl"><tr><th>Código</th><th>Total</th><th>Status</th><th>Rastreio</th><th>Ação</th></tr>${d.recentes.map((o) => `<tr><td>${o.codigo}</td><td>${BRL(o.total)}</td><td><span class="pill ${o.status}">${o.status}</span></td><td>${o.rastreio || '—'}</td><td><select onchange="updOrder(${o.id},this.value)"><option value="">mudar…</option><option>aguardando_pagamento</option><option>pago</option><option>preparando</option><option>enviado</option><option>entregue</option><option>cancelado</option><option>reembolsado</option></select></td></tr>`).join('')}</table><small>Status por grupo: ${d.porStatus.map((s) => `${s.status}: ${s.q}`).join(' • ')}</small>`;
    if (t === 'prod') { const ps = await api('/api/products?sort=novidades'); adm.innerHTML = `<div class="frm"><h3>＋ Novo produto</h3><input id="pN" placeholder="Nome"><input id="pP" type="number" placeholder="Preço"><input id="pPP" type="number" placeholder="Preço promo (opcional)"><input id="pE" type="number" placeholder="Estoque"><button class="btn primary" id="btnNP">Cadastrar</button></div><table class="tbl"><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Ação</th></tr>${ps.slice(0, 30).map((p) => `<tr><td>${p.nome}</td><td>${BRL(p.preco_final)}</td><td>${p.estoque}</td><td><button onclick="delP(${p.id})">excluir</button></td></tr>`).join('')}</table>`;
      $('#btnNP').onclick = async () => { try { await api('/api/admin/products', { method: 'POST', body: JSON.stringify({ nome: $('#pN').value, preco: Number($('#pP').value), preco_promo: $('#pPP').value || null, estoque: Number($('#pE').value || 0) }) }); toast('Produto criado!'); show('prod'); } catch (e) { toast(e.message); } }; }
    if (t === 'cup') { const cs = await api('/api/admin/coupons'); adm.innerHTML = `<div class="frm"><h3>＋ Novo cupom</h3><div class="two"><input id="cC" placeholder="CÓDIGO"><input id="cV" type="number" placeholder="Valor"></div><button class="btn primary" id="btnNC">Criar cupom (% ou R$ fixo)</button></div><table class="tbl">${cs.map((c) => `<tr><td><b>${c.codigo}</b></td><td>${c.tipo} ${c.valor}</td><td>usos ${c.usos}</td></tr>`).join('')}</table>`;
      $('#btnNC').onclick = async () => { await api('/api/admin/coupons', { method: 'POST', body: JSON.stringify({ codigo: $('#cC').value, valor: Number($('#cV').value) }) }); toast('Cupom criado!'); show('cup'); }; }
    if (t === 'ban') { const bs = await api('/api/admin/banners'); adm.innerHTML = `<div class="frm"><h3>＋ Novo banner</h3><input id="bT" placeholder="Título"><input id="bS" placeholder="Subtítulo"><button class="btn primary" id="btnNB">Criar</button></div>${bs.map((b) => `<div class="minicard">${b.imagem} <b>${b.titulo}</b> — ${b.subtitulo}</div>`).join('')}`;
      $('#btnNB').onclick = async () => { await api('/api/admin/banners', { method: 'POST', body: JSON.stringify({ titulo: $('#bT').value, subtitulo: $('#bS').value }) }); toast('Banner criado!'); show('ban'); }; }
    if (t === 'cfg') { const s = await api('/api/admin/settings'); adm.innerHTML = `<div class="frm"><h3>⚙️ Loja, frete e integrações</h3>${['store_name', 'whatsapp', 'frete_gratis_acima', 'frete_fixo', 'banner_topo'].map((k) => `<label>${k}</label><input id="s_${k}" value="${s[k] || ''}">`).join('')}<button class="btn primary" id="btnS">Salvar</button><div class="note">💳 Pagamentos reais: defina <code>MP_ACCESS_TOKEN</code> (Mercado Pix/cartão/boleto) ou <code>STRIPE_SECRET_KEY</code> nas variáveis de ambiente e reinicie. Webhook: <code>/api/webhooks/mercadopago</code>. Sem isso, pedidos ficam como <b>aguardando pagamento</b> — nunca marcamos como pago sem confirmação do provedor.</div></div>`;
      $('#btnS').onclick = async () => { const b = {}; ['store_name', 'whatsapp', 'frete_gratis_acima', 'frete_fixo', 'banner_topo'].forEach((k) => b[k] = $('#s_' + k).value); await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(b) }); toast('Configurações salvas!'); }; }
  }
  $$('.tabs button').forEach((b) => b.onclick = () => show(b.dataset.t));
  window.updOrder = async (id, status) => { if (!status) return; await api('/api/admin/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status, rastreio: status === 'enviado' ? true : undefined }) }); toast('Pedido atualizado!'); adminPage(); };
  window.delP = async (id) => { if (confirm('Excluir produto?')) { await api('/api/admin/products/' + id, { method: 'DELETE' }); show('prod'); } };
  show('ped');
}

/* ---------- INSTITUCIONAL ---------- */
const page = (t, b) => { $('#conteudo').innerHTML = `<div class="frm" style="max-width:760px"><h2>${t}</h2>${b}<br><a class="btn ghost" href="#/">← Voltar</a></div>`; };
async function contato() { page('📩 Contato', `<div class="frm"><input id="mN" placeholder="Seu nome"><input id="mE" placeholder="Seu e-mail"><input id="mA" placeholder="Assunto"><textarea id="mT" placeholder="Como podemos ajudar?"></textarea><button class="btn primary" id="btnM">Enviar mensagem</button><p>Ou chame no <a href="${$('#zap').href}">WhatsApp</a> • Seg–Sáb 9h–18h</p></div>`);
  $('#btnM').onclick = async () => { try { const r = await api('/api/contact', { method: 'POST', body: JSON.stringify({ nome: $('#mN').value, email: $('#mE').value, assunto: $('#mA').value, texto: $('#mT').value }) }); toast(r.aviso); } catch (e) { toast(e.message); } }; }
async function faq() { page('❓ Perguntas frequentes', `<p><b>Quais formas de pagamento?</b><br>Pix, cartão em até 12x e boleto (via provedor configurado).</p><p><b>Qual o prazo de entrega?</b><br>Postagem em até 48h úteis + prazo do frete calculado no checkout, com código de rastreio.</p><p><b>Posso trocar?</b><br>Sim, em até 7 dias (ver <a href="#/trocas">trocas e devoluções</a>).</p><p><b>Preciso criar conta?</b><br>Não — você pode comprar como visitante, mas a conta guarda endereços e histórico.</p>`); }
async function priv() { page('🔒 Privacidade & LGPD', `<p>Coletamos apenas nome, e-mail, endereço e dados do pedido para processar sua compra (base legal: execução de contrato, art. 7º LGPD). Nunca vendemos seus dados. Você pode solicitar acesso, correção ou exclusão pelo contato da loja.</p><p>Cookies: usamos apenas os essenciais (carrinho e login). Pagamentos são processados pelo provedor oficial — não armazenamos dados de cartão.</p>`); }
async function termos() { page('📄 Termos de uso', `<p>Preços e estoque podem mudar sem aviso. Pedidos só são confirmados após confirmação real do pagamento pelo provedor. Em caso de divergência, o valor válido é o do checkout confirmado.</p>`); }
async function trocas() { page('🔄 Trocas e devoluções', `<p>Você tem 7 dias (art. 49 CDC) para desistir, com reembolso total. Produto com defeito: 30/90 dias de garantia. Fale no WhatsApp com código do pedido e fotos.</p>`); }
async function sobre() { page('✨ Sobre a loja', `<p>A LUMIÈRE Store nasceu para provar que comprar online pode ser simples, bonito e seguro: curadoria de qualidade, preço justo e atendimento humano.</p>`); }

boot();
