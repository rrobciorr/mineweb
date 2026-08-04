import * as THREE from 'three';
import { B, BLOCK_PROPS, BLOCK_COLORS, BLOCK_FACES, faceUV, buildTextureAtlas, blockFaceTiles, iconTile, isRailBlock, railTexTile, isGlassTex } from './blocks.js?v=29';
import { railShape } from './rails.js?v=29';
import { CHUNK_SIZE, WORLD_HEIGHT } from './world.js?v=29';

// Ustaw UV siatki na kafelek(i) atlasu (flipY=false → odwracamy v).
function setBoxUVs(geo, tiles) {
  const uv = geo.attributes.uv;
  const faceTile = [tiles[2], tiles[2], tiles[0], tiles[1], tiles[2], tiles[2]]; // +x,-x,+y,-y,+z,-z
  for (let f = 0; f < 6; f++) {
    const [u0, u1, v0, v1] = faceUV(faceTile[f]);
    for (let k = 0; k < 4; k++) {
      const idx = f * 4 + k, a = uv.getX(idx), b = uv.getY(idx);
      uv.setXY(idx, u0 + a * (u1 - u0), v0 + (1 - b) * (v1 - v0));
    }
  }
  uv.needsUpdate = true;
}
function setPlaneUV(geo, tile) {
  const [u0, u1, v0, v1] = faceUV(tile), uv = geo.attributes.uv;
  for (let k = 0; k < 4; k++) {
    const a = uv.getX(k), b = uv.getY(k);
    uv.setXY(k, u0 + a * (u1 - u0), v0 + (1 - b) * (v1 - v0));
  }
  uv.needsUpdate = true;
}

// uvs: współrzędne w kafelku (0..1) dla v0..v3; v=0 to góra kafelka (flipY=false)
const FACES = [
  { d:[ 1,0,0], s:0, shade:0.80, verts:[[1,0,0],[1,1,0],[1,1,1],[1,0,1]], uvs:[[0,1],[0,0],[1,0],[1,1]] },
  { d:[-1,0,0], s:0, shade:0.80, verts:[[0,0,1],[0,1,1],[0,1,0],[0,0,0]], uvs:[[0,1],[0,0],[1,0],[1,1]] },
  { d:[0, 1,0], s:1, shade:1.00, verts:[[0,1,0],[0,1,1],[1,1,1],[1,1,0]], uvs:[[0,0],[0,1],[1,1],[1,0]] },
  { d:[0,-1,0], s:2, shade:0.50, verts:[[0,0,1],[0,0,0],[1,0,0],[1,0,1]], uvs:[[0,1],[0,0],[1,0],[1,1]] },
  { d:[0,0, 1], s:0, shade:0.90, verts:[[1,0,1],[1,1,1],[0,1,1],[0,0,1]], uvs:[[0,1],[0,0],[1,0],[1,1]] },
  { d:[0,0,-1], s:0, shade:0.70, verts:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]], uvs:[[0,1],[0,0],[1,0],[1,1]] },
];

const FALLBACK = { top:[1,0,1], side:[1,0,1], bot:[1,0,1] };

// Use 'aColor' — NOT 'color' which is a Three.js reserved attribute name
// Non-indexed geometry: 6 verts per face (2 triangles), no index buffer
const VERT = `
  attribute vec3 aColor;
  varying vec3 vC;
  void main() {
    vC = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAG = `
  uniform float uBright;
  varying vec3 vC;
  void main() { gl_FragColor = vec4(vC * uBright, 1.0); }
`;
const FRAG_T = `
  uniform float uBright;
  varying vec3 vC;
  void main() { gl_FragColor = vec4(vC * uBright, 0.75); }
`;
// Świecące bloki (redstone): pełny kolor niezależnie od pory dnia
const FRAG_GLOW = `
  varying vec3 vC;
  void main() { gl_FragColor = vec4(vC, 1.0); }
`;
// Teksturowane bloki: próbkujemy atlas, mnożymy przez cieniowanie ściany i jasność świata
const VERT_TEX = `
  attribute vec2 aUV;
  attribute float aShade;
  varying vec2 vUV;
  varying float vSh;
  void main() {
    vUV = aUV; vSh = aShade;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAG_TEX = `
  uniform sampler2D uTex;
  uniform float uBright;
  varying vec2 vUV;
  varying float vSh;
  void main() {
    vec4 t = texture2D(uTex, vUV);
    if (t.a < 0.3) discard;               // dziury w liściach itp.
    gl_FragColor = vec4(t.rgb * vSh * uBright, 1.0);
  }
`;
const FRAG_TEX_T = `
  uniform sampler2D uTex;
  uniform float uBright;
  varying vec2 vUV;
  varying float vSh;
  void main() {
    vec4 t = texture2D(uTex, vUV);
    gl_FragColor = vec4(t.rgb * vSh * uBright, t.a);   // szkło (półprzezroczyste)
  }
`;
// Teksturowane bloki świecące (pochodnia/lampa redstone): jak FRAG_TEX, ale bez uBright —
// świecą pełnym kolorem tekstury niezależnie od pory dnia.
const FRAG_TEX_GLOW = `
  uniform sampler2D uTex;
  varying vec2 vUV;
  varying float vSh;
  void main() {
    vec4 t = texture2D(uTex, vUV);
    if (t.a < 0.3) discard;
    gl_FragColor = vec4(t.rgb * vSh, 1.0);
  }
`;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x5ba3e0);
    this.scene.fog = new THREE.FogExp2(0x5ba3e0, 0.008);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 280);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

    this._bright = { value: 1.0 };
    this._brightnessMul = 1.0;   // mnożnik jasności z ustawień (gamma)
    this.solidMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG,
      uniforms: { uBright: this._bright },
      side: THREE.DoubleSide,
    });
    this.transMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_T,
      uniforms: { uBright: this._bright },
      transparent: true, side: THREE.DoubleSide,
    });
    this.glowMat = new THREE.ShaderMaterial({   // redstone: pochodnia/lampa świecą
      vertexShader: VERT, fragmentShader: FRAG_GLOW, side: THREE.DoubleSide,
    });
    // Atlas tekstur bloków (16×16 kafelków) — proceduralnie rysowany na canvasie
    const atlasCanvas = buildTextureAtlas();
    this.atlasTex = new THREE.CanvasTexture(atlasCanvas);
    this.atlasTex.magFilter = THREE.NearestFilter;
    this.atlasTex.minFilter = THREE.NearestFilter;
    this.atlasTex.flipY = false;
    this.atlasTex.needsUpdate = true;
    this.texMat = new THREE.ShaderMaterial({
      vertexShader: VERT_TEX, fragmentShader: FRAG_TEX,
      uniforms: { uBright: this._bright, uTex: { value: this.atlasTex } },
      side: THREE.DoubleSide,
    });
    this.texTransMat = new THREE.ShaderMaterial({
      vertexShader: VERT_TEX, fragmentShader: FRAG_TEX_T,
      uniforms: { uBright: this._bright, uTex: { value: this.atlasTex } },
      transparent: true, side: THREE.DoubleSide,
    });
    this.texGlowMat = new THREE.ShaderMaterial({   // teksturowane bloki świecące (pochodnia/lampa redstone)
      vertexShader: VERT_TEX, fragmentShader: FRAG_TEX_GLOW,
      uniforms: { uTex: { value: this.atlasTex } },
      side: THREE.DoubleSide,
    });
    this.waterMat = new THREE.MeshBasicMaterial({
      color: 0x1a5fcc, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    });
    // Lawa i pochodnie świecą własnym światłem (MeshBasic ignoruje uBright).
    this.lavaMat = new THREE.MeshBasicMaterial({ color: 0xff6a10, side: THREE.DoubleSide });
    this.torchMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, side: THREE.DoubleSide });

    this.selectionBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
      new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
    );
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);

    this.crackTex = this._buildCrackTextures();
    this.breakOverlay = new THREE.Mesh(
      new THREE.BoxGeometry(1.01, 1.01, 1.01),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false, polygonOffset:true, polygonOffsetFactor:-1 })
    );
    this.breakOverlay.visible = false;
    this.scene.add(this.breakOverlay);

    // ── Viewmodel (trzymany przedmiot w 1. osobie) + cząsteczki ───────────────
    this.scene.add(this.camera);           // aby dzieci kamery się renderowały
    this.viewGroup = new THREE.Group();
    this.camera.add(this.viewGroup);
    this.viewMesh = null;
    this._swing = 0;
    this._heldKey = undefined;
    this.particles = [];

    // Podświetlenie ściany, na której powstanie nowy blok (zielona płytka na
    // tej ścianie celowanego bloku, w którą patrzy gracz).
    this.faceHighlight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({ color: 0x7CFC00, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
    );
    this.faceHighlight.visible = false;
    this.scene.add(this.faceHighlight);

    // ── Sky: stars, sun, moon ───────────────────────────────────────────────
    const starGeo = new THREE.BufferGeometry();
    const starN = 600, sp = [];
    for (let i=0;i<starN;i++) {
      // random unit direction (r128 lacks Vector3.randomDirection)
      const u = Math.random()*2-1, th = Math.random()*Math.PI*2, s = Math.sqrt(1-u*u);
      let vy = u; if (vy < 0.1) vy = Math.abs(vy)+0.1; // keep above horizon
      sp.push(s*Math.cos(th)*240, vy*240, s*Math.sin(th)*240);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0 }));
    this.scene.add(this.stars);

    this.sun = new THREE.Mesh(new THREE.SphereGeometry(10, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, fog: false }));
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xdde6f0, fog: false }));
    this.scene.add(this.sun, this.moon);

    // Planeta Ziemia — widoczna tylko w trybie stacji kosmicznej (space).
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(45, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x2a6fb0, fog: false }));
    this.earth.visible = false;
    this.scene.add(this.earth);
    this.spaceMode = false;
    this._defaultFog = null;   // zapamiętana mgła, by móc wrócić z trybu space

    // ── Weather particles (rain/snow) ───────────────────────────────────────
    const wN = 1500, wp = [];
    for (let i=0;i<wN;i++) wp.push((Math.random()-0.5)*40, Math.random()*30, (Math.random()-0.5)*40);
    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
    this.weatherPts = new THREE.Points(wGeo, new THREE.PointsMaterial({ color: 0xaaccff, size: 0.12, transparent: true, opacity: 0 }));
    this.weatherPts.visible = false;
    this.scene.add(this.weatherPts);
    this.weather = 'sun';     // 'sun' | 'rain' | 'snow'
    this._weatherT = 30 + Math.random()*60;

    // Day/night state
    this.dayTime = 0.30;      // 0..1, 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
    this.dayLength = 600;     // seconds for a full day (~10 min)
    this.isNight = false;

    this.chunkMeshes = new Map();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  // Adjust fog so the view fades near the loaded-chunk edge: a larger render
  // distance means thinner fog (see further) and a farther camera clip plane.
  setRenderDistance(radius) {
    const blocks = radius * CHUNK_SIZE;
    if (this.scene.fog) this.scene.fog.density = 0.384 / blocks;   // ≈0.008 at the default radius 3
    this.camera.far = Math.max(this.spaceMode ? 2000 : 280, blocks * 4);
    this.camera.updateProjectionMatrix();
  }

  // Pole widzenia (FOV) kamery — z ustawień.
  setFov(deg) {
    this._fovBase = deg;
    this.camera.fov = deg + (this._fovBoost || 0);
    this.camera.updateProjectionMatrix();
  }

  // Chwilowe rozszerzenie FOV podczas sprintu (jak w Minecrafcie).
  setFovBoost(extra) {
    if (this._fovBoost === extra) return;
    this._fovBoost = extra;
    this.camera.fov = (this._fovBase || 75) + extra;
    this.camera.updateProjectionMatrix();
  }

  // Mnożnik jasności świata (gamma) — z ustawień. Stosowany w updateDayNight.
  setBrightness(mul) {
    this._brightnessMul = mul;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // Tryb stacji kosmicznej: czarny kosmos, brak mgły/pogody/cyklu dnia, stałe jasne wnętrze.
  setSpaceMode(on) {
    this.spaceMode = !!on;
    if (on) {
      this._defaultFog = this.scene.fog;
      this.scene.fog = null;                          // mgła chowałaby tło kosmosu
      this.scene.background = new THREE.Color(0x01010a);
      this.stars.material.opacity = 1;                // pełny gwiazdozbiór
      this.moon.visible = false;
      this.sun.visible = true;
      this.earth.visible = true;
      this.camera.far = Math.max(this.camera.far, 2000);   // dojrzeć odległe Słońce/Ziemię
      this.camera.updateProjectionMatrix();
    } else {
      if (this._defaultFog) this.scene.fog = this._defaultFog;
      this.earth.visible = false;
    }
  }

  // Uproszczona „scena kosmiczna”: bez cyklu dnia, gwiazdy/Słońce/Ziemia przy graczu.
  _updateSpaceSky(player) {
    const cx = player ? player.x : 0, cy = player ? player.y : 50, cz = player ? player.z : 0;
    this.scene.background = new THREE.Color(0x01010a);
    this.stars.material.opacity = 1;
    if (player) this.stars.position.set(cx, cy, cz);
    // Słońce i Ziemia na stałych, odległych kierunkach względem kamery.
    this.sun.position.set(cx + 600, cy + 400, cz - 500);
    this.earth.position.set(cx - 700, cy - 120, cz + 650);
    this.sun.visible = true; this.earth.visible = true; this.moon.visible = false;
    // Stałe, jasne wnętrze (brak dnia/nocy), z uwzględnieniem gammy z ustawień.
    this._bright.value = Math.min(1.8, 1.0 * this._brightnessMul);
  }

  updateDayNight(dt, player) {
    if (this.spaceMode) { this._updateSpaceSky(player); return; }
    this.dayTime = (this.dayTime + dt / this.dayLength) % 1;
    const t = this.dayTime;
    // Sun angle: 0 at dawn(0.25)->noon(0.5)->dusk(0.75). dayFactor 0..1
    const sunAngle = (t - 0.25) * Math.PI * 2;   // rad
    const sunY = Math.sin(sunAngle);             // -1..1 (height)
    const day = Math.max(0, sunY);               // 0 at/below horizon, 1 at noon
    this.isNight = sunY < -0.05;

    // Sky color: night→dawn/dusk(orange)→day(blue)
    const dawn = Math.max(0, 1 - Math.abs(sunY) * 4) * (sunY > -0.3 ? 1 : 0); // orange band near horizon
    const night = [0.03, 0.04, 0.10], noon = [0.36, 0.66, 0.90], dusk = [0.85, 0.45, 0.20];
    const mix = (a,b,f)=>a+(b-a)*f;
    let r = mix(night[0], noon[0], day), g = mix(night[1], noon[1], day), b = mix(night[2], noon[2], day);
    r = mix(r, dusk[0], dawn*0.7); g = mix(g, dusk[1], dawn*0.7); b = mix(b, dusk[2], dawn*0.7);
    const sky = new THREE.Color(r, g, b);
    this.scene.background = sky;
    this.scene.fog.color = sky;

    // World brightness (block lighting)
    this._bright.value = 0.28 + day * 0.72;

    // Stars fade in at night
    this.stars.material.opacity = Math.max(0, -sunY) * 0.9;
    if (player) this.stars.position.set(player.x, 0, player.z);

    // Sun & moon orbit around player
    const cx = player ? player.x : 0, cz = player ? player.z : 0, cy = player ? player.y : 60;
    const R = 200;
    this.sun.position.set(cx + Math.cos(sunAngle)*R*0.0, cy + sunY*R, cz + Math.cos(sunAngle)*R);
    this.moon.position.set(cx, cy - sunY*R, cz - Math.cos(sunAngle)*R);
    this.sun.visible = sunY > -0.2;
    this.moon.visible = sunY < 0.2;

    this._updateWeather(dt, player, day);

    // Mnożnik jasności z ustawień (po pogodzie/porze dnia), z bezpiecznym limitem.
    this._bright.value = Math.min(1.8, this._bright.value * this._brightnessMul);
  }

  _updateWeather(dt, player, day) {
    this._weatherT -= dt;
    if (this._weatherT <= 0) {
      this._weatherT = 40 + Math.random()*80;
      const roll = Math.random();
      this.weather = roll < 0.65 ? 'sun' : (roll < 0.85 ? 'rain' : 'snow');
    }
    const raining = this.weather !== 'sun';
    this.weatherPts.visible = raining;
    if (raining && player) {
      const mat = this.weatherPts.material;
      mat.opacity = 0.5;
      mat.color.set(this.weather === 'snow' ? 0xffffff : 0x9fc2ff);
      mat.size = this.weather === 'snow' ? 0.18 : 0.1;
      // animate fall
      const pos = this.weatherPts.geometry.attributes.position;
      const arr = pos.array, fall = this.weather === 'snow' ? 4 : 18;
      for (let i=1;i<arr.length;i+=3) {
        arr[i] -= fall*dt;
        if (arr[i] < 0) arr[i] += 30;
      }
      pos.needsUpdate = true;
      this.weatherPts.position.set(player.x, player.y - 4, player.z);
      // overcast dims the world a bit
      this._bright.value *= 0.8;
    }
  }

  buildChunkMesh(chunk, world) {
    // Non-indexed: push 6 vertices per face (v0,v1,v2  v0,v2,v3)
    const S = { p:[], c:[] };
    const T = { p:[], c:[] };
    const W = { p:[] };
    const L = { p:[] };   // lawa
    const TR = { p:[] };  // pochodnie
    const TX = { p:[], u:[], sh:[] };   // teksturowane, nieprzezroczyste
    const TXT = { p:[], u:[], sh:[] };  // teksturowane, przezroczyste (szkło)
    const G = { p:[], c:[] };           // świecące bez tekstury (fallback) — ignoruje uBright
    const TXG = { p:[], u:[], sh:[] };  // świecące teksturowane (redstone: pochodnia/lampa) — ignoruje uBright

    const push6 = (bkt, verts, r, g, b) => {
      const [v0,v1,v2,v3] = verts;
      // triangle 1: v0,v1,v2
      bkt.p.push(...v0, ...v1, ...v2);
      if (bkt.c) { bkt.c.push(r,g,b, r,g,b, r,g,b); }
      // triangle 2: v0,v2,v3
      bkt.p.push(...v0, ...v2, ...v3);
      if (bkt.c) { bkt.c.push(r,g,b, r,g,b, r,g,b); }
    };
    // teksturowana ściana: pozycje + UV z atlasu + cieniowanie
    const push6tex = (bkt, verts, uvq, shade) => {
      const [v0,v1,v2,v3] = verts;
      const [t0,t1,t2,t3] = uvq;
      bkt.p.push(...v0, ...v1, ...v2, ...v0, ...v2, ...v3);
      bkt.u.push(...t0, ...t1, ...t2, ...t0, ...t2, ...t3);
      for (let i=0;i<6;i++) bkt.sh.push(shade);
    };

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const b = chunk.get(x, y, z);
          if (b === B.AIR || b === B.DOOR_OPEN) continue;   // otwarte drzwi = niewidoczne (przejście)
          const props = BLOCK_PROPS[b];
          if (!props) continue;
          const bc = BLOCK_COLORS[b] || FALLBACK;

          // ── Płaskie tory: jeden poziomy quad z teksturą szyn (nie sześcian) ──
          if (isRailBlock(b)) {
            const gb = (dx, dz) => {
              const ax=x+dx, az=z+dz;
              if (ax<0||ax>=CHUNK_SIZE||az<0||az>=CHUNK_SIZE)
                return world.getBlock(chunk.cx*CHUNK_SIZE+ax, y, chunk.cz*CHUNK_SIZE+az);
              return chunk.get(ax, y, az);
            };
            const west=isRailBlock(gb(-1,0)), east=isRailBlock(gb(1,0));
            const north=isRailBlock(gb(0,-1)), south=isRailBlock(gb(0,1));
            const { shape, orient } = railShape(west, east, north, south, b === B.RAIL);
            const [u0,u1,v0,v1] = faceUV(railTexTile(b, shape, orient));
            const h = 0.0625;
            const verts = [[x,y+h,z],[x+1,y+h,z],[x+1,y+h,z+1],[x,y+h,z+1]];
            // tożsamościowe UV — orientacja zapisana wprost w kafelku (bez obracania)
            const uvq = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
            push6tex(TX, verts, uvq, 1.0);
            continue;
          }

          for (let fi = 0; fi < 6; fi++) {
            const face = FACES[fi];
            const [ndx, ndy, ndz] = face.d;
            const nx = x+ndx, ny = y+ndy, nz = z+ndz;

            let nb;
            if (nx<0||nx>=CHUNK_SIZE||nz<0||nz>=CHUNK_SIZE) {
              nb = world.getBlock(chunk.cx*CHUNK_SIZE+nx, ny, chunk.cz*CHUNK_SIZE+nz);
            } else if (ny<0||ny>=WORLD_HEIGHT) {
              nb = B.AIR;
            } else {
              nb = chunk.get(nx, ny, nz);
            }

            const np = BLOCK_PROPS[nb] || BLOCK_PROPS[B.AIR];
            if (np.solid && !np.transparent) continue;
            if (nb===b && props.transparent) continue;

            const baseCol = face.s===1 ? bc.top : face.s===2 ? bc.bot : bc.side;
            const sh = face.shade;
            const cr = baseCol[0]*sh, cg = baseCol[1]*sh, cb = baseCol[2]*sh;

            // Build absolute vertex positions
            const absVerts = face.verts.map(([vx,vy,vz]) => [x+vx, y+vy, z+vz]);

            const tf = BLOCK_FACES[b];   // kafelki atlasu [top, bottom, side]
            if (b === B.WATER) {
              push6(W, absVerts, cr, cg, cb);
            } else if (b === B.LAVA) {
              push6(L, absVerts, 0,0,0);
            } else if (b === B.TORCH) {
              push6(TR, absVerts, 0,0,0);
            } else if (b === B.RS_TORCH || b === B.RS_LAMP_ON) {
              if (tf) {
                // teksturowany blok świecący: wylicz UV, ale ignoruj uBright (patrz TXG/texGlowMat)
                const tile = face.s===1 ? tf[0] : face.s===2 ? tf[1] : tf[2];
                const [u0,u1,v0,v1] = faceUV(tile);
                const uvq = face.uvs.map(([uf,vf]) => [u0 + uf*(u1-u0), v0 + vf*(v1-v0)]);
                push6tex(TXG, absVerts, uvq, sh);
              } else {
                push6(G, absVerts, baseCol[0], baseCol[1], baseCol[2]);   // brak tekstury: świeci pełnym kolorem
              }
            } else if (tf) {
              // teksturowany blok: wylicz UV wybranego kafelka
              const tile = face.s===1 ? tf[0] : face.s===2 ? tf[1] : tf[2];
              const [u0,u1,v0,v1] = faceUV(tile);
              const uvq = face.uvs.map(([uf,vf]) => [u0 + uf*(u1-u0), v0 + vf*(v1-v0)]);
              push6tex(isGlassTex(b) ? TXT : TX, absVerts, uvq, sh);
            } else if (props.transparent) {
              push6(T, absVerts, cr, cg, cb);
            } else {
              push6(S, absVerts, cr, cg, cb);
            }
          }
        }
      }
    }

    const key = `${chunk.cx},${chunk.cz}`;
    this._disposeChunk(key);

    const wx = chunk.cx * CHUNK_SIZE, wz = chunk.cz * CHUNK_SIZE;
    const meshes = {};

    const make = (bkt, mat, hasColor) => {
      if (!bkt.p.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bkt.p, 3));
      if (hasColor && bkt.c) {
        geo.setAttribute('aColor', new THREE.Float32BufferAttribute(bkt.c, 3));
      }
      const m = new THREE.Mesh(geo, mat);
      m.position.set(wx, 0, wz);
      this.scene.add(m);
      return m;
    };
    const makeTex = (bkt, mat) => {
      if (!bkt.p.length) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(bkt.p, 3));
      geo.setAttribute('aUV', new THREE.Float32BufferAttribute(bkt.u, 2));
      geo.setAttribute('aShade', new THREE.Float32BufferAttribute(bkt.sh, 1));
      const m = new THREE.Mesh(geo, mat);
      m.position.set(wx, 0, wz);
      this.scene.add(m);
      return m;
    };

    meshes.solid = make(S, this.solidMat, true);
    meshes.trans = make(T, this.transMat, true);
    meshes.tex   = makeTex(TX, this.texMat);
    meshes.texT  = makeTex(TXT, this.texTransMat);
    meshes.water = make(W, this.waterMat, false);
    meshes.lava  = make(L, this.lavaMat, false);
    meshes.torch = make(TR, this.torchMat, false);
    meshes.glow  = make(G, this.glowMat, true);
    meshes.texGlow = makeTex(TXG, this.texGlowMat);
    this.chunkMeshes.set(key, meshes);
    chunk.dirty = false;
  }

  _disposeChunk(key) {
    const old = this.chunkMeshes.get(key);
    if (!old) return;
    for (const m of Object.values(old)) {
      if (m) { this.scene.remove(m); m.geometry.dispose(); }
    }
    this.chunkMeshes.delete(key);
  }

  removeChunk(chunk) { this._disposeChunk(`${chunk.cx},${chunk.cz}`); }

  updateCamera(player) {
    const eye = player.getEyePosition();
    this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = player.yaw + Math.PI;
    // +pitch: zgodnie z kierunkiem myszy (góra = patrz w górę) ORAZ z raycastem
    // celowania (player.getLookDirection używa dy = sin(pitch)).
    this.camera.rotation.x = player.pitch;
  }

  updateSelection(hit) {
    if (hit) {
      // Kontur celowanego bloku (zostanie usunięty).
      this.selectionBox.position.set(hit.wx+0.5, hit.wy+0.5, hit.wz+0.5);
      this.selectionBox.visible = true;

      // Płytka na ścianie, po której powstanie nowy blok (kierunek normalnej).
      const { nx, ny, nz } = hit;
      this.faceHighlight.position.set(
        hit.wx + 0.5 + nx * 0.501,
        hit.wy + 0.5 + ny * 0.501,
        hit.wz + 0.5 + nz * 0.501
      );
      this.faceHighlight.rotation.set(0, 0, 0);
      if (nx !== 0)      this.faceHighlight.rotation.y = nx > 0 ? Math.PI/2 : -Math.PI/2;
      else if (ny !== 0) this.faceHighlight.rotation.x = ny > 0 ? -Math.PI/2 : Math.PI/2;
      else if (nz < 0)   this.faceHighlight.rotation.y = Math.PI;
      this.faceHighlight.visible = (nx !== 0 || ny !== 0 || nz !== 0);
    } else {
      this.selectionBox.visible = false;
      this.faceHighlight.visible = false;
    }
  }

  updateBreakOverlay(hit, progress) {
    if (hit && progress > 0) {
      this.breakOverlay.position.set(hit.wx+0.5, hit.wy+0.5, hit.wz+0.5);
      const stage = Math.min(this.crackTex.length-1, Math.floor(progress * this.crackTex.length));
      this.breakOverlay.material.map = this.crackTex[stage];
      this.breakOverlay.material.needsUpdate = true;
      this.breakOverlay.material.opacity = 0.85;
      this.breakOverlay.visible = true;
    } else {
      this.breakOverlay.visible = false;
    }
  }

  // Proceduralne tekstury pęknięć (kilka etapów, przezroczyste tło).
  _buildCrackTextures() {
    const texs = [];
    const STAGES = 5;
    for (let s = 0; s < STAGES; s++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 16;
      const c = cv.getContext('2d');
      c.clearRect(0,0,16,16);
      c.strokeStyle = 'rgba(0,0,0,0.75)'; c.lineWidth = 1;
      const lines = 2 + s*2;
      let seed = 1234 + s*777;
      const rnd = () => { seed ^= seed<<13; seed ^= seed>>17; seed ^= seed<<5; return ((seed>>>0)%1000)/1000; };
      for (let i=0;i<lines;i++) {
        c.beginPath();
        let x = rnd()*16, y = rnd()*16; c.moveTo(x,y);
        const segs = 2 + (rnd()*3|0);
        for (let j=0;j<segs;j++){ x += (rnd()-0.5)*8; y += (rnd()-0.5)*8; c.lineTo(x,y); }
        c.stroke();
      }
      const t = new THREE.CanvasTexture(cv);
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
      texs.push(t);
    }
    return texs;
  }

  // ── Viewmodel: trzymany przedmiot ───────────────────────────────────────────
  // key = klucz przedmiotu (do cache); color/isBlock definiują wygląd bryły
  setHeldItem(key, color, isBlock) {
    if (this._heldKey === key) return;
    this._heldKey = key;
    if (this.viewMesh) { this.viewGroup.remove(this.viewMesh); this.viewMesh.geometry.dispose(); this.viewMesh.material.dispose(); this.viewMesh = null; }

    let mesh = null;
    if (key === null) {
      // pusta ręka (mały prostopadłościan w kolorze skóry)
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.35), new THREE.MeshBasicMaterial({ color: 0xd8a070 }));
    } else if (isBlock) {
      const id = +key.slice(2);                       // 'b:<id>'
      const tiles = blockFaceTiles(id);
      if (tiles) {
        const g = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        setBoxUVs(g, tiles);
        mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.atlasTex }));
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshBasicMaterial({ color }));
      }
    } else {
      const tile = iconTile(key);
      if (tile >= 0) {
        const g = new THREE.PlaneGeometry(0.42, 0.42);
        setPlaneUV(g, tile);
        mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: this.atlasTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
      } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.4), new THREE.MeshBasicMaterial({ color }));
      }
    }
    mesh.position.set(0.32, -0.30, -0.6);
    mesh.rotation.set(0.1, 0.5, 0.2);
    this.viewMesh = mesh;
    this.viewGroup.add(mesh);
  }

  swingHand() { this._swing = 1; }

  updateViewmodel(dt) {
    if (this._swing > 0) this._swing = Math.max(0, this._swing - dt * 4.5);
    const s = Math.sin((1 - this._swing) * Math.PI);   // 0→1→0
    this.viewGroup.rotation.x = -s * 0.7;
    this.viewGroup.rotation.z = s * 0.25;
    this.viewGroup.position.y = -s * 0.12;
  }

  // ── Cząsteczki niszczenia bloku ─────────────────────────────────────────────
  spawnBlockParticles(x, y, z, color) {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(x + 0.5 + (Math.random()-0.5)*0.6, y + 0.5 + (Math.random()-0.5)*0.6, z + 0.5 + (Math.random()-0.5)*0.6);
      this.scene.add(m);
      this.particles.push({ mesh:m, vx:(Math.random()-0.5)*3, vy:2+Math.random()*2, vz:(Math.random()-0.5)*3, life:0.6 });
    }
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt; p.vy -= 18*dt;
      p.mesh.position.x += p.vx*dt; p.mesh.position.y += p.vy*dt; p.mesh.position.z += p.vz*dt;
      p.mesh.scale.setScalar(Math.max(0.05, p.life/0.6));
    }
    for (const p of this.particles) if (p.life <= 0) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  // Wymuś pogodę komendą /weather; blokuje losową zmianę do kolejnego polecenia.
  setWeather(type) {
    this.weather = (type === 'clear') ? 'sun' : type;   // 'sun' | 'rain' | 'snow'
    this._weatherT = 1e9;
  }

  // Rozjaśnij świat, gdy gracz jest blisko pochodni (proste światło punktowe).
  // Wywoływane po updateDayNight, więc nadpisuje jasność pory dnia w dół jaskini.
  applyTorchGlow(on) {
    if (on) this._bright.value = Math.max(this._bright.value, 0.85);
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
