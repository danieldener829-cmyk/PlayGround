import { store, getUser, getPlan, setPlan, getProjects, saveProject, deleteProject, getSettings, toast } from './store.js';
import { TEMPLATES, generateSiteData, slugify } from './gen.js';
import { renderSiteInner, exportStandaloneHTML } from './renderSite.js';
import { nav, footer, observeReveals, vLanding, vGerar, runGeneration, vTemplates, paintTplGrid, vDashboard, vPlanos, vCheckout, vAdmin, vConfig } from './views.js';
import { vEditor, editorActions, paintCanvas } from './editor.js';

const app = document.getElementById('app');
editorActions();

// ---------- global actions ----------
window.__gen = (prompt)=>{
  if(!prompt || !prompt.trim()){ location.hash='#/gerar'; setTimeout(()=>toast('Descreva seu site primeiro 💡','err'),400); return; }
  location.hash='#/gerar?prompt='+encodeURIComponent(prompt);
};
window.__useTpl = (id)=>{
  const tpl=TEMPLATES.find(t=>t.id===id);
  const data=generateSiteData(tpl.name, tpl);
  const plan=getPlan(); const projs=getProjects();
  if(plan.name!=='pro' && projs.length>=1){ toast('Plano grátis: 1 site. Assine o Pro.','err'); location.hash='#/planos'; return; }
  const proj={ id:Math.random().toString(36).slice(2,9), business:data.business, niche:data.niche, prompt:tpl.name, theme:{...tpl.colors}, font:tpl.font, templateId:tpl.id, heroImg:tpl.img, wa:data.wa, sections:data.sections, slug:slugify(data.business+'-'+Date.now().toString(36).slice(-3)), published:false, url:'', createdAt:Date.now(), updatedAt:Date.now() };
  saveProject(proj); location.hash='#/editor/'+proj.id; toast('Template aplicado! Edite à vontade 🎨');
};
window.__prevTpl = (id)=>{
  const tpl=TEMPLATES.find(t=>t.id===id);
  const data=generateSiteData('preview', tpl);
  const proj={ business:data.business, niche:data.niche, theme:{...tpl.colors}, font:tpl.font, wa:data.wa, sections:data.sections, published:false };
  const html=renderSiteInner(proj);
  const w=window.open('','_blank'); w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"><\/script><title>${tpl.name}</title></head><body>${html}</body></html>`); w.document.close();
};
window.__del = (id)=>{ if(confirm('Excluir este site?')){ deleteProject(id); toast('Site excluído'); route(); } };
window.__csv = ()=>{ const rows=[['nome','email','plano','mrr'],['Ana Beatriz','ana@salao.com','Pro','27'],['Carlos Mota','carlos@barber.com','Pro','27']]; const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='usuarios.csv'; a.click(); };
window.__saveKeys = ()=>{ const g=id=>document.getElementById(id).value.trim(); store.set('settings',{ anthropicKey:g('kClaude'), supabaseUrl:g('kSbU'), supabaseKey:g('kSbK'), unsplashKey:g('kUn') }); toast('Integrações salvas ⚙️'); };
window.__payCard = ()=>{ setPlan({name:'pro', since:Date.now()}); toast('Pagamento aprovado! Bem-vindo ao PRO 🚀'); location.hash='#/dashboard'; };
window.__payPix = ()=>{ setPlan({name:'pro', since:Date.now()}); toast('PIX confirmado! PRO ativado ⚡'); location.hash='#/dashboard'; };
window.__copyPix = ()=>{ const i=document.getElementById('pixCode'); i.select(); navigator.clipboard?.writeText(i.value); toast('Código PIX copiado'); };

// publish flow (global, works from dashboard + editor)
function cleanSlug(s){ return String(s||'meu-site').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'meu-site'; }
function workingLink(slug){ return location.origin + location.pathname + '#/site/' + slug; }
window.__publish = (id)=>{
  const all=getProjects();
  const proj=all.find(p=>p.id===id); if(!proj){ toast('Projeto não encontrado','err'); return; }
  const plan=getPlan();
  const modal=document.getElementById('pubModal');
  const show=(html)=>{ if(modal){ modal.classList.remove('hidden'); document.getElementById('pubBody').innerHTML=html; } else { // dashboard não tem modal → cria overlay
      const d=document.createElement('div'); d.id='pubOverlay'; d.className='fixed inset-0 z-[100] bg-black/70 backdrop-blur grid place-items-center p-4'; d.innerHTML=`<div class="glass rounded-3xl p-8 max-w-md w-full bg-[#0d0d16] text-center" id="pubBody">${html}</div>`; document.body.appendChild(d);
    } };
  const body=()=>document.getElementById('pubBody');
  show(`<div class="text-4xl">🚀</div><h3 class="font-extrabold text-xl mt-2">Publicar “${proj.business}”</h3>
   <label class="text-xs font-bold text-white/60 block text-left mt-4">SLUG DO LINK</label>
   <div class="flex gap-2 mt-1"><input id="pubSlug" value="${proj.slug}" class="flex-1 bg-black/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10"/><span class="text-xs self-center text-white/40">.sitegenius.com.br</span></div>
   <label class="text-xs font-bold text-white/60 block text-left mt-3">DOMÍNIO PRÓPRIO ${plan.name!=='pro'?'(PRO)':''}</label>
   <input id="pubDom" ${plan.name!=='pro'?'disabled':''} placeholder="${plan.name!=='pro'?'Disponível no Pro — ex: seudominio.com.br':'ex: seudominio.com.br'}" value="${proj.domain||''}" class="mt-1 w-full bg-black/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10 ${plan.name!=='pro'?'opacity-50':''}"/>
   <div class="flex items-center gap-2 text-xs text-white/60 mt-3"><span>🔒 SSL automático</span><span>•</span><span>⚡ CDN global</span></div>
   <button id="pubGo" class="grad-btn w-full font-bold py-3 rounded-xl mt-4">Publicar agora →</button>
   ${plan.name!=='pro'?'<a href="#/planos" class="text-xs text-cyan-300 mt-2 inline-block">Quero domínio próprio + sem marca → Pro R$27</a>':''}
   <button onclick="window.__pubClose()" class="text-xs text-white/40 mt-2">cancelar</button>`);
  window.__pubClose=()=>{ document.getElementById('pubModal')?.classList.add('hidden'); document.getElementById('pubOverlay')?.remove(); };
  document.getElementById('pubGo').onclick=async ()=>{
    let slug=cleanSlug(document.getElementById('pubSlug').value||proj.slug);
    const dom=(document.getElementById('pubDom')?.value||'').trim();
    // evita colisão: se outro projeto usa o mesmo slug, acrescenta sufixo
    const taken = getProjects().some(p=>p.id!==proj.id && p.slug===slug);
    if(taken) slug = slug + '-' + Math.random().toString(36).slice(2,5);
    body().innerHTML=`<div class="text-4xl animate-bounce">⚙️</div><h3 class="font-bold mt-2">Publicando...</h3><div id="pubSteps" class="text-left text-sm mt-4 space-y-2 text-white/70"></div>`;
    const steps=['▸ Gerando build otimizado...','▸ Salvando site nesta hospedagem...','▸ Gerando link de acesso imediato...','▸ Reservando '+ (dom||slug+'.sitegenius.com.br') +' (ativa com o DNS)...'];
    for(const s of steps){ const d=document.createElement('div'); d.textContent=s; const box=body().querySelector('#pubSteps'); if(!box) return; box.appendChild(d); await new Promise(r=>setTimeout(r,650)); d.textContent='✓ '+s.slice(2); d.classList.add('text-emerald-300'); }
    proj.slug=slug; proj.domain=dom; proj.published=true; proj.publishedAt=Date.now();
    proj.url='https://'+(dom||slug+'.sitegenius.com.br');
    proj.publicUrl=workingLink(slug);
    // Link estático real servido por esta hospedagem (funciona em qualquer navegador)
    proj.staticUrl=location.origin + location.pathname.replace(/\/$/,'') + '/s/' + slug + '.html';
    proj.updatedAt=Date.now(); saveProject(proj);
    body().innerHTML=`<div class="text-5xl">🎉</div><h3 class="font-extrabold text-xl mt-2">Publicado!</h3>
    <div class="mt-3 rounded-xl p-4 text-left" style="background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.4)">
      <div class="text-[11px] font-bold text-emerald-300">✅ LINK QUE FUNCIONA AGORA</div>
      <div class="text-sm font-bold break-all mt-1">${proj.publicUrl}</div>
      <div class="text-[11px] text-white/50 mt-1">Abre neste navegador em qualquer aba. Use o botão abaixo.</div>
    </div>
    <a href="#/site/${slug}" class="block mt-3 grad-btn rounded-xl px-4 py-3.5 text-sm font-extrabold">👁 ABRIR MEU SITE AGORA</a>
    <div class="grid grid-cols-2 gap-2 mt-3 text-xs font-bold">
      <button onclick="window.__copyWork('${proj.id}')" class="glass py-2.5 rounded-lg">📋 Copiar link</button>
      <button onclick="window.__edExportFrom('${proj.id}')" class="glass py-2.5 rounded-lg">⬇ Baixar HTML</button>
    </div>
    <div class="mt-3 rounded-xl p-3 text-left text-[11px] text-white/50" style="background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.3)">
      ⏳ Endereço reservado: <b class="text-white/80">${proj.url}</b><br/>Ele ativa sozinho quando o domínio <b>sitegenius.com.br</b> for registrado e o DNS wildcard apontar para esta hospedagem (ver HOSPEDAGEM.md). Enquanto isso, <b>não cole esse https:// no navegador</b> — dá erro de DNS.
    </div>
    <button onclick="window.__hostHelp()" class="w-full mt-2 text-xs text-cyan-300 font-bold py-2">❓ Como coloco no ar com link público? →</button>
    <button onclick="window.__pubClose();window.location.hash='#/dashboard'" class="text-xs text-white/50 mt-1">voltar ao dashboard</button>`;
    toast('Site publicado 🚀');
    if(document.getElementById('edCanvas')) paintCanvas();
  };
};
// Explica a hospedagem + guia real
window.__hostHelp=()=>{
  const d=document.createElement('div'); d.id='pubOverlay2'; d.className='fixed inset-0 z-[110] bg-black/80 backdrop-blur grid place-items-center p-4';
  d.innerHTML=`<div class="glass rounded-3xl p-7 max-w-md w-full bg-[#0d0d16] text-sm">
   <b class="text-base">🌐 Como funciona a hospedagem</b>
   <p class="mt-2 text-white/70">O endereço <b class="text-white">*.sitegenius.com.br</b> é um <b class="text-white">domínio de demonstração</b> — ele não existe de verdade na internet, por isso colar o <b class="text-white">https://...</b> em outra aba dá erro. Seu site <b class="text-emerald-300">ESTÁ publicado</b> e abre pelo botão “Abrir meu site”.</p>
   <div class="mt-3 space-y-2 text-white/80">
    <div class="glass rounded-xl p-3"><b>1️⃣ Link que funciona (aqui):</b><br/>use “Copiar link que funciona” — abre em qualquer aba <u>neste navegador</u>.</div>
    <div class="glass rounded-xl p-3"><b>2️⃣ Colocar no ar DE VERDADE (grátis, 2 min):</b><br/>Publique → Baixar HTML → arraste o arquivo em <b>app.netlify.com/drop</b> → ganhe um link real <b>seusite.netlify.app</b> no ar pro mundo.</div>
    <div class="glass rounded-xl p-3"><b>3️⃣ Domínio próprio:</b><br/>No Netlify/Vercel: Site settings → Domains → Add custom domain + SSL automático.</div>
   </div>
   <button onclick="document.getElementById('pubOverlay2').remove()" class="grad-btn w-full font-bold py-2.5 rounded-xl mt-4">Entendi 👍</button></div>`;
  document.body.appendChild(d);
};
window.__copyWork=(id)=>{ const p=getProjects().find(x=>x.id===id); const link=workingLink(p.slug); try{navigator.clipboard?.writeText(link);}catch(e){ prompt('Copie o link:', link); } toast('Link que funciona copiado 📋'); };
window.toastCopy=()=>toast('Link copiado 📋');
window.__edExportFrom=(id)=>{ const p=getProjects().find(x=>x.id===id); if(!p) return; const blob=new Blob([exportStandaloneHTML({...p,published:true})],{type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=p.slug+'.html'; a.click(); toast(getPlan().name==='pro'?'Código exportado (sem marca) ⬇':'HTML baixado (com marca d\'água no Grátis) ⬇'); };

// ---------- public site view ----------
function vSite(rawSlug){
  try{
  const slug=cleanSlug(decodeURIComponent(rawSlug||''));
  const all=getProjects();
  const proj=all.find(p=>cleanSlug(p.slug)===slug) || all.find(p=>p.id===rawSlug);
  if(!proj) return `${nav('')}<div class="max-w-xl mx-auto text-center py-24 px-4"><div class="text-6xl">🔍</div><h1 class="font-extrabold text-2xl mt-4">Site não encontrado neste navegador</h1><p class="text-white/50 text-sm mt-2">Sites publicados ficam salvos no navegador onde foram criados. Se você colou um link <b>https://...sitegenius.com.br</b> em outra aba ou aparelho, ele não vai abrir — esse domínio é de demonstração.</p><div class="flex flex-wrap justify-center gap-2 mt-6"><a href="#/dashboard" class="grad-btn px-6 py-3 rounded-xl font-bold">Meus sites</a><button onclick="window.__hostHelp()" class="glass px-6 py-3 rounded-xl font-bold">Entender hospedagem</button></div><p class="text-xs text-white/30 mt-4">Procurado: “${String(rawSlug||'').slice(0,60)}”</p></div>${footer()}`;
  if(!proj.published) return `${nav('')}<div class="max-w-xl mx-auto text-center py-24 px-4"><div class="text-6xl">🚧</div><h1 class="font-extrabold text-2xl mt-4">“${proj.business}” ainda não foi publicado</h1><a href="#/editor/${proj.id}" class="grad-btn inline-block mt-6 px-6 py-3 rounded-xl font-bold">Abrir no editor e publicar →</a></div>${footer()}`;
  return `<div class="fixed top-0 inset-x-0 z-50 bg-black/80 backdrop-blur border-b border-white/10 px-4 py-2 flex items-center gap-3 text-xs">
    <span>⚡ <b>${proj.business}</b> • ${proj.url||''} • SSL 🔒</span><button onclick="window.__hostHelp()" class="glass px-3 py-1 rounded-lg font-bold">🌐 Hospedagem</button><a href="#/dashboard" class="ml-auto glass px-3 py-1 rounded-lg font-bold">Dashboard</a><a href="#/editor/${proj.id}" class="grad-btn px-3 py-1 rounded-lg font-bold">Editar site</a></div>
   <div class="pt-10">${renderSiteInner({...proj,published:true})}</div>`;
  }catch(e){ console.error('vSite',e); return `${nav('')}<div class="text-center py-24">⚠️ Erro ao abrir o site. <a href="#/dashboard" class="text-cyan-300">Voltar</a></div>${footer()}`; }
}
// backup: exportar/importar JSON do projeto (trocar de navegador)
window.__exportJSON=(id)=>{ const p=getProjects().find(x=>x.id===id); const blob=new Blob([JSON.stringify(p)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=p.slug+'.sitegenius.json'; a.click(); toast('Backup baixado 💾'); };
window.__importJSON=()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=()=>{ const f=i.files[0]; const r=new FileReader(); r.onload=()=>{ try{ const p=JSON.parse(r.result); p.id=Math.random().toString(36).slice(2,9); p.published=false; saveProject(p); toast('Site importado!'); location.hash='#/dashboard'; route(); }catch(e){ toast('Arquivo inválido','err'); } }; r.readAsText(f); }; i.click(); };

// ---------- router ----------
function route(){
  const h=location.hash||'#/';
  const [pathQ]=[h.slice(2)]; const [path,qs]=pathQ.split('?'); const q=new URLSearchParams(qs||'');
  window.scrollTo(0,0);
  if(path===''||path==='/'){ app.innerHTML=vLanding(); }
  else if(path==='gerar'||path.startsWith('gerar')){ app.innerHTML=vGerar(q.get('prompt')||''); bindGerar(); }
  else if(path==='templates'){ app.innerHTML=vTemplates(); paintTplGrid(); document.querySelectorAll('.nbtn').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.nbtn').forEach(x=>x.className='nbtn text-sm px-4 py-2 rounded-full font-bold glass'); b.className='nbtn text-sm px-4 py-2 rounded-full font-bold grad-btn'; paintTplGrid(b.dataset.n); }); }
  else if(path==='dashboard'){ app.innerHTML=vDashboard(); }
  else if(path.startsWith('editor/')){ const id=path.split('/')[1]; app.innerHTML=vEditor(id); }
  else if(path.startsWith('site/')){ app.innerHTML=vSite(path.split('/')[1]); }
  else if(path==='planos'){ app.innerHTML=vPlanos(); }
  else if(path==='checkout'){ app.innerHTML=vCheckout(); const c=document.getElementById('tabCard'),p=document.getElementById('tabPix'); if(c) c.onclick=()=>{document.getElementById('paneCard').classList.remove('hidden');document.getElementById('panePix').classList.add('hidden');c.className='flex-1 py-2.5 rounded-xl text-sm font-bold grad-btn';p.className='flex-1 py-2.5 rounded-xl text-sm font-bold glass'}; if(p) p.onclick=()=>{document.getElementById('panePix').classList.remove('hidden');document.getElementById('paneCard').classList.add('hidden');p.className='flex-1 py-2.5 rounded-xl text-sm font-bold grad-btn';c.className='flex-1 py-2.5 rounded-xl text-sm font-bold glass'}; }
  else if(path==='admin'){ app.innerHTML=vAdmin(); }
  else if(path==='config'){ app.innerHTML=vConfig(); }
  else { app.innerHTML=vLanding(); }
  observeReveals();
}
function bindGerar(){
  document.querySelectorAll('.exbtn').forEach(b=>b.onclick=()=>{ document.getElementById('genPrompt').value=b.dataset.ex; });
  const sel=document.getElementById('genTpl');
  document.getElementById('genBtn').onclick=()=>runGeneration(document.getElementById('genPrompt').value.trim()||'Site moderno para meu negócio', sel.value);
}
window.addEventListener('hashchange',route);
if (!window.__SG_GATEWAY) route(); // gateway de subdomínio assume a página (ver index.html)
