import * as THREE from 'three';
import { B, BLOCK_PROPS, isRailBlock } from './blocks.js?v=29';
import { railTurn } from './rails.js?v=29';
import { WORLD_HEIGHT } from './world.js?v=29';
import { ITEMS } from './inventory.js?v=29';

const GRAVITY = -24;

// type -> config. col=[body,head] hex, size=[w,h], spd m/s, hp, hostile, dmg, loot
const MOBS = {
  cow:      { col:[0x4a3520,0x6b4e30], size:[0.9,1.3], spd:1.6, hp:10, hostile:false, loot:'Wołowina 🥩' },
  sheep:    { col:[0xe8e8e0,0xd8c8b0], size:[0.9,1.2], spd:1.6, hp:8,  hostile:false, loot:'Wełna 🧶' },
  pig:      { col:[0xe89aa0,0xd87a82], size:[0.9,1.0], spd:1.6, hp:8,  hostile:false, loot:'Wieprzowina 🥓' },
  chicken:  { col:[0xf0f0f0,0xf0d040], size:[0.5,0.7], spd:1.8, hp:4,  hostile:false, loot:'Pióro 🪶' },
  zombie:   { col:[0x3a7a3a,0x4a8050], size:[0.7,1.85],spd:2.2, hp:14, hostile:true, dmg:3, loot:'Zgniłe mięso 🍖', burnSun:true },
  skeleton: { col:[0xd8d8d0,0xe8e8e0], size:[0.7,1.85],spd:2.4, hp:12, hostile:true, dmg:2, loot:'Kość 🦴', burnSun:true, ranged:true },
  creeper:  { col:[0x3aa84a,0x2e8a3c], size:[0.7,1.7], spd:2.0, hp:12, hostile:true, dmg:0, loot:'Proch 💥', creeper:true },
  spider:   { col:[0x3a2320,0x241412], size:[1.1,0.7], spd:3.0, hp:10, hostile:true, dmg:2, loot:'string', neutralDay:true },
};
const PASSIVE = ['cow','sheep','pig','chicken'];
const HOSTILE = ['zombie','skeleton','creeper','spider'];
// Dodatkowy łup poza głównym (klucz przedmiotu)
const EXTRA_LOOT = { cow:'leather' };
// Czym karmi się dane zwierzę, by wejść w tryb godowy
const FEED = { cow:'wheat', sheep:'wheat', pig:'wheat', chicken:'seeds' };

class Mob {
  constructor(type, x, y, z, scene, opts={}) {
    const c = MOBS[type];
    this.type = type; this.cfg = c;
    this.x=x; this.y=y; this.z=z;
    this.vx=0; this.vy=0; this.vz=0;
    this.yaw = Math.random()*Math.PI*2;
    this.hp = c.hp;
    this.onGround = false;
    this.dead = false;
    this.wanderT = 0; this.moveDir = null;
    this.fleeT = 0;
    this.atkCd = 0;
    this.shootCd = 1 + Math.random();   // cooldown strzału (szkielet)
    this.fuse = -1;
    this.voiceT = 2 + Math.random()*6;
    this.baby = !!opts.baby;       // młode – mniejsze, dorasta z czasem
    this.growT = this.baby ? 60 : 0;
    this.loveT = 0;                // tryb godowy (sekundy)
    this.breedCd = 0;              // cooldown po rozmnożeniu
    this._buildMesh(scene);
  }

  _buildMesh(scene) {
    const [w,h] = this.cfg.size;
    const [bodyC, headC] = this.cfg.col;
    this.group = new THREE.Group();
    if (this.baby) this.group.scale.setScalar(0.5);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h*0.62, w*0.7),
      new THREE.MeshBasicMaterial({ color: bodyC })
    );
    body.position.y = h*0.31;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(w*0.7, h*0.34, w*0.6),
      new THREE.MeshBasicMaterial({ color: headC })
    );
    head.position.set(0, h*0.78, w*0.32);
    this.group.add(body, head);
    this.head = head;
    scene.add(this.group);
  }

  removeMesh(scene) { scene.remove(this.group); this.group.traverse(o=>{ if(o.geometry)o.geometry.dispose(); if(o.material)o.material.dispose(); }); }

  syncMesh() {
    this.group.position.set(this.x, this.y, this.z);
    this.group.rotation.y = this.yaw;
  }
}

export class MobManager {
  constructor(world, scene, player, audio) {
    this.world = world; this.scene = scene; this.player = player; this.audio = audio;
    this.mobs = [];
    this.drops = [];
    this.arrows = [];              // lecące strzały
    this.carts = [];              // wagoniki (encje jeżdżące po torach)
    this.spawnT = 1;
    this.onMessage = null;
    this.onXP = null;             // callback zdobycia XP
    this.cap = 30;
    this.isNight = false;
  }

  _solid(x,y,z) {
    const b = this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return b !== B.AIR && BLOCK_PROPS[b] && BLOCK_PROPS[b].solid;
  }

  // Czy nad mobem jest odsłonięte niebo (brak nieprzezroczystych bloków wyżej)?
  _skyExposed(x, y, z) {
    const ix = Math.floor(x), iz = Math.floor(z);
    for (let yy = Math.floor(y + 2); yy < WORLD_HEIGHT; yy++) {
      const b = this.world.getBlock(ix, yy, iz);
      if (b !== B.AIR && BLOCK_PROPS[b] && !BLOCK_PROPS[b].transparent) return false;
    }
    return true;
  }

  _collidesAt(x,y,z,w,h) {
    const w2 = w/2;
    for (let bx=Math.floor(x-w2); bx<=Math.floor(x+w2); bx++)
      for (let by=Math.floor(y); by<=Math.floor(y+h-0.01); by++)
        for (let bz=Math.floor(z-w2); bz<=Math.floor(z+w2); bz++)
          if (this._solid(bx,by,bz)) return true;
    return false;
  }

  // ── spawning ──────────────────────────────────────────────────────────────
  _spawn() {
    if (this.mobs.length >= this.cap) return;
    const p = this.player;
    const ang = Math.random()*Math.PI*2;
    const dist = 14 + Math.random()*14;
    const sx = Math.floor(p.x + Math.cos(ang)*dist);
    const sz = Math.floor(p.z + Math.sin(ang)*dist);
    // find surface
    let sy = -1;
    for (let y=WORLD_HEIGHT-1; y>1; y--) {
      if (this._solid(sx,y,sz)) { sy = y+1; break; }
    }
    if (sy < 2) return;
    const surfBlock = this.world.getBlock(sx, sy-1, sz);
    // 80% passive (in herds), 20% hostile
    const hostile = Math.random() < 0.35;
    if (hostile) {
      if (!this.isNight) return;   // hostiles spawn only at night
      const type = HOSTILE[(Math.random()*HOSTILE.length)|0];
      this.mobs.push(new Mob(type, sx+0.5, sy, sz+0.5, this.scene));
      return;
    }
    if (surfBlock !== B.GRASS && surfBlock !== B.SAND && surfBlock !== B.SNOW) return;
    // passive herd: 3–5 of the same species clustered together
    const type = PASSIVE[(Math.random()*PASSIVE.length)|0];
    const herd = 3 + (Math.random()*3|0);
    for (let i=0; i<herd && this.mobs.length<this.cap; i++) {
      const ox = sx + (Math.random()*5-2.5), oz = sz + (Math.random()*5-2.5);
      let oy = -1;
      for (let y=WORLD_HEIGHT-1; y>1; y--) if (this._solid(ox,y,oz)) { oy=y+1; break; }
      if (oy < 2) continue;
      this.mobs.push(new Mob(type, ox+0.5, oy, oz+0.5, this.scene));
    }
  }

  // ── per-frame ─────────────────────────────────────────────────────────────
  update(dt) {
    const p = this.player;
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 1.5 + Math.random()*2; this._spawn(); }

    for (const m of this.mobs) {
      if (m.dead) continue;
      this._ai(m, dt, p);
      this._physics(m, dt);
      // timery hodowli / dorastania
      if (m.loveT > 0)  m.loveT  -= dt;
      if (m.breedCd > 0) m.breedCd -= dt;
      if (m.baby) { m.growT -= dt; if (m.growT <= 0) { m.baby=false; m.group.scale.setScalar(1); } }
      // nieumarli płoną w świetle dnia (jak w Minecrafcie)
      if (m.cfg.burnSun && !this.isNight && this._skyExposed(m.x, m.y, m.z)) {
        m.burnT = (m.burnT || 0) + dt;
        if (m.burnT >= 1) { m.burnT = 0; m.hp -= 2; if (m.hp <= 0) { this._kill(m); continue; } }
      } else m.burnT = 0;
      m.syncMesh();
      // voice
      m.voiceT -= dt;
      if (m.voiceT <= 0) { m.voiceT = 5+Math.random()*8; this.audio?.playMob(m.type); }
      // despawn if very far
      const dx=m.x-p.x, dz=m.z-p.z;
      if (dx*dx+dz*dz > 80*80) m.dead = true;
    }
    this._breed();
    // remove dead
    for (const m of this.mobs) if (m.dead) m.removeMesh(this.scene);
    this.mobs = this.mobs.filter(m=>!m.dead);

    this._updateArrows(dt, p);
    this._updateDrops(dt, p);
    this._updateCarts(dt);
  }

  // ── Wagoniki ────────────────────────────────────────────────────────────────
  _isRail(x, y, z) {
    return isRailBlock(this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)));
  }
  _railType(x, y, z) {
    return this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  }
  _isPowered(x, y, z) {
    return this.world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)) === B.POWERED_RAIL;
  }

  // Utwórz wagonik na torze (rx,ry,rz = kostka toru). variant: 'rideable'|'chest'|'furnace'|'tnt'.
  spawnCart(rx, ry, rz, variant = 'rideable') {
    const group = new THREE.Group();
    // metaliczna misa (podłoga + 4 sfazowane burty)
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x9099a4 });
    const rimMat  = new THREE.MeshBasicMaterial({ color: 0xb8c0cc });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), bodyMat);
    floor.position.y = 0.18;
    const mkWall = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.position.set(x,y,z); return m; };
    group.add(floor,
      mkWall(0.9,0.34,0.1, 0,0.36, 0.42, bodyMat), mkWall(0.9,0.34,0.1, 0,0.36,-0.42, bodyMat),
      mkWall(0.1,0.34,0.9, 0.42,0.36,0, bodyMat), mkWall(0.1,0.34,0.9,-0.42,0.36,0, bodyMat),
      mkWall(0.98,0.06,0.98, 0,0.53,0, rimMat));   // górna krawędź
    // 4 kółka
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
    for (const [wx,wz] of [[0.34,0.3],[-0.34,0.3],[0.34,-0.3],[-0.34,-0.3]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.08,10), wheelMat);
      wheel.rotation.z = Math.PI/2; wheel.position.set(wx, 0.1, wz);
      group.add(wheel);
    }
    // zawartość wariantu
    if (variant === 'chest') { const m=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.5,0.7), new THREE.MeshBasicMaterial({color:0x8a5a28})); m.position.y=0.5; group.add(m); }
    else if (variant === 'furnace') { const m=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.7), new THREE.MeshBasicMaterial({color:0x555555})); m.position.y=0.55; group.add(m); }
    else if (variant === 'tnt') { const m=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,0.7), new THREE.MeshBasicMaterial({color:0xc0342a})); m.position.y=0.55; group.add(m); }
    this.scene.add(group);
    const cart = {
      x:rx+0.5, y:ry+0.15, z:rz+0.5, speed:0, axis:'x', dir:1, rider:false, group, variant,
      storage: variant==='chest' ? { items:new Array(27).fill(null) } : null,
      fuse: -1, fuel: 0,
    };
    cart.group.position.set(cart.x, cart.y, cart.z);
    this.carts.push(cart);
    return cart;
  }

  // Wagonik, na który patrzy gracz (w zasięgu), albo null.
  pickCart(reach = 3.5) {
    const p = this.player;
    const eye = p.getEyePosition();
    const dx = Math.cos(p.pitch)*Math.sin(p.yaw);
    const dy = Math.sin(p.pitch);
    const dz = Math.cos(p.pitch)*Math.cos(p.yaw);
    let best=null, bestT=reach;
    for (const c of this.carts) {
      const t = rayBox(eye.x,eye.y,eye.z, dx,dy,dz, c.x-0.5,c.y,c.z-0.5, c.x+0.5,c.y+0.9,c.z+0.5);
      if (t!==null && t<bestT) { bestT=t; best=c; }
    }
    return best;
  }

  removeCart(cart) {
    cart.dead = true;
    if (this.player && this.player.riding === cart) this.player.riding = null;   // zsiądź, jeśli w nim był
    this.scene.remove(cart.group);
    this.carts = this.carts.filter(c => c !== cart);
  }

  // Fizyka jazdy wagonika (wywoływana z main, gdy gracz w nim siedzi).
  // keys = player.keys, yaw = kierunek patrzenia. Zwraca true, jeśli jedzie.
  driveCart(cart, dt, keys, yaw) {
    // Tor jest w TEJ SAMEJ komórce co wagonik (płaskie tory)
    const rx = Math.floor(cart.x), ry = Math.floor(cart.y), rz = Math.floor(cart.z);
    if (!this._isRail(rx, ry, rz)) {
      // brak toru — grawitacja / zatrzymanie
      if (cart.y > 1) cart.y -= Math.min(6*dt, cart.y-1);
      cart.speed *= 0.9;
    } else {
      // wykryj oś na podstawie dostępnych sąsiednich torów
      const railX = this._isRail(rx+1,ry,rz) || this._isRail(rx-1,ry,rz);
      const railZ = this._isRail(rx,ry,rz+1) || this._isRail(rx,ry,rz-1);
      if (railX && !railZ) cart.axis = 'x';
      else if (railZ && !railX) cart.axis = 'z';
      // (zakręt: oba — oś zmienia się przy krawędzi komórki, patrz niżej)

      // sterowanie: W przyspiesza w stronę patrzenia (rzut na oś toru), S hamuje
      const look = cart.axis === 'x' ? Math.sin(yaw) : Math.cos(yaw);
      const fwd = keys['KeyW'] || keys['ArrowUp'];
      const back = keys['KeyS'] || keys['ArrowDown'];
      const ACC = 14, MAXV = 8;
      if (fwd)  cart.speed += Math.sign(look || cart.dir) * ACC * dt;
      if (back) cart.speed -= Math.sign(cart.speed || 1) * ACC * dt * 1.4;
      if (this._isPowered(rx,ry,rz) && Math.abs(cart.speed) > 0.2) cart.speed += Math.sign(cart.speed)*ACC*dt;
      cart.speed *= (1 - 0.6*dt);
      cart.speed = Math.max(-MAXV, Math.min(MAXV, cart.speed));
      if (Math.abs(cart.speed) < 0.05) cart.speed = 0;
      if (cart.speed) cart.dir = Math.sign(cart.speed);
    }
    this._moveCart(cart, cart.speed * dt);
    cart.group.position.set(cart.x, cart.y, cart.z);
    return Math.abs(cart.speed) > 0.01;
  }

  // Przesuń wagonik wzdłuż osi z obsługą zakrętów i końca torów.
  _moveCart(cart, move) {
    if (!move) return;
    const ty = Math.floor(cart.y);
    let nx = cart.x, nz = cart.z;
    if (cart.axis === 'x') nx += move; else nz += move;
    if (this._isRail(nx, ty, nz)) { cart.x = nx; cart.z = nz; return; }
    // koniec bieżącego toru — spróbuj zakrętu (spójne z railShape w rendererze)
    const rx = Math.floor(cart.x), rz = Math.floor(cart.z);
    const west=this._isRail(rx-1,ty,rz),  east=this._isRail(rx+1,ty,rz);
    const north=this._isRail(rx,ty,rz-1), south=this._isRail(rx,ty,rz+1);
    const turn = railTurn(cart.axis, cart.dir, west, east, north, south);
    if (turn) {
      cart.x = rx+0.5; cart.z = rz+0.5;
      cart.axis = turn.axis; cart.dir = turn.dir;
      cart.speed = Math.abs(cart.speed) * turn.dir;
      return;
    }
    // brak kontynuacji — dojedź do środka i zatrzymaj
    if (cart.axis === 'x') cart.x = rx+0.5; else cart.z = rz+0.5;
    cart.speed = 0;
  }

  _updateCarts(dt) {
    for (const c of this.carts) {
      const ry = Math.floor(c.y);
      const onRail = this._isRail(c.x, ry, c.z);
      // TNT: na torze aktywującym → zapal lont, potem wybuch
      if (c.variant === 'tnt') {
        if (onRail && this._railType(c.x,ry,c.z) === B.ACTIVATOR_RAIL && c.fuse < 0) c.fuse = 1.2;
        if (c.fuse >= 0) { c.fuse -= dt; if (c.fuse <= 0) { this._explode(c, this.player); this.removeCart(c); continue; } }
      }
      if (c.rider) continue;   // wagonikiem z graczem steruje driveCart()
      // Piec: sam jedzie, dopóki ma paliwo
      if (c.variant === 'furnace' && c.fuel > 0 && onRail) {
        c.fuel -= dt;
        if (Math.abs(c.speed) < 3) c.speed += Math.sign(c.speed||1) * 8 * dt;
        c.speed *= (1 - 0.4*dt);
        this._moveCart(c, c.speed*dt);
        if (c.fuel <= 0) c.speed = 0;
      } else if (!onRail && c.y > 1) {
        // grawitacja, gdy brak toru pod wagonikiem
        c.y = Math.max(1, c.y - Math.min(6*dt, 0.2));
      }
      c.group.position.set(c.x, c.y, c.z);
    }
  }

  // Dwa dorosłe zwierzęta tego samego gatunku w trybie godowym i blisko siebie
  // tworzą młode.
  _breed() {
    if (this.mobs.length >= this.cap) return;
    for (let i=0;i<this.mobs.length;i++) {
      const a = this.mobs[i];
      if (a.dead || a.baby || a.loveT<=0 || a.breedCd>0) continue;
      for (let j=i+1;j<this.mobs.length;j++) {
        const b = this.mobs[j];
        if (b.dead || b.baby || b.loveT<=0 || b.breedCd>0 || b.type!==a.type) continue;
        const dx=a.x-b.x, dz=a.z-b.z;
        if (dx*dx+dz*dz > 9) continue;   // w promieniu 3 bloków
        a.loveT=0; b.loveT=0; a.breedCd=b.breedCd=20;
        const baby = new Mob(a.type, (a.x+b.x)/2, a.y, (a.z+b.z)/2, this.scene, { baby:true });
        this.mobs.push(baby);
        if (this.onMessage) this.onMessage(`🐣 Urodziło się młode (${a.type})`);
        return;   // jedno młode na klatkę
      }
    }
  }

  // Nakarm celowane zwierzę trzymanym przedmiotem. Zwraca true jeśli nakarmiono.
  tryFeed(key, reach = 3.2) {
    if (!key) return false;
    const p = this.player;
    const eye = p.getEyePosition();
    const dirx = Math.cos(p.pitch)*Math.sin(p.yaw);
    const diry = Math.sin(p.pitch);
    const dirz = Math.cos(p.pitch)*Math.cos(p.yaw);
    let best=null, bestT=reach;
    for (const m of this.mobs) {
      if (m.dead || FEED[m.type]!==key) continue;
      const [w,h]=m.cfg.size, w2=w/2;
      const t = rayBox(eye.x,eye.y,eye.z, dirx,diry,dirz, m.x-w2,m.y,m.z-w2, m.x+w2,m.y+h,m.z+w2);
      if (t!==null && t<bestT) { bestT=t; best=m; }
    }
    if (!best) return false;
    if (best.baby) { best.growT = Math.max(0, best.growT - 20); }  // karmienie przyspiesza dorastanie
    else best.loveT = 30;
    this.audio?.playMob(best.type);
    return true;
  }

  // Ostrzyż owcę, na którą patrzy gracz (nożyce). Zwraca true, jeśli udało się.
  tryShear(reach = 3.2) {
    const p = this.player;
    const eye = p.getEyePosition();
    const dirx = Math.cos(p.pitch)*Math.sin(p.yaw);
    const diry = Math.sin(p.pitch);
    const dirz = Math.cos(p.pitch)*Math.cos(p.yaw);
    let best=null, bestT=reach;
    for (const m of this.mobs) {
      if (m.dead || m.type !== 'sheep' || m.shorn) continue;
      const [w,h]=m.cfg.size, w2=w/2;
      const t = rayBox(eye.x,eye.y,eye.z, dirx,diry,dirz, m.x-w2,m.y,m.z-w2, m.x+w2,m.y+h,m.z+w2);
      if (t!==null && t<bestT) { bestT=t; best=m; }
    }
    if (!best) return false;
    best.shorn = true;
    // upuść 1-3 wełny (podnosi je istniejący system dropów)
    const n = 1 + (Math.random()*3|0);
    for (let i=0;i<n;i++) this._spawnDrop(best.x+(Math.random()-0.5)*0.4, best.y+0.5, best.z+(Math.random()-0.5)*0.4, 'Wełna 🧶', '#eaeae2', 'Wełna');
    this.audio?.playMob('sheep');
    return true;
  }

  _ai(m, dt, p) {
    const c = m.cfg;
    const dx = p.x-m.x, dz = p.z-m.z, dy = (p.y+0.9)-m.y;
    const dist = Math.hypot(dx,dz);
    let tx=0, tz=0, run=1;

    // pająki są neutralne w dzień (atakują tylko w nocy)
    const hostileNow = c.hostile && !(c.neutralDay && !this.isNight);
    if (hostileNow && dist < 20) {
      // chase player
      m.yaw = Math.atan2(dx,dz);
      tx = Math.sin(m.yaw); tz = Math.cos(m.yaw);
      // creeper fuse / explode
      if (c.creeper && dist < 2.2) {
        if (m.fuse < 0) { m.fuse = 1.4; }
        m.fuse -= dt;
        if (((m.fuse*6)|0)%2===0) this.audio?.playFuse();
        tx=0; tz=0;
        if (m.fuse <= 0) { this._explode(m, p); return; }
      } else if (c.creeper) { m.fuse = -1; }
      // szkielet: strzela z łuku, trzyma dystans
      if (c.ranged) {
        m.shootCd -= dt;
        if (dist < 6) { tx = -tx; tz = -tz; }        // za blisko → cofa się
        else if (dist < 10) { tx = 0; tz = 0; }      // dobry dystans → stoi i strzela
        if (dist < 16 && m.shootCd <= 0) {
          m.shootCd = 1.6 + Math.random()*0.8;
          this._skeletonShoot(m, p);
        }
      }
      // melee attack
      if (!c.creeper && !c.ranged && dist < 1.6) {
        m.atkCd -= dt;
        if (m.atkCd <= 0) { m.atkCd = 1.0; this._hurtPlayer(c.dmg, dx, dz); }
      }
    } else if (m.fleeT > 0) {
      // flee from player
      m.fleeT -= dt;
      m.yaw = Math.atan2(-dx,-dz);
      tx = Math.sin(m.yaw); tz = Math.cos(m.yaw); run = 1.8;
    } else {
      // wander
      m.wanderT -= dt;
      if (m.wanderT <= 0) {
        m.wanderT = 2 + Math.random()*3;
        if (Math.random() < 0.4) { m.moveDir = null; }
        else { m.yaw = Math.random()*Math.PI*2; m.moveDir = [Math.sin(m.yaw), Math.cos(m.yaw)]; }
      }
      if (m.moveDir) { tx = m.moveDir[0]; tz = m.moveDir[1]; }
    }

    const spd = c.spd * run;
    m.vx = tx * spd; m.vz = tz * spd;
    // jump over 1-block obstacles
    if ((tx||tz) && m.onGround) {
      const ax = m.x + Math.sign(tx)*0.5, az = m.z + Math.sign(tz)*0.5;
      if (this._solid(ax, m.y, az) && !this._solid(Math.floor(m.x), m.y+1, Math.floor(m.z))) m.vy = 7;
    }
  }

  _physics(m, dt) {
    const [w,h] = m.cfg.size;
    m.vy += GRAVITY*dt;
    // X
    const nx = m.x + m.vx*dt;
    if (!this._collidesAt(nx, m.y, m.z, w, h)) m.x = nx; else m.vx=0;
    // Z
    const nz = m.z + m.vz*dt;
    if (!this._collidesAt(m.x, m.y, nz, w, h)) m.z = nz; else m.vz=0;
    // Y
    const ny = m.y + m.vy*dt;
    if (!this._collidesAt(m.x, ny, m.z, w, h)) { m.y = ny; m.onGround=false; }
    else { if (m.vy<0) m.onGround=true; m.vy=0; }
    if (m.y < 1) { m.y = 1; m.onGround = true; m.vy = 0; }
  }

  _explode(m, p) {
    this.audio?.playExplode();
    const cx=Math.floor(m.x), cy=Math.floor(m.y), cz=Math.floor(m.z), R=3;
    for (let x=-R;x<=R;x++)for(let y=-R;y<=R;y++)for(let z=-R;z<=R;z++){
      if (x*x+y*y+z*z > R*R) continue;
      const bx=cx+x, by=cy+y, bz=cz+z;
      const b=this.world.getBlock(bx,by,bz);
      if (b!==B.AIR && b!==B.BEDROCK && BLOCK_PROPS[b]?.solid && BLOCK_PROPS[b].hardness<50) {
        this.world.setBlock(bx,by,bz,B.AIR);
      }
    }
    // damage by distance
    const d = Math.hypot(p.x-m.x, p.y-m.y, p.z-m.z);
    if (d < R+1) this._hurtPlayer(Math.max(2, (R+1-d)*5), p.x-m.x, p.z-m.z);
    if (this.onExplosion) this.onExplosion(cx,cy,cz);
    m.dead = true;
  }

  _hurtPlayer(dmg, dx, dz) {
    const p = this.player;
    if (p.creative) return;   // w creative gracz jest nietykalny
    const reduce = Math.min(0.8, (p.armorPoints || 0) * 0.04);   // zbroja pochłania obrażenia
    p.health = Math.max(0, p.health - dmg * (1 - reduce));
    this.audio?.playHurt();
    // knockback
    const l = Math.hypot(dx,dz)||1;
    p.x += (dx/l)*0.3; p.z += (dz/l)*0.3;
  }

  // ── player melee against mobs ───────────────────────────────────────────────
  // Called on attack: returns true if a mob was hit (so block-break is skipped)
  tryPlayerAttack(reach = 3.2) {
    const p = this.player;
    const eye = p.getEyePosition();
    const dirx = Math.cos(p.pitch)*Math.sin(p.yaw);
    const diry = Math.sin(p.pitch);
    const dirz = Math.cos(p.pitch)*Math.cos(p.yaw);
    let best=null, bestT=reach;
    for (const m of this.mobs) {
      if (m.dead) continue;
      const [w,h]=m.cfg.size, w2=w/2;
      // ray vs AABB
      const minx=m.x-w2, maxx=m.x+w2, miny=m.y, maxy=m.y+h, minz=m.z-w2, maxz=m.z+w2;
      const t = rayBox(eye.x,eye.y,eye.z, dirx,diry,dirz, minx,miny,minz,maxx,maxy,maxz);
      if (t!==null && t < bestT) { bestT=t; best=m; }
    }
    if (!best) return false;
    best.hp -= 4;
    this.audio?.playHurt();
    // knockback + flee
    const dx=best.x-p.x, dz=best.z-p.z, l=Math.hypot(dx,dz)||1;
    best.vx += (dx/l)*4; best.vz += (dz/l)*4; best.vy = 4;
    if (!best.cfg.hostile) best.fleeT = 4;
    if (best.hp <= 0) this._kill(best);
    return true;
  }

  _kill(m) {
    m.dead = true;
    this.audio?.playMob(m.type);
    // główny łup (etykieta z ITEMS, jeśli jest)
    const label = ITEMS[m.cfg.loot]?.name || m.cfg.loot;
    this._spawnDrop(m.x, m.y+0.4, m.z, m.cfg.loot, m.cfg.col[0], label);
    // dodatkowy łup (np. skóra z krowy)
    const extra = EXTRA_LOOT[m.type];
    if (extra) this._spawnDrop(m.x+0.2, m.y+0.4, m.z, extra, ITEMS[extra]?.color||'#aaa', ITEMS[extra]?.name||extra);
    // kula doświadczenia
    if (!m.baby) this.spawnXP(m.x, m.y+0.5, m.z, m.cfg.hostile ? 5 : 2);
  }

  // ── Kule doświadczenia (XP) ─────────────────────────────────────────────────
  spawnXP(x, y, z, amount) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x7fe83a })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.drops.push({ x, y, z, vy:2, xp:amount, mesh, t:0, life:120, pick:0.3 });
  }

  // ── Strzały (łuk gracza / szkielet) ─────────────────────────────────────────
  shootArrow(x, y, z, dx, dy, dz, fromPlayer) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.6),
      new THREE.MeshBasicMaterial({ color: 0x8a6a3a })
    );
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const SP = 26;
    this.arrows.push({ x, y, z, vx:dx*SP, vy:dy*SP, vz:dz*SP, mesh, life:4, fromPlayer });
    this.audio?.playPlace();
  }

  _skeletonShoot(m, p) {
    const ex = m.x, ey = m.y + m.cfg.size[1]*0.7, ez = m.z;
    const tx = p.x, ty = p.y + 0.9, tz = p.z;
    let dx = tx-ex, dy = ty-ey + 0.08*Math.hypot(tx-ex,tz-ez), dz = tz-ez;
    const l = Math.hypot(dx,dy,dz) || 1;
    this.shootArrow(ex, ey, ez, dx/l, dy/l, dz/l, false);
  }

  _updateArrows(dt, p) {
    for (const a of this.arrows) {
      a.life -= dt;
      a.vy += GRAVITY*0.5*dt;
      a.x += a.vx*dt; a.y += a.vy*dt; a.z += a.vz*dt;
      a.mesh.position.set(a.x, a.y, a.z);
      a.mesh.lookAt(a.x + a.vx, a.y + a.vy, a.z + a.vz);
      // trafienie w blok
      if (this._solid(a.x, a.y, a.z)) { a.dead = true; continue; }
      if (a.fromPlayer) {
        // trafienie w moba
        for (const m of this.mobs) {
          if (m.dead) continue;
          const [w,h]=m.cfg.size, w2=w/2;
          if (a.x>m.x-w2 && a.x<m.x+w2 && a.z>m.z-w2 && a.z<m.z+w2 && a.y>m.y && a.y<m.y+h) {
            m.hp -= 5; a.dead = true;
            const dx=m.x-p.x, dz=m.z-p.z, l=Math.hypot(dx,dz)||1;
            m.vx += (dx/l)*3; m.vz += (dz/l)*3;
            if (!m.cfg.hostile) m.fleeT = 4;
            if (m.hp <= 0) this._kill(m);
            break;
          }
        }
      } else {
        // strzała wroga → gracz
        const dx=p.x-a.x, dy=(p.y+0.9)-a.y, dz=p.z-a.z;
        if (dx*dx+dy*dy+dz*dz < 0.5*0.5) { this._hurtPlayer(4, a.x-p.x, a.z-p.z); a.dead = true; }
      }
    }
    for (const a of this.arrows) if (a.dead || a.life<=0) this.scene.remove(a.mesh);
    this.arrows = this.arrows.filter(a=>!a.dead && a.life>0);
  }

  // Wyrzuć wykopany przedmiot jako fruwającą encję (jak w Minecrafcie).
  spawnItem(x, y, z, key, n = 1) {
    const it = ITEMS[key];
    if (!it) return;
    const color = it.color || '#aaa';
    for (let i = 0; i < n; i++) {
      const jx = x + 0.5 + (Math.random()-0.5)*0.3;
      const jz = z + 0.5 + (Math.random()-0.5)*0.3;
      this._spawnDrop(jx, y + 0.4, jz, key, color, it.name);
    }
  }

  // ── item drops ──────────────────────────────────────────────────────────────
  _spawnDrop(x,y,z,name,color,label) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.3,0.3,0.3),
      new THREE.MeshBasicMaterial({ color })
    );
    mesh.position.set(x,y,z);
    this.scene.add(mesh);
    this.drops.push({ x,y,z, vy:2, name, label:label||name, mesh, t:0, life:120, pick:0.4 });
  }

  _updateDrops(dt, p) {
    for (const d of this.drops) {
      d.t += dt; d.life -= dt;
      if (d.pick > 0) d.pick -= dt;   // krótka zwłoka zanim można podnieść
      d.vy += GRAVITY*dt;
      let ny = d.y + d.vy*dt;
      if (this._solid(d.x, ny, d.z)) { d.vy=0; ny=Math.floor(ny)+1.1; }
      d.y = ny;
      d.mesh.position.set(d.x, d.y + Math.sin(d.t*3)*0.05, d.z);
      d.mesh.rotation.y += dt*2;
      // pickup
      const dx=p.x-d.x, dy=(p.y+0.9)-d.y, dz=p.z-d.z;
      if (d.pick <= 0 && dx*dx+dy*dy+dz*dz < 1.6*1.6) {
        d.collected = true;
        if (d.xp) { if (this.onXP) this.onXP(d.xp); }
        else {
          if (this.onLoot) this.onLoot(d.name);
          if (this.onMessage) this.onMessage(`+1 ${d.label}`);
        }
        this.audio?.playPlace();
      }
    }
    for (const d of this.drops) if (d.collected || d.life<=0) this.scene.remove(d.mesh);
    this.drops = this.drops.filter(d=>!d.collected && d.life>0);
  }

  clear() {
    for (const m of this.mobs) m.removeMesh(this.scene);
    for (const d of this.drops) this.scene.remove(d.mesh);
    for (const a of this.arrows) this.scene.remove(a.mesh);
    for (const c of this.carts) this.scene.remove(c.group);
    this.mobs=[]; this.drops=[]; this.arrows=[]; this.carts=[];
  }
}

// Slab method ray-AABB; returns entry distance or null
function rayBox(ox,oy,oz, dx,dy,dz, minx,miny,minz, maxx,maxy,maxz) {
  let tmin=0, tmax=Infinity;
  const axes=[[ox,dx,minx,maxx],[oy,dy,miny,maxy],[oz,dz,minz,maxz]];
  for (const [o,d,mn,mx] of axes) {
    if (Math.abs(d) < 1e-8) { if (o<mn||o>mx) return null; }
    else {
      let t1=(mn-o)/d, t2=(mx-o)/d;
      if (t1>t2) [t1,t2]=[t2,t1];
      tmin=Math.max(tmin,t1); tmax=Math.min(tmax,t2);
      if (tmin>tmax) return null;
    }
  }
  return tmin;
}
