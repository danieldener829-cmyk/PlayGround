import { getProjects, saveProject, getPlan, toast } from './store.js';
import { renderSiteInner, exportStandaloneHTML, esc } from './renderSite.js';

const UNSPLASH_POOL = [
 'photo-1585747860715-2ba37e788b70','photo-1503951914875-452162b0f3f1','photo-1589829545856-d10d557cf95f','photo-1573496359142-b8d87734a5a2','photo-1629909613654-28e377c37b09','photo-1570172619644-dfd03ed5d881','photo-1414235077428-338989a2e8c0','photo-1579871494447-9811cf80d66c','photo-1441986300917-64674bd600d8','photo-1596462502278-27bfdc403348','photo-1571019613454-1cb2f99b2d8b','photo-1460925895917-afdab827c52f','photo-1534438327276-14e5300c3a48','photo-1560518883-ce09059eeffa','photo-1548199973-03cce0bbc87b','photo-1519741497674-611481863552','photo-1551288049-bebda4e38f71','photo-1493863641943-9b68992a8d07'
].map(id=>`https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`);

let proj=null, device='desktop', imgTarget=null;

export function vEditor(id){
  proj = getProjects().find(p=>p.id===id);
  if(!proj) return `<div class="p-20 text-center">Projeto não encontrado. <a href="#/dashboard" class="text-cyan-300">Voltar</a></div>`;
  device='desktop';
  setTimeout(mountEditor, 0);
  return `<div class="h-screen flex flex-col bg-[#05050a]">
   <div class="h-14 shrink-0 border-b border-white/10 bg-[#0a0a12]/95 backdrop-blur flex items-center gap-2 px-3 z-40">
    <a href="#/dashboard" class="glass px-3 py-1.5 rounded-lg text-sm">← Sites</a>
    <span class="font-bold text-sm truncate max-w-[180px]" id="edName">${esc(proj.business)}</span>
    <span class="text-[11px] px-2 py-0.5 rounded-full ${proj.published?'bg-emerald-500':'bg-white/10'}">${proj.published?'● Publicado':'○ Rascunho'}</span>
    <div class="mx-auto hidden md:flex glass rounded-xl p-1 text-sm">
      <button id="devD" class="px-4 py-1 rounded-lg font-bold bg-white/10">🖥 Desktop</button>
      <button id="devM" class="px-4 py-1 rounded-lg opacity-60">📱 Mobile</button>
    </div>
    <div class="ml-auto flex gap-2">
      <button onclick="window.__edPreview()" class="glass text-xs font-bold px-3 py-2 rounded-lg">👁 Prévia</button>
      <button onclick="window.__edExport()" class="glass text-xs font-bold px-3 py-2 rounded-lg">⬇ Exportar</button>
      <button onclick="window.__publish('${proj.id}')" class="grad-btn text-xs font-bold px-4 py-2 rounded-lg">🚀 Publicar</button>
    </div>
   </div>
   <div class="flex-1 flex min-h-0">
    <aside class="w-[260px] shrink-0 border-r border-white/10 bg-[#0a0a12] overflow-y-auto hidden md:block">
      <div class="flex text-xs font-bold border-b border-white/10">
        ${['Seções','Design','IA'].map((t,i)=>`<button data-etab="${i}" class="etab flex-1 py-3 ${i===0?'text-cyan-300 border-b-2 border-cyan-400':'text-white/50'}">${t}</button>`).join('')}
      </div>
      <div id="etab0" class="p-3 space-y-2">
        <p class="text-[11px] font-bold text-white/40 px-1">ADICIONAR SEÇÃO (clique)</p>
        <div id="addBtns" class="grid grid-cols-2 gap-2"></div>
        <p class="text-[11px] font-bold text-white/40 px-1 pt-3">DICA</p>
        <p class="text-xs text-white/50 px-1">Arraste as seções pela alça ⠿ para reordenar. Clique em qualquer texto para editar. Clique em imagem para trocar.</p>
      </div>
      <div id="etab1" class="p-4 space-y-4 hidden">
        <div><label class="text-xs font-bold text-white/60">NOME DO NEGÓCIO</label><input id="fBiz" value="${esc(proj.business)}" class="mt-1 w-full bg-black/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10"/></div>
        <div><label class="text-xs font-bold text-white/60">WHATSAPP (só números)</label><input id="fWa" value="${esc(proj.wa)}" class="mt-1 w-full bg-black/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10"/></div>
        <div><label class="text-xs font-bold text-white/60">FONTE</label><select id="fFont" class="mt-1 w-full bg-black/40 rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10"><option ${proj.font==='Sora'?'selected':''}>Sora</option><option ${proj.font==='Inter'?'selected':''}>Inter</option><option>Georgia</option><option>Verdana</option></select></div>
        ${[['bg','Fundo'],['ink','Texto'],['accent','Destaque'],['btn','Botões']].map(([k,l])=>`<div class="flex items-center gap-3"><input type="color" id="c_${k}" value="${proj.theme[k]}" class="w-10 h-10 rounded-lg bg-transparent cursor-pointer"/><div><div class="text-xs font-bold">${l}</div><div class="text-[11px] text-white/40">${proj.theme[k]}</div></div></div>`).join('')}
        <button onclick="window.__regen()" class="glass w-full text-xs font-bold py-2.5 rounded-xl">🤖 Melhorar copy com IA</button>
      </div>
      <div id="etab2" class="p-4 space-y-3 hidden">
        <p class="text-xs text-white/60">Peça ajustes em linguagem natural:</p>
        <textarea id="aiAsk" rows="3" placeholder='Ex: "deixe mais premium e mude o CTA para Agendar avaliação grátis"' class="w-full bg-black/40 rounded-xl p-3 text-sm outline-none border border-white/10"></textarea>
        <button onclick="window.__aiEdit()" class="grad-btn w-full text-sm font-bold py-2.5 rounded-xl">Aplicar com IA ✨</button>
        <div class="text-[11px] text-white/40">A IA reescreve títulos, CTAs e descrições mantendo seu layout.</div>
      </div>
    </aside>
    <main class="flex-1 min-w-0 bg-[#15151f] overflow-auto" id="edScroll">
      <div id="edCanvasWrap" class="mx-auto my-6 transition-all rounded-2xl overflow-hidden shadow-2xl" style="max-width:1100px">
        <div id="edCanvas" class="sg-canvas"></div>
      </div>
    </main>
   </div>
   <!-- modal imagem -->
   <div id="imgModal" class="hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur grid place-items-center p-4">
     <div class="glass rounded-3xl p-6 max-w-2xl w-full bg-[#0d0d16]">
       <div class="flex items-center gap-2"><b>Trocar imagem 🖼</b><button onclick="document.getElementById('imgModal').classList.add('hidden')" class="ml-auto glass px-3 py-1 rounded-lg text-sm">✕</button></div>
       <input id="imgSearch" placeholder="Buscar: barbearia, comida, sorriso..." class="mt-3 w-full bg-black/40 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10"/>
       <div id="imgGrid" class="grid grid-cols-3 gap-2 mt-3 max-h-[300px] overflow-auto"></div>
       <div class="flex gap-2 mt-3"><input id="imgUrl" placeholder="...ou cole URL da imagem" class="flex-1 bg-black/40 rounded-xl px-4 py-2.5 text-sm outline-none border border-white/10"/><button onclick="window.__imgUrl()" class="grad-btn px-4 rounded-xl text-sm font-bold">Usar URL</button></div>
     </div>
   </div>
   <!-- modal publish -->
   <div id="pubModal" class="hidden fixed inset-0 z-[100] bg-black/70 backdrop-blur grid place-items-center p-4"><div class="glass rounded-3xl p-8 max-w-md w-full bg-[#0d0d16] text-center" id="pubBody"></div></div>
  </div>`;
}

function mountEditor(){
  if(!proj) return;
  paintCanvas(); paintAddBtns();
  document.querySelectorAll('.etab').forEach(b=>b.onclick=()=>{ document.querySelectorAll('.etab').forEach(x=>{x.classList.remove('text-cyan-300','border-b-2','border-cyan-400');x.classList.add('text-white/50')}); b.classList.add('text-cyan-300','border-b-2','border-cyan-400'); [0,1,2].forEach(i=>document.getElementById('etab'+i).classList.toggle('hidden', +b.dataset.etab!==i)); });
  const dd=document.getElementById('devD'), dm=document.getElementById('devM');
  if(dd) dd.onclick=()=>{device='desktop';document.getElementById('edCanvasWrap').style.maxWidth='1100px';dd.classList.add('bg-white/10');dm.classList.remove('bg-white/10')};
  if(dm) dm.onclick=()=>{device='mobile';document.getElementById('edCanvasWrap').style.maxWidth='420px';dm.classList.add('bg-white/10');dd.classList.remove('bg-white/10')};
  bindDesignInputs(); paintImgGrid('');
  const s=document.getElementById('imgSearch'); if(s) s.oninput=e=>paintImgGrid(e.target.value);
}

function paintAddBtns(){
  const defs=[['hero','🦸 Hero'],['sobre','📖 Sobre'],['servicos','💈 Serviços'],['precos','💰 Preços'],['depoimentos','⭐ Depoimentos'],['faq','❓ FAQ'],['contato','📞 Contato'],['cta','⚡ CTA'],['footer','🦶 Footer']];
  const box=document.getElementById('addBtns'); if(!box) return;
  box.innerHTML=defs.map(([t,l])=>`<button data-add="${t}" class="glass rounded-xl py-2.5 text-xs font-bold hover:!border-violet-400">${l}</button>`).join('');
  box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addSection(b.dataset.add));
}

function paintCanvas(){
  const cv=document.getElementById('edCanvas'); if(!cv||!proj) return;
  cv.innerHTML = renderSiteInner({...proj, published:false});
  // toolbar + editable por seção
  const wrap = cv.firstElementChild?.nextElementSibling || cv.firstElementChild; // .g-wrap
  // mapeia na ordem: cada section filha
  const container = cv.querySelector('.g-wrap');
  // Como renderSiteInner gera sections sem wrapper id, vamos embrulhar: recriar com wrappers
  container.innerHTML = proj.sections.map((s,i)=>`<div class="sg-section" draggable="true" data-idx="${i}">
    <div class="sg-sec-toolbar absolute top-2 left-2 z-30 flex gap-1 bg-black/80 backdrop-blur rounded-lg p-1 text-xs">
      <span class="px-2 py-1 cursor-grab font-bold text-white/60" title="Arrastar">⠿ ${s.type}</span>
      <button data-act="up" class="px-2 py-1 hover:bg-white/10 rounded">↑</button>
      <button data-act="down" class="px-2 py-1 hover:bg-white/10 rounded">↓</button>
      <button data-act="dup" class="px-2 py-1 hover:bg-white/10 rounded">⧉</button>
      <button data-act="del" class="px-2 py-1 hover:bg-rose-500/40 rounded">✕</button>
    </div>${sectionInner(s)}</div>`).join('') + waFloat() + '<div class="text-center text-[11px] py-2 bg-black/60 text-white/50">— prévia no editor • publique para remover este aviso —</div>';
  bindCanvas();
  // esconde WA float real do render (vamos usar o nosso)
  function sectionInner(s){
    const tmp=document.createElement('div'); tmp.innerHTML=renderSiteInner({ ...proj, sections:[s], published:false });
    const w=tmp.querySelector('.g-wrap'); return w? w.innerHTML.replace(/<a class="wa-float"[\s\S]*?<\/a>/,'') : tmp.innerHTML;
  }
  function waFloat(){ return `<div class="text-center py-4 opacity-60 text-xs">💬 WhatsApp flutuante ativo (${esc(proj.wa)})</div>` }
}

function bindCanvas(){
  const cv=document.getElementById('edCanvas'); if(!cv) return;
  // contenteditable
  cv.querySelectorAll('[data-edit]').forEach(el=>{
    el.setAttribute('contenteditable','true'); el.setAttribute('spellcheck','false');
    el.onfocus=()=>{ const r=document.createRange(); };
    el.oninput=()=>{ debounceSave(el); };
    el.onkeydown=e=>{ if(e.key==='Enter' && !e.shiftKey && el.tagName.match(/H\d/)){ e.preventDefault(); el.blur(); } };
  });
  cv.querySelectorAll('[data-edit-img]').forEach(img=>{
    img.style.cursor='pointer'; img.parentElement?.classList.add('sg-img-hover');
    img.onclick=e=>{ e.preventDefault(); openImgModal(img); };
  });
  // toolbar
  cv.querySelectorAll('.sg-section').forEach(sec=>{
    const idx=+sec.dataset.idx;
    sec.querySelectorAll('[data-act]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); secAction(idx,b.dataset.act); });
    sec.addEventListener('dragstart',e=>{ sec.classList.add('dragging'); e.dataTransfer.setData('text/plain',String(idx)); });
    sec.addEventListener('dragend',()=>sec.classList.remove('dragging'));
    sec.addEventListener('dragover',e=>{ e.preventDefault(); sec.classList.add('drag-over'); });
    sec.addEventListener('dragleave',()=>sec.classList.remove('drag-over'));
    sec.addEventListener('drop',e=>{ e.preventDefault(); sec.classList.remove('drag-over'); const from=+e.dataTransfer.getData('text/plain'); moveSection(from, idx); });
  });
}
let debT=null;
function debounceSave(el){
  clearTimeout(debT);
  debT=setTimeout(()=>{
    // re-lê todos os data-edit na ordem das seções
    const secs=document.querySelectorAll('#edCanvas .sg-section');
    secs.forEach((secEl,i)=>{
      const map={};
      secEl.querySelectorAll('[data-edit]').forEach(n=>{ map[n.dataset.edit]=n.innerText.trim(); });
      const s=proj.sections[i]; if(!s) return;
      Object.assign(s, pickByType(s,map,secEl));
    });
    persist();
  },600);
}
function pickByType(s,map,secEl){
  const out={};
  if(map.title!==undefined) out.title=map.title;
  if(map.subtitle!==undefined) out.subtitle=map.subtitle;
  if(map.text!==undefined) out.text=map.text;
  if(map.cta!==undefined) out.cta=map.cta;
  return out;
}
function persist(){ proj.updatedAt=Date.now(); saveProject(proj); const n=document.getElementById('edName'); if(n) n.textContent=proj.business; }

function secAction(idx,act){
  const arr=proj.sections;
  if(act==='del'){ if(arr.length<=1) return toast('Mínimo 1 seção','err'); arr.splice(idx,1); }
  if(act==='up' && idx>0){ [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]] }
  if(act==='down' && idx<arr.length-1){ [arr[idx+1],arr[idx]]=[arr[idx],arr[idx+1]] }
  if(act==='dup'){ arr.splice(idx+1,0,JSON.parse(JSON.stringify({...arr[idx],id:Math.random().toString(36).slice(2,8)}))); }
  persist(); paintCanvas(); toast(act==='del'?'Seção excluída':'Layout atualizado');
}
function moveSection(from,to){ if(from===to||isNaN(from)) return; const [m]=proj.sections.splice(from,1); proj.sections.splice(to,0,m); persist(); paintCanvas(); }

function addSection(type){
  const id=()=>Math.random().toString(36).slice(2,8);
  const base={hero:{type:'hero',title:proj.business,subtitle:'Novo título irresistível',text:'Descreva aqui o benefício principal em 1 frase.',cta:'Chamar no WhatsApp',image:proj.heroImg,layout:'split'},sobre:{type:'sobre',title:'Sobre nós',subtitle:'Por que a gente?',text:'Conte sua história e gere confiança.',image:proj.heroImg,stats:[['+1k','clientes'],['5★','nota'],['24h','suporte']]},servicos:{type:'servicos',title:'Serviços',subtitle:'Escolha o ideal',items:[{t:'Serviço 1',p:'R$ 99',d:'Descrição curta'},{t:'Serviço 2',p:'R$ 149',d:'Descrição curta'},{t:'Serviço 3',p:'R$ 199',d:'Descrição curta'}]},precos:{type:'precos',title:'Preços',subtitle:'Sem pegadinha',items:[{t:'Básico',p:'R$ 49',d:'Ideal p/ começar',hl:false},{t:'Pro',p:'R$ 97',d:'O mais popular',hl:true},{t:'Premium',p:'R$ 197',d:'Completo',hl:false}]},depoimentos:{type:'depoimentos',title:'Depoimentos',items:[{n:'Cliente 1',t:'Excelente!',s:5},{n:'Cliente 2',t:'Recomendo!',s:5}]},faq:{type:'faq',title:'Dúvidas frequentes',items:[{q:'Como funciona?',a:'Explique aqui.'}]},contato:{type:'contato',title:'Fale com a gente',subtitle:'Resposta rápida',text:'Endereço e horários.',cta:'Chamar no WhatsApp',image:proj.heroImg},cta:{type:'cta',title:'Pronto pra começar?',cta:'Quero agora'},footer:{type:'footer',title:proj.business,text:'© '+new Date().getFullYear()+' Todos os direitos reservados.'}};
  proj.sections.push({id:id(),...base[type]});
  persist(); paintCanvas(); toast('Seção "'+type+'" adicionada');
  document.getElementById('edScroll').scrollTo({top:99999,behavior:'smooth'});
}

function bindDesignInputs(){
  const b=document.getElementById('fBiz'); if(b) b.oninput=()=>{ proj.business=b.value; persist(); };
  const w=document.getElementById('fWa'); if(w) w.oninput=()=>{ proj.wa=w.value.replace(/\D/g,''); persist(); };
  const f=document.getElementById('fFont'); if(f) f.onchange=()=>{ proj.font=f.value; persist(); paintCanvas(); };
  ['bg','ink','accent','btn'].forEach(k=>{ const c=document.getElementById('c_'+k); if(c) c.oninput=()=>{ proj.theme[k]=c.value; persist(); paintCanvas(); }; });
}

function openImgModal(imgEl){
  // descobre seção/idx
  const secEl=imgEl.closest('.sg-section'); const idx=secEl?+secEl.dataset.idx:0;
  imgTarget={imgEl,idx};
  document.getElementById('imgModal').classList.remove('hidden');
}
function paintImgGrid(q){
  const g=document.getElementById('imgGrid'); if(!g) return;
  const list=UNSPLASH_POOL.filter(u=>!q||u.toLowerCase().includes('photo'));
  g.innerHTML=list.map(u=>`<img src="${u}" data-u="${u}" class="h-24 w-full object-cover rounded-xl cursor-pointer hover:ring-2 ring-cyan-400"/>`.replace('w=1200','w=400')).join('');
  g.querySelectorAll('img').forEach(im=>im.onclick=()=>applyImage(im.dataset.u));
}
function applyImage(url){
  if(!url) return;
  const s=proj.sections[imgTarget?.idx ?? 0];
  if(s){ s.image=url; if(imgTarget?.imgEl) imgTarget.imgEl.src=url; persist(); paintCanvas(); }
  document.getElementById('imgModal').classList.add('hidden');
  toast('Imagem trocada 🖼');
}

// expõe ações globais usadas pelo router
export function editorActions(){
  window.__edPreview=()=>{ persist(); const p=proj; const html=renderSiteInner({...p,published:true}); const w=window.open('','_blank'); w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"><\/script><title>Prévia — ${esc(p.business)}</title></head><body>${html}</body></html>`); w.document.close(); };
  window.__edExport=()=>{
    const blob=new Blob([exportStandaloneHTML({...proj,published:true})],{type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=proj.slug+'.html'; a.click(); toast('HTML baixado — arraste em netlify.com/drop p/ link real ⬇');
  };
  window.__imgUrl=()=>{ const u=document.getElementById('imgUrl').value.trim(); if(u) applyImage(u); };
  window.__regen=()=>{ // melhora copy local
    proj.sections.forEach(s=>{ if(s.cta && !s.cta.includes('→')) s.cta=s.cta+' →'; });
    persist(); paintCanvas(); toast('Copy turbinada com IA ✨');
  };
  window.__aiEdit=()=>{
    const ask=(document.getElementById('aiAsk').value||'').toLowerCase();
    if(!ask) return toast('Descreva o ajuste','err');
    if(ask.includes('premium')||ask.includes('luxo')){ proj.theme.accent='#c9a227'; proj.font='Sora'; }
    if(ask.includes('cta')||ask.includes('agendar')||ask.includes('avalia')){ proj.sections.forEach(s=>{ if(s.cta) s.cta='Agendar avaliação grátis →'; }); }
    if(ask.includes('preço')||ask.includes('preco')||ask.includes('desconto')){ proj.sections.forEach(s=>{ if(s.type==='precos'||s.type==='servicos') s.items.forEach(it=>{ if(!it.p.includes('OFF')) it.d=(it.d||'')+' 🔥 Oferta hoje'; }); }); }
    if(ask.includes('título')||ask.includes('titulo')){ const h=proj.sections.find(s=>s.type==='hero'); if(h) h.subtitle='A transformação que você merece, sem enrolação.'; }
    persist(); paintCanvas(); toast('Ajuste aplicado com IA ✨');
  };
}
export { paintCanvas };
