/* TEIA — streaming clone */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const store={
  get(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
let myList=store.get('teia_list',[]);
let favs=store.get('teia_favs',[]);
let progress=store.get('teia_progress',{});
let curView='home', curGenre='Todos', curTvCat='Todos', curTvQ='', curQ='', liveIdx=0, liveHls=null, vodItem=null;

const byId=id=>CATALOG.find(m=>m.id===id);
const heroItem=byId('brand-new-day')||CATALOG[0];
const TOP10_IDS=["brand-new-day","dune-2","spider-verse","round-6","batman-tdk","top-gun-maverick","interestelar","john-wick-4","1917","f1"];
const ROWS=[
 {id:'saga',label:'A Saga do Aranha',eyebrow:'Universo Marvel',match:m=>!!m.saga},
 {id:'trending',label:'Em Alta Agora',eyebrow:'Todo mundo está vendo',match:m=>m.match>=92},
 {id:'acao',label:'Ação & Adrenalina',eyebrow:'Coração acelerado',match:m=>m.genres.includes('Ação')&&!m.saga},
 {id:'scifi',label:'Ficção & Outros Mundos',eyebrow:'Além da realidade',match:m=>m.genres.includes('Ficção Científica')||m.genres.includes('Fantasia')},
 {id:'series',label:'Séries para Maratonar',eyebrow:'Só mais um episódio',match:m=>m.kind==='serie'},
 {id:'suspense',label:'Suspense, Terror & Mistério',eyebrow:'Durma com a luz acesa',match:m=>m.genres.includes('Suspense')||m.genres.includes('Mistério')||m.genres.includes('Terror')},
 {id:'classicos',label:'Clássicos & Premiados',eyebrow:'Ouro do cinema',match:m=>m.year<=2008},
];

/* ---------- splash ---------- */
(()=>{let p=0;const f=$('#splashFill');const t=setInterval(()=>{p=Math.min(100,p+Math.random()*28);if(f)f.style.width=p+'%';if(p>=100){clearInterval(t);setTimeout(()=>$('#splash').classList.add('done'),350)}},260);setTimeout(()=>$('#splash').classList.add('done'),3800);})();

/* ---------- clock ---------- */
function tick(){try{$('#clock').textContent=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date())}catch{}}
setInterval(tick,1000);tick();
$('#year').textContent=new Date().getFullYear();

/* ---------- nav ---------- */
function go(view){curView=view;
  ['home','filmes','series','tv','lista'].forEach(v=>{$('#view-'+v).hidden=v!==view});
  $$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
  window.scrollTo({top:0});
  if(view==='lista')renderLista();
  if(view==='tv')renderTv();
  if(view==='filmes')renderFilmes();
  if(view==='series')renderSeries();
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b)go(b.dataset.nav)});
window.addEventListener('scroll',()=>$('#topbar').classList.toggle('scrolled',scrollY>30));

/* ---------- search ---------- */
$('#searchBtn').onclick=()=>{const b=$('#searchBar');b.hidden=!b.hidden;if(!b.hidden)$('#searchInput').focus()};
$('#searchClear').onclick=()=>{curQ='';$('#searchInput').value='';applySearch()};
$('#searchInput').addEventListener('input',e=>{curQ=e.target.value.toLowerCase().trim();applySearch()});
function applySearch(){
  const empty=!curQ;
  $('#searchEmpty').hidden=true;
  if(curView==='home'&&!empty){go('filmes')}
  if(curView==='filmes')renderFilmes();
  else if(curView==='series')renderSeries();
  else if(curView==='lista')renderLista();
}
function matchQ(m){if(!curQ)return true;const hay=[m.name,m.director,...m.cast,...m.genres,String(m.year)].join(' ').toLowerCase();return curQ.split(/\s+/).every(w=>hay.includes(w))}

/* ---------- cards ---------- */
function metaLine(m){return `<span class="match">${m.match}% relevante</span><span>${m.year}</span><span>${m.duration}</span><span class="rate">${m.rating}</span>`}
function cardHTML(m){
  const pct=progress[m.id]?Math.min(96,Math.round(progress[m.id]*100)):0;
  const inL=myList.includes(m.id);
  return `<div class="card" data-open="${m.id}" tabindex="0">
    <div class="card-img"><img loading="lazy" src="${m.image}" alt="${m.name}" onerror="this.style.opacity=0"/>
    ${m.badge?`<span class="card-badge">${m.badge}</span>`:''}
    <div class="card-play"><span>▶</span></div></div>
    <button class="card-list-btn ${inL?'in':''}" data-list="${m.id}" aria-label="Minha lista">${inL?'✓':'＋'}</button>
    <div class="card-info"><h4>${m.name}</h4><div class="card-sub"><span style="color:#4ade80;font-weight:800">${m.match}%</span><span>${m.year}</span><span class="rate">${m.rating}</span><span>${m.kind==='serie'?'Série':'Filme'}</span></div><div class="card-genre">${m.genres.slice(0,3).join(' · ')}</div></div>
    ${pct?`<div class="card-progress"><i style="width:${pct}%"></i></div>`:''}
  </div>`;
}
document.addEventListener('click',e=>{
  const lb=e.target.closest('[data-list]');
  if(lb){e.stopPropagation();toggleList(lb.dataset.list);return}
  const op=e.target.closest('[data-open]');
  if(op){openModal(op.dataset.open);return}
  const ch=e.target.closest('[data-chan]');
  if(ch){const c=CHANNELS[+ch.dataset.chan];if(c&&c.external){openExt(c);return}openLive(+ch.dataset.chan);return}
});
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,2200)}
function toggleList(id){const i=myList.indexOf(id);if(i>=0){myList.splice(i,1);toast('Removido da Minha Lista')}else{myList.push(id);toast('Adicionado à Minha Lista')}store.set('teia_list',myList);refreshListUI()}
function refreshListUI(){const c=$('#listCount');c.hidden=!myList.length;c.textContent=myList.length;$$('.card-list-btn').forEach(()=>{});rerenderDynamic()}
function rerenderDynamic(){renderHero();renderHomeRows();renderTop10();if(curView==='filmes')renderFilmes();if(curView==='series')renderSeries();if(curView==='lista')renderLista()}

/* ---------- hero ---------- */
function renderHero(){const m=heroItem;const inL=myList.includes(m.id);
  $('#hero').innerHTML=`<div class="hero-bg"><img src="${m.image}" alt="${m.name}" onerror="this.style.opacity=0"/></div>
  <div class="hero-shade-r"></div><div class="hero-shade-b"></div>
  <div class="hero-content"><div style="max-width:760px">
    <div class="hero-tags"><span class="pill-live">Teia Original</span><span class="pill-ghost">ESTREIA DISPONÍVEL AGORA</span><span class="pill-studio">MARVEL STUDIOS</span></div>
    <h1 class="hero-title"><span class="l1">HOMEM-ARANHA</span><span class="l2">UM NOVO DIA</span></h1>
    <div class="hero-meta"><span class="match">${m.match}% relevante</span><span>${m.year}</span><span>${m.duration}</span><span class="rate">${m.rating}</span>${m.quality.map(q=>`<span class="q">${q}</span>`).join('')}</div>
    <p class="hero-syn">${m.synopsis}</p>
    <div class="hero-actions"><button class="btn-white" data-play="${m.id}">▶ Assistir agora</button>
    <button class="btn-ghost" data-list="${m.id}">${inL?'✓ Na sua lista':'＋ Minha Lista'}</button>
    <button class="icon-btn" data-open="${m.id}" aria-label="Mais informações">ⓘ</button></div>
  </div></div>
  <div class="scroll-hint"><span>Role para explorar</span><i>↓</i></div>`;
}
document.addEventListener('click',e=>{const p=e.target.closest('[data-play]');if(p){playVod(p.dataset.play)}});
$('#techPlay').onclick=()=>playVod('brand-new-day');

/* ---------- marquee ---------- */
(()=>{const words=["Homem-Aranha: Um Novo Dia","Estreia Mundial","Canais abertos ao vivo","4K Dolby Vision","Só na TEIA","Filmes, séries e TV grátis"];
const html=[...words,...words].map(w=>`<span>${w}<span class="sep">✦</span></span>`).join('');
$('#mq1').innerHTML=html;$('#mq2').innerHTML=html;})();

/* ---------- home rows ---------- */
function renderHomeRows(){$('#homeRows').innerHTML=ROWS.map(r=>{const items=CATALOG.filter(r.match);if(!items.length)return '';
  return `<section class="row-sec"><div class="sec-head"><div><p class="eyebrow">${r.eyebrow}</p><h2>${r.label}</h2></div></div><div class="row-track">${items.map(cardHTML).join('')}</div></section>`}).join('')}
function renderTop10(){const items=TOP10_IDS.map(byId).filter(Boolean);
  $('#top10').innerHTML=items.map((m,i)=>`<div class="top10-item" data-open="${m.id}"><span class="top10-num">${i+1}</span>${cardHTML(m)}</div>`).join('')}
function renderTvPreview(){$('#tvPreview').innerHTML=CHANNELS.slice(0,12).map((c,i)=>`<div class="tv-chip" data-chan="${i}">${c.logo?`<img loading="lazy" src="${c.logo}" alt="${c.name}" onerror="this.style.opacity=0"/>`:`<span class="tv-letter">${c.name[0]}</span>`}<h4>${c.name}</h4><p><i></i>${c.external?'Site oficial':'Ao vivo'}</p></div>`).join('')}

/* ---------- filmes/series/lista ---------- */
const allGenres=()=>['Todos',...new Set(CATALOG.flatMap(m=>m.genres))];
function renderFilmes(){
  if(!$('#filmeChips').dataset.done){$('#filmeChips').dataset.done=1;
    $('#filmeChips').innerHTML=allGenres().map(g=>`<button class="chip ${g===curGenre?'active':''}" data-genre="${g}">${g}</button>`).join('')}
  $$('#filmeChips .chip').forEach(c=>c.classList.toggle('active',c.dataset.genre===curGenre));
  const items=CATALOG.filter(m=>m.kind==='filme').filter(m=>curGenre==='Todos'||m.genres.includes(curGenre)).filter(matchQ);
  $('#filmesCount').textContent=items.length+(items.length===1?' título encontrado':' títulos encontrados');
  $('#filmesGrid').innerHTML=items.map(cardHTML).join('');
  $('#searchEmpty').hidden=!(curQ&&!items.length)||curView!=='filmes';
}
document.addEventListener('click',e=>{const g=e.target.closest('[data-genre]');if(g){curGenre=g.dataset.genre;renderFilmes()}});
function renderSeries(){const items=CATALOG.filter(m=>m.kind==='serie').filter(matchQ);
  $('#seriesCount').textContent=items.length+' títulos';
  $('#seriesGrid').innerHTML=items.map(cardHTML).join('')}
function renderLista(){const items=CATALOG.filter(m=>myList.includes(m.id)).filter(matchQ);
  $('#listaCount').textContent=items.length?items.length+' títulos salvos':'';
  $('#listaGrid').innerHTML=items.map(cardHTML).join('');
  $('#listaEmpty').style.display=items.length?'none':'block'}

/* ---------- TV guide ---------- */
const tvCats=()=>['Todos','Favoritos',...new Set(CHANNELS.map(c=>c.category))];
function renderTv(){
  if(!$('#tvChips').dataset.done){$('#tvChips').dataset.done=1;
    $('#tvChips').innerHTML=tvCats().map(c=>`<button class="chip ${c===curTvCat?'active':''}" data-tvcat="${c}">${c==='Favoritos'?'★ ':''}${c}</button>`).join('')}
  $$('#tvChips .chip').forEach(c=>c.classList.toggle('active',c.dataset.tvcat===curTvCat));
  const q=curTvQ.toLowerCase();
  let items=CHANNELS.map((c,i)=>({...c,idx:i}));
  if(curTvCat==='Favoritos')items=items.filter(c=>favs.includes(c.id));
  else if(curTvCat!=='Todos')items=items.filter(c=>c.category===curTvCat);
  if(q)items=items.filter(c=>(c.name+' '+c.category).toLowerCase().includes(q));
  $('#tvCount').textContent=CHANNELS.length;
  $('#tvGrid').innerHTML=items.map(c=>`<div class="chan-card ${favs.includes(c.id)?'fav':''}">
    <div class="chan-top"><div class="chan-logo">${c.logo?`<img loading="lazy" src="${c.logo}" alt="${c.name}" onerror="this.remove()"/>`:c.name[0]}</div><span class="chan-num">#${String(c.idx+1).padStart(3,'0')}</span></div>
    <h4>${c.name}</h4><p class="chan-cat"><i></i>${c.category} · ${c.external?'Site oficial':'Ao vivo'}</p>
    <div class="chan-foot"><button data-chan="${c.idx}" style="font:inherit;color:inherit">${c.external?'↗ Ver no site oficial':'▶ No ar agora'}</button><button class="star-btn ${favs.includes(c.id)?'on':''}" data-fav="${c.id}">${favs.includes(c.id)?'★':'☆'}</button></div>
  </div>`).join('')||`<div class="empty"><div class="empty-ico">📡</div><h3>${curTvCat==='Favoritos'?'Nenhum favorito ainda':'Nenhum canal encontrado'}</h3><p>${curTvCat==='Favoritos'?'Toque na estrela de qualquer canal para fixá-lo aqui.':'Ajuste a busca ou explore outra categoria.'}</p></div>`;
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-tvcat]');if(t){curTvCat=t.dataset.tvcat;renderTv()}
  const f=e.target.closest('[data-fav]');if(f){e.stopPropagation();const id=f.dataset.fav;const i=favs.indexOf(id);if(i>=0){favs.splice(i,1);toast('Removido dos favoritos')}else{favs.push(id);toast('Adicionado aos favoritos')}store.set('teia_favs',favs);renderTv()}});
$('#tvSearch').addEventListener('input',e=>{curTvQ=e.target.value;renderTv()});

/* ---------- modal ---------- */
let modalItem=null;
function similar(m,n=4){return CATALOG.filter(t=>t.id!==m.id).map(t=>({t,s:t.genres.filter(g=>m.genres.includes(g)).length+((t.saga&&m.saga)?3:0)})).sort((a,b)=>b.s-a.s||b.t.match-a.t.match).slice(0,n).map(x=>x.t)}
function openModal(id){const m=byId(id);if(!m)return;modalItem=m;const inL=myList.includes(id);
  $('#mImg').src=m.image;$('#mImg').alt=m.name;
  $('#mBadge').textContent=m.badge||(m.kind==='serie'?'Série':'Filme');$('#mBadge').style.display=(m.badge||true)?'inline-block':'none';
  $('#mTitle').textContent=m.name;
  $('#mMeta').innerHTML=`<span class="match">${m.match}% relevante</span><span>${m.year}</span><span>${m.duration}</span><span class="rate">${m.rating}</span>${m.quality.map(q=>`<span class="q">${q}</span>`).join('')}`;
  $('#mSyn').textContent=m.synopsis;
  $('#mCast').innerHTML=m.cast.map(c=>`<span>${c}</span>`).join('');
  $('#mDir').textContent=m.director;
  $('#mList').textContent=inL?'✓ Na sua lista':'＋ Minha Lista';
  $('#mSim').innerHTML=similar(m).map(s=>cardHTML(s)).join('');
  $('#modal').hidden=false;document.body.style.overflow='hidden'}
function closeModal(){$('#modal').hidden=true;document.body.style.overflow=''}
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeVod();closeLive();closeExt()}});
$('#mPlay').onclick=()=>{if(modalItem){closeModal();playVod(modalItem.id)}};
$('#mList').onclick=()=>{if(modalItem){toggleList(modalItem.id);$('#mList').textContent=myList.includes(modalItem.id)?'✓ Na sua lista':'＋ Minha Lista'}};

/* ---------- Sala externa (canais abertos, dentro do app) ---------- */
let extUrl='';
function openExt(c){extUrl=c.url;$('#extName').textContent=c.name;$('#extFrame').src=c.url;$('#extroom').hidden=false;document.body.style.overflow='hidden'}
function closeExt(){$('#extFrame').removeAttribute('src');$('#extroom').hidden=true;document.body.style.overflow='';extUrl=''}
document.addEventListener('click',e=>{if(e.target.closest('[data-ext-close]'))closeExt()});
$('#extOpen').onclick=()=>{if(extUrl)window.open(extUrl,'_blank','noopener')};

/* ---------- VOD player ---------- */
const vv=$('#vodVideo');
function fmt(t){if(!isFinite(t))return '00:00';t=Math.floor(t);const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function playVod(id){const m=byId(id);if(!m)return;vodItem=m;
  $('#vod').hidden=false;document.body.style.overflow='hidden';
  $('#vodTitle').textContent=m.name;
  vv.src=m.videoUrl;vv.poster=m.image;vv.muted=false;vv.volume=1;
  const resume=progress[m.id];
  $('#vodResume').hidden=!(resume&&resume>0.02&&resume<0.95);
  vv.onloadedmetadata=()=>{if(resume&&resume>0.02&&resume<0.95&&vv.duration)vv.currentTime=resume*vv.duration;vv.play().catch(()=>{});syncVodIcon()};
  vv.play().catch(()=>{});updateVodBar();
  $('#vodCenter').style.display='grid';
}
function closeVod(){if(vodItem&&vv.duration)progress[vodItem.id]=vv.currentTime/vv.duration;store.set('teia_progress',progress);vv.pause();vv.removeAttribute('src');vv.load();$('#vod').hidden=true;document.body.style.overflow='';vodItem=null;rerenderDynamic()}
document.addEventListener('click',e=>{if(e.target.closest('[data-vod-close]'))closeVod()});
function syncVodIcon(){$('#vodPlay').textContent=vv.paused?'▶':'⏸';$('#vodCenter').style.display=vv.paused?'grid':'none';$('#vodBig').textContent=vv.paused?'▶':'⏸'}
vv.addEventListener('play',syncVodIcon);vv.addEventListener('pause',syncVodIcon);vv.addEventListener('click',()=>vv.paused?vv.play():vv.pause());
$('#vodBig').onclick=()=>vv.paused?vv.play():vv.pause();
$('#vodPlay').onclick=()=>vv.paused?vv.play():vv.pause();
$('#vodBack').onclick=()=>vv.currentTime=Math.max(0,vv.currentTime-10);
$('#vodFwd').onclick=()=>vv.currentTime=Math.min(vv.duration||0,vv.currentTime+10);
$('#vodMute').onclick=()=>{vv.muted=!vv.muted;$('#vodMute').textContent=vv.muted?'🔇':'🔊'};
$('#vodFs').onclick=()=>{const el=$('#vod');document.fullscreenElement?document.exitFullscreen():el.requestFullscreen?.()};
vv.addEventListener('timeupdate',updateVodBar);
function updateVodBar(){const d=vv.duration||0,c=vv.currentTime||0;$('#vodFill').innerHTML=`<i style="width:${d?c/d*100:0}%"></i>`;$('#vodTime').textContent=fmt(c)+' / '+fmt(d);if(vodItem&&d)progress[vodItem.id]=c/d}
setInterval(()=>{if(vodItem)store.set('teia_progress',progress)},5000);
$('#vodBar').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();if(vv.duration)vv.currentTime=((e.clientX-r.left)/r.width)*vv.duration};

/* ---------- Live player ---------- */
const lv=$('#liveVideo');
function liveList(){return CHANNELS}
function openLive(i){liveIdx=i;$('#live').hidden=false;document.body.style.overflow='hidden';startLive()}
function closeLive(){try{liveHls?.destroy()}catch{}liveHls=null;lv.pause();lv.removeAttribute('src');lv.load();$('#live').hidden=true;document.body.style.overflow=''}
document.addEventListener('click',e=>{if(e.target.closest('[data-live-close]')){closeLive();if(curView==='tv')renderTv()}});
function setChanTag(c,i){$('#liveName').textContent=c.name;$('#liveLoadName').textContent=c.name;$('#chanTagName').textContent=c.name;$('#zapName').textContent=`${String(i+1).padStart(3,'0')} · ${c.name}`;
  const logo=c.logo?`<img src="${c.logo}" alt="" style="width:100%;height:100%;object-fit:contain" onerror="this.remove()"/>`:'T';
  $('#chanLogo').innerHTML=logo;$('#zapLogo').innerHTML=logo;
  $('#liveFav').textContent=favs.includes(c.id)?'★':'☆';$('#liveFav').classList.toggle('on',favs.includes(c.id))}
function startLive(){const c=liveList()[liveIdx];if(!c)return;setChanTag(c,liveIdx);
  $('#liveLoading').style.display='flex';$('#liveError').hidden=true;
  try{liveHls?.destroy()}catch{}liveHls=null;lv.muted=true;
  const ok=()=>{$('#liveLoading').style.display='none';lv.play().catch(()=>{})};
  const fail=()=>{$('#liveLoading').style.display='none';$('#liveError').hidden=false;$('#liveErrMsg').textContent=`O canal ${c.name} está fora do ar na fonte atual.`;$('#liveSugg').innerHTML=CHANNELS.filter((_,j)=>j!==liveIdx).slice(0,4).map((s)=>`<button data-chan="${CHANNELS.indexOf(s)}">${s.name}</button>`).join('')};
  if(c.url.includes('.m3u8')&&window.Hls&&Hls.isSupported()){liveHls=new Hls({maxBufferLength:20});liveHls.loadSource(c.url);liveHls.attachMedia(lv);liveHls.on(Hls.Events.MANIFEST_PARSED,ok);liveHls.on(Hls.Events.ERROR,(_,d)=>{if(d.fatal)fail()});setTimeout(()=>{if(!$('#liveLoading').style.display||$('#liveLoading').style.display==='flex'){if(lv.readyState<2)fail()}},14000)}
  else{lv.src=c.url;lv.onloadeddata=ok;lv.onerror=fail;lv.load();setTimeout(()=>{if(lv.readyState<2&&!$('#liveError').hidden===false&&$('#liveLoading').style.display!=='none'){/* wait */}},12000);setTimeout(()=>{if(lv.readyState<2&&$('#liveLoading').style.display!=='none')fail()},14000)}
  setTimeout(()=>{$('#chanTag').style.opacity='0';$('#chanTag').style.transition='opacity 1s';setTimeout(()=>$('#chanTag').style.display='none',1100)},6000);
  $('#chanTag').style.display='flex';$('#chanTag').style.opacity='1';
}
$('#liveRetry').onclick=startLive;
$('#liveGuide').onclick=()=>{closeLive();go('tv')};
$('#zapPrev').onclick=()=>{liveIdx=(liveIdx-1+CHANNELS.length)%CHANNELS.length;startLive()};
$('#zapNext').onclick=()=>{liveIdx=(liveIdx+1)%CHANNELS.length;startLive()};
$('#zapToggle').onclick=()=>{lv.paused?lv.play():lv.pause();$('#zapToggle').textContent=lv.paused?'▶':'⏸'};
lv.addEventListener('play',()=>$('#zapToggle').textContent='⏸');lv.addEventListener('pause',()=>$('#zapToggle').textContent='▶');
lv.addEventListener('click',()=>{lv.muted=false;$('#liveMute').textContent='🔊'});
$('#liveMute').onclick=()=>{lv.muted=!lv.muted;$('#liveMute').textContent=lv.muted?'🔇':'🔊'};
$('#liveFs').onclick=()=>{const el=$('#live');document.fullscreenElement?document.exitFullscreen():el.requestFullscreen?.()};
$('#liveFav').onclick=()=>{const c=CHANNELS[liveIdx];const i=favs.indexOf(c.id);if(i>=0)favs.splice(i,1);else favs.push(c.id);store.set('teia_favs',favs);setChanTag(c,liveIdx);toast(i>=0?'Removido dos favoritos':'Adicionado aos favoritos')};

/* ---------- boot ---------- */
renderHero();renderHomeRows();renderTop10();renderTvPreview();renderFilmes();renderSeries();renderLista();refreshListUI();
