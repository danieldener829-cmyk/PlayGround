import { BLOCKS, RECIPES, ITEMS, I18N } from '../data/content.js';
import { bus } from '../core/utils.js';

const blockLabel = (k) => BLOCKS[Object.entries(BLOCKS).find(([, b]) => b.name === k)?.[0]]?.pt || ITEMS[k]?.pt || k;
const itemColor = (k) => {
  const b = Object.values(BLOCKS).find(b => b.name === k);
  if (b) return b.colors[0];
  const map = { graveto: '#9c7040', fibra: '#58c24f', carvao: '#2b2b2e', cobre: '#c47b3a', ferro: '#d8a17a', ouro: '#f2d24b', cristal_frag: '#7fe3ff', maca_verde: '#6abe4f', pao_raiz: '#c9a35e', semente: '#8fbf6a', trigo_selvagem: '#e0cf9a' };
  if (map[k]) return map[k];
  if (k.includes('pic') || k.includes('pa_') || k.includes('mach')) return '#9c7040';
  if (k.includes('espada') || k.includes('arco')) return '#b0b6bd';
  return '#aaa';
};

export function mountUI(game, canvas) {
  const root = document.getElementById('ui');
  root.innerHTML = `
  <div id="menu" class="panel">
    <h1>⛰️ LUMIVALE</h1>
    <p class="sub">Sandbox voxel original • exploração, construção e sobrevivência</p>
    <label>Nome do mundo<input id="m-name" value="Vale Inicial"></label>
    <label>Seed (opcional)<input id="m-seed" placeholder="ex: vale-123"></label>
    <div class="row">
      <label>Modo<select id="m-mode"><option value="survival">Sobrevivência</option><option value="creative">Criativo</option></select></label>
      <label>Render<input id="m-render" type="number" value="4" min="2" max="7"></label>
    </div>
    <div class="row">
      <button id="b-play" class="primary">▶ Jogar</button>
      <button id="b-continue">⤺ Continuar</button>
    </div>
    <div class="row">
      <button id="b-settings">⚙️ Configurações</button>
      <button id="b-help">❓ Ajuda</button>
    </div>
    <div id="worlds"></div>
    <p class="tiny">Mundos salvos no navegador • WASD+mouse no PC • joystick no celular</p>
  </div>
  <div id="hud" class="hidden">
    <div id="cross">+</div>
    <div id="stats">
      <div class="bar"><span>❤️</span><div class="track"><div id="hp"></div></div></div>
      <div class="bar"><span>🍖</span><div class="track"><div id="hung"></div></div></div>
      <div class="bar"><span>⭐</span><div class="track"><div id="xp"></div></div><b id="lvl"></b></div>
      <div id="clock">☀️</div><div id="bio"></div><div id="wthr"></div>
    </div>
    <div id="hotbar"></div>
    <div id="msg"></div>
    <div id="bossbar" class="hidden"><span>Coração Ígneo</span><div class="track"><div id="bossfill"></div></div></div>
    <div id="prog" class="hidden"><div id="progfill"></div></div>
    <div id="touch">
      <div id="joy"><div id="stick"></div></div>
      <div id="tbtns">
        <button data-a="jump">⤒</button><button data-a="hit">⚔️</button>
        <button data-a="use">✋</button><button data-a="inv">🎒</button>
      </div>
    </div>
  </div>
  <div id="inv" class="panel hidden">
    <h2>🎒 Inventário <small>(E fecha • arraste para mover)</small></h2>
    <div id="invgrid"></div>
    <h3>🛠️ Fabricação</h3>
    <div id="recipes"></div>
    <h3>🔥 Fornalha</h3>
    <div id="furn" class="row">
      <select id="f-in"></select>
      <div id="f-stat">—</div>
      <button id="f-out">Retirar</button>
    </div>
    <div class="row"><button id="b-respawn">Respawn</button><button id="b-save">💾 Salvar</button><button id="b-menu">Menu</button></div>
  </div>
  <div id="cfg" class="panel hidden">
    <h2>⚙️ Configurações</h2>
    <label>Volume<input id="c-vol" type="range" min="0" max="1" step="0.05" value="0.7"></label>
    <label>Sensibilidade<input id="c-sens" type="range" min="0.5" max="3" step="0.1" value="1"></label>
    <label>FOV<input id="c-fov" type="range" min="60" max="100" value="75"></label>
    <label>Idioma<select id="c-lang"><option value="pt-BR">Português</option><option value="en">English</option><option value="es">Español</option></select></label>
    <label class="row"><input id="c-shadow" type="checkbox"> Sombras</label>
    <div class="row"><button id="c-back" class="primary">Voltar</button></div>
  </div>
  <div id="help" class="panel hidden">
    <h2>Sandbox Lumivale — como jogar</h2>
    <ul>
      <li><b>WASD</b> mover • <b>mouse</b> olhar • <b>Espaço</b> pular • <b>Shift</b> correr • <b>1-9</b> hotbar • <b>E</b> inventário</li>
      <li><b>Clique esq.</b> quebrar/atacar • <b>dir.</b> colocar/usar • <b>E + receitas</b> para evoluir até ferro</li>
      <li>Ara a grama (clique esq. de mãos vazias), plante <b>sementes</b>, colha o trigo maduro.</li>
      <li>Monte um portal: empilhe <b>4 cristais Lumis + 1 lâmpada</b>? Não — use o menu Criativo ou encontre <b>bloco roxo Portal</b> nas torres para viajar ao <b>Reino Ígneo</b> e enfrentar o chefe.</li>
      <li>No celular use o joystick e os botões ⚔️/✋.</li>
    </ul>
    <button id="h-back" class="primary">Voltar</button>
  </div>
  <div id="over" class="panel hidden"><h2>💀 Você caiu</h2><p>Renasça no último ponto seguro.</p><button id="o-respawn" class="primary">Renascer</button></div>
  <div id="paused" class="panel hidden"><h2>⏸️ Pausado (ESC)</h2><button id="p-back" class="primary">Continuar</button></div>
  <div id="errlog"></div>`;
  const $ = (s) => root.querySelector(s);
  const menu = $('#menu'), hud = $('#hud'), invP = $('#inv'), cfg = $('#cfg'), help = $('#help'), over = $('#over'), paused = $('#paused');
  const show = (el, on) => el.classList.toggle('hidden', !on);
  let sens = 1;

  // lista mundos
  function refreshWorlds() {
    const w = $('#worlds'); w.innerHTML = '<h3>Mundos salvos</h3>';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('lumivale_') && !k.endsWith('.tmp') && k !== 'lumivale_last') {
        const name = k.replace('lumivale_', '');
        const b = document.createElement('button'); b.textContent = '▶ ' + name;
        b.onclick = () => { $('#m-name').value = name; startGame(); };
        w.appendChild(b);
      }
    }
  }
  refreshWorlds();
  window.startGame = startGame;
  function startGame() {
    game.opts.worldName = $('#m-name').value.trim() || 'Vale Inicial';
    game.opts.seed = $('#m-seed').value.trim() || game.opts.worldName;
    game.opts.mode = $('#m-mode').value;
    game.world.renderDist = Math.max(2, Math.min(7, +$('#m-render').value || 4));
    game.player.creative = game.opts.mode === 'creative';
    game.player.fly = game.opts.mode === 'creative';
    // re-seed world
    game.audio.ensure();
    show(menu, false); show(hud, true);
    canvas.requestPointerLock?.();
    game.say(game.opts.mode === 'creative' ? 'Modo Criativo: voo com Espaço (sobe) e Ctrl (desce).' : 'Sobreviva, colete, construa. Boa exploração!');
    renderHot(); renderInv();
  }
  $('#b-play').onclick = () => { game.audio.ensure(); game.audio.ui(); startGame(); };
  $('#b-continue').onclick = () => {
    const last = localStorage.getItem('lumivale_last');
    if (last) { $('#m-name').value = last; startGame(); } else game.audio.ui();
  };
  $('#b-settings').onclick = () => { show(menu, false); show(cfg, true); };
  $('#b-help').onclick = () => { show(menu, false); show(help, true); };
  $('#c-back').onclick = () => { show(cfg, false); show(menu, !hudVisible()); if (hudVisible()) show(hud, true); };
  $('#h-back').onclick = () => { show(help, false); show(menu, !hudVisible()); };
  const hudVisible = () => !hud.classList.contains('hidden');
  $('#c-vol').oninput = (e) => game.audio.setVolume(+e.target.value);
  $('#c-sens').oninput = (e) => sens = +e.target.value;
  $('#c-fov').oninput = (e) => { game.player.camera.fov = +e.target.value; game.player.camera.updateProjectionMatrix(); };
  $('#c-lang').onchange = (e) => { game.lang = e.target.value; };
  // pointer lock + olhar
  let locked = false;
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
  canvas.addEventListener('click', () => { game.audio.ensure(); if (!locked && hudVisible() && invP.classList.contains('hidden')) canvas.requestPointerLock?.(); });
  document.addEventListener('mousemove', (e) => {
    if (locked && hudVisible() && invP.classList.contains('hidden')) game.player.look(e.movementX * sens, e.movementY * sens);
  });
  // combate/quebra com mouse
  canvas.addEventListener('mousedown', (e) => {
    if (!hudVisible() || !invP.classList.contains('hidden')) return;
    game.audio.ensure();
    if (e.button === 0) { if (!game.hitCreature()) { if (!game.harvest()) game.tillOrAttack(); game._wantBreak = game._wantBreak ?? true; game._wantBreak = true; } }
    if (e.button === 2) game.useSelected();
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) game._wantBreak = false; });
  addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('keydown', (e) => {
    if (!hudVisible()) return;
    if (e.code === 'KeyE') { toggleInv(); }
    if (e.code === 'Escape') { show(paused, paused.classList.contains('hidden')); document.exitPointerLock?.(); }
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8 }[e.code];
    if (n !== undefined) { game.sel = n; renderHot(); game.audio.ui(); }
  });
  function toggleInv() { const open = invP.classList.contains('hidden'); show(invP, open); document.exitPointerLock?.(); if (open) { renderInv(); game.audio.ui(); } }
  $('#b-menu').onclick = () => { game.save(); show(invP, false); show(hud, false); show(menu, true); refreshWorlds(); };
  $('#b-save').onclick = () => { game.save(true); game.say('Progresso salvo.'); };
  $('#b-respawn').onclick = () => { respawn(); };
  $('#o-respawn').onclick = () => respawn();
  $('#p-back').onclick = () => show(paused, false);
  function respawn() {
    const s = game.world.spawnPoint();
    game.player.pos.set(s.x, s.y + 1, s.z); game.player.hp = 20; game.player.hunger = 20;
    game.over = false; show(over, false); game.say('Você renasceu.');
  }
  bus.on('game:over', () => show(over, true));
  bus.on('game:msg', (m) => { $('#msg').textContent = m || ''; });
  bus.on('break:progress', ({ t }) => {
    const p = $('#prog'); p.classList.toggle('hidden', t <= 0 || t >= 1);
    $('#progfill').style.width = Math.min(100, t * 100) + '%';
  });
  // HUD loop
  setInterval(() => {
    if (!hudVisible()) return;
    $('#hp').style.width = (game.player.hp / 20 * 100) + '%';
    $('#hung').style.width = (game.player.hunger / 20 * 100) + '%';
    const need = game.player.level * 20;
    $('#xp').style.width = (game.player.xp / need * 100) + '%';
    $('#lvl').textContent = 'Nv ' + game.player.level;
    const hh = Math.floor(game.time * 24);
    $('#clock').textContent = (game.isNight ? '🌙 ' : '☀️ ') + String(hh).padStart(2, '0') + 'h';
    const b = game.world.biomeAt(Math.floor(game.player.pos.x), Math.floor(game.player.pos.z));
    $('#bio').textContent = (game.world.isIgneo(game.player.pos.x, game.player.pos.z) ? '🔥 Reino Ígneo' : '🧭 ' + b.pt);
    $('#wthr').textContent = { limpo: '🌤️', chuva: '🌧️', tempestade: '⛈️', neve: '❄️', neblina: '🌫️' }[game.weather] || '';
    // boss bar
    const boss = game.entities.boss;
    $('#bossbar').classList.toggle('hidden', !boss || boss.dead || Math.hypot(boss.mesh.position.x - game.player.pos.x, boss.mesh.position.z - game.player.pos.z) > 40);
    if (boss && !boss.dead) $('#bossfill').style.width = (boss.hp / boss.maxHp * 100) + '%';
  }, 200);
  // hotbar + inventário com drag & drop
  let drag = null;
  function slotEl(i, small) {
    const s = game.inv[i];
    const d = document.createElement('div'); d.className = 'slot' + (i === game.sel && small ? ' sel' : '');
    if (s) {
      d.innerHTML = `<i style="background:${itemColor(s.key)}"></i><b>${s.count}</b><small>${(blockLabel(s.key) || '').slice(0, 10)}</small>`;
    }
    d.onclick = () => {
      if (small) { game.sel = i; renderHot(); return; }
      if (drag === null && s) { drag = i; d.classList.add('drag'); }
      else if (drag !== null) {
        const a = game.inv[drag], b = game.inv[i];
        if (a && b && a.key === b.key) { const space = 64 - b.count; const mv = Math.min(space, a.count); b.count += mv; a.count -= mv; if (a.count <= 0) game.inv[drag] = null; }
        else { game.inv[drag] = b; game.inv[i] = a; }
        drag = null; renderInv(); renderHot();
      }
    };
    return d;
  }
  function renderHot() {
    const h = $('#hotbar'); h.innerHTML = '';
    for (let i = 0; i < 9; i++) h.appendChild(slotEl(i, true));
  }
  function renderInv() {
    const g = $('#invgrid'); g.innerHTML = '';
    for (let i = 0; i < 36; i++) g.appendChild(slotEl(i, false));
    const r = $('#recipes'); r.innerHTML = '';
    for (const rec of RECIPES) {
      if (rec.station === 'fornalha') continue;
      const can = Object.entries(rec.in).every(([k, n]) => game.count(k) >= n);
      const b = document.createElement('button');
      b.className = can ? 'can' : ''; b.textContent = `${Object.entries(rec.in).map(([k, n]) => n + '×' + k).join(' + ')} → ${Object.entries(rec.out).map(([k, n]) => n + '×' + k).join()}`;
      b.onclick = () => { if (game.craft(rec.id)) { renderInv(); renderHot(); } else game.say('Faltam ingredientes.'); };
      r.appendChild(b);
    }
    const fi = $('#f-in'); fi.innerHTML = '';
    for (const rec of RECIPES.filter(x => x.smelt)) {
      const k = Object.keys(rec.in)[0];
      const o = document.createElement('option'); o.value = k; o.textContent = k;
      fi.appendChild(o);
    }
    if (game.furnace.in) fi.value = game.furnace.in;
    fi.onchange = () => { game.furnace.in = fi.value; game.furnace.prog = 0; };
    if (!game.furnace.in) game.furnace.in = fi.value;
    $('#f-stat').textContent = `🔥${game.furnace.fuel.toFixed(0)} ⏳${(game.furnace.prog * 100).toFixed(0)}% 📦${game.furnace.out ? game.furnace.out.count + '×' + game.furnace.out.key : '—'}`;
    $('#f-out').onclick = () => {
      if (game.furnace.out) { game.give(game.furnace.out.key, game.furnace.out.count); game.furnace.out = null; renderInv(); renderHot(); }
    };
  }
  bus.on('inv:change', () => { renderHot(); if (!invP.classList.contains('hidden')) renderInv(); });
  // touch
  const joy = $('#joy'), stick = $('#stick');
  let joyId = null;
  const setStick = (dx, dy) => { stick.style.transform = `translate(${dx}px,${dy}px)`; };
  joy.addEventListener('touchstart', (e) => { joyId = e.changedTouches[0].identifier; }, { passive: true });
  addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        const r = joy.getBoundingClientRect();
        let dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
        dx = Math.max(-40, Math.min(40, dx)); dy = Math.max(-40, Math.min(40, dy));
        setStick(dx, dy);
        game.player.touch.mx = dx / 40; game.player.touch.mz = dy / 40;
      }
    }
  }, { passive: true });
  addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) if (t.identifier === joyId) { joyId = null; setStick(0, 0); game.player.touch.mx = 0; game.player.touch.mz = 0; }
  });
  // olhar por arrasto no canvas (mobile)
  let lookId = null, lx = 0, ly = 0;
  canvas.addEventListener('touchstart', (e) => {
    game.audio.ensure();
    const t = e.changedTouches[0];
    const jr = joy.getBoundingClientRect();
    if (t.clientX < jr.right + 20 && t.clientY > jr.top - 20) return;
    lookId = t.identifier; lx = t.clientX; ly = t.clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookId) {
      game.player.look((t.clientX - lx) * 2.2 * sens, (t.clientY - ly) * 2.2 * sens);
      lx = t.clientX; ly = t.clientY;
    }
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; });
  document.querySelectorAll('#tbtns button').forEach((b) => {
    b.addEventListener('touchstart', (e) => {
      e.preventDefault(); game.audio.ensure();
      const a = b.dataset.a;
      if (a === 'jump') game.player.touch.jump = true;
      if (a === 'hit') { if (!game.hitCreature()) { game._wantBreak = true; setTimeout(() => game._wantBreak = false, 350); } }
      if (a === 'use') game.useSelected();
      if (a === 'inv') toggleInv();
    });
    b.addEventListener('touchend', (e) => { if (b.dataset.a === 'jump') game.player.touch.jump = false; });
  });
  addEventListener('beforeunload', () => game.save());
  renderHot();
}
