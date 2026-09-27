import { store, getUser, getPlan, setPlan, getProjects, saveProject, deleteProject, getSettings, toast, uid, fmtDate } from './store.js';
import { TEMPLATES, generateSiteData, generateWithAI, slugify } from './gen.js';
import { renderSiteInner, exportStandaloneHTML } from './renderSite.js';

const app = document.getElementById('app');
const EXAMPLES = ['Site de barbearia moderna com agendamento no WhatsApp','Site de advogada de família, elegante e confiável','Landing page de infoproduto de emagrecimento que converte muito','Site de restaurante italiano com cardápio e delivery','Portfólio de fotógrafa minimalista','Loja de streetwear com grade de produtos','Clínica odontológica com agendamento','Academia com planos mensais'];

function nav(active=''){
  const u = getUser(); const plan = getPlan();
  const link = (h,t)=>`<a href="${h}" class="px-3 py-2 rounded-lg text-sm font-medium ${active===h?'bg-white/10 text-white':'text-white/60 hover:text-white hover:bg-white/5'}">${t}</a>`;
  return `<header class="sticky top-0 z-50 border-b border-white/10 bg-[#05050a]/85 backdrop-blur-xl">
   <div class="max-w-7xl mx-auto px-4 h-16 flex items-center gap-2">
    <a href="#/" class="flex items-center gap-2 font-display font-extrabold text-lg"><span class="w-9 h-9 rounded-xl grad-btn grid place-items-center text-xl">⚡</span> SITE<span class="grad-text">GENIUS</span></a>
    <nav class="hidden md:flex items-center ml-6">${link('#/gerar','Criar')}${link('#/templates','Templates')}${link('#/dashboard','Dashboard')}${link('#/planos','Planos')}${link('#/admin','Admin')}</nav>
    <div class="ml-auto flex items-center gap-2">
      <a href="#/config" class="text-xs text-white/50 hover:text-white hidden sm:block">⚙️ API Keys</a>
      <span class="text-[11px] px-2 py-1 rounded-full font-bold ${plan.name==='pro'?'bg-gradient-to-r from-violet-600 to-cyan-500':'bg-white/10 text-white/70'}">${plan.name==='pro'?'PRO':'GRÁTIS'}</span>
      <a href="#/dashboard" class="w-9 h-9 rounded-full grad-btn grid place-items-center font-bold text-sm" title="${u.name}">${u.avatar}</a>
      <a href="#/gerar" class="grad-btn text-sm font-bold px-4 py-2 rounded-xl hidden sm:block">+ Gerar site</a>
    </div></div></header>`;
}
function footer(){
  return `<footer class="border-t border-white/10 mt-20"><div class="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8 text-sm text-white/60">
  <div><div class="font-display font-extrabold text-white text-lg">⚡ SITE GENIUS</div><p class="mt-2">Descreva. Gere. Publique. Sites profissionais em 10 segundos com IA.</p><p class="mt-3 text-xs">Suporte: contato@sitegenius.com.br</p></div>
  <div><div class="font-bold text-white mb-2">Produto</div><a href="#/gerar" class="block py-1">Gerador IA</a><a href="#/templates" class="block py-1">Templates</a><a href="#/planos" class="block py-1">Planos</a></div>
  <div><div class="font-bold text-white mb-2">Conta</div><a href="#/dashboard" class="block py-1">Dashboard</a><a href="#/admin" class="block py-1">Admin</a><a href="#/config" class="block py-1">Integrações</a></div>
  <div><div class="font-bold text-white mb-2">Legal</div><p class="py-1">Termos • Privacidade • LGPD</p><p class="py-1">Pagamentos: Stripe + Mercado Pago</p></div>
  </div><div class="text-center text-xs text-white/30 pb-8">© 2026 Site Genius • Feito com IA no Brasil</div></footer>`;
}
function observeReveals(){ const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1}); document.querySelectorAll('.reveal').forEach(el=>io.observe(el)); }

// ============ LANDING ============
function vLanding(){
  const tplCards = TEMPLATES.slice(0,8).map(t=>`
   <a href="#/templates" class="reveal glass rounded-2xl overflow-hidden g-card block">
    <img src="${t.img}" class="h-44 w-full object-cover" loading="lazy"/>
    <div class="p-4"><div class="text-[11px] font-bold text-cyan-300 uppercase">${t.tag}</div><div class="font-bold">${t.name}</div><div class="text-xs text-white/60 mt-1">${t.desc}</div></div>
   </a>`).join('');
  return `${nav('#/')}
  <div class="hero-grid absolute inset-0 -z-10"></div>
  <div class="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-30 -z-10" style="background:linear-gradient(90deg,#7c3aed,#06b6d4,#ec4899)"></div>
  <main class="max-w-7xl mx-auto px-4">
   <section class="text-center pt-16 pb-10 fade-up">
    <div class="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs">✨ Novo: IA Claude + 20 templates premium <a href="#/gerar" class="text-cyan-300 font-bold">Testar →</a></div>
    <h1 class="font-display font-extrabold text-5xl md:text-7xl mt-6 leading-tight">Descreva. <span class="grad-text">A IA cria.</span><br/>Publique em 10s.</h1>
    <p class="text-white/60 text-lg mt-4 max-w-2xl mx-auto">Digite “quero um site de barbearia moderno” e receba um site completo, editável e pronto pra vender — com WhatsApp, preços e publicação incluída.</p>
    <div class="max-w-2xl mx-auto mt-8 glass rounded-2xl p-2 flex gap-2 shadow-2xl">
      <input id="heroPrompt" class="flex-1 bg-transparent px-4 py-3 outline-none placeholder:text-white/30" placeholder='Ex: "Quero um site de barbearia moderna..."'/>
      <button onclick="window.__gen(document.getElementById('heroPrompt').value)" class="grad-btn font-bold px-6 py-3 rounded-xl">Gerar site ⚡</button>
    </div>
    <div class="flex flex-wrap justify-center gap-2 mt-4">${EXAMPLES.slice(0,4).map(e=>`<button onclick="window.__gen('${e.replace(/'/g,"\\'")}')" class="text-xs glass rounded-full px-3 py-1.5 hover:border-violet-400">💡 ${e.slice(0,34)}…</button>`).join('')}</div>
    <div class="flex justify-center gap-6 mt-6 text-sm text-white/50"><span>⚡ 10 segundos</span><span>🎨 Sem código</span><span>🚀 Publique grátis</span></div>
   </section>
   <section class="glass rounded-3xl overflow-hidden shadow-2xl reveal">
     <div class="flex items-center gap-2 px-4 py-3 border-b border-white/10 text-xs text-white/50"><span class="w-3 h-3 rounded-full bg-rose-500"></span><span class="w-3 h-3 rounded-full bg-yellow-500"></span><span class="w-3 h-3 rounded-full bg-emerald-500"></span><span class="ml-2">barbearia-corte-fino.sitegenius.com.br</span><span class="ml-auto grad-btn text-white px-3 py-1 rounded-lg font-bold">● LIVE</span></div>
     <img src="${TEMPLATES[0].img}" class="w-full h-[380px] object-cover"/>
     <div class="p-6 md:p-10 bg-gradient-to-br from-violet-900/40 to-cyan-900/20">
       <div class="font-display font-extrabold text-3xl">Barbearia Corte Fino</div>
       <div class="text-amber-400 font-bold text-xl mt-1">Corte impecável, estilo de respeito.</div>
       <div class="mt-4 flex gap-3"><span class="grad-btn px-5 py-3 rounded-xl font-bold text-sm">Agendar horário →</span><span class="glass px-5 py-3 rounded-xl text-sm">Ver serviços</span></div>
     </div>
   </section>
   <section class="grid md:grid-cols-4 gap-4 mt-14">
     ${[['🤖','IA geradora','Claude/GPT cria copy, cores e seções sob medida.'],['🎨','Editor visual','Clique e edite textos, imagens, cores e fontes.'],['🚀','Publicação 1-clique','Link sitegenius + domínio próprio + SSL.'],['💰','Feito pra vender','Preços, WhatsApp flutuante e checkout.']].map(f=>`<div class="reveal glass rounded-2xl p-6"><div class="text-3xl">${f[0]}</div><div class="font-bold mt-2">${f[1]}</div><p class="text-sm text-white/60 mt-1">${f[2]}</p></div>`).join('')}
   </section>
   <section class="mt-16"><div class="flex items-end justify-between"><h2 class="font-display font-extrabold text-3xl">20 templates premium</h2><a href="#/templates" class="text-cyan-300 text-sm font-bold">Ver todos →</a></div>
   <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">${tplCards}</div></section>
   <section class="mt-16 grid md:grid-cols-2 gap-4">
     <div class="reveal rounded-3xl p-8 border border-white/10 bg-white/[.03]"><div class="text-xs font-bold text-white/50">GRÁTIS</div><div class="font-display font-extrabold text-4xl mt-1">R$ 0</div><ul class="text-sm text-white/70 mt-4 space-y-2"><li>✓ 1 site publicado</li><li>✓ Editor visual completo</li><li>✓ 20 templates</li><li>• Com marca d'água</li></ul><a href="#/gerar" class="block text-center mt-6 glass rounded-xl py-3 font-bold">Começar grátis</a></div>
     <div class="reveal rounded-3xl p-8 grad-btn shadow-2xl"><div class="text-xs font-bold opacity-80">PRO — MAIS POPULAR</div><div class="font-display font-extrabold text-4xl mt-1">R$ 27<span class="text-base">/mês</span></div><ul class="text-sm mt-4 space-y-2"><li>✓ 10 sites, sem marca d'água</li><li>✓ Domínio próprio + SSL</li><li>✓ IA ilimitada + exportar código</li><li>✓ Suporte prioritário</li></ul><a href="#/planos" class="block text-center mt-6 bg-white text-black rounded-xl py-3 font-bold">Assinar Pro →</a></div>
   </section>
   <section class="mt-16 max-w-3xl mx-auto">
     <h2 class="font-display font-extrabold text-3xl text-center">Perguntas frequentes</h2>
     <div class="space-y-3 mt-6">${[['Preciso saber programar?','Não. Você descreve, a IA gera, você clica e edita. Publicação em 1 clique.'],['Posso usar meu domínio?','Sim, no plano Pro. Apontamos SSL automático e fica no ar em minutos.'],['Como funciona a IA?','Usamos Claude/GPT-4 quando você conecta sua API key. Sem chave, nosso motor local gera na hora — grátis e ilimitado no Pro.'],['Posso exportar o código?','Sim, no Pro você baixa o HTML/CSS/JS completo e hospeda onde quiser.']].map(f=>`<details class="reveal glass rounded-2xl p-5"><summary class="font-bold cursor-pointer">${f[0]}</summary><p class="text-sm text-white/60 mt-2">${f[1]}</p></details>`).join('')}</div>
     <div class="text-center mt-10"><a href="#/gerar" class="grad-btn font-bold px-10 py-4 rounded-2xl inline-block text-lg">Criar meu site agora ⚡</a><p class="text-xs text-white/40 mt-2">Grátis • Sem cartão • Leva 10 segundos</p></div>
   </section>
  </main>${footer()}`;
}

// ============ GERAR ============
function vGerar(prefill=''){
  return `${nav('#/gerar')}<main class="max-w-3xl mx-auto px-4 pt-14 pb-20">
   <div class="text-center fade-up"><h1 class="font-display font-extrabold text-4xl md:text-5xl">O que vamos <span class="grad-text">criar hoje?</span></h1>
   <p class="text-white/60 mt-3">Descreva com detalhes: nicho, nome, serviços, preços, estilo e cores.</p></div>
   <div class="glass rounded-3xl p-6 mt-8 shadow-2xl fade-up">
     <textarea id="genPrompt" rows="4" class="w-full bg-black/40 rounded-2xl p-4 outline-none focus:ring-2 ring-violet-500 placeholder:text-white/30" placeholder="Ex: Quero um site de barbearia moderna chamada Corte Fino, com agendamento no WhatsApp, tabela de preços (corte R$45, barba R$35), cores preto e dourado...">${prefill}</textarea>
     <div class="flex flex-wrap gap-2 mt-3">${EXAMPLES.map(e=>`<button data-ex="${e.replace(/"/g,'&quot;')}" class="exbtn text-xs glass rounded-full px-3 py-1.5 hover:border-cyan-400">✨ ${e.slice(0,40)}…</button>`).join('')}</div>
     <div class="flex items-center gap-3 mt-5">
       <select id="genTpl" class="bg-black/40 rounded-xl px-3 py-3 text-sm outline-none border border-white/10"><option value="">🤖 IA escolhe o template</option>${TEMPLATES.map(t=>`<option value="${t.id}">${t.tag} — ${t.name}</option>`).join('')}</select>
       <button id="genBtn" class="grad-btn flex-1 font-bold py-3.5 rounded-2xl text-lg">GERAR SITE COM IA ⚡</button>
     </div>
     <p id="genHint" class="text-xs text-white/40 mt-3">💡 Sem API key a geração é instantânea e local. Conecte sua Claude API em ⚙️ para copy ainda mais inteligente.</p>
   </div>
   <div id="genProgress" class="hidden glass rounded-3xl p-8 mt-6 text-center">
     <div class="text-5xl animate-bounce">🤖</div>
     <div id="genStep" class="font-bold mt-3 type-caret">Analisando seu pedido...</div>
     <div class="h-2 bg-white/10 rounded-full mt-4 overflow-hidden"><div id="genBar" class="h-full grad-btn rounded-full transition-all" style="width:5%"></div></div>
   </div>
  </main>${footer()}`;
}
async function runGeneration(prompt, tplId){
  const bar = document.getElementById('genBar'), step=document.getElementById('genStep');
  document.getElementById('genProgress').classList.remove('hidden');
  const steps=['Analisando seu pedido...','Detectando nicho e estilo...','Escrevendo copy que vende...','Escolhendo cores e imagens...','Montando seções (hero, preços, FAQ)...','Otimizando para celular...','Finalizando ✨'];
  const settings = getSettings();
  for(let i=0;i<steps.length;i++){ step.textContent=steps[i]; bar.style.width=(8+i*(92/steps.length))+'%'; await new Promise(r=>setTimeout(r,520)); }
  const tplOverride = tplId?TEMPLATES.find(t=>t.id===tplId):null;
  let data;
  if(tplOverride){ const {generateSiteData:gsd}=await import('./gen.js'); data=gsd(prompt,tplOverride); }
  else data = await generateWithAI(prompt, settings);
  const plan = getPlan(); const projs=getProjects();
  if(plan.name!=='pro' && projs.length>=1){ toast('Plano grátis permite 1 site. Exclua um ou assine o Pro.', 'err'); location.hash='#/planos'; return; }
  if(plan.name==='pro' && projs.length>=10){ toast('Limite Pro: 10 sites.', 'err'); return; }
  const proj={ id:uid(), business:data.business, niche:data.niche, prompt, theme:{...data.tpl.colors}, font:data.tpl.font, templateId:data.tpl.id, heroImg:data.tpl.img, wa:data.wa, sections:data.sections, slug:slugify(data.business), published:false, url:'', createdAt:Date.now(), updatedAt:Date.now() };
  saveProject(proj);
  location.hash='#/editor/'+proj.id;
}

// ============ TEMPLATES ============
function vTemplates(){
  const niches=['Todos',...new Set(TEMPLATES.map(t=>t.tag))];
  return `${nav('#/templates')}<main class="max-w-7xl mx-auto px-4 pt-12 pb-20">
  <h1 class="font-display font-extrabold text-4xl">Templates <span class="grad-text">premium</span></h1>
  <p class="text-white/60 mt-2">20 modelos prontos. Clique em “Usar” e edite tudo no visual.</p>
  <div id="niches" class="flex flex-wrap gap-2 mt-6">${niches.map((n,i)=>`<button data-n="${n}" class="nbtn text-sm px-4 py-2 rounded-full font-bold ${i===0?'grad-btn':'glass'}">${n}</button>`).join('')}</div>
  <div id="tplGrid" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6"></div></main>${footer()}`;
}
function paintTplGrid(filter='Todos'){
  const grid=document.getElementById('tplGrid'); if(!grid) return;
  grid.innerHTML=TEMPLATES.filter(t=>filter==='Todos'||t.tag===filter).map(t=>`
   <div class="glass rounded-2xl overflow-hidden g-card">
    <div class="relative"><img src="${t.img}" class="h-44 w-full object-cover"/><span class="absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-full" style="background:${t.colors.accent};color:#fff">${t.tag}</span></div>
    <div class="p-4"><div class="font-bold">${t.name}</div><div class="text-xs text-white/60 mt-1 h-8">${t.desc}</div>
    <div class="flex gap-2 mt-3"><button onclick="window.__useTpl('${t.id}')" class="grad-btn flex-1 text-sm font-bold py-2.5 rounded-xl">Usar template</button><button onclick="window.__prevTpl('${t.id}')" class="glass text-sm px-3 py-2.5 rounded-xl">👁</button></div></div>
   </div>`).join('');
}

// ============ DASHBOARD ============
function vDashboard(){
  const projs=getProjects(); const plan=getPlan(); const u=getUser();
  const cards=projs.map(p=>{
   const cover=(p.sections&&p.sections.find(s=>s.image)?.image)||p.heroImg||'';
   return `
   <div class="glass rounded-2xl overflow-hidden g-card">
    <div class="relative">${cover?`<img src="${cover}" class="h-40 w-full object-cover"/>`:`<div class="h-40 w-full grid place-items-center text-4xl bg-gradient-to-br from-violet-900 to-cyan-900">⚡</div>`}
     <span class="absolute top-3 right-3 text-[11px] font-bold px-2 py-1 rounded-full ${p.published?'bg-emerald-500':'bg-white/20'}">${p.published?'● Publicado':'○ Rascunho'}</span></div>
    <div class="p-4"><div class="font-bold truncate">${p.business}</div><div class="text-xs text-white/50">${p.niche||''} • atualizado ${fmtDate(p.updatedAt)}</div>
    ${p.published?`<a href="#/site/${p.slug}" class="block text-xs text-emerald-300 truncate mt-1 font-bold">👁 Abrir: ${p.url||p.slug}</a>`:`<div class="text-xs text-white/40 mt-1">não publicado</div>`}
    <div class="grid grid-cols-3 gap-2 mt-3">
      <a href="#/editor/${p.id}" class="grad-btn text-center text-xs font-bold py-2 rounded-lg">Editar</a>
      ${p.published?`<a href="#/site/${p.slug}" class="glass text-center text-xs font-bold py-2 rounded-lg">👁 Abrir</a>`:`<button onclick="window.__publish('${p.id}')" class="glass text-xs font-bold py-2 rounded-lg">🚀 Publicar</button>`}
      <button onclick="window.__del('${p.id}')" class="glass text-xs font-bold py-2 rounded-lg hover:!border-rose-500">🗑</button>
    </div>
    ${p.published?`<div class="grid grid-cols-3 gap-2 mt-2"><button onclick="window.__publish('${p.id}')" class="glass text-[11px] py-1.5 rounded-lg">↻ Republicar</button><button onclick="window.__exportJSON('${p.id}')" class="glass text-[11px] py-1.5 rounded-lg">💾 Backup</button><button onclick="window.__copyWork('${p.id}')" class="glass text-[11px] py-1.5 rounded-lg">📋 Link</button></div>`:''}
    </div></div>`}).join('');
  return `${nav('#/dashboard')}<main class="max-w-7xl mx-auto px-4 pt-10 pb-20">
   <div class="flex flex-wrap items-center gap-4"><div><h1 class="font-display font-extrabold text-3xl">Olá, ${u.name.split(' ')[0]} 👋</h1><p class="text-white/50 text-sm">Plano <b class="${plan.name==='pro'?'text-cyan-300':'text-white'}">${plan.name.toUpperCase()}</b> • ${projs.length}/${plan.name==='pro'?10:1} sites usados</p></div>
   <div class="ml-auto flex gap-2"><button onclick="window.__importJSON()" class="glass text-sm font-bold px-4 py-2.5 rounded-xl">⤴ Importar</button><a href="#/gerar" class="grad-btn text-sm font-bold px-5 py-2.5 rounded-xl">+ Novo site</a><a href="#/planos" class="glass text-sm font-bold px-5 py-2.5 rounded-xl">Ver planos</a></div></div>
   <div class="h-2 bg-white/10 rounded-full mt-4 overflow-hidden"><div class="h-full grad-btn" style="width:${Math.min(100,projs.length/(plan.name==='pro'?10:1)*100)}%"></div></div>
   ${projs.length===0?`<div class="glass rounded-3xl p-12 text-center mt-8"><div class="text-5xl">🚀</div><h2 class="font-bold text-xl mt-3">Nenhum site ainda</h2><p class="text-white/50 text-sm mt-1">Gere seu primeiro site em 10 segundos.</p><a href="#/gerar" class="grad-btn inline-block mt-5 font-bold px-8 py-3 rounded-xl">Gerar meu primeiro site ⚡</a></div>`:`<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">${cards}</div>`}
   <div class="grid md:grid-cols-3 gap-4 mt-8">
    <div class="glass rounded-2xl p-5"><div class="text-xs text-white/50 font-bold">DICA IA</div><p class="text-sm mt-1">Descreva preços e WhatsApp no prompt — a IA já deixa tudo clicável.</p></div>
    <div class="glass rounded-2xl p-5"><div class="text-xs text-white/50 font-bold">DOMÍNIO PRÓPRIO</div><p class="text-sm mt-1">${plan.name==='pro'?'Ativo! Configure no editor → Publicar.':'Disponível no Pro por R$ 27/mês.'} </p><a href="#/planos" class="text-cyan-300 text-sm font-bold">Ver →</a></div>
    <div class="glass rounded-2xl p-5"><div class="text-xs text-white/50 font-bold">EXPORTAR CÓDIGO</div><p class="text-sm mt-1">Baixe HTML/CSS/JS e hospede onde quiser (Pro).</p></div>
   </div></main>${footer()}`;
}

// ============ PLANOS / CHECKOUT ============
function vPlanos(){
  const plan=getPlan();
  return `${nav('#/planos')}<main class="max-w-5xl mx-auto px-4 pt-12 pb-20 text-center">
  <h1 class="font-display font-extrabold text-4xl md:text-5xl">Um plano pra cada <span class="grad-text">fase</span></h1>
  <p class="text-white/60 mt-2">Comece grátis. Escale no Pro. Cancele quando quiser.</p>
  <div class="grid md:grid-cols-2 gap-5 mt-10 text-left">
   <div class="rounded-3xl p-8 border border-white/10 bg-white/[.03]">
    <div class="font-bold text-white/60 text-sm">GRÁTIS ${plan.name==='free'?'• ATUAL':''}</div><div class="font-display font-extrabold text-5xl mt-2">R$ 0</div>
    <ul class="text-sm text-white/70 mt-5 space-y-2.5"><li>✓ 1 site publicado</li><li>✓ Editor visual + 20 templates</li><li>✓ Link sitegenius.com.br + SSL</li><li>✕ Com marca d'água</li><li>✕ Sem domínio próprio / export</li></ul>
    <a href="#/gerar" class="block text-center mt-6 glass rounded-xl py-3 font-bold">Começar grátis</a></div>
   <div class="rounded-3xl p-8 grad-btn shadow-2xl relative overflow-hidden">
    <span class="absolute top-4 right-4 bg-yellow-300 text-black text-[11px] font-extrabold px-3 py-1 rounded-full">-40% HOJE</span>
    <div class="font-bold text-sm opacity-80">PRO ${plan.name==='pro'?'• ATUAL':''}</div><div class="font-display font-extrabold text-5xl mt-2">R$ 27<span class="text-lg">/mês</span></div><div class="text-sm opacity-70 line-through">R$ 47/mês</div>
    <ul class="text-sm mt-5 space-y-2.5"><li>✓ 10 sites, <b>sem marca d'água</b></li><li>✓ Domínio próprio + SSL automático</li><li>✓ IA ilimitada (Claude/GPT-4)</li><li>✓ Exportar HTML/CSS/JS</li><li>✓ Suporte prioritário no WhatsApp</li></ul>
    <a href="#/checkout" class="block text-center mt-6 bg-white text-black rounded-xl py-3.5 font-extrabold">Assinar Pro →</a>
    <div class="text-xs mt-2 opacity-80">💳 Stripe • PIX Mercado Pago • 7 dias de garantia</div></div>
  </div>
  <div class="glass rounded-2xl p-5 mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/60"><span>🔒 Pagamento seguro</span><span>⚡ Ativação imediata</span><span>↩️ 7 dias de garantia</span><span>🇧🇷 Nota fiscal</span></div>
  </main>${footer()}`;
}
function vCheckout(){
  return `${nav('#/planos')}<main class="max-w-4xl mx-auto px-4 pt-10 pb-20">
  <a href="#/planos" class="text-sm text-white/50">← voltar</a>
  <h1 class="font-display font-extrabold text-3xl mt-2">Checkout <span class="grad-text">Pro — R$ 27/mês</span></h1>
  <div class="grid md:grid-cols-2 gap-5 mt-6">
   <div class="glass rounded-3xl p-6">
    <div class="flex gap-2"><button id="tabCard" class="flex-1 py-2.5 rounded-xl text-sm font-bold grad-btn">💳 Cartão (Stripe)</button><button id="tabPix" class="flex-1 py-2.5 rounded-xl text-sm font-bold glass">⚡ PIX</button></div>
    <div id="paneCard" class="mt-5 space-y-3">
      <input id="ccName" class="w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10" placeholder="Nome no cartão" value="Seu Nome"/>
      <input id="ccNum" class="w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10" placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242"/>
      <div class="grid grid-cols-2 gap-3"><input class="bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10" placeholder="12/28" value="12/28"/><input class="bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10" placeholder="123" value="123"/></div>
      <button onclick="window.__payCard()" class="grad-btn w-full font-bold py-3.5 rounded-xl">Pagar R$ 27 →</button>
      <p class="text-[11px] text-white/40 text-center">Ambiente demo — nenhum valor é cobrado. Stripe test mode.</p>
    </div>
    <div id="panePix" class="hidden mt-5 text-center">
      <img id="pixQr" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=SITEGENIUS-PIX-27-BR" class="mx-auto rounded-2xl border-4 border-white/20"/>
      <div class="text-3xl font-extrabold mt-3">R$ 27,00</div>
      <div class="text-xs text-white/50">Escaneie ou copie o código abaixo (Mercado Pago)</div>
      <div class="flex gap-2 mt-3"><input id="pixCode" readonly value="00020126580014BR.GOV.BCB.PIX0136sitegenius-pix-27/br520400005303986540527.006802BR5913SITE GENIUS6009SAO PAULO62070503***6304A1B2" class="flex-1 bg-black/40 rounded-xl px-3 py-2.5 text-[11px] outline-none"/><button onclick="window.__copyPix()" class="glass px-4 rounded-xl text-sm font-bold">Copiar</button></div>
      <button onclick="window.__payPix()" class="grad-btn w-full font-bold py-3.5 rounded-xl mt-4">Já paguei, ativar Pro ⚡</button>
    </div>
   </div>
   <div class="rounded-3xl p-6 grad-btn"><h3 class="font-bold">Resumo</h3><div class="flex justify-between text-sm mt-3"><span>Site Genius Pro mensal</span><span>R$ 27,00</span></div><div class="flex justify-between text-sm mt-1 opacity-80"><span>Desconto lançamento</span><span>-R$ 20,00</span></div><div class="border-t border-white/30 mt-3 pt-3 flex justify-between font-extrabold"><span>Total hoje</span><span>R$ 27,00</span></div><ul class="text-sm mt-4 space-y-1.5"><li>✓ 10 sites sem marca</li><li>✓ Domínio próprio + SSL</li><li>✓ IA ilimitada + export</li></ul><p class="text-xs mt-4 opacity-80">Garantia incondicional de 7 dias.</p></div>
  </div></main>${footer()}`;
}

// ============ ADMIN ============
function vAdmin(){
  const projs=getProjects(); const plan=getPlan();
  const fake=[['Ana Beatriz','ana@salao.com','Pro','R$ 27'],['Carlos Mota','carlos@barber.com','Pro','R$ 27'],['Juliana Prado','ju@advocacia.com','Pro','R$ 27'],['Pedro Santos','pedro@loja.com','Grátis','R$ 0'],['Fernanda Lima','nanda@clinica.com','Pro','R$ 27']];
  const mrr = fake.filter(f=>f[2]==='Pro').length*27 + (plan.name==='pro'?27:0);
  return `${nav('#/admin')}<main class="max-w-7xl mx-auto px-4 pt-10 pb-20">
  <div class="flex items-center gap-3"><h1 class="font-display font-extrabold text-3xl">Painel Admin 📊</h1><span class="text-xs glass px-2 py-1 rounded-full">MRR ao vivo</span></div>
  <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
   ${[['💰 MRR','R$ '+mrr,'+18% este mês'],['👥 Usuários','1.284','+96 hoje'],['🌐 Sites gerados',(1240+projs.length).toLocaleString('pt-BR'),'+IA ativa'],['📈 Conversão','6,4%','grátis → pro']].map(s=>`<div class="glass rounded-2xl p-5"><div class="text-xs text-white/50 font-bold">${s[0]}</div><div class="font-display font-extrabold text-3xl mt-1">${s[1]}</div><div class="text-xs text-emerald-300 mt-1">${s[2]}</div></div>`).join('')}
  </div>
  <div class="grid lg:grid-cols-2 gap-4 mt-4">
   <div class="glass rounded-2xl p-6"><div class="font-bold mb-4">Receita últimos 7 dias</div><div class="flex items-end gap-2 h-36">${[40,65,52,80,95,70,110].map((h,i)=>`<div class="flex-1 rounded-t-lg grad-btn" style="height:${h}%" title="R$ ${h*3}"></div>`).join('')}</div><div class="flex justify-between text-[11px] text-white/40 mt-2"><span>seg</span><span>ter</span><span>qua</span><span>qui</span><span>sex</span><span>sáb</span><span>hoje</span></div></div>
   <div class="glass rounded-2xl p-6"><div class="font-bold mb-2">Meus sites (neste navegador)</div>${projs.length===0?'<p class="text-sm text-white/50">Nenhum ainda. <a href="#/gerar" class="text-cyan-300">Gerar →</a></p>':projs.map(p=>`<div class="flex justify-between text-sm py-2 border-b border-white/5"><span>${p.business}</span><span class="${p.published?'text-emerald-300':'text-white/40'}">${p.published?'publicado':'rascunho'}</span></div>`).join('')}</div>
  </div>
  <div class="glass rounded-2xl p-6 mt-4 overflow-x-auto"><div class="flex items-center gap-3 mb-4"><span class="font-bold">Usuários</span><button onclick="window.__csv()" class="ml-auto glass text-xs px-3 py-1.5 rounded-lg font-bold">⬇ Exportar CSV</button></div>
   <table class="w-full text-sm"><thead class="text-white/40 text-xs"><tr><td class="py-2">NOME</td><td>EMAIL</td><td>PLANO</td><td>FATURAMENTO</td></tr></thead><tbody>
   ${fake.map(f=>`<tr class="border-t border-white/5"><td class="py-2.5 font-semibold">${f[0]}</td><td class="text-white/60">${f[1]}</td><td><span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${f[2]==='Pro'?'bg-gradient-to-r from-violet-600 to-cyan-500':'bg-white/10'}">${f[2].toUpperCase()}</span></td><td>${f[3]}</td></tr>`).join('')}
   </tbody></table></div></main>${footer()}`;
}

// ============ CONFIG ============
function vConfig(){
  const s=getSettings();
  return `${nav('')}<main class="max-w-2xl mx-auto px-4 pt-10 pb-20">
  <h1 class="font-display font-extrabold text-3xl">Integrações ⚙️</h1>
  <p class="text-white/60 text-sm mt-1">Conecte suas chaves. Tudo opcional — o app funciona 100% sem elas (motor local + imagens Unsplash públicas).</p>
  <div class="glass rounded-3xl p-6 mt-6 space-y-4">
   <div><label class="text-xs font-bold text-white/60">ANTHROPIC CLAUDE API (IA premium)</label><input id="kClaude" type="password" value="${s.anthropicKey}" placeholder="sk-ant-..." class="mt-1 w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10"/><p class="text-[11px] text-white/40 mt-1">console.anthropic.com → API Keys. Ativa copy ultra-persuasiva.</p></div>
   <div><label class="text-xs font-bold text-white/60">SUPABASE URL</label><input id="kSbU" value="${s.supabaseUrl}" placeholder="https://xxx.supabase.co" class="mt-1 w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10"/></div>
   <div><label class="text-xs font-bold text-white/60">SUPABASE ANON KEY</label><input id="kSbK" type="password" value="${s.supabaseKey}" placeholder="eyJ..." class="mt-1 w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10"/></div>
   <div><label class="text-xs font-bold text-white/60">UNSPLASH ACCESS KEY (troca de imagens)</label><input id="kUn" value="${s.unsplashKey}" placeholder="opcional" class="mt-1 w-full bg-black/40 rounded-xl px-4 py-3 text-sm outline-none border border-white/10"/></div>
   <button onclick="window.__saveKeys()" class="grad-btn w-full font-bold py-3 rounded-xl">Salvar integrações</button>
  </div></main>${footer()}`;
}

export { nav, footer, observeReveals, vLanding, vGerar, runGeneration, vTemplates, paintTplGrid, vDashboard, vPlanos, vCheckout, vAdmin, vConfig };
