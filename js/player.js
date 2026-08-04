import { B, BLOCK_PROPS, isRailBlock } from './blocks.js?v=29';
import { CHUNK_SIZE, WORLD_HEIGHT } from './world.js?v=29';

const GRAVITY   = -28;
const JUMP_VEL  = 9;
const WALK_SPD  = 5;
const FLY_SPD   = 12;
const SNEAK_MUL = 0.35;
const PLAYER_W  = 0.6;
const PLAYER_H  = 1.8;
const EYE_H     = 1.62;
const SNEAK_DROP = 0.25;

export class Player {
  constructor(world) {
    this.world = world;
    this.x = 0.5; this.y = 80; this.z = 0.5;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.yaw = 0; this.pitch = 0;
    this.onGround = false;
    this.flying = false;
    this.inWater = false;
    this.inLava = false;
    this.health = 20; this.maxHealth = 20;
    this.hunger = 20; this.maxHunger = 20;
    this.air = 10; this.maxAir = 10;   // tlen (sekundy) do nurkowania
    this._airHurt = 0; this._lavaHurt = 0;
    this._jumpPressed = false;
    this._lastJump = 0;
    this.keys = {};
    this.hotbarSlot = 0;
    this.sneaking = false;
    this.eyeH = EYE_H;
    this.inventory = {};
    this.sprinting = false;
    this.creative = false;      // tryb gry (false = survival)
    this.inputLocked = false;   // true gdy otwarty czat/ekwipunek — blokuje sterowanie
    this.riding = null;         // wagonik, w którym siedzi gracz (blokuje chodzenie)
    this.armorPoints = 0;       // suma ochrony założonej zbroi (ustawiana z main)
    this.xp = 0;                // punkty doświadczenia (suma)
    this._lastW = 0;
    this._fallStartY = this.y;
    this._prevGround = true;
    this._starveAcc = 0;
    this._regenAcc = 0;
    this._registerKeys();
  }

  _registerKeys() {
    document.addEventListener('keydown', e => {
      if (this.inputLocked) return;   // czat/ekwipunek otwarty — nie steruj postacią
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        const now = Date.now();
        if (now - this._lastJump < 250) this.flying = !this.flying;
        this._lastJump = now;
      }
      // podwójne W = sprint
      if (e.code === 'KeyW' && !e.repeat) {
        const now = Date.now();
        if (now - this._lastW < 300) this.sprinting = true;
        this._lastW = now;
      }
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) this.hotbarSlot = n - 1;
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; if (e.code === 'KeyW') this.sprinting = false; });
    document.addEventListener('wheel', e => {
      this.hotbarSlot = (this.hotbarSlot + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    }, { passive: true });
  }

  update(dt) {
    // Jazda wagonikiem: pozycją steruje logika wagonika (main.js), tu tylko
    // pomijamy normalne chodzenie/fizykę i wygaszamy prędkości.
    if (this.riding) {
      this.vx = this.vy = this.vz = 0;
      this.onGround = true;
      this.sneaking = false;
      this.eyeH = EYE_H;
      this.inWater = false; this.inLava = false;
      this._fallStartY = this.y;
      this._hunger(dt);
      return;
    }
    const { keys } = this;
    const shift = keys['ShiftLeft'] || keys['ShiftRight'];
    // Shift = sneak on ground, descend while flying
    this.sneaking = shift && !this.flying;
    this.eyeH = this.sneaking ? EYE_H - SNEAK_DROP : EYE_H;
    // Camera direction (ignoring pitch for movement)
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const speedMul = this.sneaking ? SNEAK_MUL : 1;
    // Sprint: tylko bieg do przodu, bez skradania i przy zapasie głodu
    const fwd = keys['KeyW'] || keys['ArrowUp'];
    if (this.sprinting && (!fwd || this.sneaking || this.hunger <= 0)) this.sprinting = false;
    const sprintMul = (this.sprinting && !this.flying) ? 1.35 : 1;
    const zeroG = this.flying || !this.world.gravity;   // stacja kosmiczna: brak grawitacji
    const inSpace = !this.world.gravity;                // stacja kosmiczna: lot w kierunku patrzenia
    const spd = (zeroG ? FLY_SPD : WALK_SPD) * speedMul * sprintMul;
    let mvx = 0, mvz = 0, mvy = 0;
    if (inSpace) {
      // W kosmosie cały ruch (przód/tył, góra/dół) podąża za kierunkiem patrzenia
      // (yaw + pitch) — jak w kabinie statku, nie tylko po płaszczyźnie poziomej.
      const ldx = Math.cos(this.pitch) * sin, ldy = Math.sin(this.pitch), ldz = Math.cos(this.pitch) * cos;
      // Lokalny wektor „góra" kamery (prostopadły do kierunku patrzenia i do lewej/prawej).
      const upx = -Math.sin(this.pitch) * sin, upy = Math.cos(this.pitch), upz = -Math.sin(this.pitch) * cos;
      if (keys['KeyW'] || keys['ArrowUp'])    { mvx += ldx * spd; mvy += ldy * spd; mvz += ldz * spd; }
      if (keys['KeyS'] || keys['ArrowDown'])  { mvx -= ldx * spd; mvy -= ldy * spd; mvz -= ldz * spd; }
      if (keys['KeyA'] || keys['ArrowLeft'])  { mvx += cos * spd; mvz -= sin * spd; }
      if (keys['KeyD'] || keys['ArrowRight']) { mvx -= cos * spd; mvz += sin * spd; }
      if (keys['Space'])                                { mvx += upx * spd; mvy += upy * spd; mvz += upz * spd; }
      if (shift || keys['ControlLeft'] || keys['KeyC']) { mvx -= upx * spd; mvy -= upy * spd; mvz -= upz * spd; }
    } else {
      if (keys['KeyW'] || keys['ArrowUp'])    { mvx += sin * spd; mvz += cos * spd; }
      if (keys['KeyS'] || keys['ArrowDown'])  { mvx -= sin * spd; mvz -= cos * spd; }
      if (keys['KeyA'] || keys['ArrowLeft'])  { mvx += cos * spd; mvz -= sin * spd; }
      if (keys['KeyD'] || keys['ArrowRight']) { mvx -= cos * spd; mvz += sin * spd; }
    }

    if (zeroG) {
      this.vx = mvx; this.vz = mvz;
      if (inSpace) {
        // Kosmos: pion też z kierunku patrzenia (patrz wyżej) — bez osobnego trybu.
        this.vy = mvy;
      } else {
        // Latanie w zwykłym świecie: pion sterowany bezpośrednio, Space/Shift = czysto pionowo.
        this.vy = 0;
        if (keys['Space']) this.vy = spd;
        if (shift || keys['ControlLeft'] || keys['KeyC']) this.vy = -spd;
      }
    } else {
      this.vx = mvx; this.vz = mvz;
      if (!this.inWater && !this.inLava) {
        this.vy += GRAVITY * dt;
        if (keys['Space'] && this.onGround) { this.vy = JUMP_VEL; this.onGround = false; }
      } else {
        this.vy += GRAVITY * 0.1 * dt;
        if (keys['Space']) this.vy = 3;
        this.vy = Math.max(this.vy, -2);
        this.vx *= 0.7; this.vz *= 0.7;
      }
    }

    this._move(dt);

    // Check water / lava at head and feet
    const headY = Math.floor(this.y + this.eyeH - 0.1);
    const feetY = Math.floor(this.y + 0.1);
    const ix = Math.floor(this.x), iz = Math.floor(this.z);
    const headB = this.world.getBlock(ix, headY, iz);
    const feetB = this.world.getBlock(ix, feetY, iz);
    this.inWater = headB === B.WATER;
    this.inLava  = headB === B.LAVA || feetB === B.LAVA;

    this._fallDamage();
    this._breath(dt);
    this._lavaDamage(dt);
    this._hunger(dt);
  }

  // ── Tlen: pod wodą maleje, na powietrzu szybko wraca; brak tlenu = obrażenia ──
  _breath(dt) {
    if (this.creative) { this.air = this.maxAir; this._airHurt = 0; return; }
    if (this.inWater) {
      this.air = Math.max(0, this.air - dt);
      if (this.air <= 0) {
        this._airHurt += dt;
        if (this._airHurt >= 1) { this._airHurt = 0; this.health = Math.max(0, this.health - 2); }
      }
    } else {
      this.air = Math.min(this.maxAir, this.air + dt * 4);
      this._airHurt = 0;
    }
  }

  // ── Lawa parzy: silne obrażenia dopóki gracz w niej stoi ────────────────────
  _lavaDamage(dt) {
    if (this.creative) { this._lavaHurt = 0; return; }
    if (!this.inLava) { this._lavaHurt = 0; return; }
    this.air = Math.max(0, this.air - dt * 2);   // w lawie też się dusisz
    this._lavaHurt += dt;
    if (this._lavaHurt >= 0.5) { this._lavaHurt = 0; this.health = Math.max(0, this.health - 3); }
  }

  // ── Fall damage: track peak height while airborne, hurt on landing ──────────
  _fallDamage() {
    if (this.creative || this.flying || !this.world.gravity || this.inWater || this.inLava) { this._fallStartY = this.y; this._prevGround = this.onGround; return; }
    if (this.onGround) {
      if (!this._prevGround) {
        const fall = this._fallStartY - this.y;
        if (fall > 3) this.health = Math.max(0, this.health - (fall - 3) * 1.3);
      }
      this._fallStartY = this.y;
    } else if (this.y > this._fallStartY) {
      this._fallStartY = this.y;
    }
    this._prevGround = this.onGround;
  }

  // ── Hunger drain, starvation, regeneration ──────────────────────────────────
  _hunger(dt) {
    if (this.creative) { this.hunger = this.maxHunger; this.health = this.maxHealth; return; }
    const moving = (this.vx || this.vz) && this.onGround;
    const rate = this.sprinting ? 0.14 : (moving ? 0.07 : 0.028);
    this.hunger = Math.max(0, this.hunger - dt * rate);
    if (this.hunger <= 0) {
      this._starveAcc += dt;
      if (this._starveAcc >= 2) { this._starveAcc = 0; this.health = Math.max(0, this.health - 1); }
    } else this._starveAcc = 0;
    // regen while well-fed
    if (this.hunger >= 17 && this.health < this.maxHealth) {
      this._regenAcc += dt;
      if (this._regenAcc >= 3) { this._regenAcc = 0; this.health = Math.min(this.maxHealth, this.health + 1); }
    } else this._regenAcc = 0;
  }

  // Eat one food item from inventory; returns message or null
  eat() {
    const FOODS = { 'Wołowina 🥩':7, 'Wieprzowina 🥓':6, 'Zgniłe mięso 🍖':3 };
    if (this.hunger >= this.maxHunger) return null;
    for (const name in FOODS) {
      if (this.inventory[name] > 0) {
        this.inventory[name]--;
        this.hunger = Math.min(this.maxHunger, this.hunger + FOODS[name]);
        return `Zjedzono ${name}`;
      }
    }
    return null;
  }

  _move(dt) {
    let dx = this.vx * dt, dy = this.vy * dt, dz = this.vz * dt;
    // Sneak edge protection: only when on ground and not flying
    const edgeGuard = this.sneaking && this.onGround && !this.flying;

    // X
    const oldX = this.x;
    this.x += dx;
    if (this._collides()) { this.x = oldX; this.vx = 0; }
    else if (edgeGuard && !this._hasGroundBelow()) { this.x = oldX; this.vx = 0; }

    // Z
    const oldZ = this.z;
    this.z += dz;
    if (this._collides()) { this.z = oldZ; this.vz = 0; }
    else if (edgeGuard && !this._hasGroundBelow()) { this.z = oldZ; this.vz = 0; }

    // Y
    this.y += dy;
    if (this._collides()) {
      if (dy < 0) { this.onGround = true; }
      this.y -= dy; this.vy = 0;
    } else {
      this.onGround = false;
    }

    // Clamp
    this.y = Math.max(1, Math.min(WORLD_HEIGHT - PLAYER_H - 1, this.y));
  }

  // True if any block of the player's footprint has solid ground just below feet
  _hasGroundBelow() {
    const w2 = PLAYER_W / 2;
    const by = Math.floor(this.y - 0.05);
    for (const px of [this.x - w2, this.x + w2])
      for (const pz of [this.z - w2, this.z + w2]) {
        const b = this.world.getBlock(Math.floor(px), by, Math.floor(pz));
        if (b !== B.AIR && BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) return true;
      }
    return false;
  }

  _collides() {
    const w2 = PLAYER_W / 2;
    const x0 = Math.floor(this.x - w2), x1 = Math.floor(this.x + w2);
    const y0 = Math.floor(this.y),       y1 = Math.floor(this.y + PLAYER_H - 0.01);
    const z0 = Math.floor(this.z - w2), z1 = Math.floor(this.z + w2);
    for (let bx = x0; bx <= x1; bx++)
      for (let by = y0; by <= y1; by++)
        for (let bz = z0; bz <= z1; bz++) {
          const b = this.world.getBlock(bx, by, bz);
          if (b !== B.AIR && BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) return true;
        }
    return false;
  }

  // Raycast: returns {wx,wy,wz, nx,ny,nz, dist} or null
  // includeFluids=true → zatrzymuje się też na wodzie/lawie (dla wiadra)
  raycast(maxDist = 5.5, includeFluids = false) {
    const dx = Math.cos(this.pitch) * Math.sin(this.yaw);
    const dy = Math.sin(this.pitch);
    const dz = Math.cos(this.pitch) * Math.cos(this.yaw);
    const ox = this.x, oy = this.y + this.eyeH, oz = this.z;

    let cx = Math.floor(ox), cy = Math.floor(oy), cz = Math.floor(oz);
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;
    const tDX = Math.abs(1/dx) || 1e30;
    const tDY = Math.abs(1/dy) || 1e30;
    const tDZ = Math.abs(1/dz) || 1e30;
    let tMaxX = (dx > 0 ? cx+1-ox : ox-cx) * tDX;
    let tMaxY = (dy > 0 ? cy+1-oy : oy-cy) * tDY;
    let tMaxZ = (dz > 0 ? cz+1-oz : oz-cz) * tDZ;
    let nx = 0, ny = 0, nz = 0;

    for (let i = 0; i < 50; i++) {
      const b = this.world.getBlock(cx, cy, cz);
      const hitFluid = includeFluids && (b === B.WATER || b === B.LAVA);
      // tory są niesolidne (przechodnie), ale celowalne — można je rozbić / stawiać na nich wagonik
      if (b !== B.AIR && ((BLOCK_PROPS[b] && BLOCK_PROPS[b].solid) || isRailBlock(b) || hitFluid)) {
        return { wx:cx, wy:cy, wz:cz, nx, ny, nz };
      }
      let t;
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        t = tMaxX; if (t > maxDist) return null;
        nx = -stepX; ny = 0; nz = 0; cx += stepX; tMaxX += tDX;
      } else if (tMaxY < tMaxZ) {
        t = tMaxY; if (t > maxDist) return null;
        nx = 0; ny = -stepY; nz = 0; cy += stepY; tMaxY += tDY;
      } else {
        t = tMaxZ; if (t > maxDist) return null;
        nx = 0; ny = 0; nz = -stepZ; cz += stepZ; tMaxZ += tDZ;
      }
    }
    return null;
  }

  placeBlock(block) {
    const hit = this.raycast();
    if (!hit) return false;
    const px = hit.wx + hit.nx, py = hit.wy + hit.ny, pz = hit.wz + hit.nz;
    if (py < 1 || py >= WORLD_HEIGHT) return false;
    // Nie stawiaj, jeśli blok [px,px+1]³ faktycznie nachodzi na bryłę gracza.
    // (poprzednia wersja używała zbyt szerokiego testu z `+1`, przez co blokowała
    //  stawianie bloków oddalonych o cały metr — stąd „nie da się postawić na ziemi")
    const w2 = PLAYER_W/2;
    const overlap =
      px < this.x + w2 && px + 1 > this.x - w2 &&
      py < this.y + PLAYER_H && py + 1 > this.y &&
      pz < this.z + w2 && pz + 1 > this.z - w2;
    if (overlap) return false;
    // Nie zastępuj istniejącego bloku stałego (miejsce docelowe musi być puste/zastępowalne).
    const cur = this.world.getBlock(px, py, pz);
    if (cur !== B.AIR && BLOCK_PROPS[cur] && BLOCK_PROPS[cur].solid) return false;
    this.world.setBlock(px, py, pz, block);
    return true;
  }

  breakBlock() {
    const hit = this.raycast();
    if (!hit) return false;
    this.world.setBlock(hit.wx, hit.wy, hit.wz, B.AIR);
    return true;
  }

  getEyePosition() {
    return { x: this.x, y: this.y + this.eyeH, z: this.z };
  }
}
