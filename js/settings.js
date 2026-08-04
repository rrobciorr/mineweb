// ─── GAME SETTINGS ──────────────────────────────────────────────────────────
// Persisted in localStorage, loaded once at module init. Other modules read
// `settings.values` and call `settings.set(key, val)` to change + persist.

const STORAGE_KEY = 'mc_settings';

const DEFAULTS = {
  renderDistance: 3,   // chunk radius (2..8)
  volume: 1.0,         // master volume 0..1
  fov: 75,             // camera field of view (degrees)
  sensitivity: 0.2,    // mouse sensitivity (×0.01 = rad per pixel)
  brightness: 1.0,     // gamma / world brightness multiplier
  fpsLimit: 0,         // 0 = bez limitu, inaczej docelowy FPS
  hideHud: 0,          // 0 = HUD widoczny, 1 = ukryty
};

const RANGES = {
  renderDistance: { min: 2, max: 8, step: 1 },
  volume:         { min: 0, max: 1, step: 0.05 },
  fov:            { min: 60, max: 110, step: 1 },
  sensitivity:    { min: 0.05, max: 1, step: 0.05 },
  brightness:     { min: 0.5, max: 1.5, step: 0.05 },
  // fpsLimit i hideHud są dyskretne (select / przełącznik) — bez zakresu suwaka.
};

function clamp(key, v) {
  const r = RANGES[key];
  if (!r) return v;
  v = Math.min(r.max, Math.max(r.min, v));
  return v;
}

class Settings {
  constructor() {
    this.values = { ...DEFAULTS };
    this._listeners = {};   // key -> [fn]
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        for (const k of Object.keys(DEFAULTS)) {
          if (typeof data[k] === 'number' && !Number.isNaN(data[k])) {
            this.values[k] = clamp(k, data[k]);
          }
        }
      }
    } catch (e) { /* ignore corrupt storage */ }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values)); } catch (e) {}
  }

  get(key) { return this.values[key]; }
  range(key) { return RANGES[key]; }

  // Set a value, persist, and notify listeners so the change applies live.
  set(key, value) {
    if (!(key in DEFAULTS)) return;
    const v = clamp(key, value);
    this.values[key] = v;
    this.save();
    (this._listeners[key] || []).forEach(fn => fn(v));
  }

  // Subscribe to live changes for a key. Returns nothing; call once at setup.
  onChange(key, fn) {
    (this._listeners[key] = this._listeners[key] || []).push(fn);
  }
}

export const settings = new Settings();
