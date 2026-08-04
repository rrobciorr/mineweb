// MineWeb — symulacja redstone. Świat trzyma tylko ID bloku, więc stan komponentów
// (moc, kierunek, on/off, timery) żyje tutaj w mapie `states`. Wizualne warianty
// (pył on/off, lampa, pochodnia, drzwi) przełączane przez world.setBlock (→ remesh).
import { B, BLOCK_PROPS, isRedstone } from './blocks.js?v=29';

const DIRV = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];   // dir 0..3: x+, x-, z+, z-
const N6 = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const SUB = 0.1;   // sekundy na tik redstone (10 Hz)

export class RedstoneSim {
  constructor(world) {
    this.world = world;
    this.states = new Map();     // "x,y,z" -> { type, ... }
    this._acc = 0;
    this.dirty = true;
    this._dust = new Map();      // wynik ostatniego przeliczenia (moc pyłu)
    this._active = new Set();    // aktywne źródła (klucze)
  }

  key(x,y,z){ return `${x},${y},${z}`; }
  get(x,y,z){ return this.states.get(this.key(x,y,z)); }

  // Zarejestruj komponent przy stawianiu (dir z orientacji gracza dla repeatera/tłoka).
  onPlace(x,y,z,id,dir=0){
    const k=this.key(x,y,z);
    let st;
    switch(id){
      case B.REDSTONE_BLOCK: st={type:'block'}; break;
      case B.RS_LAMP: case B.RS_LAMP_ON: st={type:'lamp'}; break;
      case B.RS_DUST: case B.RS_DUST_ON: st={type:'dust'}; break;
      case B.RS_TORCH: case B.RS_TORCH_OFF: st={type:'torch',lit:true}; break;
      case B.LEVER:  st={type:'lever',on:false}; break;
      case B.BUTTON: st={type:'button',timer:0}; break;
      case B.REPEATER: st={type:'repeater',dir,delay:1,q:[],out:false}; break;
      case B.PISTON: st={type:'piston',dir,ext:false}; break;
      case B.DOOR: case B.DOOR_OPEN: st={type:'door',open:false}; break;
      default: return;
    }
    this.states.set(k,st); this.dirty=true;
  }
  onBreak(x,y,z){ if(this.states.delete(this.key(x,y,z))) this.dirty=true; }

  // PPM na komponencie: dźwignia/przycisk/repeater. Zwraca true jeśli obsłużono.
  interact(x,y,z){
    const st=this.get(x,y,z); if(!st) return false;
    if(st.type==='lever'){ st.on=!st.on; this.dirty=true; return true; }
    if(st.type==='button'){ st.timer=10; this.dirty=true; return true; }   // ~1 s impulsu
    if(st.type==='repeater'){ st.delay=st.delay%4+1; st.q=[]; this.dirty=true; return true; }
    return false;
  }

  tick(dt){
    this._acc+=dt; let n=0;
    while(this._acc>=SUB && n<4){ this._acc-=SUB; this._step(); n++; }
  }

  _step(){
    let changed=false;
    for(const st of this.states.values())
      if(st.type==='button' && st.timer>0){ st.timer--; changed=true; }
    // przekaźniki — potok opóźnienia
    for(const [k,st] of this.states){
      if(st.type!=='repeater') continue;
      const [x,y,z]=k.split(',').map(Number), d=DIRV[st.dir];
      const back=this._poweredAt(x-d[0],y-d[1],z-d[2]) ? 1:0;
      st.q.push(back); while(st.q.length>st.delay) st.q.shift();
      const nout = st.q.length>=st.delay ? !!st.q[0] : st.out;
      if(nout!==st.out){ st.out=nout; changed=true; }
    }
    if(this.dirty || changed) this._recompute();
  }

  // Czy komórka zasilona wg ostatniego wyniku (do wejścia repeaterów).
  _poweredAt(x,y,z){
    const k=this.key(x,y,z);
    if((this._dust.get(k)||0)>0 || this._active.has(k)) return true;
    for(const [dx,dy,dz] of N6){
      const nk=this.key(x+dx,y+dy,z+dz);
      if(this._active.has(nk) || (this._dust.get(nk)||0)>0) return true;
    }
    return false;
  }

  _front(k,st){ const [x,y,z]=k.split(',').map(Number), d=DIRV[st.dir]; return this.key(x+d[0],y+d[1],z+d[2]); }

  _recompute(){
    this.dirty=false;
    const S=this.states;
    let torchLit=new Map();
    for(const [k,st] of S) if(st.type==='torch') torchLit.set(k, st.lit!==false);
    let dust=new Map(), active=new Set();

    for(let pass=0; pass<8; pass++){
      active=new Set();
      for(const [k,st] of S){
        if(st.type==='block') active.add(k);
        else if(st.type==='lever' && st.on) active.add(k);
        else if(st.type==='button' && st.timer>0) active.add(k);
        else if(st.type==='torch' && torchLit.get(k)) active.add(k);
        else if(st.type==='repeater' && st.out) active.add(k);
      }
      dust=this._computeDust(active);
      let changed=false; const newLit=new Map();
      for(const [k,st] of S){
        if(st.type!=='torch') continue;
        const [x,y,z]=k.split(',').map(Number);
        const powered=this._blockPowered(x,y-1,z, active, dust, k);   // nośnik = blok poniżej
        const lit=!powered;
        newLit.set(k,lit); if(lit!==torchLit.get(k)) changed=true;
      }
      torchLit=newLit;
      if(!changed) break;
    }

    this._dust=dust; this._active=active;
    for(const [k,st] of S) if(st.type==='torch') st.lit=torchLit.get(k);
    this._apply(active, dust, torchLit);
  }

  _computeDust(active){
    const S=this.states, dust=new Map(), queue=[];
    for(const [k,st] of S) if(st.type==='dust') dust.set(k,0);
    for(const k of dust.keys()){
      const [x,y,z]=k.split(',').map(Number); let p=0;
      for(const [dx,dy,dz] of N6){
        const nk=this.key(x+dx,y+dy,z+dz);
        if(!active.has(nk)) continue;
        const st=S.get(nk);
        if(st && st.type==='repeater'){ if(this._front(nk,st)===k) p=15; }
        else p=15;
      }
      if(p>0){ dust.set(k,p); queue.push(k); }
    }
    while(queue.length){
      const k=queue.shift(), p=dust.get(k); if(p<=1) continue;
      const [x,y,z]=k.split(',').map(Number);
      for(const nk of this._dustNeighbors(x,y,z)){
        if(dust.has(nk) && dust.get(nk) < p-1){ dust.set(nk,p-1); queue.push(nk); }
      }
    }
    return dust;
  }

  _dustNeighbors(x,y,z){
    const out=[];
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      out.push(this.key(x+dx,y,z+dz), this.key(x+dx,y+1,z+dz), this.key(x+dx,y-1,z+dz));
    }
    return out;
  }

  // Zasilenie bloku stałego (bx,by,bz), pomijając komponent excludeKey (własną pochodnię).
  _blockPowered(bx,by,bz, active, dust, excludeKey){
    const bst=this.states.get(this.key(bx,by,bz));
    if(bst && bst.type==='block') return true;
    const bk=this.key(bx,by,bz);
    for(const [dx,dy,dz] of N6){
      const nk=this.key(bx+dx,by+dy,bz+dz);
      if(nk===excludeKey) continue;
      const nst=this.states.get(nk);
      if(active.has(nk)){
        if(nst && nst.type==='repeater'){ if(this._front(nk,nst)===bk) return true; }
        else return true;
      }
      if((dust.get(nk)||0)>0) return true;
    }
    return false;
  }

  // Zasilenie mechanizmu (lampa/drzwi/tłok) z sąsiedztwa.
  _selfPowered(x,y,z, active, dust){
    const sk=this.key(x,y,z);
    for(const [dx,dy,dz] of N6){
      const nk=this.key(x+dx,y+dy,z+dz), nst=this.states.get(nk);
      if(active.has(nk)){
        if(nst && nst.type==='repeater'){ if(this._front(nk,nst)===sk) return true; }
        else return true;
      }
      if((dust.get(nk)||0)>0) return true;
    }
    return false;
  }

  _apply(active, dust, torchLit){
    const W=this.world;
    const setB=(x,y,z,id)=>{ if(W.getBlock(x,y,z)!==id) W.setBlock(x,y,z,id); };
    for(const [k,st] of this.states){
      const [x,y,z]=k.split(',').map(Number);
      if(st.type==='dust'){
        setB(x,y,z, (dust.get(k)||0)>0 ? B.RS_DUST_ON : B.RS_DUST);
      } else if(st.type==='torch'){
        setB(x,y,z, torchLit.get(k) ? B.RS_TORCH : B.RS_TORCH_OFF);
      } else if(st.type==='lamp'){
        setB(x,y,z, this._selfPowered(x,y,z,active,dust) ? B.RS_LAMP_ON : B.RS_LAMP);
      } else if(st.type==='door'){
        const on=this._selfPowered(x,y,z,active,dust);
        if(on!==st.open){ st.open=on; setB(x,y,z, on ? B.DOOR_OPEN : B.DOOR); }
      } else if(st.type==='piston'){
        const on=this._selfPowered(x,y,z,active,dust);
        if(on && !st.ext){ st.ext=true; this._pistonPush(x,y,z,st); }
        else if(!on && st.ext){ st.ext=false; }
      }
    }
  }

  _pistonPush(x,y,z,st){
    const d=DIRV[st.dir];
    const fx=x+d[0], fy=y+d[1], fz=z+d[2];
    const gx=fx+d[0], gy=fy+d[1], gz=fz+d[2];
    const fb=this.world.getBlock(fx,fy,fz), gb=this.world.getBlock(gx,gy,gz);
    if(fb===B.AIR || gb!==B.AIR) return;
    const p=BLOCK_PROPS[fb];
    if(p && p.solid && p.hardness<50 && !isRedstone(fb)){
      this.world.setBlock(gx,gy,gz, fb);
      this.world.setBlock(fx,fy,fz, B.AIR);
    }
  }

  // ── zapis/odczyt stanu ──
  export(){ return [...this.states].map(([k,st])=>({k,st})); }
  import(arr){ this.states.clear(); for(const {k,st} of (arr||[])) this.states.set(k,st); this.dirty=true; }
}
