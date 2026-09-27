// Núcleo: PRNG com seed, ruído value-noise 2D/3D, bus de eventos, logger.
// Tudo original, sem dependências externas.
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedFromString(s) {
  if (typeof s === 'number') return s >>> 0;
  if (!s) return (Math.random() * 0xffffffff) >>> 0;
  return xmur3(String(s))();
}
// Value noise 2D com fBm — determinístico por seed
export class Noise2D {
  constructor(seed, cell = 32) {
    this.rand = mulberry32(seed);
    this.perm = new Uint8Array(512);
    const p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = (this.rand() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    this.grad = new Float32Array(256);
    for (let i = 0; i < 256; i++) this.grad[i] = this.rand() * 2 - 1;
  }
  _v(ix, iy) { return this.grad[this.perm[(ix & 255) + this.perm[iy & 255]] & 255]; }
  noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = this._v(ix, iy), b = this._v(ix + 1, iy), c = this._v(ix, iy + 1), d = this._v(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let amp = 1, f = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) { sum += amp * this.noise(x * f, y * f); norm += amp; amp *= gain; f *= lac; }
    return sum / norm;
  }
}
// Hash 3D barato para cavernas (sem tabelas gigantes)
export function hash3(x, y, z, seed) {
  let h = seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 2246822519) ^ Math.imul(z, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function smoothNoise3(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const c000 = hash3(ix, iy, iz, seed), c100 = hash3(ix + 1, iy, iz, seed);
  const c010 = hash3(ix, iy + 1, iz, seed), c110 = hash3(ix + 1, iy + 1, iz, seed);
  const c001 = hash3(ix, iy, iz + 1, seed), c101 = hash3(ix + 1, iy, iz + 1, seed);
  const c011 = hash3(ix, iy + 1, iz + 1, seed), c111 = hash3(ix + 1, iy + 1, iz + 1, seed);
  const x00 = c000 + (c100 - c000) * sx, x10 = c010 + (c110 - c010) * sx;
  const x01 = c001 + (c101 - c001) * sx, x11 = c011 + (c111 - c011) * sx;
  const y0 = x00 + (x10 - x00) * sy, y1 = x01 + (x11 - x01) * sy;
  return (y0 + (y1 - y0) * sz) * 2 - 1;
}
export class EventBus {
  constructor() { this.m = new Map(); }
  on(e, f) { if (!this.m.has(e)) this.m.set(e, new Set()); this.m.get(e).add(f); return () => this.m.get(e).delete(f); }
  emit(e, d) { const s = this.m.get(e); if (s) for (const f of [...s]) { try { f(d); } catch (err) { console.error('[bus]', e, err); } } }
}
export const bus = new EventBus();
export const Logger = {
  logs: [],
  _push(level, ...a) {
    const msg = `[${new Date().toISOString()}] ${level}: ${a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ')}`;
    this.logs.push(msg); if (this.logs.length > 200) this.logs.shift();
    if (level === 'ERROR') console.error(msg); else console.log(msg);
    try {
      const el = document.getElementById('errlog');
      if (el && level === 'ERROR') { el.style.display = 'block'; el.textContent = msg + '\n' + el.textContent.slice(0, 500); }
    } catch {}
  },
  info(...a) { this._push('INFO', ...a); }, warn(...a) { this._push('WARN', ...a); }, error(...a) { this._push('ERROR', ...a); }
};
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
