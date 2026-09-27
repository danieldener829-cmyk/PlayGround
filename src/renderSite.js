// Renderiza o site gerado (preview + publicado + export)
export function esc(s){ return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

export function siteCSS(proj){
  const c = Object.assign({bg:'#0a0a12',ink:'#ffffff',accent:'#7c3aed',accent2:'#06b6d4',btn:'#7c3aed'}, proj.theme||{});
  return `
  :root{ --bg:${c.bg}; --ink:${c.ink}; --ac:${c.accent}; --ac2:${c.accent2}; --btn:${c.btn}; --font:${proj.font||'Inter'},sans-serif; }
  *{ font-family:var(--font); }
  .g-wrap{ background:var(--bg); color:var(--ink); }
  .g-ac{ color:var(--ac); } .g-bg-ac{ background:var(--ac); } .g-btn{ background:var(--btn); color:#fff; }
  .g-gradient{ background:linear-gradient(135deg,var(--ac),var(--ac2)); }
  .g-card{ background:color-mix(in srgb, var(--ink) 6%, var(--bg)); border:1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
  .g-anim{ animation:fadeUp .8s both; }
  @keyframes fadeUp{ from{opacity:0; transform:translateY(24px)} to{opacity:1; transform:none} }
  .g-btn{ transition:.25s; } .g-btn:hover{ transform:translateY(-2px); filter:brightness(1.12); }
  .g-card{ transition:.3s; } .g-card:hover{ transform:translateY(-6px); }
  .wa-float{ position:fixed; bottom:22px; right:22px; z-index:50; width:60px; height:60px; border-radius:99px; background:#22c55e; display:flex; align-items:center; justify-content:center; font-size:30px; box-shadow:0 10px 30px rgba(0,0,0,.4); animation:float 3s ease-in-out infinite; }
  @keyframes float{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  `;
}

export function sectionHTML(s, proj){
  try{
  s = s||{type:'cta',title:'Seção'};
  const waNum = String(proj.wa||'5511999999999').replace(/\D/g,'')||'5511999999999';
  const wa = `https://wa.me/${waNum}?text=${encodeURIComponent('Olá! Vim pelo site '+(proj.business||'e quero atendimento.'))}`;
  if(s.type==='hero') return `
  <section class="px-6 md:px-16 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center max-w-7xl mx-auto g-anim">
    <div>
      <span class="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full g-gradient text-white mb-4">✦ Novo • Vagas abertas</span>
      <h1 class="text-4xl md:text-6xl font-extrabold leading-tight" data-edit="title">${esc(s.title)}</h1>
      <p class="text-2xl mt-3 font-bold g-ac" data-edit="subtitle">${esc(s.subtitle)}</p>
      <p class="mt-4 opacity-80 text-lg" data-edit="text">${esc(s.text)}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="${wa}" target="_blank" class="g-btn g-btn px-7 py-4 rounded-2xl font-bold" data-edit="cta">${esc(s.cta)} →</a>
        <a href="#servicos" class="px-7 py-4 rounded-2xl font-bold border border-current opacity-80">Ver serviços</a>
      </div>
      <div class="mt-6 flex gap-5 text-sm opacity-70"><span>★ 4.9 (2.3k avaliações)</span><span>⚡ Resposta em 5 min</span></div>
    </div>
    <div class="relative"><img src="${esc(s.image)}" class="rounded-3xl shadow-2xl w-full h-[420px] object-cover" data-edit-img="image" /><div class="absolute -bottom-5 -left-5 g-gradient text-white rounded-2xl px-5 py-4 shadow-xl"><div class="text-2xl font-extrabold">+2.500</div><div class="text-xs opacity-80">clientes felizes</div></div></div>
  </section>`;
  if(s.type==='logos') return `<section class="border-y border-white/10 py-6 text-center text-sm opacity-70"><div class="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto px-6">${(s.items||[]).map(t=>`<span>✓ ${esc(typeof t==='string'?t:t.t||'')}</span>`).join('')}</div></section>`;
  if(s.type==='sobre') return `
  <section class="px-6 md:px-16 py-16 max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
    <img src="${esc(s.image)}" class="rounded-3xl h-[380px] object-cover w-full shadow-xl" data-edit-img="image"/>
    <div><p class="g-ac font-bold tracking-widest text-sm uppercase" data-edit="title">${esc(s.title)}</p>
    <h2 class="text-3xl md:text-4xl font-extrabold mt-2" data-edit="subtitle">${esc(s.subtitle)}</h2>
    <p class="mt-4 opacity-80" data-edit="text">${esc(s.text)}</p>
    <div class="grid grid-cols-3 gap-4 mt-6">${(s.stats||[]).map(st=>`<div class="g-card rounded-2xl p-4 text-center"><div class="text-2xl font-extrabold g-ac">${esc(st[0])}</div><div class="text-xs opacity-70">${esc(st[1])}</div></div>`).join('')}</div></div>
  </section>`;
  if(s.type==='servicos') return `
  <section id="servicos" class="px-6 md:px-16 py-16 max-w-7xl mx-auto">
    <h2 class="text-3xl md:text-5xl font-extrabold text-center" data-edit="title">${esc(s.title)}</h2>
    <p class="text-center opacity-70 mt-2" data-edit="subtitle">${esc(s.subtitle)}</p>
    <div class="grid md:grid-cols-3 gap-6 mt-10">${(s.items||[]).map(it=>`
      <div class="g-card rounded-3xl p-8 g-anim"><h3 class="text-xl font-bold">${esc(it.t)}</h3><div class="text-3xl font-extrabold g-ac mt-2">${esc(it.p)}</div><p class="opacity-70 mt-2 text-sm">${esc(it.d)}</p><a href="${wa}" target="_blank" class="g-btn block text-center mt-6 py-3 rounded-xl font-bold">Quero esse →</a></div>`).join('')}</div>
  </section>`;
  if(s.type==='depoimentos') return `
  <section class="px-6 md:px-16 py-16 max-w-7xl mx-auto"><h2 class="text-3xl md:text-4xl font-extrabold text-center" data-edit="title">${esc(s.title)}</h2>
  <div class="grid md:grid-cols-3 gap-6 mt-10">${(s.items||[]).map(d=>`<div class="g-card rounded-3xl p-7"><div class="text-yellow-400">${'★'.repeat(d.s||5)}</div><p class="mt-3 italic">“${esc(d.t)}”</p><div class="mt-4 font-bold">— ${esc(d.n)}</div></div>`).join('')}</div></section>`;
  if(s.type==='precos') return `
  <section class="px-6 md:px-16 py-16 max-w-6xl mx-auto"><h2 class="text-3xl md:text-5xl font-extrabold text-center" data-edit="title">${esc(s.title)}</h2>
  <p class="text-center opacity-70 mt-2" data-edit="subtitle">${esc(s.subtitle)}</p>
  <div class="grid md:grid-cols-3 gap-6 mt-10">${(s.items||[]).map(it=>`
    <div class="rounded-3xl p-8 ${it.hl?'g-gradient text-white scale-105 shadow-2xl':'g-card'}"><h3 class="text-lg font-bold">${esc(it.t)}</h3><div class="text-4xl font-extrabold mt-2">${esc(it.p)}</div><p class="mt-2 text-sm opacity-80">${esc(it.d)}</p><a href="${wa}" target="_blank" class="block text-center mt-6 py-3 rounded-xl font-bold ${it.hl?'bg-white text-black':'g-btn'}">Assinar agora</a></div>`).join('')}</div>
  <p class="text-center text-sm opacity-60 mt-6">🔒 Pagamento seguro • 7 dias de garantia • Cancele quando quiser</p></section>`;
  if(s.type==='faq') return `
  <section class="px-6 md:px-16 py-16 max-w-3xl mx-auto"><h2 class="text-3xl font-extrabold text-center mb-8" data-edit="title">${esc(s.title)}</h2>
  <div class="space-y-3">${(s.items||[]).map(f=>`<details class="g-card rounded-2xl p-5"><summary class="font-bold cursor-pointer">${esc(f.q)}</summary><p class="mt-2 opacity-75 text-sm">${esc(f.a)}</p></details>`).join('')}</div></section>`;
  if(s.type==='contato') return `
  <section class="px-6 md:px-16 py-16"><div class="max-w-5xl mx-auto g-gradient rounded-[2rem] p-10 md:p-14 text-white grid md:grid-cols-2 gap-8 items-center">
    <div><h2 class="text-3xl md:text-4xl font-extrabold" data-edit="title">${esc(s.title)}</h2><p class="opacity-90 mt-2" data-edit="subtitle">${esc(s.subtitle)}</p><p class="opacity-80 text-sm mt-2" data-edit="text">${esc(s.text)}</p>
    <div class="mt-6 flex gap-3"><a href="${wa}" target="_blank" class="bg-white text-black px-6 py-3 rounded-xl font-bold" data-edit="cta">${esc(s.cta)}</a></div>
    <div class="mt-4 text-sm opacity-80">📍 Centro • Seg–Sáb 9h–20h • 📞 (11) 99999-9999</div></div>
    <img src="${esc(s.image)}" class="rounded-2xl h-64 w-full object-cover shadow-xl" data-edit-img="image"/>
  </div></section>`;
  if(s.type==='footer') return `<footer class="border-t border-white/10 py-10 text-center text-sm opacity-70"><div class="font-bold text-lg" data-edit="title">${esc(s.title)}</div><p data-edit="text">${esc(s.text)}</p><p class="mt-2">Feito com ⚡ Site Genius</p></footer>`;
  if(s.type==='cta') return `<section class="px-6 py-16 text-center"><div class="max-w-3xl mx-auto g-gradient rounded-3xl p-12 text-white"><h2 class="text-3xl font-extrabold" data-edit="title">${esc(s.title)}</h2><a href="${wa}" class="inline-block mt-6 bg-white text-black px-8 py-4 rounded-2xl font-bold" data-edit="cta">${esc(s.cta)}</a></div></section>`;
  return `<section class="px-6 py-10 text-center opacity-60 text-sm">Seção "${esc(s.type)}" sem conteúdo</section>`;
  }catch(e){ console.error('sectionHTML',e); return `<section class="px-6 py-10 text-center text-sm" style="background:#3f1d1d;color:#fecaca">⚠️ Erro ao renderizar seção ${(s&&s.type)||''}</section>`; }
}

export function renderSiteInner(proj, opts={}){
  try{
  proj = proj||{};
  proj.theme = Object.assign({bg:'#0a0a12',ink:'#ffffff',accent:'#7c3aed',accent2:'#06b6d4',btn:'#7c3aed'}, proj.theme||{});
  proj.sections = Array.isArray(proj.sections)&&proj.sections.length?proj.sections:[{id:'x',type:'hero',title:proj.business||'Meu site',subtitle:'Bem-vindo',text:'Site criado com Site Genius.',cta:'Chamar no WhatsApp',image:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop'}];
  const showWM = proj.published && getComputedPlan()==='free';
  const waNum = String(proj.wa||'5511999999999').replace(/\D/g,'')||'5511999999999';
  return `<style>${siteCSS(proj)}</style><div class="g-wrap min-h-screen">${proj.sections.map(s=>sectionHTML(s,proj)).join('')}
  <a class="wa-float" href="https://wa.me/${waNum}" target="_blank" title="WhatsApp">💬</a>
  ${showWM && !opts.noWM ? `<div class="watermark-bar text-center text-white text-xs font-bold py-2 sticky bottom-0 z-50">⚡ Feito com SITE GENIUS — <a href="#/planos" class="underline">remover marca d'água no Pro</a></div>`:''}
  </div>`;
  }catch(e){ console.error('renderSiteInner',e); return `<div style="padding:60px;text-align:center;font-family:sans-serif">⚠️ Erro ao carregar o site. <a href="#/dashboard">Voltar ao dashboard</a></div>`; }
}
function getComputedPlan(){ try{ return JSON.parse(localStorage.getItem('sg_plan_v1'))?.name||'free' }catch{ return 'free' } }

export function exportStandaloneHTML(proj){
  const inner = renderSiteInner(proj,{noWM: getComputedPlan()!=='free'});
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(proj.business)} — Site Genius</title><script src="https://cdn.tailwindcss.com"><\/script></head><body>${inner}</body></html>`;
}
