/* SiteFinder AI — SPA mobile-first. Regra: nunca inventar contatos. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const store = {
  get:(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}},
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};

const CATS=[
 {n:'Barbearias',i:'💈',kw:['barbear','barber']},
 {n:'Restaurantes',i:'🍽️',kw:['restaurante','restaurant']},
 {n:'Pizzarias',i:'🍕',kw:['pizza']},
 {n:'Academias',i:'🏋️',kw:['academia','gym','fitness']},
 {n:'Lojas',i:'🛍️',kw:['loja','shop','store']},
 {n:'Salões de beleza',i:'💇',kw:['salao','salão','beauty','cabelo']},
 {n:'Oficinas',i:'🔧',kw:['oficina','mecanica','auto']} ,
 {n:'Clínicas',i:'🏥',kw:['clinica','clínica','clinic']},
 {n:'Dentistas',i:'🦷',kw:['dente','odonto','dent']} ,
 {n:'Hotéis',i:'🏨',kw:['hotel','pousada']},
 {n:'Padarias',i:'🥖',kw:['padaria','bakery','pão']} ,
 {n:'Imobiliárias',i:'🏠',kw:['imob','imovel','real estate']},
];
const STATUS=['Novo','Contatado','Negociação','Cliente','Recusou'];
const THEMES={
 barbearia:{label:'Barbearia — masculino e moderno',color:'#f59e0b',bg:'#101014',font:'Sora',logo:'💈',cover:'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=60',tag:'Corte, barba e estilo de verdade.'},
 restaurante:{label:'Restaurante — gastronômico',color:'#ef4444',bg:'#160b0b',font:'Georgia',logo:'🍽️',cover:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=60',tag:'Comida boa, ambiente melhor ainda.'},
 pizzaria:{label:'Pizzaria — gastronômica',color:'#f97316',bg:'#170d06',font:'Georgia',logo:'🍕',cover:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=60',tag:'Pizza artesanal, forno a lenha.'},
 academia:{label:'Academia — esportiva',color:'#22c55e',bg:'#07120c',font:'Impact',logo:'🏋️',cover:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=60',tag:'Seu melhor shape começa aqui.'},
 loja:{label:'Loja — catálogo visual',color:'#8b5cf6',bg:'#0e0a1c',font:'Inter',logo:'🛍️',cover:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=60',tag:'Novidades toda semana.'},
 salao:{label:'Salão — beleza',color:'#ec4899',bg:'#170a14',font:'Georgia',logo:'💇',cover:'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=60',tag:'Realce a sua beleza.'},
 hotel:{label:'Hotel — elegante',color:'#c9a227',bg:'#0c0f1c',font:'Georgia',logo:'🏨',cover:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=60',tag:'Conforto e hospitalidade.'},
 default:{label:'Profissional — moderno',color:'#06b6d4',bg:'#080f1c',font:'Inter',logo:'✨',cover:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=60',tag:'Atendimento profissional perto de você.'},
 oficina:{label:'Oficina — técnica',color:'#f59e0b',bg:'#12100a',font:'Sora',logo:'🔧',cover:'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=60',tag:'Manutenção com garantia.'},
 clinica:{label:'Clínica — saúde',color:'#14b8a6',bg:'#071412',font:'Inter',logo:'🏥',cover:'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=60',tag:'Cuidado e confiança.'},
 padaria:{label:'Padaria — artesanal',color:'#d97706',bg:'#150e05',font:'Georgia',logo:'🥖',cover:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=60',tag:'Pão quentinho todo dia.'},
 imobiliaria:{label:'Imobiliária — premium',color:'#3b82f6',bg:'#080d1c',font:'Sora',logo:'🏠',cover:'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=60',tag:'Seu próximo lar está aqui.'},
};
const COVERS=[
 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=60',
 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=60',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=60',
 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=60',
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=60',
 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=60',
];
const SVC_HINTS={
 barbearia:['Corte masculino','Barba completa','Corte + barba','Acabamento / pezinho'],
 restaurante:['Prato do dia','À la carte','Delivery / marmita','Sobremesas'],
 pizzaria:['Pizza tradicional','Pizza especial','Borda recheada','Delivery'],
 academia:['Musculação','Funcional','Avaliação física','Planos mensal / anual'],
 loja:['Novidades','Mais vendidos','Promoções','Encomendas'],
 salao:['Corte feminino','Escova / hidratação','Coloração','Manicure e pedicure'],
 oficina:['Revisão','Troca de óleo','Freios','Elétrica'],
 clinica:['Consulta','Avaliação','Exames','Retorno'],
 default:['Atendimento','Orçamento gratuito','Delivery / entrega','Agendamento']
};
const DEFAULT_MSG='Olá! Tudo bem? Vi a {EMPRESA} e trabalho criando sites profissionais para empresas locais. Preparei uma demonstração de como poderia ficar o site da empresa. Posso te mostrar? 🤝';

let state={cat:'Barbearias',results:[],biz:null,site:null,leadFilter:'Todas'};

function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.add('hidden'),2400)}
function cfg(){return store.get('sf_cfg',{google:'',serper:'',osm:'on',msg:DEFAULT_MSG})}
function hasRealKey(){const c=cfg();return !!(c.google||c.serper)}
function updateBadge(){const c=cfg();const b=$('#dataBadge');
 if(hasRealKey()){b.textContent='API OK';b.className='badge live'}
 else if(c.osm==='on'){b.textContent='OSM GRÁTIS';b.className='badge live'}
 else{b.textContent='SEM FONTE';b.className='badge demo'}
 $('#srcNote').innerHTML=hasRealKey()?'Google Places ativo — buscando <b>dados públicos reais</b> com telefone e avaliação.'
  :(c.osm==='on'?'Fonte gratuita ativa (OpenStreetMap) — <b>somente dados públicos reais</b>. Para telefones e avaliações, adicione a chave do Google em ⚙️.'
  :'Nenhuma fonte ativa. Ative o OpenStreetMap ou adicione uma API em ⚙️. <b>Nenhum dado fictício é exibido.</b>')}

/* ---------- NAV ---------- */
function nav(v){$$('.view').forEach(x=>x.classList.remove('active'));$('#view-'+v).classList.add('active');
 $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.nav===v));window.scrollTo({top:0,behavior:'smooth'});
 if(v==='leads')renderLeads();if(v==='sites')renderSites()}
document.addEventListener('click',e=>{const n=e.target.closest('[data-nav]');if(n)nav(n.dataset.nav);
 const bt=e.target.closest('[data-btab]');if(bt){$$('.btab').forEach(b=>b.classList.remove('active'));bt.classList.add('active');
 $$('.btab-pane').forEach(p=>p.classList.remove('active'));$('#btab-'+bt.dataset.btab).classList.add('active')}});

/* ---------- SEARCH UI ---------- */
function buildCats(){$('#catGrid').innerHTML=CATS.map(c=>'<button class="cat'+(c.n===state.cat?' sel':'')+'" data-cat="'+c.n+'"><span>'+c.i+'</span>'+c.n+'</button>').join('');
 const q=[...CATS.slice(0,8),{n:'Dentistas',i:'🦷'},{n:'Hotéis',i:'🏨'}];
 $('#quickRow').innerHTML=q.map(c=>'<button class="quick" data-cat="'+c.n+'">'+c.i+' '+c.n+'</button>').join('')}
document.addEventListener('click',e=>{const c=e.target.closest('[data-cat]');if(c){state.cat=c.dataset.cat;$('#qWhat').value=c.dataset.cat;buildCats()}});

function themeKeyFor(cat){const s=(cat||'').toLowerCase();
 if(/barbear|barber/.test(s))return'barbearia';if(/pizza/.test(s))return'pizzaria';
 if(/restaurante|restaurant/.test(s))return'restaurante';if(/academia|gym|fitness/.test(s))return'academia';
 if(/loja|shop|store/.test(s))return'loja';if(/salao|salão|beauty|cabelo/.test(s))return'salao';
 if(/hotel|pousada/.test(s))return'hotel';if(/oficina|mecan/.test(s))return'oficina';
 if(/odonto|dent/.test(s))return'clinica';if(/clinica|clínica/.test(s))return'clinica';
 if(/padaria|bakery/.test(s))return'padaria';if(/imob/.test(s))return'imobiliaria';return'default'}

/* ---------- DATA: 100% real. Nenhum dado fictício. ---------- */

/* ---------- DATA: real (OSM Overpass + Nominatim, Google opcional) ---------- */
async function geocodeCity(city){
 const r=await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q='+encodeURIComponent(city),{headers:{Accept:'application/json'}});
 const j=await r.json();if(!j[0])throw new Error('Cidade não encontrada');return{lat:+j[0].lat,lon:+j[0].lon}}
function osmFilterFor(cat){const s=(cat||'').toLowerCase();
 if(/barbear|barber|cabelo|salao|salão|beauty/.test(s))return'["shop"~"hairdresser|beauty"]';
 if(/pizza/.test(s))return'["amenity"="restaurant"]["cuisine"~"pizza"]';
 if(/restaurante|restaurant/.test(s))return'["amenity"="restaurant"]';
 if(/academia|gym|fitness/.test(s))return'["leisure"="fitness_centre"]';
 if(/hotel|pousada/.test(s))return'["tourism"~"hotel|guest_house|hostel"]';
 if(/padaria|bakery|pão/.test(s))return'["shop"="bakery"]';
 if(/oficina|mecan/.test(s))return'["shop"~"car_repair|car"]';
 if(/odonto|dent/.test(s))return'["amenity"~"dentist"]';
 if(/clinica|clínica|clinic/.test(s))return'["amenity"~"clinic|doctors|dentist"]';
 if(/imob/.test(s))return'["office"="estate_agent"]';
 if(/loja|shop|store/.test(s))return'["shop"]';
 return'["shop"~"hairdresser|beauty|bakery|car_repair"]'}
async function overpassQuery(filter,lat,lon){
 const q='[out:json][timeout:25];(nwr'+filter+'(around:8000,'+lat+','+lon+'););out center 30;';
 const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)});
 if(!r.ok)throw new Error('Overpass instável ('+r.status+')');
 return r.json()}
function mapOsmEl(e,what,city){const t=e.tags||{};const digits=(t['contact:phone']||t.phone||t['contact:mobile']||'').replace(/\D/g,'');
 return{id:'osm-'+(e.type||'n')+'-'+e.id,name:t.name,category:what,city,
  address:[t['addr:street']&&(t['addr:street']+(t['addr:housenumber']?' , '+t['addr:housenumber']:'')),t['addr:suburb'],city].filter(Boolean).join(' — ')||'',
  phone:digits?formatPhone(digits):'',whatsapp:normalizeWhatsBR(t['contact:mobile']||t['contact:phone']||t.phone||''),
  instagram:'',rating:'',hours:t.opening_hours||'',website:t.website||t['contact:website']||'',
  demo:false,source:'osm'}}
async function searchOSM(what,city){
 const g=await geocodeCity(city);
 let j=await overpassQuery(osmFilterFor(what),g.lat,g.lon);
 let els=(j.elements||[]).filter(e=>e.tags&&e.tags.name);
 if(!els.length){ // fallback genérico: qualquer comércio nomeado na área
  j=await overpassQuery('["shop"]',g.lat,g.lon);
  els=(j.elements||[]).filter(e=>e.tags&&e.tags.name)}
 return els.slice(0,20).map(e=>mapOsmEl(e,what,city))}
function formatPhone(d){d=d.replace(/^55/,'');if(d.length===11)return'('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);if(d.length===10)return'('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);return d}
/* Normaliza para WhatsApp (wa.me): só aceita celular BR válido → '55'+DDD+9+8 dígitos.
   Retorna '' se inválido (fixo, incompleto, estrangeiro). Nunca duplica o 55. */
function normalizeWhatsBR(raw){
 let d=String(raw||'').replace(/\D/g,'').replace(/^0+/,'');
 if(d.length>11&&d.startsWith('55'))d=d.slice(2);
 if(d.length===11&&/^[1-9][1-9]9\d{8}$/.test(d))return'55'+d;
 return ''}
async function searchGoogle(what,city){
 const key=cfg().google;if(!key)throw new Error('no-key');
 const r=await fetch('https://places.googleapis.com/v1/places:searchText',{method:'POST',
  headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.rating,places.regularOpeningHours,places.websiteUri'},
  body:JSON.stringify({textQuery:(what+' em '+city),languageCode:'pt-BR',maxResultCount:15})});
 if(!r.ok)throw new Error('Google: '+r.status);
 const j=await r.json();return(j.places||[]).map((p,i)=>{
  return{id:'g-'+i,name:p.displayName?.text||'Empresa '+(i+1),category:what,city,address:p.formattedAddress||'',
   phone:p.internationalPhoneNumber||'',whatsapp:normalizeWhatsBR(p.internationalPhoneNumber||''),instagram:'',rating:p.rating?String(p.rating):'',
   hours:p.regularOpeningHours?.weekdayDescriptions?.slice(0,2).join(' • ')||'',website:p.websiteUri||'',demo:false,source:'google'}})}

async function doSearch(){
 const what=$('#qWhat').value.trim()||state.cat;const city=$('#qCity').value.trim();
 if(!city){toast('Digite a cidade 📍');return}
 state.cat=what;const btn=$('#btnSearch');btn.disabled=true;btn.textContent='⏳ BUSCANDO...';
 try{
  let res=[];let err='';
  if(cfg().google){try{res=await searchGoogle(what,city)}catch(e){console.warn(e);err='Google: '+(e.message||'falhou')}}
  if(!res.length&&cfg().osm==='on'){try{res=await searchOSM(what,city)}catch(e){console.warn(e);err=e.message||'Busca falhou'}}
  if(!res.length&&cfg().osm!=='on'&&!cfg().google){err='Nenhuma fonte ativa — ative o OpenStreetMap ou cadastre a chave do Google em ⚙️.'}
  state.results=res;state.lastError=err;renderResults(what,city);nav('results');
  if(!res.length)toast(err||'Nenhuma empresa encontrada para essa busca 😕');
 }finally{btn.disabled=false;btn.textContent='🔍 ENCONTRAR EMPRESAS';updateBadge()}}

/* ---------- RESULTS ---------- */
function waLink(biz,msg){const n=normalizeWhatsBR(biz.whatsapp||'');if(!n)return'';return'https://wa.me/'+n+'?text='+encodeURIComponent(msg||('Olá! Vim pelo site da '+(biz.name||'empresa')+' 👋'))}
function renderResults(what,city){
 $('#resTitle').textContent=(what||'Empresas')+' em '+city;
 $('#resCount').textContent=state.results.length+' empresas';
 const src=state.results.length?(state.results[0].source==='google'?'Google Places':'OpenStreetMap'):'';
 $('#demoAlert').classList.add('hidden');
 const ra=$('#realAlert');ra.classList.remove('hidden');
 ra.innerHTML=state.results.length?('✅ Dados públicos reais via <b>'+src+'</b>. Campos ausentes foram omitidos — nada foi inventado.')
  :('⚠️ '+(esc(state.lastError||'Nenhuma empresa encontrada.')+' Tente outra categoria/cidade ou ative a chave do Google em ⚙️ para resultados mais completos.'));
 $('#resSub').textContent=state.results.length?('Somente informações públicas ('+src+').'):'';
 $('#emptyRes').classList.toggle('hidden',state.results.length>0);
 $('#cards').innerHTML=state.results.map((b,i)=>{
  const rows=[
   b.address?'📍 '+esc(b.address):'',
   b.phone?'📞 '+esc(b.phone):'',
   b.whatsapp?'💬 WhatsApp disponível':'',
   b.instagram?'📸 '+esc(b.instagram):'',
   b.rating?'⭐ '+esc(b.rating)+' avaliação':'',
   b.hours?'🕐 '+esc(b.hours):'',
  ].filter(Boolean).map(r=>'<div>'+r+'</div>').join('');
  return'<article class="biz glass"><h3>'+esc(b.name)+'</h3><div class="cat-line">'+esc(b.category||'')+' • '+esc(b.city||'')+' • <b style="color:#86efac">PÚBLICO</b></div>'
  +'<div class="meta">'+(rows||'<div class="muted">Sem dados públicos de contato.</div>')+'</div>'
  +'<div class="biz-btns"><button class="go" data-act="site" data-i="'+i+'">🌐 GERAR SITE</button><button data-act="contact" data-i="'+i+'">📇 VER CONTATO</button>'
  +'<button data-act="lead" data-i="'+i+'">💾 SALVAR LEAD</button>'
  +(b.whatsapp?'<button class="wa" data-act="wa" data-i="'+i+'">📲 WHATSAPP</button>':'<button data-act="talk" data-i="'+i+'">💬 FALAR</button>')
  +'</div></article>'}).join('')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;
 const biz=state.results[+b.dataset.i];if(!biz)return;const act=b.dataset.act;
 if(act==='site')openBuilder(biz);
 if(act==='contact')showContact(biz);
 if(act==='lead')saveLead(biz);
 if(act==='wa')window.open(waLink(biz),'_blank');
 if(act==='talk')openTalk(biz)});

function showContact(b){
 const rows=[['🏢',b.name],['📍',b.address],['📞',b.phone],['💬',b.whatsapp?'WhatsApp: +'+b.whatsapp:''],['📸',b.instagram],['⭐',b.rating?b.rating+' / 5':''],['🕐',b.hours],['🌐',b.website||'']]
  .filter(r=>r[1]).map(r=>'<div class="meta"><div><b>'+r[0]+'</b> '+esc(r[1])+'</div></div>').join('')||'<p class="muted">Nenhum contato público encontrado para esta empresa.</p>';
 $('#contactBody').innerHTML=rows+'<p class="micro muted">Fonte: dados públicos. Nada foi inventado.</p>'
  +(b.whatsapp?'<button class="btn-whats" id="cWa">📲 ABRIR WHATSAPP</button>':'');
 $('#modalContact').classList.remove('hidden');
 const w=$('#cWa');if(w)w.onclick=()=>window.open(waLink(b),'_blank')}
$('#btnCloseContact').onclick=()=>$('#modalContact').classList.add('hidden');

/* ---------- LEADS ---------- */
function leads(){return store.get('sf_leads',[])}
function saveLead(b,silent){
 const ls=leads();if(ls.some(l=>l.name===b.name&&l.city===b.city)){toast('Lead já salvo 💼');return}
 ls.unshift({id:Date.now(),name:b.name,category:b.category,city:b.city,address:b.address||'',phone:b.phone||'',whatsapp:b.whatsapp||'',instagram:b.instagram||'',rating:b.rating||'',hours:b.hours||'',status:'Novo',created:new Date().toLocaleDateString('pt-BR')});
 store.set('sf_leads',ls);if(!silent)toast('Lead salvo! 💼');renderLeads()}
function renderLeads(){
 const q=($('#leadSearch').value||'').toLowerCase();
 $('#statusFilters').innerHTML=['Todas',...STATUS].map(s=>'<button class="chip'+(state.leadFilter===s?' sel':'')+'" data-f="'+s+'">'+s+'</button>').join('');
 const ls=leads().filter(l=>(state.leadFilter==='Todas'||l.status===state.leadFilter)&&(!q||(l.name+l.city+l.category).toLowerCase().includes(q)));
 $('#leadsList').innerHTML=ls.length?ls.map(l=>'<article class="biz glass"><h3>'+esc(l.name)+'</h3>'
  +'<div class="cat-line">'+esc(l.category||'')+' • '+esc(l.city||'')+' • '+esc(l.created||'')+'</div>'
  +'<span class="lead-status st-'+esc(l.status)+'">'+({Novo:'🟡 Novo',Contatado:'🔵 Contatado',Negociação:'🟠 Negociação',Cliente:'🟢 Cliente',Recusou:'🔴 Recusou'}[l.status])+'</span>'
  +'<div class="meta">'+[l.address&&'<div>📍 '+esc(l.address)+'</div>',l.phone&&'<div>📞 '+esc(l.phone)+'</div>',l.instagram&&'<div>📸 '+esc(l.instagram)+'</div>'].filter(Boolean).join('')+'</div>'
  +'<div class="lead-actions">'+STATUS.map(s=>'<button data-ls="'+l.id+'" data-s="'+s+'">'+s+'</button>').join('')
  +'<button data-site-lead="'+l.id+'" style="border-color:#7c3aed">🌐 Gerar site</button>'
  +(l.whatsapp?'<button data-wa-lead="'+l.id+'" style="border-color:#22c55e">📲 WhatsApp</button>':'')
  +'<button data-del-lead="'+l.id+'" style="border-color:#ef4444">🗑️</button></div></article>').join('')
  :'<div class="card glass" style="text-align:center">Nenhum lead aqui ainda.<br><span class="muted small">Busque empresas e toque em 💾 SALVAR LEAD.</span></div>'}
document.addEventListener('click',e=>{
 const f=e.target.closest('[data-f]');if(f){state.leadFilter=f.dataset.f;renderLeads()}
 const s=e.target.closest('[data-ls]');if(s){const ls=leads();const l=ls.find(x=>x.id==s.dataset.ls);if(l){l.status=s.dataset.s;store.set('sf_leads',ls);renderLeads();toast('Status: '+l.status)}}
 const d=e.target.closest('[data-del-lead]');if(d){store.set('sf_leads',leads().filter(x=>x.id!=d.dataset.delLead));renderLeads()}
 const w=e.target.closest('[data-wa-lead]');if(w){const l=leads().find(x=>x.id==w.dataset.waLead);if(l)openTalk(l)}
 const g=e.target.closest('[data-site-lead]');if(g){const l=leads().find(x=>x.id==g.dataset.siteLead);if(l)openBuilder(l)}});
$('#leadSearch')?.addEventListener('input',renderLeads);

/* ---------- BUILDER ---------- */
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openBuilder(biz){
 state.biz=biz;const tk=themeKeyFor(biz.category);const th=THEMES[tk]||THEMES.default;
 const hints=SVC_HINTS[tk]||SVC_HINTS.default;
 state.site={bizName:biz.name,tagline:th.tag,about:'Bem-vindo à '+biz.name+'! '+(biz.address?('Estamos em '+biz.address+'. '):'')+'Entre em contato e agende seu horário. 🏆',
  whatsapp:normalizeWhatsBR(biz.whatsapp||biz.phone||'').replace(/^55/,''),phone:biz.phone||'',addr:biz.address||'',hours:biz.hours||'Seg–Sáb • 9h às 19h',
  insta:biz.instagram||'',theme:tk,color:th.color,bg:th.bg,font:th.font,logo:th.logo,cover:th.cover,
  services:hints.map(h=>({n:h,p:''}))};
 $('#builderBiz').textContent=biz.name.slice(0,22);
 // fill editor
 $('#eTheme').innerHTML=Object.entries(THEMES).map(([k,t])=>'<option value="'+k+'"'+(k===tk?' selected':'')+'>'+t.label+'</option>').join('');
 $('#eName').value=state.site.bizName;$('#eTagline').value=state.site.tagline;$('#eAbout').value=state.site.about;
 $('#eWhats').value=state.site.whatsapp;$('#ePhone').value=state.site.phone;$('#eAddr').value=state.site.addr;
 $('#eHours').value=state.site.hours;$('#eInsta').value=state.site.insta;
 $('#eServices').value=state.site.services.map(s=>s.n+(s.p?' | '+s.p:'')).join('\n');
 $('#eColor').value=state.site.color;$('#eBg').value=state.site.bg;$('#eFont').value=state.site.font;
 $('#eLogo').value=state.site.logo;$('#eCover').value=state.site.cover;
 $('#coverPicks').innerHTML=COVERS.map(c=>'<img src="'+c+'" data-cover="'+c+'">').join('');
 renderPreview();nav('builder');toast('Site gerado! 🎨 Edite à vontade.')}
function syncFromEditor(){const s=state.site;if(!s)return;
 s.bizName=$('#eName').value;s.tagline=$('#eTagline').value;s.about=$('#eAbout').value;
 s.whatsapp=$('#eWhats').value.replace(/\D/g,'');s.phone=$('#ePhone').value;s.addr=$('#eAddr').value;
 s.hours=$('#eHours').value;s.insta=$('#eInsta').value;s.theme=$('#eTheme').value;
 s.color=$('#eColor').value;s.bg=$('#eBg').value;s.font=$('#eFont').value;s.logo=$('#eLogo').value||'✨';s.cover=$('#eCover').value;
 s.services=$('#eServices').value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const[n,p]=l.split('|');return{n:n.trim()||'✏️ Novo serviço',p:(p||'').trim()}});
 const wh=$('#waHint');if(wh){const typed=$('#eWhats').value.trim();const ok=typed?normalizeWhatsBR(typed):'';
  wh.textContent=!typed?'':(ok?'✅ WhatsApp válido: +'+ok:'⚠️ Número inválido ou fixo — o botão de WhatsApp ficará desativado. Use celular com DDD (ex: 13999990000).');
  wh.style.color=ok?'#86efac':'#fca5a5'}
 renderPreview()}
['eName','eTagline','eAbout','eWhats','ePhone','eAddr','eHours','eInsta','eServices','eTheme','eColor','eBg','eFont','eLogo','eCover'].forEach(id=>{
 document.addEventListener('input',e=>{if(e.target&&e.target.id===id)syncFromEditor()});
 document.addEventListener('change',e=>{if(e.target&&e.target.id===id)syncFromEditor()})});
document.addEventListener('click',e=>{const c=e.target.closest('[data-cover]');if(c){$('#eCover').value=c.dataset.cover;syncFromEditor();
 $$('#coverPicks img').forEach(i=>i.classList.remove('sel'));c.classList.add('sel')}});

function renderPreview(){
 const s=state.site;if(!s)return;$('#pvUrl').textContent=s.bizName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'')+'.sitefinder';
 const waN=normalizeWhatsBR(s.whatsapp||'');
 const waUrl=waN?'https://wa.me/'+waN+'?text='+encodeURIComponent('Olá! Vim pelo site da '+s.bizName+' 👋 Quero agendar!'):'';
 const svc=s.services.map(v=>'<div class="svc"><span>'+esc(v.n)+'</span><b>'+(v.p?esc(v.p):'a combinar')+'</b></div>').join('')||'<p class="muted">✏️ Adicione serviços na aba Editar.</p>';
 $('#sitePreview').innerHTML='<div class="gsite" style="background:'+s.bg+';font-family:'+s.font+',sans-serif;color:#fff">'
 +'<div class="g-hero" style="background:linear-gradient(180deg,'+s.color+'55,'+s.bg+')"><img class="bg" src="'+esc(s.cover)+'" onerror="this.remove()"><div class="inner">'
 +'<div class="g-logo">'+esc(s.logo)+'</div><h1>'+esc(s.bizName)+'</h1><p>'+esc(s.tagline)+'</p>'
 +(waUrl?'<a class="g-cta" style="background:'+s.color+';color:#000" href="'+waUrl+'" target="_blank">📲 Agendar no WhatsApp</a>':'<span class="micro" style="opacity:.7">✏️ Adicione o WhatsApp na aba Editar para ativar o botão</span>')
 +'</div></div>'
 +'<div class="gsec"><h2>Sobre nós</h2><p style="opacity:.85">'+esc(s.about)+'</p></div>'
 +'<div class="gsec"><h2>Serviços</h2>'+svc+'<p class="micro" style="opacity:.6">💡 Valores “a combinar” = confirmar com a empresa. Não inventamos preços.</p></div>'
 +'<div class="gsec"><h2>Galeria</h2><div class="ggrid"><img src="'+esc(s.cover)+'" onerror="this.remove()"><img src="'+COVERS[0]+'"><img src="'+COVERS[2]+'"><img src="'+COVERS[3]+'"></div></div>'
 +'<div class="gsec"><h2>⏰ Horários</h2><p>'+esc(s.hours||'✏️ A confirmar')+'</p><h2>📍 Onde estamos</h2><p>'+esc(s.addr||'✏️ Endereço a confirmar')+'</p>'
 +(s.phone?'<p>📞 '+esc(s.phone)+'</p>':'')+(s.insta?'<p>📸 '+esc(s.insta)+'</p>':'')+'</div>'
 +'<div class="gfoot">© '+new Date().getFullYear()+' '+esc(s.bizName)+' • Site criado com SiteFinder AI</div></div>'}

/* talk / export / save site */
function salesMsg(biz){return(cfg().msg||DEFAULT_MSG).replaceAll('{EMPRESA}',biz.name||'sua empresa')}
function openTalk(biz){state.biz=biz;$('#talkMsg').value=salesMsg(biz);$('#modalTalk').classList.remove('hidden')}
$('#btnTalk').onclick=()=>{if(!state.biz){toast('Gere um site primeiro 🌐');return}openTalk(state.biz)};
$('#btnCloseTalk').onclick=()=>$('#modalTalk').classList.add('hidden');
$('#btnSendWa').onclick=()=>{const b=state.biz||{};const n=normalizeWhatsBR(b.whatsapp||'');
 const msg=$('#talkMsg').value;
 if(!n){toast('⚠️ Número inválido ou fixo — mensagem copiada, ligue 📞');try{navigator.clipboard?.writeText(msg)}catch(_){}return}
 window.open('https://wa.me/'+n+'?text='+encodeURIComponent(msg),'_blank');
 const ls=leads();const l=ls.find(x=>x.name===b.name);if(l&&l.status==='Novo'){l.status='Contatado';store.set('sf_leads',ls)}
 $('#modalTalk').classList.add('hidden');toast('WhatsApp aberto ✅ Revise e envie!')};
$('#btnCopyLink').onclick=()=>{if(!state.biz)return;navigator.clipboard?.writeText(salesMsg(state.biz));toast('Mensagem copiada 📋')};
$('#btnSaveSite').onclick=()=>{if(!state.site)return;const ss=store.get('sf_sites',[]);
 ss.unshift({id:Date.now(),...JSON.parse(JSON.stringify(state.site)),saved:new Date().toLocaleDateString('pt-BR')});
 store.set('sf_sites',ss);saveLead(state.biz,true);toast('Site salvo! 🗂️ + lead criado')};
$('#btnExport').onclick=()=>{if(!state.site)return;const html='<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(state.site.bizName)+'</title></head><body>'+$('#sitePreview').innerHTML+'</body></html>';
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download=state.site.bizName.replace(/\W+/g,'-')+'.html';a.click()};
function renderSites(){const ss=store.get('sf_sites',[]);
 $('#sitesList').innerHTML=ss.length?ss.map(s=>'<article class="biz glass"><h3>'+esc(s.logo)+' '+esc(s.bizName)+'</h3><div class="cat-line">'+esc(s.saved||'')+'</div><div class="lead-actions"><button data-open-site="'+s.id+'">👁️ Abrir</button><button data-del-site="'+s.id+'" style="border-color:#ef4444">🗑️</button></div></article>').join('')
 :'<div class="card glass" style="text-align:center">Nenhum site salvo.<br><span class="muted small">Gere um site e toque em 💾 Salvar site.</span></div>'}
document.addEventListener('click',e=>{const o=e.target.closest('[data-open-site]');if(o){const s=store.get('sf_sites',[]).find(x=>x.id==o.dataset.openSite);
 if(s){state.site=JSON.parse(JSON.stringify(s));state.biz={name:s.bizName,category:'',city:'',whatsapp:normalizeWhatsBR(s.whatsapp||''),phone:s.phone};renderPreview();nav('builder')}}
 const d=e.target.closest('[data-del-site]');if(d){store.set('sf_sites',store.get('sf_sites',[]).filter(x=>x.id!=d.dataset.delSite));renderSites()}});

/* ---------- CONFIG ---------- */
function loadCfg(){const c=cfg();$('#kGoogle').value=c.google||'';$('#kSerper').value=c.serper||'';$('#kOsm').value=c.osm||'on';$('#kMsg').value=c.msg||DEFAULT_MSG}
$('#btnSaveKeys').onclick=()=>{store.set('sf_cfg',{...cfg(),google:$('#kGoogle').value.trim(),serper:$('#kSerper').value.trim(),osm:$('#kOsm').value});
 $('#cfgStatus').textContent='✅ Salvo! Faça uma busca para usar dados reais.';updateBadge();toast('Config salva ✅')};
$('#btnSaveMsg').onclick=()=>{store.set('sf_cfg',{...cfg(),msg:$('#kMsg').value});$('#cfgStatus').textContent='✅ Mensagem salva!';toast('Mensagem salva ✅')};
$('#btnTestApi').onclick=async()=>{store.set('sf_cfg',{...cfg(),google:$('#kGoogle').value.trim(),serper:$('#kSerper').value.trim(),osm:$('#kOsm').value});
 $('#qWhat').value=$('#qWhat').value||'Barbearias';await doSearch()};
$('#btnWipe').onclick=()=>{if(confirm('Apagar tudo?')){localStorage.removeItem('sf_leads');localStorage.removeItem('sf_sites');renderLeads();renderSites();toast('Limpo 🗑️')}};

/* ---------- INIT ---------- */
$('#btnSearch').onclick=doSearch;
$('#qWhat').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
$('#qCity').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});
buildCats();loadCfg();renderLeads();renderSites();updateBadge();
