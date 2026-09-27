import * as THREE from 'three';
import { Noise2D, smoothNoise3, seedFromString, clamp } from '../core/utils.js';
import { BLOCKS, BLOCK_NAME_TO_ID, BIOMES } from '../data/content.js';

export const CHUNK = 16, WORLD_H = 72, SEA = 24;
const idx = (x, y, z) => (y * CHUNK + z) * CHUNK + x;

// Atlas procedural original: 8x4 tiles de 32px
function makeAtlas() {
  const cols = 8, rows = 4, t = 32;
  const cv = document.createElement('canvas'); cv.width = cols * t; cv.height = rows * t;
  const g = cv.getContext('2d');
  const ids = Object.keys(BLOCKS).map(Number).sort((a, b) => a - b);
  // PRNG visual fixo (independe da seed do mundo — identidade visual própria)
  let s = 1234567; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (const id of ids) {
    const b = BLOCKS[id];
    const tx = (id % cols) * t, ty = ((id / cols) | 0) * t;
    const base = b.colors[0] || '#888888';
    g.fillStyle = base; g.fillRect(tx, ty, t, t);
    // textura pixelada original: speckles + faixas (margem de 3px: evita sangrar no mipmap)
    for (let i = 0; i < 46; i++) {
      const px = tx + 3 + ((rnd() * (t - 8)) | 0), py = ty + 3 + ((rnd() * (t - 8)) | 0);
      g.fillStyle = b.colors[(rnd() * b.colors.length) | 0];
      g.globalAlpha = 0.55; g.fillRect(px, py, 2, 2); g.globalAlpha = 1;
    }
    if (id === 1) { // grama: topo verde, faixa terra embaixo (lateral usa mesmo tile; ok estilizado)
      g.fillStyle = '#6abe4f'; g.fillRect(tx, ty, t, 10);
      g.fillStyle = '#5d8a3c'; g.fillRect(tx, ty + 10, t, 3);
    }
    if (id === 18) { g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 6; i++) g.fillRect(tx + rnd() * t, ty + rnd() * t, 6, 2); }
    if (id === 12 || id === 26) { g.fillStyle = '#ffffff'; for (let i = 0; i < 8; i++) g.fillRect(tx + rnd() * t, ty + rnd() * t, 3, 3); }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, cols, rows };
}
function tileUV(id, cols, rows) {
  const tx = id % cols, ty = ((id / cols) | 0);
  // inset de 1px para não sangrar tiles vizinhos na filtragem/mipmap
  const pxU = 1 / (cols * 32), pxV = 1 / (rows * 32);
  const x0 = tx / cols + pxU, x1 = (tx + 1) / cols - pxU;
  const y1 = 1 - ty / rows - pxV, y0 = 1 - (ty + 1) / rows + pxV;
  return [x0, y0, x1, y1];
}

export class World {
  constructor(scene, seedStr) {
    this.scene = scene;
    this.seed = seedFromString(seedStr);
    this.nHeight = new Noise2D(this.seed ^ 0x1111);
    this.nTemp = new Noise2D(this.seed ^ 0x2222);
    this.nMoist = new Noise2D(this.seed ^ 0x3333);
    this.nCave = this.seed ^ 0x4444;
    this.chunks = new Map(); // "cx,cz" -> {cx,cz,data,opaque,trans,dirty}
    this.modified = new Map(); // "x,y,z" -> id (para save + persistência sobre regeneração)
    this.genCache = new Map(); // memoização de dados gerados (evita regenerar vizinhos)
    this.queue = [];
    this.renderDist = 4;
    const { tex, cols, rows } = makeAtlas();
    this.atlas = tex; this.atlasCols = cols; this.atlasRows = rows;
    this.matOpaque = new THREE.MeshLambertMaterial({ map: tex });
    this.matTrans = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.85, alphaTest: 0.05, side: THREE.DoubleSide });
    this.group = new THREE.Group(); scene.add(this.group);
  }
  key(cx, cz) { return cx + ',' + cz; }
  chunkCoords(wx, wz) { return [Math.floor(wx / CHUNK), Math.floor(wz / CHUNK)]; }
  isIgneo(wx, wz) { // dimensão/região especial: faixa distante no eixo X (portal leva até lá)
    return wx > 8000 && wx < 9000;
  }
  biomeAt(wx, wz) {
    if (this.isIgneo(wx, wz)) return BIOMES.find(b => b.id === 'vulcanica');
    const t = this.nTemp.fbm(wx * 0.008, wz * 0.008, 3) * 0.5 + 0.5;
    const m = this.nMoist.fbm(wx * 0.01 + 500, wz * 0.01, 3) * 0.5 + 0.5;
    const h = this.heightAt(wx, wz);
    if (h < SEA - 2) return BIOMES[0];
    if (h <= SEA + 1) return BIOMES[1];
    let best = BIOMES[3], bd = 1e9;
    for (const b of BIOMES) {
      if (b.id === 'oceano' || b.id === 'praia') continue;
      const d = Math.abs(b.temp - t) * 1.4 + Math.abs(b.moist - m);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  heightAt(wx, wz) {
    if (this.isIgneo(wx, wz)) {
      const h = this.nHeight.fbm(wx * 0.02, wz * 0.02, 4);
      return Math.floor(30 + h * 10 + Math.abs(this.nHeight.fbm(wx * 0.05, wz * 0.05, 2)) * 12);
    }
    const base = this.nHeight.fbm(wx * 0.012, wz * 0.012, 4);
    const mont = Math.max(0, this.nHeight.fbm(wx * 0.004 + 900, wz * 0.004, 3));
    let h = 28 + base * 10 + Math.pow(mont, 2) * 34;
    return Math.floor(clamp(h, 4, WORLD_H - 12));
  }
  genColumn(wx, wz) {
    // retorna {h, biome}
    return { h: this.heightAt(wx, wz), biome: this.biomeAt(wx, wz) };
  }
  getChunkData(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (c) return c.data;
    const g = this.genCache.get(k);
    if (g) return g;
    const data = new Uint8Array(CHUNK * WORLD_H * CHUNK);
    for (let lx = 0; lx < CHUNK; lx++) for (let lz = 0; lz < CHUNK; lz++) {
      const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
      const { h, biome } = this.genColumn(wx, wz);
      const surfId = BLOCK_NAME_TO_ID[biome.surface] ?? 1;
      const groundId = BLOCK_NAME_TO_ID[biome.ground] ?? 2;
      for (let y = 0; y <= h; y++) {
        let id = 3; // pedra base
        if (y === h) id = h <= SEA + 1 && biome.id !== 'oceano' ? (biome.id === 'tundra' ? 20 : surfId) : surfId;
        else if (y > h - 4) id = groundId;
        if (y === 0) id = 3;
        // oceanos / lagos
        if (y > h && y <= SEA && h < SEA) id = 18;
        // cavernas: carve com ruído 3D (raras e grandes em bandas)
        if (y < h - 3 && y > 2) {
          const n = smoothNoise3(wx * 0.045, y * 0.06, wz * 0.045, this.nCave);
          const n2 = smoothNoise3(wx * 0.012 + 300, y * 0.02, wz * 0.012, this.nCave ^ 0x99);
          if ((n * n + n2 * n2) < 0.012) id = 0;
          // salões raros
          const big = smoothNoise3(wx * 0.008, y * 0.015, wz * 0.008, this.nCave ^ 0x55);
          if (y < 20 && big > 0.72) id = 0;
        }
        // lava profunda
        if (id === 0 && y <= 8 && smoothNoise3(wx * 0.05, 0, wz * 0.05, this.nCave ^ 7) > 0.35) { /* mantém ar */ }
        else if (y <= 6 && id === 3 && hashCave(wx, y, wz, this.seed)) id = y <= 4 ? 19 : id;
        // minérios (profundidade + ruído)
        if (id === 3) {
          const r = pseudo(wx, y, wz, this.seed);
          if (y < 40 && r < 0.018) id = 8;
          else if (y < 30 && r > 0.982 && r < 0.996) id = 9;
          else if (y < 22 && r > 0.994) id = 10;
          else if (y < 14 && smoothNoise3(wx * 0.09, y * 0.09, wz * 0.09, this.seed ^ 0x77) > 0.62) id = 11;
          else if (y < 16 && smoothNoise3(wx * 0.11, y * 0.11, wz * 0.11, this.seed ^ 0x5a) > 0.7) id = 13;
          if (this.isIgneo(wx, wz) && r < 0.03) id = 12;
        }
        // superfície ígnea: lava exposta + cristais
        if (this.isIgneo(wx, wz) && y === h && pseudo(wx, 1, wz, (this.seed ^ 3) >>> 0) < 0.04) id = 19;
        if (id !== 0) data[idx(lx, y, lz)] = id;
      }
      // água do mar já tratada; lava superficial ígnea:
      if (this.isIgneo(wx, wz)) {
        const hh = h;
        if (hh < 28) for (let y = hh + 1; y <= 28; y++) data[idx(lx, y, lz)] = 19;
      }
      // árvores procedurais (determinístico por coluna)
      const rT = pseudo(wx, 7, wz, this.seed ^ 0xabc);
      if (rT < biome.tree && h > SEA + 1 && h < WORLD_H - 14) {
        const th = 4 + (pseudo(wx, 9, wz, this.seed) * 3 | 0);
        for (let y = h + 1; y <= h + th; y++) data[idx(lx, y, lz)] = 6;
        for (let dy = th - 2; dy <= th + 1; dy++) {
          const rad = dy <= th - 1 ? 2 : 1;
          for (let ox = -rad; ox <= rad; ox++) for (let oz = -rad; oz <= rad; oz++) {
            if (Math.abs(ox) === rad && Math.abs(oz) === rad && pseudo(wx + ox, h + dy, wz + oz, this.seed) < 0.6) continue;
            this._safeSet(data, cx, cz, wx + ox, h + dy, wz + oz, 7);
          }
        }
      }
      // estruturas raras por chunk (ruína / torre / templo)
      // (posicionadas no centro do chunk com hash)
    }
    // estruturas no nível do chunk
    this._structures(cx, cz, data);
    // aplica blocos modificados (save / edição) — itera só sobre o diff, não sobre o chunk todo
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    for (const [mk, mv] of this.modified) {
      const i1 = mk.indexOf(','), i2 = mk.indexOf(',', i1 + 1);
      const mx = +mk.slice(0, i1), my = +mk.slice(i1 + 1, i2), mz = +mk.slice(i2 + 1);
      if (mx >= x0 && mx < x0 + CHUNK && mz >= z0 && mz < z0 + CHUNK && my >= 0 && my < WORLD_H)
        data[idx(mx - x0, my, mz - z0)] = mv;
    }
    if (this.genCache.size > 256) { const fk = this.genCache.keys().next().value; this.genCache.delete(fk); }
    this.genCache.set(k, data);
    return data;
  }
  _safeSet(data, cx, cz, wx, y, wz, id) {
    const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
    if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= WORLD_H) return; // vizinho: ignora (árvore cortada na borda — aceitável)
    if (data[idx(lx, y, lz)] === 0) data[idx(lx, y, lz)] = id;
  }
  _structures(cx, cz, data) {
    const r = pseudo(cx, 31, cz, (this.seed ^ 0x5bd1) >>> 0);
    const wx0 = cx * CHUNK + 8, wz0 = cz * CHUNK + 8;
    if (this.isIgneo(wx0, wz0)) { // templo ígneo raro
      if (r < 0.02) {
        const h = this.heightAt(wx0, wz0);
        for (let ox = -3; ox <= 3; ox++) for (let oz = -3; oz <= 3; oz++)
          this._safeSetForce(data, cx, cz, wx0 + ox, h + 1, wz0 + oz, 23);
        for (let i = 0; i < 4; i++) this._safeSetForce(data, cx, cz, wx0 - 3 + i * 2, h + 2, wz0 - 3, 22);
        this._safeSetForce(data, cx, cz, wx0, h + 2, wz0, 12);
      }
      return;
    }
    if (r < 0.015) { // torre de pedra
      const h = this.heightAt(wx0, wz0); if (h <= SEA + 1) return;
      for (let y = h + 1; y <= h + 8; y++) for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
        if (ox === 0 && oz === 0 && y < h + 8) continue;
        this._safeSetForce(data, cx, cz, wx0 + ox, y, wz0 + oz, (ox === 0 && oz === 0) ? 22 : 3);
      }
      this._safeSetForce(data, cx, cz, wx0, h + 9, wz0, 12); // tesouro
    } else if (r > 0.985) { // ruína / casa abandonada
      const h = this.heightAt(wx0, wz0); if (h <= SEA + 1) return;
      for (let ox = -2; ox <= 2; ox++) for (let oz = -2; oz <= 2; oz++)
        this._safeSetForce(data, cx, cz, wx0 + ox, h + 1, wz0 + oz, 16);
      for (let ox = -2; ox <= 2; ox++) { this._safeSetForce(data, cx, cz, wx0 + ox, h + 2, wz0 - 2, 6); this._safeSetForce(data, cx, cz, wx0 + ox, h + 2, wz0 + 2, 6); }
    }
  }
  _safeSetForce(data, cx, cz, wx, y, wz, id) {
    const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
    if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= WORLD_H) return;
    data[idx(lx, y, lz)] = id;
  }
  // ---- acesso ----
  getBlock(wx, wy, wz) {
    wy = Math.floor(wy); if (wy < 0 || wy >= WORLD_H) return wy < 0 ? 3 : 0;
    wx = Math.floor(wx); wz = Math.floor(wz);
    const m = this.modified.get(wx + ',' + wy + ',' + wz);
    if (m !== undefined) return m;
    const cx = Math.floor(wx / CHUNK), cz = Math.floor(wz / CHUNK);
    const data = this.getChunkData(cx, cz);
    return data[idx(wx - cx * CHUNK, wy, wz - cz * CHUNK)];
  }
  setBlock(wx, wy, wz, id, record = true) {
    wx = Math.floor(wx); wy = Math.floor(wy); wz = Math.floor(wz);
    if (wy < 0 || wy >= WORLD_H) return false;
    if (record) this.modified.set(wx + ',' + wy + ',' + wz, id);
    const cx = Math.floor(wx / CHUNK), cz = Math.floor(wz / CHUNK);
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) { this.getChunkData(cx, cz); c = this.chunks.get(k); if (!c) return true; }
    c.data[idx(wx - cx * CHUNK, wy, wz - cz * CHUNK)] = id;
    c.dirty = true;
    // vizinhos na borda
    const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
    if (lx === 0) this._markDirty(cx - 1, cz);
    if (lx === 15) this._markDirty(cx + 1, cz);
    if (lz === 0) this._markDirty(cx, cz - 1);
    if (lz === 15) this._markDirty(cx, cz + 1);
    return true;
  }
  _markDirty(cx, cz) { const c = this.chunks.get(this.key(cx, cz)); if (c) c.dirty = true; }
  isSolid(wx, wy, wz) { const id = this.getBlock(wx, wy, wz); return id !== 0 && !!BLOCKS[id]?.solid; }
  // ---- streaming ----
  ensureAround(px, pz) {
    const [pcx, pcz] = this.chunkCoords(px, pz);
    const R = this.renderDist;
    const want = new Set();
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      if (dx * dx + dz * dz > (R + 0.5) * (R + 0.5)) continue;
      want.add(this.key(pcx + dx, pcz + dz));
    }
    for (const k of [...this.chunks.keys()]) {
      if (!want.has(k)) {
        const c = this.chunks.get(k);
        if (c.opaque) { this.group.remove(c.opaque); c.opaque.geometry.dispose(); }
        if (c.trans) { this.group.remove(c.trans); c.trans.geometry.dispose(); }
        this.chunks.delete(k);
      }
    }
    for (const k of want) if (!this.chunks.has(k) && !this.queue.includes(k)) this.queue.push(k);
    // ordena por distância
    this.queue.sort((a, b) => dist2(a, pcx, pcz) - dist2(b, pcx, pcz));
  }
  updateBuildBudget(n = 2) {
    let built = 0;
    // rebuild dirty próximos primeiro
    for (const [, c] of this.chunks) {
      if (c.dirty && built < n) { this.buildChunk(c.cx, c.cz); built++; }
    }
    while (this.queue.length && built < n) {
      const k = this.queue.shift();
      if (this.chunks.has(k)) continue;
      const [cx, cz] = k.split(',').map(Number);
      const data = this.getChunkData(cx, cz);
      this.chunks.set(k, { cx, cz, data, opaque: null, trans: null, dirty: false });
      this.genCache.delete(k);
      this.buildChunk(cx, cz);
      built++;
    }
  }
  buildChunk(cx, cz) {
    const k = this.key(cx, cz);
    const c = this.chunks.get(k); if (!c) return;
    if (c.opaque) { this.group.remove(c.opaque); c.opaque.geometry.dispose(); }
    if (c.trans) { this.group.remove(c.trans); c.trans.geometry.dispose(); }
    const op = this._mesh(c, false), tr = this._mesh(c, true);
    c.opaque = op; c.trans = tr; c.dirty = false;
    if (op) this.group.add(op); if (tr) this.group.add(tr);
  }
  _mesh(c, wantTrans) {
    const pos = [], nrm = [], uv = [], col = [];
    const cols = this.atlasCols, rows = this.atlasRows;
    const gb = (wx, wy, wz) => this.getBlock(wx, wy, wz);
    for (let y = 0; y < WORLD_H; y++) for (let z = 0; z < CHUNK; z++) for (let x = 0; x < CHUNK; x++) {
      const id = c.data[idx(x, y, z)];
      if (id === 0) continue;
      const B = BLOCKS[id]; if (!B) continue;
      const isT = !!(B.transparent || B.liquid);
      if (isT !== wantTrans) continue;
      // oculta faces cercadas
      const wx = c.cx * CHUNK + x, wz = c.cz * CHUNK + z;
      const faces = [
        { d: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], n: [1, 0, 0], s: 0.82 },
        { d: [-1, 0, 0], v: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]], n: [-1, 0, 0], s: 0.82 },
        { d: [0, 1, 0], v: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], n: [0, 1, 0], s: 1.0 },
        { d: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], n: [0, -1, 0], s: 0.55 },
        { d: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], n: [0, 0, 1], s: 0.9 },
        { d: [0, 0, -1], v: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], n: [0, 0, -1], s: 0.9 },
      ];
      for (const f of faces) {
        const nb = gb(wx + f.d[0], y + f.d[1], wz + f.d[2]);
        const NB = BLOCKS[nb];
        let show = false;
        if (nb === 0) show = true;
        else if (wantTrans) show = (!NB.transparent && !NB.liquid) || (nb !== id && (NB.transparent || NB.liquid));
        else show = !!(NB.transparent || NB.liquid);
        if (!show) continue;
        let yOff = 0;
        if (B.liquid && f.d[1] === 1) yOff = -0.15;
        const [u0, v0, u1, v1] = tileUV(id, cols, rows);
        const quad = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        // sombreamento: topo claro, fundo escuro, profundidade das cavernas escurece
        let shade = f.s;
        if (y < 18) shade *= (0.55 + (y / 18) * 0.45);
        if ((B.light || 0) > 0) shade = 1.15;
        const baseI = [0, 1, 2, 0, 2, 3];
        const start = pos.length / 3;
        for (let i = 0; i < 4; i++) {
          pos.push(wx + f.v[i][0], y + f.v[i][1] + (f.v[i][1] === 1 ? yOff : 0), wz + f.v[i][2]);
          nrm.push(...f.n); uv.push(quad[i][0], quad[i][1]);
          col.push(shade, shade, shade);
        }
        for (const i of baseI) { /* índices expandidos abaixo */ }
        this._tmpIndex = this._tmpIndex || [];
        // guardamos índices via ordem de vértices sequencial
        if (!this._idx) this._idx = [];
      }
      // Como usamos geometria não-indexada simplificada, reemitimos por face abaixo:
      // (recolhemos faces já emitidas — abordagem: reconstruir com non-indexed)
      // Para evitar complexidade, o loop acima já empilhou vértices por face; agora
      // convertemos os últimos N vértices em triângulos duplicando na ordem correta.
      // Simplificação: como empilhamos 4 vértices por face visível, expandimos aqui:
      const facesAdded = pos.length / 3 - (this._lastCount || 0);
      // (nada a fazer — usaremos indexação explícita abaixo via reordenação)
      this._lastCount = pos.length / 3;
    }
    if (!pos.length) return null;
    // Converte quads (4 vértices) em triângulos não-indexados
    const P = [], N = [], U = [], C = [];
    for (let q = 0; q < pos.length / 12; q++) {
      const v = [0, 1, 2, 0, 2, 3];
      for (const k of v) {
        const vi = q * 4 + k;
        P.push(pos[vi * 3], pos[vi * 3 + 1], pos[vi * 3 + 2]);
        N.push(nrm[vi * 3], nrm[vi * 3 + 1], nrm[vi * 3 + 2]);
        U.push(uv[vi * 2], uv[vi * 2 + 1]);
        C.push(col[vi * 3], col[vi * 3 + 1], col[vi * 3 + 2]);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const mesh = new THREE.Mesh(geo, wantTrans ? this.matTrans : this.matOpaque);
    mesh.material.vertexColors = true;
    mesh.matrixAutoUpdate = false;
    return mesh;
  }
  // Raycast DDA (retorna {x,y,z,nx,ny,nz,id})
  raycast(origin, dir, maxD = 8) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = dir.x > 0 ? 1 : -1, stepY = dir.y > 0 ? 1 : -1, stepZ = dir.z > 0 ? 1 : -1;
    const tDeltaX = Math.abs(1 / (dir.x || 1e-9)), tDeltaY = Math.abs(1 / (dir.y || 1e-9)), tDeltaZ = Math.abs(1 / (dir.z || 1e-9));
    let tMaxX = (dir.x !== 0 ? ((stepX > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX) : 1e9);
    let tMaxY = (dir.y !== 0 ? ((stepY > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY) : 1e9);
    let tMaxZ = (dir.z !== 0 ? ((stepZ > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ) : 1e9);
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let i = 0; i < 128; i++) {
      const id = this.getBlock(x, y, z);
      if (id !== 0 && id !== 18) return { x, y, z, nx, ny, nz, id, dist: t };
      if (tMaxX < tMaxY && tMaxX < tMaxZ) { x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0; }
      else if (tMaxY < tMaxZ) { y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0; }
      else { z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ; }
      if (t > maxD) return null;
    }
    return null;
  }
  spawnPoint() {
    const h = this.heightAt(8, 8);
    return { x: 8.5, y: h + 2, z: 8.5 };
  }
}
function dist2(k, cx, cz) { const [a, b] = k.split(',').map(Number); return (a - cx) ** 2 + (b - cz) ** 2; }
function pseudo(x, y, z, seed) {
  let h = (seed >>> 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 2246822519) ^ Math.imul(z | 0, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function hashCave(x, y, z, seed) { return pseudo(x >> 1, y >> 1, z >> 1, (seed ^ 0x1a2b) >>> 0) > 0.965; }
