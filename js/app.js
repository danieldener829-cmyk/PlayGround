// Dados 100% originais (placeholders) — sem cópia do quenq.com
const APPS = [
  { nome: "Cidade Neon 3", desc: "Aventura em mundo aberto direto no navegador.", icon: "🌆", c1: "#7c3aed", c2: "#2e1065" },
  { nome: "Vice Neon", desc: "A experiência dos anos 80 em Miami fictícia.", icon: "🌴", c1: "#ec4899", c2: "#500f28" },
  { nome: "Blocos Infinitos", desc: "Construa sozinho ou com amigos online.", icon: "🧱", c1: "#059669", c2: "#064e3b" },
  { nome: "Pássaros Bravos", desc: "Versão web completa com power-ups extras.", icon: "🐦", c1: "#ea580c", c2: "#431407" },
  { nome: "Pinball Espacial", desc: "O clássico pinball 3D do XP.", icon: "🪩", c1: "#1e6fd9", c2: "#0b2a5b" },
  { nome: "Update Falso", desc: "Pregue peças com telas de update falsas.", icon: "😈", c1: "#475569", c2: "#0f172a" },
];

const GAMES = [
  { nome: "Cara Voador", genero: "acao", icon: "🦸" },
  { nome: "Covil do Vilão", genero: "acao", icon: "🐉" },
  { nome: "Dança do Destino", genero: "puzzle", icon: "💃" },
  { nome: "Torre Apocalíptica", genero: "acao", icon: "🗼" },
  { nome: "Grilo Maluco", genero: "esporte", icon: "🏏" },
  { nome: "Amigos da Árvore", genero: "puzzle", icon: "🎄" },
  { nome: "Gerador de Agentes", genero: "puzzle", icon: "🕵️" },
  { nome: "Rima Divertida", genero: "puzzle", icon: "🎵" },
  { nome: "Tanques Incríveis 2", genero: "acao", icon: "🛡️" },
  { nome: "Pinte os Animais", genero: "puzzle", icon: "🎨" },
  { nome: "Turbo Corrida  nitro", genero: "corrida", icon: "🏎️" },
  { nome: "Rali Retrô", genero: "corrida", icon: "🚗" },
];

const PALETTES = [["#7c3aed","#2e1065"],["#059669","#064e3b"],["#1e6fd9","#0b2a5b"],["#dc2626","#450a0a"],["#ea580c","#431407"],["#0d9488","#134e4a"]];

let activeGenre = "todos";

function renderApps() {
  const grid = document.getElementById("apps-grid");
  grid.innerHTML = APPS.map((a, i) => `
    <a href="#arcade" class="apps-card" style="--bg1:${a.c1};--bg2:${a.c2}" onclick="openApp('${a.nome}');return false;">
      <div class="apps-card-overlay"></div>
      <div class="game-art" style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:flex-end;padding:14px;font-size:44px">${a.icon}</div>
      <div class="apps-card-content"><h2>${a.nome}</h2><p>${a.desc}</p></div>
    </a>`).join("");
}

function renderGames() {
  const q = (document.getElementById("search-bar").value || "").toLowerCase();
  const grid = document.getElementById("game-grid");
  const empty = document.getElementById("no-games");
  const list = GAMES.filter(g =>
    (activeGenre === "todos" || g.genero === activeGenre) &&
    g.nome.toLowerCase().includes(q)
  );
  empty.style.display = list.length ? "none" : "block";
  document.getElementById("stat-games").textContent = GAMES.length * 108 + "+";
  grid.innerHTML = list.map((g, i) => {
    const p = PALETTES[i % PALETTES.length];
    return `<a class="game-card" style="--bg1:${p[0]};--bg2:${p[1]}" onclick="playGame('${g.nome}');return false;">
      <span class="game-genre">${g.genero}</span>
      <span class="game-art">${g.icon}</span>
      <h2>${g.nome}</h2></a>`;
  }).join("");
}

function playGame(nome) {
  const p = document.getElementById("player");
  p.hidden = false;
  document.getElementById("player-title").textContent = "▶ Jogando: " + nome;
  document.getElementById("player-screen").textContent = "🎮 '" + nome + "' carregando... (demo — conecte Ruffle/EmulatorJS para o jogo real)";
  p.scrollIntoView({ behavior: "smooth", block: "center" });
}
function openApp(nome) {
  const p = document.getElementById("player");
  p.hidden = false;
  document.getElementById("player-title").textContent = "💾 App: " + nome;
  document.getElementById("player-screen").textContent = "✨ '" + nome + "' iniciado (demo educacional).";
  p.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.addEventListener("DOMContentLoaded", () => {
  renderApps(); renderGames();
  setTimeout(() => document.getElementById("global-loader").classList.add("loader-hidden"), 500);

  document.getElementById("search-bar").addEventListener("input", renderGames);
  document.querySelectorAll("#genre-filters .chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#genre-filters .chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeGenre = btn.dataset.genre;
      renderGames();
    });
  });

  document.querySelectorAll(".faq-question").forEach(q =>
    q.addEventListener("click", () => q.parentElement.classList.toggle("open")));

  document.getElementById("btn-close").addEventListener("click", () => document.getElementById("player").hidden = true);
  document.getElementById("btn-full").addEventListener("click", () => {
    const el = document.getElementById("player");
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen && el.requestFullscreen();
  });

  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-H");
  toggle.addEventListener("click", () => nav.classList.toggle("mobile-open"));

  // Destaque da nav por scroll
  const links = document.querySelectorAll(".Butn1");
  const secs = ["home","arcade","apps","diretorio","arquivos","sobre"].map(id => document.getElementById(id));
  window.addEventListener("scroll", () => {
    let cur = "home";
    secs.forEach(s => { if (s && window.scrollY >= s.offsetTop - 200) cur = s.id; });
    links.forEach(l => l.classList.toggle("active-nav", l.getAttribute("href") === "#" + cur));
  });
});
