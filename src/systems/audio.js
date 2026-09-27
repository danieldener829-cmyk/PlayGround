// Áudio 100% procedural (WebAudio): nenhum sample externo, tudo sintetizado.
// Sons: quebrar, colocar, passos, água, lava, chuva, combate, UI, crafting, XP.
export class AudioSys {
  constructor() {
    this.ctx = null; this.master = null; this.musicGain = null;
    this.volume = 0.7; this.musicVol = 0.35; this.muted = false;
    this.rainNode = null;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVol;
    this.musicGain.connect(this.master);
    this.startAmbience();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; }
  _tone(freq, dur, type = 'square', vol = 0.2, slide = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  _noise(dur, vol = 0.2, low = 400, high = 2000) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = (low + high) / 2; f.Q.value = 0.8;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t);
  }
  breakB() { this._noise(0.18, 0.35, 300, 1200); this._tone(140, 0.12, 'triangle', 0.15, -60); }
  place() { this._tone(220, 0.08, 'square', 0.12, 40); }
  step() { this._noise(0.07, 0.08, 500, 1500); }
  splash() { this._noise(0.3, 0.2, 800, 3000); }
  hurt() { this._tone(180, 0.2, 'sawtooth', 0.2, -100); }
  hit() { this._noise(0.1, 0.25, 1000, 4000); }
  eat() { this._noise(0.12, 0.2, 400, 900); }
  craft() { this._tone(520, 0.1, 'sine', 0.15, 200); setTimeout(() => this._tone(780, 0.12, 'sine', 0.15), 90); }
  smelt() { this._noise(0.25, 0.1, 200, 600); }
  xp() { this._tone(880, 0.15, 'sine', 0.12, 440); }
  ui() { this._tone(660, 0.06, 'sine', 0.1); }
  portal() { this._tone(120, 0.6, 'sawtooth', 0.15, 400); }
  boss() { this._tone(70, 0.8, 'sawtooth', 0.3, -20); }
  // música ambiente generativa original (pentatônica, lenta)
  startAmbience() {
    const scale = [220, 246.9, 277.2, 329.6, 369.9, 440];
    const loop = () => {
      if (!this.ctx) return;
      if (!this.muted && Math.random() < 0.8) {
        const f = scale[(Math.random() * scale.length) | 0];
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.06 * this.musicVol * 3, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4);
        o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + 4.2);
      }
      setTimeout(loop, 3500 + Math.random() * 3500);
    };
    loop();
  }
  setRain(on) {
    if (!this.ctx) return;
    if (on && !this.rainNode) {
      const len = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
      const g = this.ctx.createGain(); g.gain.value = 0.03;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
      this.rainNode = { src, g };
    } else if (!on && this.rainNode) {
      try { this.rainNode.src.stop(); } catch {}
      this.rainNode = null;
    }
  }
}
