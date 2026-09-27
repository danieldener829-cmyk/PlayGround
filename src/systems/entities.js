import * as THREE from 'three';
// Criaturas 100% originais (modelos em caixas + nomes próprios):
// - Saltídeo (passivo, pula), Javali-Musgo (neutro), Ave Cinzenta (voa)
// - Sombra Rastejante (hostil noturna), Mordedor (subterrâneo), Vespa Ígnea (dimensão)
// - NPC Andarilho (comércio) e chefe Coração Ígneo (fases + telegrafia).
// IA em máquina de estados: IDLE → PATROL → CHASE → ATTACK → RETREAT/SEARCH → IDLE
function box(w, h, d, color) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  return m;
}
function makeModel(kind) {
  const g = new THREE.Group();
  const parts = {};
  if (kind === 'saltideo') { // cervo pequeno saltitante
    const body = box(0.5, 0.4, 0.8, 0x8fbf6a); body.position.y = 0.55; g.add(body); parts.body = body;
    const head = box(0.3, 0.3, 0.3, 0x9fd47a); head.position.set(0, 0.85, 0.5); g.add(head); parts.head = head;
    parts.legs = [];
    for (const [lx, lz] of [[-0.18, 0.25], [0.18, 0.25], [-0.18, -0.25], [0.18, -0.25]]) {
      const l = box(0.12, 0.4, 0.12, 0x6b8f4e); l.position.set(lx, 0.2, lz); g.add(l); parts.legs.push(l);
    }
  } else if (kind === 'javali') {
    const body = box(0.6, 0.45, 0.9, 0x7a5a44); body.position.y = 0.5; g.add(body); parts.body = body;
    const head = box(0.4, 0.35, 0.35, 0x8a6a50); head.position.set(0, 0.6, 0.6); g.add(head); parts.head = head;
    parts.legs = [];
    for (const [lx, lz] of [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.3], [0.2, -0.3]]) {
      const l = box(0.14, 0.35, 0.14, 0x5a4232); l.position.set(lx, 0.17, lz); g.add(l); parts.legs.push(l);
    }
  } else if (kind === 'ave') {
    const body = box(0.3, 0.25, 0.45, 0x9aa4b0); body.position.y = 1.2; g.add(body); parts.body = body;
    const w1 = box(0.5, 0.06, 0.25, 0x7c8794); w1.position.set(-0.35, 1.25, 0); g.add(w1);
    const w2 = box(0.5, 0.06, 0.25, 0x7c8794); w2.position.set(0.35, 1.25, 0); g.add(w2);
    parts.wings = [w1, w2]; parts.legs = [];
  } else if (kind === 'sombra') {
    const body = box(0.55, 0.7, 0.4, 0x23232e); body.position.y = 0.6; g.add(body); parts.body = body;
    const e1 = box(0.1, 0.1, 0.05, 0xb14bff); e1.position.set(-0.12, 0.8, 0.22); g.add(e1);
    const e2 = box(0.1, 0.1, 0.05, 0xb14bff); e2.position.set(0.12, 0.8, 0.22); g.add(e2);
    parts.legs = [e1, e2];
  } else if (kind === 'vespa') {
    const body = box(0.4, 0.3, 0.6, 0xff7a2a); body.position.y = 1.4; g.add(body); parts.body = body;
    const w1 = box(0.4, 0.04, 0.3, 0xffe9a3); w1.position.set(-0.3, 1.5, 0); g.add(w1);
    const w2 = box(0.4, 0.04, 0.3, 0xffe9a3); w2.position.set(0.3, 1.5, 0); g.add(w2);
    parts.wings = [w1, w2]; parts.legs = [];
  } else if (kind === 'npc') {
    const body = box(0.5, 0.7, 0.3, 0x4a7ec2); body.position.y = 0.85; g.add(body); parts.body = body;
    const head = box(0.32, 0.32, 0.32, 0xe0b98a); head.position.set(0, 1.4, 0); g.add(head); parts.head = head;
    parts.legs = [];
    const l1 = box(0.16, 0.5, 0.16, 0x33415c); l1.position.set(-0.12, 0.25, 0); g.add(l1);
    const l2 = box(0.16, 0.5, 0.16, 0x33415c); l2.position.set(0.12, 0.25, 0); g.add(l2);
    parts.legs.push(l1, l2);
  } else { // boss coração ígneo
    const core = box(1.4, 1.4, 1.4, 0xff3a1f); core.position.y = 1.6; g.add(core); parts.body = core;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 2.0), new THREE.MeshLambertMaterial({ color: 0x3d3230 }));
    shell.position.y = 0.4; g.add(shell);
    const eye = box(0.5, 0.5, 0.2, 0xffe9a3); eye.position.set(0, 1.7, 0.75); g.add(eye); parts.head = eye;
    parts.legs = [];
  }
  return { group: g, parts };
}
let _id = 1;
export class Creature {
  constructor(scene, world, kind, x, y, z, opts = {}) {
    this.id = _id++; this.kind = kind; this.world = world;
    const { group, parts } = makeModel(kind);
    this.mesh = group; this.parts = parts;
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);
    this.scene = scene;
    this.hp = opts.hp ?? (kind === 'sombra' ? 14 : kind === 'vespa' ? 18 : kind === 'boss' ? 220 : 10);
    this.maxHp = this.hp;
    this.speed = opts.speed ?? (kind === 'ave' || kind === 'vespa' ? 3 : 1.8);
    this.dmg = opts.dmg ?? (kind === 'sombra' ? 3 : kind === 'vespa' ? 4 : kind === 'boss' ? 6 : 0);
    this.state = 'IDLE';
    this.t = Math.random() * 5; this.dir = Math.random() * Math.PI * 2;
    this.target = null; this.dead = false;
    this.hostile = ['sombra', 'vespa', 'boss'].includes(kind);
    this.phase = 1;
    this.anim = Math.random() * 10;
    this._gy = null; this._gyT = 0; // cache do chão (evita 70 getBlock/frame)
  }
  update(dt, player, isNight, inIgneo) {
    if (this.dead) return;
    this.t += dt; this.anim += dt * 6;
    const p = this.mesh.position;
    const dx = player.pos.x - p.x, dz = player.pos.z - p.z;
    const dist = Math.hypot(dx, dz);
    // percepção: distância + noite + bioma
    const seeR = this.kind === 'boss' ? 30 : this.hostile ? (isNight ? 18 : 10) : 6;
    const sees = dist < seeR && Math.abs(player.pos.y - p.y) < 8;
    switch (this.state) {
      case 'IDLE':
        if (this.hostile && sees) this.state = 'CHASE';
        else if (this.t > 3) { this.state = 'PATROL'; this.t = 0; this.dir = Math.random() * Math.PI * 2; }
        break;
      case 'PATROL':
        this._walk(dt, this.dir, this.speed * 0.4);
        if (this.hostile && sees) this.state = 'CHASE';
        else if (this.t > 6) { this.state = 'IDLE'; this.t = 0; }
        break;
      case 'CHASE': {
        if (!sees || dist > seeR * 1.6) { this.state = 'SEARCH'; this.t = 0; break; }
        const a = Math.atan2(dx, dz);
        const sp = this.speed * (this.kind === 'boss' && this.phase === 2 ? 1.5 : 1);
        this._walk(dt, a, sp, true);
        if (dist < (this.kind === 'boss' ? 3.2 : 1.6)) { this.state = 'ATTACK'; this.t = 0; }
        break;
      }
      case 'ATTACK':
        if (dist > 2.6 && this.kind !== 'boss') this.state = 'CHASE';
        else if (dist > 5 && this.kind === 'boss') this.state = 'CHASE';
        else if (this.t > (this.kind === 'boss' ? 1.1 : 0.9)) {
          this.t = 0;
          // telegrafia do boss: pulso visual antes do dano
          if (this.kind === 'boss') {
            this.mesh.scale.set(1.25, 0.8, 1.25);
            setTimeout(() => this.mesh.scale.set(1, 1, 1), 180);
            if (dist < 5.5) player.damage(this.phase === 2 ? 8 : 5, 'fisico');
            // fase 2 abaixo de 50%
            if (this.hp < this.maxHp / 2 && this.phase === 1) { this.phase = 2; this.speed *= 1.3; }
            // ataque em anel: cospe brasas (partículas lógicas: dano se perto)
            if (this.phase === 2 && Math.random() < 0.4 && dist < 9) player.damage(2, 'fogo');
          } else if (dist < 2.4) player.damage(this.dmg, 'fisico');
        }
        break;
      case 'SEARCH':
        this._walk(dt, this.dir + dt, this.speed * 0.5);
        if (sees) this.state = 'CHASE';
        else if (this.t > 5) { this.state = 'IDLE'; this.t = 0; }
        break;
      case 'RETREAT':
        this._walk(dt, Math.atan2(-dx, -dz), this.speed);
        if (this.t > 3) { this.state = 'IDLE'; this.t = 0; }
        break;
    }
    // animação procedural (balanço / asas)
    const s = Math.sin(this.anim);
    if (this.parts.legs) this.parts.legs.forEach((l, i) => { l.position.y += 0; l.rotation.x = s * 0.5 * (i % 2 ? 1 : -1); });
    if (this.parts.wings) this.parts.wings.forEach((w, i) => { w.rotation.z = s * 0.6 * (i ? 1 : -1); });
    if (this.kind === 'ave' || this.kind === 'vespa') {
      // voo: mantém altura
      const groundY = this.groundY(p.x, p.z, dt);
      const wantY = groundY + (this.kind === 'vespa' ? 2.5 : 5);
      p.y += (wantY - p.y) * Math.min(1, dt * 2);
    } else {
      // gravidade simples
      const gy = this.groundY(p.x, p.z, dt);
      if (p.y > gy) p.y = Math.max(gy, p.y - dt * 12);
      else p.y = gy;
    }
  }
  groundY(x, z, dt) {
    this._gyT -= dt || 0;
    if (this._gy === null || this._gyT <= 0) { this._gy = this._groundY(x, z); this._gyT = 0.5; }
    return this._gy;
  }
  _groundY(x, z) {
    for (let y = 70; y > 0; y--) if (this.world.isSolid(Math.floor(x), y, Math.floor(z))) return y + 1;
    return 30;
  }
  _walk(dt, angle, sp, face = true) {
    const p = this.mesh.position;
    const nx = p.x + Math.sin(angle) * sp * dt, nz = p.z + Math.cos(angle) * sp * dt;
    // evita entrar em bloco sólido
    if (!this.world.isSolid(Math.floor(nx), Math.floor(p.y + 0.3), Math.floor(nz)) && !this.world.isSolid(Math.floor(nx), Math.floor(p.y + 1), Math.floor(nz))) {
      p.x = nx; p.z = nz;
    } else this.dir = Math.random() * Math.PI * 2;
    if (face) this.mesh.rotation.y = angle;
  }
  hurt(n) {
    this.hp -= n;
    // flash
    this.mesh.scale.set(1.15, 1.15, 1.15);
    setTimeout(() => this.mesh.scale.set(1, 1, 1), 120);
    if (this.hp <= 0 && !this.dead) { this.dead = true; return true; }
    if (!this.hostile && this.hp < this.maxHp) { this.state = 'RETREAT'; this.t = 0; }
    return false;
  }
  dispose() { this.scene.remove(this.mesh); }
}
export class EntityManager {
  constructor(scene, world) {
    this.scene = scene; this.world = world; this.list = [];
    this.spawnT = 0; this.boss = null;
  }
  spawnInitial(px, pz) {
    for (let i = 0; i < 7; i++) {
      const x = px + (Math.random() - 0.5) * 60, z = pz + (Math.random() - 0.5) * 60;
      const kind = ['saltideo', 'saltideo', 'javali', 'ave'][i % 4];
      this.add(kind, x, 40, z);
    }
    // NPC andarilho perto do spawn
    this.add('npc', px + 6, 40, pz + 4);
  }
  add(kind, x, y, z, opts) {
    const c = new Creature(this.scene, this.world, kind, x, y, z, opts);
    c.mesh.position.y = c._groundY(x, z);
    this.list.push(c); return c;
  }
  spawnBoss(x, z) {
    if (this.boss && !this.boss.dead) return this.boss;
    const b = this.add('boss', x, 40, z, { hp: 220, speed: 2.4, dmg: 6 });
    this.boss = b; return b;
  }
  update(dt, player, isNight, inIgneo, cap = 24) {
    this.spawnT += dt;
    // spawns naturais com limite (otimização: teto de entidades)
    if (this.spawnT > 6 && this.list.length < cap) {
      this.spawnT = 0;
      const a = Math.random() * Math.PI * 2, r = 25 + Math.random() * 20;
      const x = player.pos.x + Math.sin(a) * r, z = player.pos.z + Math.cos(a) * r;
      let kind = 'saltideo';
      const roll = Math.random();
      if (inIgneo) kind = roll < 0.6 ? 'vespa' : 'sombra';
      else if (isNight) kind = roll < 0.55 ? 'sombra' : roll < 0.75 ? 'javali' : 'saltideo';
      else kind = roll < 0.4 ? 'saltideo' : roll < 0.65 ? 'javali' : 'ave';
      this.add(kind, x, 40, z);
    }
    for (const c of this.list) c.update(dt, player, isNight, inIgneo);
    // remove mortos (mantém NPC)
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (this.list[i].dead && this.list[i].kind !== 'npc') {
        this.list[i].dispose(); this.list.splice(i, 1);
      }
    }
  }
}
