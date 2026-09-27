import * as THREE from 'three';
import { clamp } from '../core/utils.js';

// Jogador em primeira pessoa: WASD + mouse (pointer lock) + touch (joystick).
// Física própria otimizada para voxel (AABB x blocos), sem motor pesado.
export class Player {
  constructor(scene, world, opts = {}) {
    this.scene = scene; this.world = world;
    this.pos = new THREE.Vector3(8.5, 40, 8.5);
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.onGround = false;
    this.hp = 20; this.maxHp = 20;
    this.hunger = 20; this.stamina = 20;
    this.xp = 0; this.level = 1;
    this.fly = !!opts.fly; this.creative = !!opts.creative;
    this.speed = 4.4;
    this.keys = {};
    this.touch = { mx: 0, mz: 0, jump: false, sprint: false };
    this.camera = new THREE.PerspectiveCamera(opts.fov || 75, innerWidth / innerHeight, 0.1, 600);
    scene.add(this.camera);
    // "mão"/ferramenta visível (caixa estilizada original)
    const g = new THREE.BoxGeometry(0.12, 0.12, 0.5);
    const m = new THREE.MeshLambertMaterial({ color: 0x9c7040 });
    this.hand = new THREE.Mesh(g, m);
    this.hand.position.set(0.35, -0.32, -0.6);
    this.camera.add(this.hand);
    this.swing = 0;
    this._bindKeys();
    this.half = { x: 0.3, y: 0.9, z: 0.3 }; // meio-tamanho (altura total 1.8)
  }
  _bindKeys() {
    addEventListener('keydown', e => { this.keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    });
  }
  look(dx, dy, sens = 0.0025) {
    this.yaw -= dx * sens; this.pitch -= dy * sens;
    this.pitch = clamp(this.pitch, -1.55, 1.55);
  }
  get eye() { return new THREE.Vector3(this.pos.x, this.pos.y + 1.62, this.pos.z); }
  get dir() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
  }
  collideAt(px, py, pz) {
    const h = this.half;
    const x0 = Math.floor(px - h.x), x1 = Math.floor(px + h.x);
    const y0 = Math.floor(py - h.y), y1 = Math.floor(py + h.y);
    const z0 = Math.floor(pz - h.z), z1 = Math.floor(pz + h.z);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
      if (this.world.isSolid(x, y, z)) {
        // AABB do bloco vs jogador
        if (px + h.x > x && px - h.x < x + 1 && py + h.y > y && py - h.y < y + 1 && pz + h.z > z && pz - h.z < z + 1) return true;
      }
    }
    return false;
  }
  inLiquid() {
    const id = this.world.getBlock(Math.floor(this.pos.x), Math.floor(this.pos.y + 0.4), Math.floor(this.pos.z));
    return id === 18 || id === 19;
  }
  update(dt) {
    const k = this.keys, t = this.touch;
    const sprint = k['ShiftLeft'] || k['ShiftRight'] || t.sprint;
    const sneak = k['ControlLeft'];
    let f = (k['KeyW'] ? 1 : 0) - (k['KeyS'] ? 1 : 0) + (-t.mz);
    let s = (k['KeyD'] ? 1 : 0) - (k['KeyA'] ? 1 : 0) + (t.mx);
    f = clamp(f, -1, 1); s = clamp(s, -1, 1);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let dx = (-sin * f + cos * s), dz = (-cos * f - sin * s);
    const len = Math.hypot(dx, dz) || 1;
    const spd = this.fly ? 10 : (sprint ? 6.5 : 4.4) * (sneak ? 0.5 : 1);
    dx = dx / len * spd * Math.min(1, Math.hypot(f, s));
    dz = dz / len * spd * Math.min(1, Math.hypot(f, s));
    const liquid = this.inLiquid();
    if (this.fly) {
      this.vel.x = dx; this.vel.z = dz;
      this.vel.y = ((k['Space'] || t.jump) ? 8 : 0) + ((k['ShiftLeft'] ? 0 : 0)) + (sneak ? -8 : 0);
      if (k['KeyE'] && false) {} // E reserva inventário (tratado na UI)
    } else if (liquid) {
      this.vel.x += (dx * 0.6 - this.vel.x) * Math.min(1, dt * 6);
      this.vel.z += (dz * 0.6 - this.vel.z) * Math.min(1, dt * 6);
      this.vel.y += ((k['Space'] || t.jump) ? 30 * dt : -12 * dt);
      this.vel.y = clamp(this.vel.y, -4, 4);
    } else {
      this.vel.x = dx; this.vel.z = dz;
      this.vel.y -= 26 * dt;
      if ((k['Space'] || t.jump) && this.onGround) { this.vel.y = 8.6; this.onGround = false; }
      if (this.vel.y < -30) this.vel.y = -30;
    }
    // integra com resolução de colisão por eixo
    this._moveAxis(dt, this.vel.x, 0, 0);
    this._moveAxis(dt, 0, this.vel.y, 0);
    this._moveAxis(dt, 0, 0, this.vel.z);
    // fome/stamina suaves
    if (sprint && (f || s)) this.stamina = Math.max(0, this.stamina - dt * 1.2);
    else this.stamina = Math.min(20, this.stamina + dt * 1.5);
    // câmera
    this.camera.position.copy(this.eye);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw; this.camera.rotation.x = this.pitch;
    // animação da mão
    this.swing = Math.max(0, this.swing - dt * 6);
    this.hand.rotation.x = -this.swing * 1.2;
    this.hand.position.z = -0.6 - this.swing * 0.15;
    // void / lava dano tratado no Game
    if (this.pos.y < -10) { this.pos.y = 40; this.vel.set(0, 0, 0); this.damage(5, 'queda'); }
  }
  _moveAxis(dt, vx, vy, vz) {
    const step = 1;
    let mx = vx * dt, my = vy * dt, mz = vz * dt;
    // subdivide para não atravessar
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(mx), Math.abs(my), Math.abs(mz)) / 0.2));
    for (let i = 0; i < n; i++) {
      const sx = mx / n, sy = my / n, sz = mz / n;
      const nx = this.pos.x + sx, ny = this.pos.y + sy, nz = this.pos.z + sz;
      if (!this.collideAt(nx, ny, nz)) { this.pos.set(nx, ny, nz); }
      else {
        if (sy < 0) { this.onGround = true; }
        if (sy !== 0) this.vel.y = 0;
        break;
      }
    }
    if (vy === 0 && vz === 0 && vx === 0) {}
    if (Math.abs((vy || 0) * dt) < 1e-6) { /* mantém onGround por checagem */ }
    // revalida chão
    if (vy <= 0.01) {
      const p = this.pos.clone(); p.y -= 0.05;
      // checa bloco logo abaixo dos pés
      const below = this.world.isSolid(Math.floor(p.x), Math.floor(p.y - this.half.y), Math.floor(p.z));
      if (!below && vy === 0 && vz === 0 && vx !== 0) {} // correndo no ar: nada
      if (vy !== 0) {} else this.onGround = !!below;
    }
  }
  damage(n, type = 'fisico') {
    if (this.creative) return;
    if (type === 'queda' && this.fly) return;
    this.hp = Math.max(0, this.hp - n);
  }
  heal(n) { this.hp = Math.min(this.maxHp, this.hp + n); }
  addXp(n) {
    this.xp += n;
    const need = this.level * 20;
    if (this.xp >= need) { this.xp -= need; this.level++; this.heal(4); return true; }
    return false;
  }
}
