import * as THREE from 'three';
import { World, SEA } from '../world/world.js';
import { Player } from '../player/player.js';
import { EntityManager } from './entities.js';
import { AudioSys } from './audio.js';
import { BLOCKS, BLOCK_NAME_TO_ID, DROPS, RECIPES, I18N } from '../data/content.js';
import { bus, Logger, clamp } from '../core/utils.js';

// Arquitetura server-authoritative preparada para multiplayer futuro.
// Hoje roda em modo single-player com NetworkManager em modo "local".
export class NetworkManager {
  constructor() { this.mode = 'local'; this.handlers = new Map(); }
  // Futuro: connect(url) abriria WebSocket e sincronizaria snapshots.
  async connect(url) { Logger.info('Multiplayer ainda não ativo; mantendo modo local.', url); return false; }
  on(ev, fn) { this.handlers.set(ev, fn); }
  // Toda mutação de bloco/inventário passa por aqui para futura autoridade do servidor.
  sendBlockUpdate(x, y, z, id) { bus.emit('net:block', { x, y, z, id }); }
  sendPlayerState(s) { bus.emit('net:player', s); }
}

export class Game {
  constructor(canvas, opts) {
    this.opts = opts; // {worldName, seed, mode, renderDist, lang}
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !!opts.shadows;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b5e0);
    this.scene.fog = new THREE.Fog(0x87b5e0, 30, 140);
    // luzes (sol/lua + ambiente)
    this.sun = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sun.position.set(40, 80, 20);
    if (this.renderer.shadowMap.enabled) {
      this.sun.castShadow = true;
      this.sun.shadow.camera.left = -40; this.sun.shadow.camera.right = 40;
      this.sun.shadow.camera.top = 40; this.sun.shadow.camera.bottom = -40;
    }
    this.scene.add(this.sun);
    this.moon = new THREE.DirectionalLight(0x8fa8ff, 0.0); this.scene.add(this.moon);
    this.hemi = new THREE.HemisphereLight(0xbfe3ff, 0x6a5a44, 0.7); this.scene.add(this.hemi);
    this.world = new World(this.scene, opts.seed);
    this.world.renderDist = opts.renderDist ?? 4;
    this.player = new Player(this.scene, this.world, { fly: opts.mode === 'creative', creative: opts.mode === 'creative', fov: opts.fov });
    this.entities = new EntityManager(this.scene, this.world);
    this.audio = new AudioSys();
    this.audio.setVolume(opts.volume ?? 0.7);
    this.net = new NetworkManager();
    // estado
    this.time = 0.3; // 0..1 (0=meia-noite, 0.3=manhã)
    this.dayLen = opts.dayLen ?? 600;
    this.weather = 'limpo'; this.weatherT = 0; this.rain = null;
    this.crops = new Map(); // "x,y,z" -> {stage:0..3, t}
    this.furnace = { in: null, fuel: 0, prog: 0, out: null };
    this.inv = Array.from({ length: 36 }, () => null);
    this.sel = 0;
    this.lang = opts.lang || 'pt-BR';
    this.breaking = null; // {key, t, need}
    this.attackCd = 0;
    this.msg = '';
    this.over = false;
    this.paused = false;
    this._stepT = 0;
    this.clock = new THREE.Clock();
    this.loadOrSpawn();
    this._makeRain();
    this._makeHighlight();
  }
  t(key) { return (I18N[this.lang] && I18N[this.lang][key]) || I18N['pt-BR'][key] || key; }
  // ---------- save robusto (dupla escrita atômica) ----------
  saveKey() { return 'lumivale_' + this.opts.worldName; }
  save(now = false) {
    try {
      const data = {
        v: 1, seed: this.opts.seed, mode: this.opts.mode, time: this.time,
        player: { x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z, hp: this.player.hp, hunger: this.player.hunger, xp: this.player.xp, level: this.player.level, yaw: this.player.yaw },
        inv: this.inv, crops: [...this.crops.entries()], furnace: this.furnace,
        modified: [...this.world.modified.entries()],
      };
      const s = JSON.stringify(data);
      localStorage.setItem(this.saveKey() + '.tmp', s);
      localStorage.setItem(this.saveKey(), s); // rename atômico (mesmo storage)
      localStorage.setItem('lumivale_last', this.opts.worldName);
      bus.emit('game:saved', {});
    } catch (e) { Logger.error('Falha ao salvar', e); }
  }
  loadOrSpawn() {
    try {
      const raw = localStorage.getItem(this.saveKey());
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.v === 1) {
          for (const [k, v] of d.modified) this.world.modified.set(k, v);
          Object.assign(this.player.pos, { x: d.player.x, y: d.player.y, z: d.player.z });
          this.player.hp = d.player.hp; this.player.hunger = d.player.hunger;
          this.player.xp = d.player.xp; this.player.level = d.player.level; this.player.yaw = d.player.yaw || 0;
          this.inv = d.inv; this.crops = new Map(d.crops || []); this.furnace = d.furnace || this.furnace;
          this.time = d.time ?? 0.3;
          Logger.info('Save carregado.');
          this.world.ensureAround(this.player.pos.x, this.player.pos.z);
          this.world.updateBuildBudget(6);
          this.entities.spawnInitial(this.player.pos.x, this.player.pos.z);
          return;
        }
      }
    } catch (e) { Logger.error('Save inválido, gerando spawn novo', e); }
    const s = this.world.spawnPoint();
    this.world.ensureAround(s.x, s.z);
    this.world.updateBuildBudget(6);
    // clareira de spawn: remove troncos/folhas num raio pequeno (chunks já residentes → barato)
    {
      const h0 = this.world.heightAt(Math.floor(s.x), Math.floor(s.z));
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        const bx = Math.floor(s.x) + dx, bz = Math.floor(s.z) + dz;
        for (let y = h0; y <= h0 + 9; y++) {
          const id = this.world.getBlock(bx, y, bz);
          if (id === 6 || id === 7) this.world.setBlock(bx, y, bz, 0);
        }
      }
      this.player.pos.set(s.x, h0 + 2, s.z);
      let guard = 0;
      while (this.player.collideAt(this.player.pos.x, this.player.pos.y, this.player.pos.z) && guard++ < 12)
        this.player.pos.y += 1;
    }
    this.player.yaw = Math.PI * 0.15;
    // kit inicial original
    this.give('tronco', 8); this.give('tocha', 4); this.give('maca_verde', 3);
    if (this.opts.mode === 'creative') {
      for (const b of ['grama', 'pedra', 'vidro', 'lampada', 'tijolo', 'tabuas', 'cristal']) this.give(b, 64);
      this.give('pic_ferro', 1); this.give('espada_ferro', 1);
    }
    this.world.ensureAround(this.player.pos.x, this.player.pos.z);
    this.world.updateBuildBudget(4);
    this.entities.spawnInitial(this.player.pos.x, this.player.pos.z);
  }
  give(key, n = 1) {
    const max = 64;
    for (let i = 0; i < this.inv.length && n > 0; i++) {
      const s = this.inv[i];
      if (s && s.key === key && s.count < max) { const add = Math.min(max - s.count, n); s.count += add; n -= add; }
    }
    for (let i = 0; i < this.inv.length && n > 0; i++) {
      if (!this.inv[i]) { const add = Math.min(max, n); this.inv[i] = { key, count: add }; n -= add; }
    }
    bus.emit('inv:change', {});
    return n === 0;
  }
  take(key, n = 1) {
    let need = n;
    for (let i = 0; i < this.inv.length && need > 0; i++) {
      const s = this.inv[i];
      if (s && s.key === key) { const r = Math.min(s.count, need); s.count -= r; need -= r; if (s.count <= 0) this.inv[i] = null; }
    }
    bus.emit('inv:change', {});
    return need === 0;
  }
  count(key) { return this.inv.reduce((a, s) => a + (s && s.key === key ? s.count : 0), 0); }
  selectedItem() { return this.inv[this.sel]; }
  // ---------- interação blocos ----------
  target() { return this.world.raycast(this.player.eye, this.player.dir, 8); }
  toolPower() {
    const s = this.selectedItem();
    if (!s) return { tool: null, power: 1 };
    const def = itemDef(s.key);
    return def ? { tool: def.tool || null, power: def.power || 1 } : { tool: null, power: 1 };
  }
  breakHeld(dt) {
    const hit = this.target();
    this._hit = hit;
    // highlight
    if (hit) {
      this.hl.visible = true;
      this.hl.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    } else { this.hl.visible = false; this.breaking = null; return; }
    if (!this._wantBreak) { this.breaking = null; return; }
    const id = hit.id, B = BLOCKS[id];
    if (!B || id === 0 || id === 18 || id === 19) { this.breaking = null; return; }
    const key = hit.x + ',' + hit.y + ',' + hit.z;
    const sel = this.selectedItem();
    const idef = itemDef(sel?.key);
    let mult = 1;
    if (B.tool && idef?.tool === B.tool) mult = (idef.power || 1) * 1.6;
    if (this.player.creative) mult = 1000;
    const need = (B.hardness ?? 1) / mult;
    if (!this.breaking || this.breaking.key !== key) this.breaking = { key, t: 0, need };
    this.breaking.t += dt; this.breaking.need = need;
    bus.emit('break:progress', { t: this.breaking.t / need });
    if (this.breaking.t >= need) {
      this.world.setBlock(hit.x, hit.y, hit.z, 0);
      this.net.sendBlockUpdate(hit.x, hit.y, hit.z, 0);
      this.audio.breakB();
      this.player.swing = 1;
      // desgaste
      if (sel && idef?.dura !== undefined && !this.player.creative) {
        sel._d = (sel._d || 0) + 1;
        if (sel._d >= (idef.dura || 60)) { this.inv[this.sel] = null; bus.emit('inv:change', {}); }
      }
      for (const d of (DROPS[B.name] || [])) this.give(d, 1);
      this.player.addXp(2);
      this.audio.xp();
      bus.emit('inv:change', {});
      this.breaking = null;
      this._burst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, B.colors[0]);
    }
  }
  tryPlace() {
    const hit = this.target(); if (!hit) return;
    const sel = this.selectedItem(); if (!sel) return;
    const bid = BLOCK_NAME_TO_ID[sel.key];
    if (bid === undefined) return; // item não-bloco (ferramenta/comida): usa ação alternativa
    const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
    if (this.world.getBlock(px, py, pz) !== 0) return;
    // não colocar dentro do jogador
    const pp = this.player.pos, h = this.player.half;
    if (BLOCKS[bid].solid && px + 1 > pp.x - h.x && px < pp.x + h.x && py + 1 > pp.y - h.y && py < pp.y + h.y && pz + 1 > pp.z - h.z && pz < pp.z + h.z) return;
    this.world.setBlock(px, py, pz, bid);
    this.net.sendBlockUpdate(px, py, pz, bid);
    this.audio.place();
    if (!this.player.creative) { sel.count--; if (sel.count <= 0) this.inv[this.sel] = null; bus.emit('inv:change', {}); }
  }
  useSelected() { // botão direito / ação: comer, plantar, portal
    const sel = this.selectedItem(); if (!sel) return;
    const idef = itemDef(sel.key);
    if (idef?.food) { // comer
      this.player.hunger = Math.min(20, this.player.hunger + idef.food);
      this.player.heal(1); this.audio.eat();
      sel.count--; if (sel.count <= 0) this.inv[this.sel] = null; bus.emit('inv:change', {});
      return;
    }
    if (sel.key === 'semente') { // plantar no solo arado
      const hit = this.target(); if (!hit) return;
      const below = hit.y - (hit.ny === 1 ? 0 : 1);
      const sup = this.world.getBlock(hit.x, hit.y, hit.z);
      // planta sobre solo arado mirando o solo
      const tb = this.world.getBlock(hit.x, hit.y, hit.z);
      if (BLOCKS[tb]?.name === 'solo_arado' || sup === 0) {
        const px = hit.x + (sup === 0 ? 0 : hit.nx), py = hit.y + (sup === 0 ? 0 : hit.ny), pz = hit.z + (sup === 0 ? 0 : hit.nz);
        if (this.world.getBlock(px, py - 1, pz) === BLOCK_NAME_TO_ID['solo_arado'] && this.world.getBlock(px, py, pz) === 0) {
          this.world.setBlock(px, py, pz, BLOCK_NAME_TO_ID['broto']);
          this.crops.set(px + ',' + py + ',' + pz, { stage: 0, t: 0 });
          sel.count--; if (sel.count <= 0) this.inv[this.sel] = null; bus.emit('inv:change', {});
        }
      }
      return;
    }
    this.tryPlace();
  }
  tillOrAttack() { // clique esquerdo alternativo: arar grama ou atacar
    const hit = this.target();
    // ataca criatura próxima da mira primeiro
    if (this.hitCreature(3.2)) return;
    if (!hit) return;
    const B = BLOCKS[hit.id];
    const sel = this.selectedItem();
    if ((B?.name === 'grama') && (!sel || sel.key === 'pa_madeira' || sel.key === 'pa_pedra' || !BLOCK_NAME_TO_ID[sel.key])) {
      this.world.setBlock(hit.x, hit.y, hit.z, BLOCK_NAME_TO_ID['solo_arado']);
      this.audio.place(); return;
    }
    this._wantBreak = true;
  }
  hitCreature(range = 3.4) {
    const eye = this.player.eye, dir = this.player.dir;
    let best = null, bd = range;
    for (const c of this.entities.list) {
      if (c.dead || c.kind === 'npc') continue;
      const p = c.mesh.position.clone(); p.y += 0.8;
      const to = p.clone().sub(eye);
      const along = to.dot(dir);
      if (along < 0 || along > range) continue;
      const perp = to.clone().addScaledVector(dir, -along).length();
      if (perp < 1.1 && along < bd) { bd = along; best = c; }
    }
    if (best) {
      const sel = this.selectedItem(); const idef = itemDef(sel?.key);
      const dmg = idef?.tool === 'espada' || idef?.tool === 'arco' ? (idef.power || 3) : idef?.tool === 'picareta' || idef?.tool === 'machado' ? 2 : 1;
      this.player.swing = 1; this.audio.hit();
      if (best.hurt(dmg)) { // morreu → drops + XP
        this.audio.breakB();
        const drops = best.kind === 'sombra' ? ['cristal_frag'] : best.kind === 'vespa' ? ['ouro', 'cristal_frag'] : best.kind === 'boss' ? ['cristal_frag', 'cristal_frag', 'ouro', 'ouro'] : best.kind === 'javali' ? ['pao_raiz'] : ['maca_verde', 'fibra'];
        for (const d of drops) this.give(d, 1);
        if (this.player.addXp(best.kind === 'boss' ? 60 : 8)) this.say('Nível ' + this.player.level + '!');
        if (best.kind === 'boss') this.say('Coração Ígneo derrotado! Portal estabilizado.');
        bus.emit('inv:change', {});
      }
      return true;
    }
    return false;
  }
  say(m) { this.msg = m; bus.emit('game:msg', m); clearTimeout(this._msgT); this._msgT = setTimeout(() => { this.msg = ''; bus.emit('game:msg', ''); }, 3200); }
  // ---------- crafting / fornalha ----------
  craft(recipeId) {
    const r = RECIPES.find(x => x.id === recipeId); if (!r) return false;
    if (r.station === 'fornalha') { this.say('Use a fornalha para fundir.'); return false; }
    for (const [k, n] of Object.entries(r.in)) if (this.count(k) < n) return false;
    for (const [k, n] of Object.entries(r.in)) this.take(k, n);
    for (const [k, n] of Object.entries(r.out)) this.give(k, n);
    this.audio.craft(); this.player.addXp(3);
    bus.emit('inv:change', {});
    return true;
  }
  furnaceTick(dt) {
    const F = this.furnace;
    // combustível: carvão/fibra/tronco
    if (F.fuel <= 0 && F.in) {
      if (this.count('carvao') > 0) { this.take('carvao', 1); F.fuel = 30; }
      else if (this.count('tronco') > 0) { this.take('tronco', 1); F.fuel = 12; }
      else if (this.count('fibra') > 0) { this.take('fibra', 2); F.fuel = 6; }
    }
    if (F.in && F.fuel > 0) {
      F.fuel -= dt;
      const rec = RECIPES.find(x => x.smelt && Object.keys(x.in)[0] === F.in);
      const needIn = rec ? Object.values(rec.in)[0] : 1;
      if (!rec || this.count(F.in) < needIn) { F.prog = Math.max(0, F.prog - dt * 0.2); return; }
      F.prog += dt / 8;
      if (F.prog >= 1) {
        F.prog = 0;
        this.take(F.in, needIn);
        for (const [k, n] of Object.entries(rec.out)) { if (!F.out) F.out = { key: k, count: 0 }; if (F.out.key === k) F.out.count += n; }
        this.audio.smelt(); this.player.addXp(4); bus.emit('inv:change', {});
      }
    } else F.prog = Math.max(0, F.prog - dt * 0.1);
  }
  // ---------- ciclo dia/noite + clima ----------
  get isNight() { return this.time < 0.22 || this.time > 0.78; }
  updateEnv(dt) {
    this.time = (this.time + dt / this.dayLen) % 1;
    const ang = this.time * Math.PI * 2 - Math.PI / 2; // 0.25 = meio-dia
    const elev = Math.sin(ang);
    const day = clamp(elev * 1.5 + 0.25, 0, 1);
    this._dayF = day;
    const igneo = this.world.isIgneo(this.player.pos.x, this.player.pos.z);
    if (igneo) {
      this.scene.background.setHex(0x2a0f0a); this.scene.fog.color.setHex(0x2a0f0a);
      this.sun.intensity = 0.5; this.sun.color.setHex(0xff8a4a);
      this.hemi.intensity = 0.5;
    } else if (this.weather === 'tempestade') {
      this.scene.background.setHex(0x4a5560); this.scene.fog.color.setHex(0x4a5560);
      this.sun.intensity = 0.25; this.hemi.intensity = 0.4;
    } else {
      const c = new THREE.Color().setHSL(0.58, 0.55, 0.15 + day * 0.5);
      if (this.isNight) c.setHex(0x0a0e22);
      this.scene.background.copy(c); this.scene.fog.color.copy(c);
      this.sun.intensity = 0.15 + day * 1.15;
      this.sun.color.setHex(day > 0.5 ? 0xffffff : 0xffb36e);
      this.moon.intensity = this.isNight ? 0.35 : 0;
      this.hemi.intensity = 0.25 + day * 0.55;
    }
    this.sun.position.set(Math.cos(ang) * 80, Math.sin(ang) * 80 + 20, 20);
    // clima: muda a cada ~60s, depende do bioma (deserto quase nunca chove)
    this.weatherT += dt;
    if (this.weatherT > 50) {
      this.weatherT = 0;
      const b = this.world.biomeAt(Math.floor(this.player.pos.x), Math.floor(this.player.pos.z));
      const r = Math.random();
      if (b.id === 'deserto' || b.id === 'vulcanica' || igneo) this.weather = r < 0.9 ? 'limpo' : 'neblina';
      else if (b.id === 'tundra') this.weather = r < 0.4 ? 'neve' : r < 0.6 ? 'limpo' : 'chuva';
      else this.weather = r < 0.55 ? 'limpo' : r < 0.8 ? 'chuva' : r < 0.9 ? 'tempestade' : 'neblina';
      this.audio.setRain(this.weather === 'chuva' || this.weather === 'tempestade');
      bus.emit('weather:change', this.weather);
    }
    if (this.rain) this.rain.visible = this.weather === 'chuva' || this.weather === 'tempestade' || this.weather === 'neve';
    if (this.rain?.visible) {
      const p = this.rain.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.getY(i) - dt * 22;
        if (y < 0) y = 24;
        p.setY(i, y);
      }
      p.needsUpdate = true;
      this.rain.position.set(this.player.pos.x, this.player.pos.y - 4, this.player.pos.z);
    }
  }
  _makeRain() {
    const n = 500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 40; pos[i * 3 + 1] = Math.random() * 24; pos[i * 3 + 2] = (Math.random() - 0.5) * 40; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rain = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xbfe3ff, size: 0.12, transparent: true, opacity: 0.8 }));
    this.rain.visible = false; this.scene.add(this.rain);
  }
  _makeHighlight() {
    this.hl = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
      new THREE.LineBasicMaterial({ color: 0x111111 })
    );
    this.hl.visible = false; this.scene.add(this.hl);
  }
  _burst(x, y, z, color) {
    const n = 14;
    const pos = new Float32Array(n * 3), vel = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel.push(new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: new THREE.Color(color), size: 0.09 });
    const pts = new THREE.Points(g, m); this.scene.add(pts);
    let life = 0.5;
    const tick = (dt) => {
      life -= dt;
      const p = g.attributes.position;
      for (let i = 0; i < n; i++) { p.setXYZ(i, p.getX(i) + vel[i].x * dt, p.getY(i) + vel[i].y * dt, p.getZ(i) + vel[i].z * dt); vel[i].y -= 9 * dt; }
      p.needsUpdate = true;
      if (life <= 0) { this.scene.remove(pts); g.dispose(); m.dispose(); }
      else requestAnimationFrame(() => tick(1 / 60));
    };
    tick(1 / 60);
  }
  // ---------- agricultura ----------
  farmTick(dt) {
    for (const [k, c] of this.crops) {
      const [x, y, z] = k.split(',').map(Number);
      if (this.world.getBlock(x, y, z) !== BLOCK_NAME_TO_ID['broto']) { this.crops.delete(k); continue; }
      const dist = Math.hypot(x - this.player.pos.x, z - this.player.pos.z);
      if (dist > 48) continue;
      c.t += dt;
      const need = 25 * (c.stage + 1);
      if (c.t > need && c.stage < 3) { c.stage++; c.t = 0; }
    }
  }
  harvest() {
    const hit = this.target(); if (!hit) return false;
    const B = BLOCKS[hit.id];
    if (B?.name !== 'broto') return false;
    const k = hit.x + ',' + hit.y + ',' + hit.z;
    const c = this.crops.get(k);
    if (c && c.stage >= 2) {
      this.world.setBlock(hit.x, hit.y, hit.z, 0);
      this.crops.delete(k);
      this.give('trigo_selvagem', 2); this.give('semente', 1);
      this.player.addXp(3); this.audio.eat();
      bus.emit('inv:change', {});
      return true;
    }
    this.say('Ainda está crescendo…');
    return false;
  }
  // ---------- portal / dimensão ----------
  portalTick() {
    const id = this.world.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y), Math.floor(this.player.pos.z));
    if (id === BLOCK_NAME_TO_ID['portal']) {
      const igneo = this.world.isIgneo(this.player.pos.x, this.player.pos.z);
      this.audio.portal();
      if (igneo) { this.player.pos.set(8.5, this.world.heightAt(8, 8) + 2, 8.5); this.say('Você voltou ao mundo principal.'); }
      else {
        const x = 8500, z = 8;
        this.player.pos.set(x, this.world.heightAt(x, z) + 2, z);
        this.say('Reino Ígneo — cuidado com as Vespas Ígneas!');
        this.entities.spawnBoss(x + 8, z + 8);
        this.player.addXp(15);
      }
      this.world.ensureAround(this.player.pos.x, this.player.pos.z);
    }
    // dano de lava
    const feet = this.world.getBlock(Math.floor(this.player.pos.x), Math.floor(this.player.pos.y + 0.2), Math.floor(this.player.pos.z));
    if (feet === BLOCK_NAME_TO_ID['lava']) { this.player.damage(4 * 0.016, 'fogo'); }
  }
  // ---------- loop ----------
  frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.paused && !this.over) {
      this.player.update(dt);
      this.breakHeld(dt);
      this.updateEnv(dt);
      this.farmTick(dt);
      this.furnaceTick(dt);
      this.portalTick();
      this.world.ensureAround(this.player.pos.x, this.player.pos.z);
      this.world.updateBuildBudget(2);
      const igneo = this.world.isIgneo(this.player.pos.x, this.player.pos.z);
      this.entities.update(dt, this.player, this.isNight, igneo);
      // passos
      this._stepT += dt * Math.hypot(this.player.vel.x, this.player.vel.z);
      if (this._stepT > 2.2 && this.player.onGround) { this._stepT = 0; this.audio.step(); }
      // fome lenta + regen
      this.player.hunger = Math.max(0, this.player.hunger - dt * 0.05);
      if (this.player.hunger <= 0) this.player.damage(dt * 0.6, 'fome');
      else if (this.player.hp < this.player.maxHp && this.player.hunger > 14) this.player.hp = Math.min(this.player.maxHp, this.player.hp + dt * 0.25);
      // fome → som de dano ocasional
      if (this.player.hp <= 0 && !this.over) { this.over = true; bus.emit('game:over', {}); }
      this.attackCd = Math.max(0, this.attackCd - dt);
      // autosave 30s
      this._saveT = (this._saveT || 0) + dt;
      if (this._saveT > 30) { this._saveT = 0; this.save(); }
      this.net.sendPlayerState({ x: +this.player.pos.x.toFixed(2), y: +this.player.pos.y.toFixed(2), z: +this.player.pos.z.toFixed(2) });
    }
    this.renderer.render(this.scene, this.player.camera);
  }
}
export function itemDef(key) {
  if (!key) return null;
  // importa preguiçoso para evitar ciclo
  const ITEMS = {
    graveto: { max: 64 }, fibra: { max: 64 }, carvao: { max: 64 }, cobre: { max: 64 }, ferro: { max: 64 },
    ouro: { max: 64 }, cristal_frag: { max: 64 }, maca_verde: { max: 64, food: 3 }, pao_raiz: { max: 64, food: 6 },
    semente: { max: 64 }, trigo_selvagem: { max: 64, food: 2 },
    pic_madeira: { tool: 'picareta', power: 1, dura: 60 }, pic_pedra: { tool: 'picareta', power: 2, dura: 140 },
    pic_cobre: { tool: 'picareta', power: 3, dura: 260 }, pic_ferro: { tool: 'picareta', power: 4, dura: 500 },
    mach_madeira: { tool: 'machado', power: 1, dura: 60 }, mach_pedra: { tool: 'machado', power: 2, dura: 140 },
    pa_madeira: { tool: 'pa', power: 1, dura: 60 }, pa_pedra: { tool: 'pa', power: 2, dura: 140 },
    espada_madeira: { tool: 'espada', power: 3, dura: 60 }, espada_ferro: { tool: 'espada', power: 7, dura: 500 },
    arco_simples: { tool: 'arco', power: 5, dura: 200 },
  };
  return ITEMS[key] || null;
}
