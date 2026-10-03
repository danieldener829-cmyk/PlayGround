const CATS = ["Todos","Ação","Aventura","Luta","Corrida","RPG","Esporte","Futebol","Terror","Mundo Aberto","Plataforma","Estratégia","Mods"];
const EMOJI = {"Ação":"💥","Aventura":"🗺️","Luta":"🥊","Corrida":"🏎️","RPG":"⚔️","Esporte":"⚽","Futebol":"⚽","Terror":"👻","Mundo Aberto":"🌆","Plataforma":"🍄","Estratégia":"♟️","Mods":"🛠️","Tiro":"🔫","Stealth":"🥷","Simulação":"🚗","Co-op":"👥","Casual":"😊","Ritmo":"🥁"};
const GRAD = [["#ff6a00","#7a1e00"],["#2563eb","#0c1a4d"],["#16a34a","#052e16"],["#a855f7","#3b0764"],["#ef4444","#450a0a"],["#06b6d4","#083344"],["#eab308","#422006"],["#ec4899","#500724"],["#10b981","#022c22"],["#6366f1","#1e1b4b"]];

let games = [];
let activeCat = "Todos";
let activeTab = "inicio";
let favs = new Set(JSON.parse(localStorage.getItem("psp_favs") || "[]"));

const $ = s => document.querySelector(s);
const grid = $("#grid"), gridFav = $("#gridFav");

function grad(i){ return GRAD[i % GRAD.length]; }
function emojiFor(g){ return EMOJI[g] || "🎮"; }
function ytLink(t){ return "https://www.youtube.com/results?search_query=" + encodeURIComponent(t + " PSP gameplay"); }
function parseDL(s){ const m = String(s).replace(",",".").match(/([\d.]+)\s*M/i); return m ? parseFloat(m[1]) : 0; }

function coverHTML(g, i){
  const [a,b] = grad(i + g.titulo.length);
  const e = emojiFor(g.generos[0]);
  const ini = g.titulo.split(" ").map(w=>w[0]).slice(0,2).join("");
  return `<div class="cover" style="background:linear-gradient(135deg,${a},${b})">
    <small>${e} ${g.generos[0]}</small>
    ${g.mod ? `<span class="mod-tag">MOD</span>` : ""}
    <span>${ini}</span>
    <button class="fav-btn ${favs.has(g.id)?"on":""}" data-fav="${g.id}">${favs.has(g.id)?"❤️":"🤍"}</button>
  </div>`;
}

function cardHTML(g, i){
  return `<article class="card" data-open="${g.id}">
    ${coverHTML(g,i)}
    <div class="card-info">
      <h3>${g.titulo}</h3>
      <div class="sub">${g.generos.slice(0,2).join(" • ")} • ${g.ano} • ${g.tamanho}</div>
      <div class="row"><span class="stars">★ ${g.nota.toFixed(1)}</span><span class="muted">📥 ${g.downloads}</span></div>
    </div>
  </article>`;
}

function filtered(){
  const q = $("#search").value.trim().toLowerCase();
  const sort = $("#sort").value;
  let list = games.filter(g =>
    (activeCat==="Todos" || g.generos.includes(activeCat) || (activeCat==="Futebol" && g.generos.includes("Futebol"))) &&
    (!q || g.titulo.toLowerCase().includes(q) || g.generos.join(" ").toLowerCase().includes(q))
  );
  if(sort==="nota") list = [...list].sort((a,b)=>b.nota-a.nota);
  else if(sort==="az") list = [...list].sort((a,b)=>a.titulo.localeCompare(b.titulo));
  else if(sort==="downloads") list = [...list].sort((a,b)=>parseDL(b.downloads)-parseDL(a.downloads));
  else if(sort==="ano") list = [...list].sort((a,b)=>b.ano-a.ano);
  else list = [...list].sort((a,b)=>(b.destaque?1:0)-(a.destaque?1:0) || b.nota-a.nota);
  return list;
}

function render(){
  const list = filtered();
  grid.innerHTML = list.map(cardHTML).join("");
  $("#empty").classList.toggle("hidden", list.length>0);
  $("#totalGames").textContent = list.length + " jogos";
  $("#statCatalogo").textContent = games.length;
  const fl = games.filter(g=>favs.has(g.id));
  gridFav.innerHTML = fl.map(cardHTML).join("");
  $("#emptyFav").classList.toggle("hidden", fl.length>0);
  $("#favCount").textContent = fl.length;
}

function toast(msg){
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.add("hidden"), 1800);
}

function toggleFav(id){
  if(favs.has(id)){ favs.delete(id); toast("Removido dos favoritos"); }
  else { favs.add(id); toast("❤️ Salvo nos favoritos!"); }
  localStorage.setItem("psp_favs", JSON.stringify([...favs]));
  render();
}

function openModal(id){
  const g = games.find(x=>x.id===id); if(!g) return;
  const [a,b] = grad(games.indexOf(g));
  const c = $("#modalCover");
  c.style.background = `linear-gradient(135deg,${a},${b})`;
  c.textContent = emojiFor(g.generos[0]) + " " + g.titulo.split(" ").map(w=>w[0]).slice(0,2).join("");
  $("#mTitulo").textContent = g.titulo;
  $("#mMeta").innerHTML = g.generos.map(x=>`<span>${emojiFor(x)} ${x}</span>`).join("") +
    `<span>📅 ${g.ano}</span><span>💾 ${g.tamanho}</span><span>★ ${g.nota.toFixed(1)}</span><span>📥 ${g.downloads}</span>`;
  $("#mDesc").textContent = g.desc;
  const fb = $("#mFav");
  fb.textContent = favs.has(g.id) ? "💔 Remover favorito" : "❤️ Favoritar";
  fb.onclick = ()=>{ toggleFav(g.id); fb.textContent = favs.has(g.id) ? "💔 Remover favorito" : "❤️ Favoritar"; };
  $("#mYt").href = ytLink(g.titulo);
  $("#modal").classList.remove("hidden");
}
function closeModal(){ $("#modal").classList.add("hidden"); }

function buildChips(){
  $("#chips").innerHTML = CATS.map(c=>`<button class="chip ${c===activeCat?"active":""}" data-cat="${c}">${c==="Todos"?"🏠 Todos":(EMOJI[c]||"🎮")+" "+c}</button>`).join("");
}

document.addEventListener("click", e=>{
  const cat = e.target.closest("[data-cat]");
  if(cat){ activeCat = cat.dataset.cat; buildChips(); render(); return; }
  const fav = e.target.closest("[data-fav]");
  if(fav){ e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
  const open = e.target.closest("[data-open]");
  if(open){ openModal(open.dataset.open); return; }
  const tab = e.target.closest("[data-tab]");
  if(tab){
    activeTab = tab.dataset.tab;
    document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active", t===tab));
    $("#view-inicio").classList.toggle("hidden", activeTab!=="inicio");
    $("#view-favoritos").classList.toggle("hidden", activeTab!=="favoritos");
    $("#view-emulador").classList.toggle("hidden", activeTab!=="emulador");
    window.scrollTo({top:0, behavior:"smooth"});
  }
});
$("#search").addEventListener("input", render);
$("#sort").addEventListener("change", render);
$("#modalClose").addEventListener("click", closeModal);
$("#modal").addEventListener("click", e=>{ if(e.target.id==="modal") closeModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });
$("#btnRandom").addEventListener("click", ()=>{
  const g = games[Math.floor(Math.random()*games.length)];
  openModal(g.id);
});

async function init(){
  buildChips();
  try{
    const r = await fetch("games.json");
    games = await r.json();
  }catch{
    games = [];
  }
  render();
  if("serviceWorker" in navigator){ try{ await navigator.serviceWorker.register("sw.js"); }catch{} }
}
init();
