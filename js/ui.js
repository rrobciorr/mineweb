import { B, BLOCK_PROPS, HOTBAR_BLOCKS } from './blocks.js?v=29';

const BLOCK_COLORS = {
  [B.GRASS]:'#5a9e3a',[B.DIRT]:'#8B5E3C',[B.STONE]:'#888',[B.SAND]:'#C8B274',
  [B.WOOD]:'#7a5c35',[B.LEAVES]:'#2d6e1a',[B.GLASS]:'#8cc8e6',[B.BRICK]:'#b84830',
  [B.SNOW]:'#e8eef5',[B.PLANKS]:'#b08040',
};

export class UI {
  constructor(player) {
    this.player = player;
    this._hotbarEl = document.getElementById('hotbar');
    this._healthEl = document.getElementById('health-bar');
    this._hungerEl = document.getElementById('hunger-bar');
    this._airEl    = document.getElementById('air-bar');
    this._armorEl  = document.getElementById('armor-bar');
    this._xpFill   = document.getElementById('xp-fill');
    this._xpLevel  = document.getElementById('xp-level');
    this._fpsEl    = document.getElementById('fps-counter');
    this._coordEl  = document.getElementById('coord-display');
    this._blockName= document.getElementById('selected-block-name');
    this._buildBars();   // hotbar managed by Inventory
    this._fpsFrames = 0; this._fpsLast = performance.now(); this._fpsVal = 0;
  }

  _buildBars() {
    this._healthEl.innerHTML = Array.from({length:10},(_,i)=>`<span class="heart" data-i="${i}">❤️</span>`).join('');
    this._hungerEl.innerHTML = Array.from({length:10},(_,i)=>`<span class="hunger" data-i="${i}">🍖</span>`).join('');
    if (this._airEl) this._airEl.innerHTML = Array.from({length:10},(_,i)=>`<span class="bubble" data-i="${i}">🫧</span>`).join('');
    if (this._armorEl) this._armorEl.innerHTML = Array.from({length:10},(_,i)=>`<span class="armor" data-i="${i}">🛡️</span>`).join('');
  }

  update(fps, hit) {
    const p = this.player;

    // FPS
    this._fpsFrames++;
    const now = performance.now();
    if (now - this._fpsLast > 500) { this._fpsVal = Math.round(this._fpsFrames / ((now-this._fpsLast)/1000)); this._fpsFrames = 0; this._fpsLast = now; }
    this._fpsEl.textContent = `FPS: ${this._fpsVal}`;

    // Coords
    this._coordEl.textContent = `X:${Math.floor(p.x)} Y:${Math.floor(p.y)} Z:${Math.floor(p.z)}${p.flying?' ✈️':''}`;

    // Health (full hearts out of 10)
    const hp = Math.round(p.health);
    this._healthEl.querySelectorAll('.heart').forEach((h, i) => { h.style.opacity = i < Math.ceil(hp/2) ? 1 : 0.2; });

    // Hunger
    const hg = Math.round(p.hunger);
    this._hungerEl.querySelectorAll('.hunger').forEach((h, i) => { h.style.opacity = i < Math.ceil(hg/2) ? 1 : 0.2; });

    // Armor (10 tarcz, każda = 2 punkty ochrony); ukryj gdy brak zbroi
    if (this._armorEl) {
      const ap = p.armorPoints || 0;
      this._armorEl.style.display = ap > 0 ? '' : 'none';
      if (ap > 0) this._armorEl.querySelectorAll('.armor').forEach((h, i) => { h.style.opacity = i < Math.ceil(ap/2) ? 1 : 0.2; });
    }

    // XP: poziom co 20 pkt, pasek postępu w obrębie poziomu
    if (this._xpFill) {
      const xp = p.xp || 0, lvl = Math.floor(xp / 20), prog = (xp % 20) / 20;
      this._xpFill.style.width = (prog * 100) + '%';
      if (this._xpLevel) this._xpLevel.textContent = lvl;
    }

    // Tlen (bąbelki) — widoczny tylko pod wodą / gdy niepełny
    if (this._airEl) {
      const showAir = p.air < p.maxAir - 0.01;
      this._airEl.style.display = showAir ? '' : 'none';
      if (showAir) {
        const air = Math.ceil(p.air);
        this._airEl.querySelectorAll('.bubble').forEach((b, i) => { b.style.opacity = i < air ? 1 : 0.15; });
      }
    }
  }

  show() { document.getElementById('hud').classList.remove('hidden'); }
  hide() { document.getElementById('hud').classList.add('hidden'); }
}
