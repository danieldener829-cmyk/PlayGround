// ===== STORE DEFAULT =====
const DEFAULT_MODULES = [
  {id:1, title:"Módulo 1 — Fundamentos + Nicho Lucrativo", desc:"Como o YouTube monetiza IA em 2026, 27 nichos validados e escolha do nome/canal em 1h.", lessons:[
    {t:"Boas-vindas + mapa do método", d:"12 min", free:true, v:"https://www.youtube.com/embed/dQw4w9WgXcQ"},
    {t:"27 nichos dark que mais pagam (CPM alto)", d:"22 min", free:false},
    {t:"Criando canal do zero otimizado p/ SEO", d:"18 min", free:false},
  ]},
  {id:2, title:"Módulo 2 — Roteiros Virais com ChatGPT", desc:"Prompts copia-e-cola para roteiros de 8min que prendem retenção.", lessons:[
    {t:"Meus 15 prompts de ouro", d:"25 min", free:true, v:"https://www.youtube.com/embed/dQw4w9WgXcQ"},
    {t:"Estrutura retenção 0-30s-8min", d:"19 min", free:false},
    {t:"100 roteiros prontos p/ adaptar", d:"15 min", free:false},
  ]},
  {id:3, title:"Módulo 3 — Voz IA Realista (ElevenLabs)", desc:"Clone sua voz ou use vozes prontas sem parecer robô.", lessons:[
    {t:"Configurando ElevenLabs grátis", d:"20 min", free:false},
    {t:"Entonação, pausas e emoção", d:"17 min", free:false},
  ]},
  {id:4, title:"Módulo 4 — Imagens e Vídeos IA", desc:"Midjourney, Leonardo, Runway, Pika e Sora: do prompt ao clipe.", lessons:[
    {t:"Imagens cinematográficas com 1 prompt", d:"24 min", free:true, v:"https://www.youtube.com/embed/dQw4w9WgXcQ"},
    {t:"Animando imagens (Runway + Pika)", d:"28 min", free:false},
    {t:"Vídeos longos automáticos", d:"21 min", free:false},
  ]},
  {id:5, title:"Módulo 5 — Edição Relâmpago no CapCut", desc:"Templates, legendas automáticas, efeitos e thumb que clica.", lessons:[
    {t:"Montagem em 15 min (template)", d:"26 min", free:false},
    {t:"Thumbs com CTR +12%", d:"18 min", free:false},
  ]},
  {id:6, title:"Módulo 6 — Postar, Viralizar e Monetizar", desc:"SEO, títulos, tags, shorts estratégicos e 4k horas rápido.", lessons:[
    {t:"SEO YouTube 2026 na prática", d:"23 min", free:false},
    {t:"Como bater 1k subs + 4k horas", d:"29 min", free:false},
    {t:"3 rendas extras com vídeo IA", d:"31 min", free:false},
  ]},
];
const DEFAULT_CONFIG = {price:47, oldPrice:497, discount:"90% OFF", whatsapp:"5511999999999", pix:"contato@iatubemaster.com", vagas:17};

function load(k, fb){ try{ const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; }catch{ return fb; } }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
if(!localStorage.getItem('iatube_modules')) save('iatube_modules', DEFAULT_MODULES);
if(!localStorage.getItem('iatube_config')) save('iatube_config', DEFAULT_CONFIG);
if(!localStorage.getItem('iatube_sales')) save('iatube_sales', []);
if(!localStorage.getItem('iatube_leads')) save('iatube_leads', []);

function applyConfig(){
  const c = load('iatube_config', DEFAULT_CONFIG);
  document.querySelectorAll('#price-old,#price-old2,#c-old').forEach(e=>e.textContent='R$ '+c.oldPrice);
  document.querySelectorAll('#price-now,#c-now').forEach(e=>e.textContent='R$ '+c.price);
  const big=document.getElementById('price-big'); if(big) big.textContent=c.price;
  const off=document.getElementById('badge-off'); if(off) off.textContent='-'+c.discount+' HOJE';
  const td=document.getElementById('topbar-discount'); if(td) td.textContent=c.discount+' OFF';
  const vg=document.getElementById('vagas'); if(vg) vg.textContent=c.vagas;
  const pk=document.getElementById('pix-key'); if(pk) pk.textContent=c.pix;
  const wf=document.getElementById('whats-float'); if(wf) wf.href='https://wa.me/'+c.whatsapp+'?text=Quero%20aprender%20videos%20IA%20p%20YouTube!';
  const fw=document.getElementById('foot-whats'); if(fw) fw.href='https://wa.me/'+c.whatsapp;
}
function renderModules(){
  const mods = load('iatube_modules', DEFAULT_MODULES);
  const box = document.getElementById('modules-list'); if(!box) return;
  let total=0; box.innerHTML='';
  mods.forEach((m,i)=>{
    total+= (m.lessons||[]).length;
    const lessons=(m.lessons||[]).map(l=>`<div>▶ ${l.t} <small>• ${l.d||'--'}</small> ${l.free?'<span class="free-tag">GRÁTIS</span>':'<span class="lock-tag">🔒</span>'}</div>`).join('');
    box.innerHTML+=`<div class="module"><div class="n">${i+1}</div><div><h4>${m.title}</h4><small>${m.desc||''}</small><div class="lesson-list">${lessons}</div></div></div>`;
  });
  const tl=document.getElementById('total-lessons'); if(tl) tl.textContent=total;
}
function renderFree(){
  const mods = load('iatube_modules', DEFAULT_MODULES);
  const free=[]; mods.forEach(m=>(m.lessons||[]).forEach(l=>{ if(l.free) free.push({...l, mod:m.title}); }));
  const box=document.getElementById('free-lessons'); if(!box) return;
  box.innerHTML = free.slice(0,6).map(l=>`<div class="card"><div style="font-size:40px">🎬</div><h3>${l.t}</h3><p>${l.mod} • ${l.d||''}</p>${l.v?`<div style="margin:12px 0"><iframe width="100%" height="180" src="${l.v}" frameborder="0" allowfullscreen style="border-radius:10px"></iframe></div>`:`<button class="btn outline small" onclick="openCheckout()">🔓 Desbloquear</button>`}<br><span class="free-tag">AULA GRÁTIS</span></div>`).join('') || '<p class="muted">Nenhuma aula grátis marcada. Marque no Painel Admin.</p>';
}

// countdown
let sec = 14*60+59;
setInterval(()=>{
  sec = sec>0? sec-1 : 14*60+59;
  const m = String(Math.floor(sec/60)).padStart(2,'0'), s=String(sec%60).padStart(2,'0');
  const c=document.getElementById('countdown'); if(c) c.textContent=m+':'+s;
  const mt=document.getElementById('mini-timer'); if(mt) mt.textContent=m+':'+s;
},1000);
// counters
function animateCounts(){
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=+el.dataset.count; let cur=0; const step=Math.max(1,Math.floor(target/60));
    const iv=setInterval(()=>{cur+=step; if(cur>=target){cur=target;clearInterval(iv);} el.textContent=cur.toLocaleString('pt-BR');},30);
  });
}
// checkout
let payMethod='pix';
function setPay(m,btn){ payMethod=m; document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  document.getElementById('card-fields').style.display = m==='card'?'block':'none';
  document.getElementById('pix-box').style.display = m==='pix'?'block':'none';
}
function openCheckout(){ document.getElementById('checkout-modal').classList.add('open'); document.getElementById('checkout-form').style.display='grid'; document.getElementById('checkout-success').style.display='none'; }
function closeCheckout(){ document.getElementById('checkout-modal').classList.remove('open'); }
document.getElementById('checkout-modal')?.addEventListener('click',e=>{ if(e.target.id==='checkout-modal') closeCheckout(); });
document.getElementById('checkout-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('co-name').value, email=document.getElementById('co-email').value, whats=document.getElementById('co-whats').value;
  const cfg=load('iatube_config',DEFAULT_CONFIG);
  const sales=load('iatube_sales',[]); sales.unshift({id:Date.now(), name, email, whats, value:cfg.price, method:payMethod, status:'pago', date:new Date().toLocaleString('pt-BR')}); save('iatube_sales',sales);
  document.getElementById('checkout-form').style.display='none'; document.getElementById('checkout-success').style.display='block';
  document.getElementById('success-email').textContent=email;
});
// leads
document.getElementById('lead-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const n=document.getElementById('lead-name').value, em=document.getElementById('lead-email').value;
  const leads=load('iatube_leads',[]); leads.unshift({name:n,email:em,date:new Date().toLocaleString('pt-BR')}); save('iatube_leads',leads);
  document.getElementById('lead-msg').textContent='✅ Pronto '+n+'! Aula enviada para '+em+' (demonstração).';
  e.target.reset();
});
// mobile
document.getElementById('hamburger')?.addEventListener('click',()=>{ const m=document.getElementById('mobile-menu'); m.style.display=m.style.display==='flex'?'none':'flex'; });

applyConfig(); renderModules(); renderFree(); animateCounts();
