import { settings } from './settings.js?v=29';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this._init = false;
    this._windInterval = null;
    this.master = null;
    this._volume = settings.get('volume');
    settings.onChange('volume', v => this.setVolume(v));
    document.addEventListener('click', () => this._ensure(), { once: true });
  }

  _ensure() {
    if (this._init) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Master gain — every sound routes through this so volume is global.
    this.master = this.ctx.createGain();
    this.master.gain.value = this._volume;
    this.master.connect(this.ctx.destination);
    this._init = true;
    this._startWind();
  }

  setVolume(v) {
    this._volume = v;
    if (this.master) this.master.gain.value = v;
  }

  _noise(dur = 0.05, freq = 200, type = 'triangle', vol = 0.15, decay = 0.05) {
    if (!this._init) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.master);
    osc.type = type; osc.frequency.value = freq;
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t); osc.stop(t + dur + 0.01);
  }

  _click(freq, dur, vol = 0.2) {
    if (!this._init) return;
    const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    const src = this.ctx.createBufferSource();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = 2;
    src.connect(filt); filt.connect(gain); gain.connect(this.master);
    gain.gain.value = vol;
    src.start();
  }

  playStep() { this._click(300 + Math.random()*200, 0.08, 0.12); }
  playJump() { this._noise(0.15, 400, 'sine', 0.2, 0.12); }

  playBreak(block) {
    const freq = block <= 3 ? 200 : 400;
    this._click(freq, 0.12, 0.25);
    this._noise(0.08, freq*0.5, 'square', 0.1, 0.06);
  }

  playPlace() {
    this._click(600, 0.05, 0.18);
    this._noise(0.04, 800, 'sine', 0.1, 0.03);
  }

  // Mob vocalisations — freq varies per species
  playMob(type) {
    const map = { cow:140, sheep:300, pig:220, chicken:680, zombie:90, skeleton:520, creeper:160 };
    const f = map[type] || 200;
    this._noise(0.22, f, type==='chicken'?'square':'sawtooth', 0.14, 0.2);
    this._noise(0.18, f*0.7, 'triangle', 0.08, 0.16);
  }
  playHurt() { this._noise(0.12, 160, 'square', 0.18, 0.1); }
  playFuse() { this._noise(0.1, 1200, 'sine', 0.1, 0.08); }
  playExplode() {
    this._click(80, 0.5, 0.5);
    this._noise(0.4, 60, 'sawtooth', 0.3, 0.38);
  }

  _startWind() {
    const makeWind = () => {
      if (!this._init) return;
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 3, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let v = 0;
      for (let i = 0; i < data.length; i++) { v += (Math.random() - 0.5) * 0.05; v *= 0.99; data[i] = v; }
      const src = this.ctx.createBufferSource();
      const filt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      filt.type = 'lowpass'; filt.frequency.value = 600;
      src.connect(filt); filt.connect(gain); gain.connect(this.master);
      gain.gain.value = 0.03;
      src.start();
    };
    makeWind();
    this._windInterval = setInterval(makeWind, 5000);
  }
}
