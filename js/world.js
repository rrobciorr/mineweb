import { SimplexNoise } from './noise.js?v=29';
import { B, BLOCK_PROPS } from './blocks.js?v=29';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 128;
const SEA_LEVEL = 42;

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx; this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    this.dirty = true;
    this.mesh = null;
  }

  idx(x, y, z) { return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE; }
  get(x, y, z) {
    if (x<0||x>=CHUNK_SIZE||z<0||z>=CHUNK_SIZE||y<0||y>=WORLD_HEIGHT) return B.AIR;
    return this.blocks[this.idx(x, y, z)];
  }
  set(x, y, z, b) {
    if (x<0||x>=CHUNK_SIZE||z<0||z>=CHUNK_SIZE||y<0||y>=WORLD_HEIGHT) return;
    this.blocks[this.idx(x, y, z)] = b;
    this.dirty = true;
  }
}

export class World {
  constructor(seed, mode = 'normal') {
    this.seed = seed;
    this.mode = mode;              // 'normal' | 'city' | 'space'
    this.gravity = (mode !== 'space');   // 'space' = stacja kosmiczna, stan nieważkości (zero-G)
    this.chunks = new Map();
    this.noise = new SimplexNoise(seed);
    this.noise2 = new SimplexNoise(seed + 777);
    this.caveN = new SimplexNoise(seed + 1234);
    this.caveN2 = new SimplexNoise(seed + 5678);
    this._loadedChunks = new Set();
    this.torches = new Set();     // klucze "x,y,z" pochodni (dla światła)
    this.crops = new Map();       // "x,y,z" -> { t } czas wzrostu sadzonek
  }

  key(cx, cz) { return `${cx},${cz}`; }

  getChunk(cx, cz) { return this.chunks.get(this.key(cx, cz)) || null; }

  getOrCreateChunk(cx, cz) {
    const k = this.key(cx, cz);
    if (!this.chunks.has(k)) {
      const chunk = new Chunk(cx, cz);
      this.generateChunk(chunk);
      this.chunks.set(k, chunk);
    }
    return this.chunks.get(k);
  }

  getBlock(wx, wy, wz) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return B.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.get(lx, wy, lz);
  }

  setBlock(wx, wy, wz, b) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.set(lx, wy, lz, b);
    // Mark adjacent chunks dirty for edge blocks
    if (lx === 0)          { const c = this.getChunk(cx-1, cz); if(c) c.dirty=true; }
    if (lx === CHUNK_SIZE-1){ const c = this.getChunk(cx+1, cz); if(c) c.dirty=true; }
    if (lz === 0)          { const c = this.getChunk(cx, cz-1); if(c) c.dirty=true; }
    if (lz === CHUNK_SIZE-1){ const c = this.getChunk(cx, cz+1); if(c) c.dirty=true; }
    // Śledź pochodnie (dla oświetlenia)
    const tk = `${wx},${wy},${wz}`;
    if (b === B.TORCH) this.torches.add(tk); else this.torches.delete(tk);
    // Reakcja lawa + woda → obsydian wokół zmienionej komórki
    this._reactLavaWater(wx, wy, wz);
  }

  // Jeśli lawa styka się z wodą, zamienia się w obsydian. Sprawdza zmienioną
  // komórkę i jej 6 sąsiadów (stały koszt), więc kopanie może „utwardzić" lawę.
  _reactLavaWater(wx, wy, wz) {
    const N = [[0,0,0],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (const [dx,dy,dz] of N) {
      const x=wx+dx, y=wy+dy, z=wz+dz;
      if (this.getBlock(x,y,z) !== B.LAVA) continue;
      const touchesWater = N.slice(1).some(([ex,ey,ez]) => this.getBlock(x+ex,y+ey,z+ez) === B.WATER);
      if (touchesWater) {
        const c = this.getOrCreateChunk(Math.floor(x/CHUNK_SIZE), Math.floor(z/CHUNK_SIZE));
        const llx=((x%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE, llz=((z%CHUNK_SIZE)+CHUNK_SIZE)%CHUNK_SIZE;
        c.set(llx, y, llz, B.OBSIDIAN);   // set bezpośrednio, by uniknąć rekurencji
        c.dirty = true;
      }
    }
  }

  // ── Gravity for loose blocks (sand, gravel) ─────────────────────────────────
  _loose(b) { return b === B.SAND || b === B.GRAVEL; }

  // After breaking at (wx,wy,wz): let the loose stack directly above collapse down
  collapseAbove(wx, wy, wz) {
    let dest = wy;
    let s = wy + 1;
    while (s < WORLD_HEIGHT && this._loose(this.getBlock(wx, s, wz))) {
      const b = this.getBlock(wx, s, wz);
      this.setBlock(wx, s, wz, B.AIR);
      this.setBlock(wx, dest, wz, b);
      dest++; s++;
    }
  }

  // After placing a loose block: drop it to the lowest air cell below
  dropLoose(wx, wy, wz) {
    if (!this._loose(this.getBlock(wx, wy, wz))) return;
    let y = wy;
    while (y > 1 && this.getBlock(wx, y - 1, wz) === B.AIR) y--;
    if (y !== wy) {
      const b = this.getBlock(wx, wy, wz);
      this.setBlock(wx, wy, wz, B.AIR);
      this.setBlock(wx, y, wz, b);
    }
  }

  surfaceHeight(wx, wz) {
    const n1 = this.noise.octave(wx * 0.004, wz * 0.004, 4, 0.5, 2.0);
    const n2 = this.noise2.octave(wx * 0.015, wz * 0.015, 2, 0.5, 2.0);
    const mountain = this.noise.octave(wx * 0.001, wz * 0.001, 1);
    const mf = Math.max(0, mountain * 1.2);
    let base = SEA_LEVEL + n1 * 18 + n2 * 6 + mf * 22;
    if (this.biome(wx, wz) === 'ocean') base -= 22;   // ocean basins dip below sea
    return Math.max(2, Math.min(WORLD_HEIGHT - 10, Math.round(base)));
  }

  biome(wx, wz) {
    const o = this.noise.noise2D(wx * 0.0013 + 50, wz * 0.0013 - 50);
    if (o < -0.45) return 'ocean';
    const t = this.noise2.noise2D(wx * 0.002, wz * 0.002);
    const f = this.caveN2.noise2D(wx * 0.0025 + 9, wz * 0.0025 - 9);
    if (t < -0.3) return 'desert';
    if (t > 0.5)  return 'snowy';
    if (f > 0.25) return 'forest';
    return 'plains';
  }

  // Seeded PRNG per (wx,wz) for deterministic tree/gravel placement
  _rng(wx, wz) {
    let s = (wx * 374761393 + wz * 668265263 + this.seed * 2654435761) >>> 0;
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  }
  // 3D seeded PRNG for ore placement
  _rng3(wx, wy, wz) {
    let s = (wx * 374761393 + wy * 668265263 + wz * 2246822519 + this.seed * 3266489917) >>> 0;
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  }
  // Pseudo-3D cave carving: tunnels where two ridged noises both near zero
  _isCave(wx, wy, wz) {
    const a = this.caveN.noise2D(wx * 0.05, wz * 0.05 + wy * 0.04);
    const b = this.caveN2.noise2D(wy * 0.05, (wx * 0.6 + wz * 0.4) * 0.05);
    return Math.abs(a) < 0.09 && Math.abs(b) < 0.12;
  }
  // Ore type for a stone cell at depth wy (or 0 = keep stone)
  _oreAt(wx, wy, wz) {
    const r = this._rng3(wx, wy, wz);
    if (wy <= 15 && r < 0.006) return B.DIAMOND_ORE;
    if (wy <= 30 && r < 0.0035) return B.EMERALD_ORE;   // rzadka
    if (wy <= 16 && r < 0.020) return B.REDSTONE_ORE;
    if (wy <= 30 && r < 0.010) return B.LAPIS_ORE;
    if (wy <= 22 && r < 0.012) return B.GOLD_ORE;
    if (wy <= 42 && r < 0.030) return B.IRON_ORE;
    if (wy >= 12 && wy <= 72 && r < 0.055) return B.COAL_ORE;
    return 0;
  }

  generateChunk(chunk) {
    if (this.mode === 'city') { this.generateCityChunk(chunk); return; }
    if (this.mode === 'space') { this.generateSpaceStationChunk(chunk); return; }
    const { cx, cz } = chunk;
    const bx = cx * CHUNK_SIZE, bz = cz * CHUNK_SIZE;

    // First pass: terrain blocks
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = bx + lx, wz = bz + lz;
        const surf = this.surfaceHeight(wx, wz);
        const bio  = this.biome(wx, wz);

        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = B.AIR;
          if (y === 0) {
            b = B.BEDROCK;
          } else if (y < surf - 4) {
            b = B.STONE;
          } else if (y < surf) {
            b = (bio === 'desert' || bio === 'ocean') ? B.SAND : B.DIRT;
          } else if (y === surf) {
            if (bio === 'desert') b = B.SAND;
            else if (bio === 'ocean') b = surf < SEA_LEVEL ? B.SAND : B.GRASS;
            else if (bio === 'snowy') b = B.SNOW;
            else b = B.GRASS;
          } else if (y <= SEA_LEVEL && surf < SEA_LEVEL) {
            b = B.WATER;
          }

          // gravel pockets + ores in stone
          if (b === B.STONE) {
            if (y === surf - 5 && this._rng(wx, wz) < 0.15) b = B.GRAVEL;
            else { const ore = this._oreAt(wx, y, wz); if (ore) b = ore; }
          }

          // carve caves (not bedrock, not water, leave a crust under the surface)
          if (b !== B.AIR && b !== B.BEDROCK && b !== B.WATER && y > 3 && y < surf - 1 && this._isCave(wx, y, wz)) {
            // głębokie jaskinie wypełniają się lawą (z żyłami obsydianu), wyżej puste
            b = (y <= 6) ? (this._rng3(wx, y, wz) < 0.05 ? B.OBSIDIAN : B.LAVA) : B.AIR;
          }

          chunk.set(lx, y, lz, b);
        }
      }
    }

    // Second pass: trees (after terrain so trunk doesn't overwrite grass)
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = bx + lx, wz = bz + lz;
        const surf = this.surfaceHeight(wx, wz);
        const bio  = this.biome(wx, wz);
        const treeChance = bio === 'forest' ? 0.08 : bio === 'plains' ? 0.018 : 0;
        if (treeChance > 0 && surf > SEA_LEVEL + 1 && this._rng(wx + 31, wz + 71) < treeChance) {
          this._placeTree(chunk, lx, surf + 1, lz, bx, bz);
        }
      }
    }
  }

  // ── Generacja stacji kosmicznej ─────────────────────────────────────────────
  // Skończona bryła stacji wokół origin; poza nią pusta przestrzeń (AIR).
  // W pełni deterministyczna (liczona wyłącznie z globalnych współrzędnych), więc
  // _stationBlock() jest czystą funkcją nadającą się do testów jednostkowych.
  // Kształt inspirowany rzeczywistymi/sci-fi stacjami: centralny hub-walec z przeszkloną
  // kopułą dowodzenia, cztery promieniste korytarze (szprychy) łączące go z zewnętrznym
  // pierścieniem mieszkalnym (torus) oraz dwa skrzydła paneli słonecznych. Wszystkie moduły
  // są wydrążone (przestronne), a geometrię liczą funkcje odległości (SDF) — deterministycznie.
  static STATION = {
    CY: 52,                          // płaszczyzna środka (poziom pierścienia i szprych)
    HUB_R: 6, HUB_B: 40, HUB_T: 66,  // centralny hub (walec) zwieńczony kopułą dowodzenia
    ARM_R: 4,                        // promień korytarzy-szprych
    RING_R: 28, RING_TUBE: 5,        // pierścień mieszkalny (torus)
    SOLAR_OUT: 46, SOLAR_HALF: 10,   // panele słoneczne wzdłuż osi ±X
    Y_LO: 34, Y_HI: 74,              // zakres pionowy generacji (dno hubu … szczyt kopuły)
  };

  // ── SDF modułów: odległość komórki od osi/rdzenia danego modułu ──────────────
  _capHub(wx, wy, wz) { const S = World.STATION; const t = Math.max(S.HUB_B, Math.min(S.HUB_T, wy)); return Math.hypot(wx, wy - t, wz); }
  _capArmX(wx, wy, wz) { const S = World.STATION; const t = Math.max(-S.RING_R, Math.min(S.RING_R, wx)); return Math.hypot(wx - t, wy - S.CY, wz); }
  _capArmZ(wx, wy, wz) { const S = World.STATION; const t = Math.max(-S.RING_R, Math.min(S.RING_R, wz)); return Math.hypot(wx, wy - S.CY, wz - t); }
  _torusRing(wx, wy, wz) { const S = World.STATION; const dxz = Math.hypot(wx, wz); return Math.hypot(dxz - S.RING_R, wy - S.CY); }

  // Wnętrze (wydrążenie) i bryła (kadłub) = suma modułów. Wnętrze ma promień o T=1 mniejszy,
  // więc na złączach modułów wnętrza nachodzą na siebie → przejścia są otwarte.
  _stationCavity(wx, wy, wz) {
    const S = World.STATION;
    return this._capHub(wx, wy, wz) <= S.HUB_R - 1
        || this._capArmX(wx, wy, wz) <= S.ARM_R - 1
        || this._capArmZ(wx, wy, wz) <= S.ARM_R - 1
        || this._torusRing(wx, wy, wz) <= S.RING_TUBE - 1;
  }
  _stationSolid(wx, wy, wz) {
    const S = World.STATION;
    return this._capHub(wx, wy, wz) <= S.HUB_R
        || this._capArmX(wx, wy, wz) <= S.ARM_R
        || this._capArmZ(wx, wy, wz) <= S.ARM_R
        || this._torusRing(wx, wy, wz) <= S.RING_TUBE;
  }

  // Szybki odrzut pustych kolumn (bez pełnej pętli po Y) — po rzucie XZ modułów.
  _stationColumnActive(wx, wz) {
    const S = World.STATION;
    const dxz = Math.hypot(wx, wz);
    if (dxz <= S.HUB_R + 1) return true;                                             // hub
    if (Math.abs(wz) <= S.ARM_R + 1 && Math.abs(wx) <= S.RING_R + 1) return true;    // szprycha X
    if (Math.abs(wx) <= S.ARM_R + 1 && Math.abs(wz) <= S.RING_R + 1) return true;    // szprycha Z
    if (Math.abs(dxz - S.RING_R) <= S.RING_TUBE + 1) return true;                    // pierścień
    if (Math.abs(wz) <= S.SOLAR_HALF && Math.abs(wx) > S.RING_R + S.RING_TUBE && Math.abs(wx) <= S.SOLAR_OUT) return true; // panele
    return false;
  }

  generateSpaceStationChunk(chunk) {
    const S = World.STATION;
    const bx = chunk.cx * CHUNK_SIZE, bz = chunk.cz * CHUNK_SIZE;
    const xHi = S.SOLAR_OUT, zHi = S.RING_R + S.RING_TUBE + 1;
    if (bx > xHi || bx + CHUNK_SIZE - 1 < -xHi || bz > zHi || bz + CHUNK_SIZE - 1 < -zHi) return;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = bx + lx, wz = bz + lz;
        if (wx < -xHi || wx > xHi || wz < -zHi || wz > zHi) continue;
        if (!this._stationColumnActive(wx, wz)) continue;   // pusta przestrzeń (kosmos)
        for (let wy = S.Y_LO; wy <= S.Y_HI; wy++) {
          const b = this._stationBlock(wx, wy, wz);
          if (b !== B.AIR) chunk.set(lx, wy, lz, b);
        }
      }
    }
  }

  // Czysta funkcja blueprintu: wnętrze → hull → panele/próżnia.
  _stationBlock(wx, wy, wz) {
    if (this._stationCavity(wx, wy, wz)) return this._stationInterior(wx, wy, wz);
    if (this._stationSolid(wx, wy, wz)) return this._stationHull(wx, wy, wz);
    return this._solarWing(wx, wy, wz);
  }

  // Kadłub: żelazo z poziomymi pasami okien; przeszklona kopuła na szczycie hubu.
  _stationHull(wx, wy, wz) {
    const S = World.STATION;
    if (wy >= S.HUB_T && Math.hypot(wx, wy - S.HUB_T, wz) <= S.HUB_R + 0.5) return B.GLASS;  // kopuła
    const wm = ((wy % 4) + 4) % 4;
    if (wm === 1 || wm === 2) return B.GLASS;   // pas okien wysoki na 2 bloki, co 4 bloki wysokości
    return B.IRON_BLOCK;
  }

  // Wnętrze modułów: przestronna próżnia z oświetleniem pod sufitem i rzadkim wyposażeniem
  // na podłodze. „Sufit"/„podłoga" wykrywane przez sąsiedztwo z komórką spoza wnętrza.
  _stationInterior(wx, wy, wz) {
    if (!this._stationCavity(wx, wy + 1, wz)) {   // komórka przysufitowa → oświetlenie
      return ((((wx + wz) % 5) + 5) % 5 === 0) ? B.RS_LAMP_ON : B.AIR;
    }
    if (!this._stationCavity(wx, wy - 1, wz)) {   // komórka przypodłogowa → wyposażenie
      const p = this._stationProp(wx, wy, wz); if (p) return p;
    }
    return B.AIR;
  }

  // Wyposażenie tematyczne wg modułu, rozstawione rzadko (przestronnie).
  _stationProp(wx, wy, wz) {
    const S = World.STATION;
    if (this._rng3(wx, wy, wz) > 0.18) return 0;                  // rzadko → dużo wolnej przestrzeni
    const r = this._rng3(wx + 7, wy + 3, wz + 11);
    if (this._capHub(wx, wy, wz) <= S.HUB_R) return r < 0.5 ? B.CRAFTING_TABLE : B.BOOKSHELF;      // mostek dowodzenia
    if (this._torusRing(wx, wy, wz) <= S.RING_TUBE) return r < 0.4 ? B.BED : (r < 0.7 ? B.CHEST : B.BOOKSHELF);  // moduły mieszkalne
    if (this._capArmX(wx, wy, wz) <= S.ARM_R) return r < 0.5 ? B.CHEST : B.FURNACE;                // magazyny (szprychy X)
    return r < 0.5 ? B.PUMPKIN : B.MELON;                                                          // szklarnie (szprychy Z)
  }

  // Panele słoneczne: dwa skrzydła (ogniwa z lapisu na żelaznym wysięgniku) wzdłuż osi ±X.
  _solarWing(wx, wy, wz) {
    const S = World.STATION;
    if (wy !== S.CY) return B.AIR;
    const ax = Math.abs(wx), az = Math.abs(wz);
    if (ax > S.RING_R + S.RING_TUBE && ax <= S.SOLAR_OUT && az <= S.SOLAR_HALF) {
      return az <= 1 ? B.IRON_BLOCK : B.LAPIS_BLOCK;
    }
    return B.AIR;
  }

  // ── Generacja miasta ────────────────────────────────────────────────────────
  // Płaski teren z siatką ulic, dzielnicami (centrum/handel/mieszkania/parki),
  // budynkami z wnętrzami (piętra + schody) oraz placem z fontanną i wieżą-ratuszem.
  // W pełni deterministyczna (bez szwów między chunkami): każda kolumna i cała
  // struktura liczone wyłącznie z globalnych współrzędnych.
  static CITY = {
    GROUND: 40, S: 30, FLOOR_H: 4, ROOM: 9,   // ROOM = siatka pokoi (8×8 wnętrza)
    // Progi pola brzegowego Voronoi (border = d2 - d1). ~2 jednostki ≈ 1 blok.
    ROAD_B: 3.0, SIDE_B: 5.0, CORE_B: 7.0,   // <3 ulica, 3–5 chodnik, 5–7 ogródek, ≥7 footprint
    INNER_B: 18, SETBACK_STEP: 3.2,          // dziedziniec / krok cofnięcia pięter
    STAIR_RING: [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2],[0,1]],
    ROOF_MATS: [B.STONE_BRICKS, B.COBBLE, B.PLANKS, B.WOOL_RED, B.STONE, B.WOOL_BLUE],
    // Palety materiałów per dzielnica
    PAL: {
      residential: [B.BRICK, B.PLANKS, B.WOOL_WHITE, B.WOOL_YELLOW, B.TERRACOTTA],
      commercial:  [B.TERRACOTTA, B.SANDSTONE, B.STONE_BRICKS, B.BRICK, B.WOOL_WHITE],
      downtown:    [B.QUARTZ, B.STONE_BRICKS, B.WOOL_WHITE],
    },
  };

  // Punkt-zalążek Voronoi komórki (i,j): przesunięty deterministycznie w jej wnętrzu.
  _citySite(i, j) {
    const S = World.CITY.S;
    const r1 = this._rng(i * 2 + 11, j * 2 + 7), r2 = this._rng(i * 3 + 5, j * 5 + 3);
    return [i * S + 4 + r1 * (S - 8), j * S + 4 + r2 * (S - 8)];
  }

  // Najbliższy i drugi zalążek dla kolumny → id kwartału + pole brzegowe (border=d2-d1).
  _cityCell(wx, wz) {
    const S = World.CITY.S;
    const gi = Math.floor(wx / S), gj = Math.floor(wz / S);
    let d1 = Infinity, d2 = Infinity, bi = gi, bj = gj, bsx = 0, bsz = 0;
    for (let di = -2; di <= 2; di++) for (let dj = -2; dj <= 2; dj++) {
      const ci = gi + di, cj = gj + dj;
      const [sx, sz] = this._citySite(ci, cj);
      const dx = wx + 0.5 - sx, dz = wz + 0.5 - sz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < d1) { d2 = d1; d1 = d; bi = ci; bj = cj; bsx = sx; bsz = sz; }
      else if (d < d2) { d2 = d; }
    }
    return { i: bi, j: bj, sx: bsx, sz: bsz, d1, d2, border: d2 - d1 };
  }

  // Deterministyczny opis kwartału (komórki Voronoi) — strefa, wysokość, kształt, dach, palety.
  _cityBlock(i, j) {
    if (!this._blkCache) this._blkCache = new Map();
    const key = i + ',' + j;
    let p = this._blkCache.get(key);
    if (p) return p;
    const C = World.CITY;
    // Plac = kwartał zawierający (0,0); ratusz = kwartał ~1.7 komórki na wschód. Liczone raz.
    if (!this._plazaKey) {
      const pc = this._cityCell(0, 0); this._plazaKey = pc.i + ',' + pc.j;
      const lc = this._cityCell(Math.round(C.S * 1.7), 0); this._landmarkKey = lc.i + ',' + lc.j;
    }
    const isPlaza = key === this._plazaKey;
    const landmark = key === this._landmarkKey;
    const [sx, sz] = this._citySite(i, j);
    const ring = Math.hypot(sx, sz) / C.S + this.noise2.noise2D(i * 0.2, j * 0.2) * 0.7;
    const rH = this._rng(i * 17 + 1, j * 23 + 5), rS = this._rng(i * 7 + 2, j * 13 + 9), rR = this._rng(i * 29 + 4, j * 31 + 6);
    let zone, H;
    if (isPlaza)        { zone = 'plaza';       H = 0; }
    else if (landmark)  { zone = 'landmark';    H = 34 + Math.floor(rH * 10); }
    else if (ring < 2.2){ zone = 'downtown';    H = 16 + Math.floor(rH * 16); }
    else if (ring < 4.0){ zone = 'commercial';  H = 8  + Math.floor(rH * 8); }
    else                { zone = 'residential'; H = 4  + Math.floor(rH * 3); }
    const isPark = (zone === 'residential' && rS < 0.18) || (zone === 'commercial' && rS < 0.08);
    const glassy = zone === 'downtown' || zone === 'landmark';
    // Kształt bryły
    let shape = 'solid';
    if (glassy)                    shape = rS < 0.34 ? 'round' : rS < 0.6 ? 'setback' : rS < 0.8 ? 'courtyard' : 'solid';
    else if (zone === 'commercial') shape = rS < 0.3 ? 'courtyard' : 'solid';
    // Typ dachu
    let roofType;
    if (zone === 'residential')  roofType = 'mound';           // dwuspadowy/kopczyk
    else if (landmark)           roofType = 'spire';
    else if (shape === 'setback') roofType = 'flat';
    else                          roofType = rR < 0.3 ? 'mound' : 'flat';
    const palName = zone === 'landmark' ? 'downtown' : (zone === 'downtown' ? 'downtown' : zone === 'commercial' ? 'commercial' : 'residential');
    const palArr = C.PAL[palName];
    const wallMat = glassy ? B.QUARTZ : palArr[Math.floor(this._rng(i + 100, j + 200) * palArr.length)];
    const trimMat = palArr[Math.floor(this._rng(i + 140, j + 260) * palArr.length)];
    const roofMat = C.ROOF_MATS[Math.floor(this._rng(i + 300, j + 400) * C.ROOF_MATS.length)];
    const winPattern = ['band', 'grid', 'strip', 'checker'][Math.floor(this._rng(i + 7, j + 9) * 4)];
    const prop = ['tank', 'ac', 'garden', 'antenna'][Math.floor(this._rng(i + 51, j + 53) * 4)];
    const doorAngle = this._rng(i + 71, j + 73) * Math.PI * 2;
    const doorN = 2 + Math.floor(this._rng(i + 81, j + 83) * 3);   // 2–4 wejścia
    const radius = 6 + rR * 5;
    p = { zone, H, shape, roofType, glassy, wallMat, trimMat, roofMat, winPattern, prop,
          doorAngle, doorN, radius, isPlaza, landmark, isPark, sx, sz };
    this._blkCache.set(key, p);
    return p;
  }

  // Czy kolumna należy do bryły budynku na wysokości y (uwzględnia kształt i cofnięcia).
  _footAt(P, border, rr, y) {
    const C = World.CITY;
    if (y > C.GROUND + P.H) return false;
    if (border < C.CORE_B) return false;
    if (P.shape === 'courtyard' && border >= C.INNER_B) return false;   // dziedziniec
    if (P.shape === 'round' && rr > P.radius) return false;             // okrągła wieża
    if (P.shape === 'setback') {                                        // schodkowe cofnięcia
      const tier = Math.floor((y - C.GROUND - 1) / 6);
      if (border < C.CORE_B + tier * C.SETBACK_STEP) return false;
    }
    return true;
  }

  generateCityChunk(chunk) {
    const { cx, cz } = chunk;
    const bx = cx * CHUNK_SIZE, bz = cz * CHUNK_SIZE;
    const C = World.CITY, GROUND = C.GROUND;
    const memo = new Map();
    const cellAt = (x, z) => { const k = x + ',' + z; let c = memo.get(k); if (!c) { c = this._cityCell(x, z); memo.set(k, c); } return c; };

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = bx + lx, wz = bz + lz;
        const self = cellAt(wx, wz);
        const P = this._cityBlock(self.i, self.j);
        const border = self.border;
        const dxS = wx + 0.5 - P.sx, dzS = wz + 0.5 - P.sz;
        const rrSelf = Math.hypot(dxS, dzS);
        const ang = Math.atan2(dzS, dxS);

        const isRoad = border < C.ROAD_B;
        const isSide = !isRoad && border < C.SIDE_B;
        const coreCol = border >= C.CORE_B;
        const isBuilding = coreCol && !P.isPark && P.zone !== 'plaza';

        // Sąsiedzi (do szczelnego wykrywania ścian i krawędzi footprintu)
        const nbrs = [[wx+1,wz],[wx-1,wz],[wx,wz+1],[wx,wz-1]].map(([x,z]) => {
          const c = cellAt(x, z), bp = this._cityBlock(c.i, c.j);
          const rr = Math.hypot(x + 0.5 - bp.sx, z + 0.5 - bp.sz);
          return { c, bp, rr };
        });
        const footN = (n, y) => !n.bp.isPark && n.bp.zone !== 'plaza' && this._footAt(n.bp, n.c.border, n.rr, y);
        const wallAt = (y) => nbrs.some(n => !footN(n, y));
        const cornerAt = (y) => nbrs.reduce((k, n) => k + (footN(n, y) ? 0 : 1), 0) >= 2;
        // Kilka wejść: drzwi w kilku kierunkach rozłożonych wokół budynku
        const isDoorArc = (a) => {
          const step = Math.PI * 2 / P.doorN;
          for (let k = 0; k < P.doorN; k++) {
            let d = Math.abs(a - (P.doorAngle + k * step)) % (Math.PI * 2);
            if (d > Math.PI) d = Math.PI * 2 - d;
            if (d < 0.15) return true;
          }
          return false;
        };

        // Szyb schodowy przy środku komórki
        const scx = Math.round(P.sx), scz = Math.round(P.sz);
        const inShaft = isBuilding && Math.abs(wx - scx) <= 1 && Math.abs(wz - scz) <= 1;

        // Nawierzchnia na poziomie gruntu
        let surf;
        if (isRoad) surf = (border < 0.7 && ((wx + wz) & 3) === 0) ? B.QUARTZ : B.STONE; // asfalt + dash
        else if (isSide) surf = B.QUARTZ;                                                 // chodnik
        else if (P.isPlaza && coreCol) surf = ((wx + wz) & 1) ? B.QUARTZ : B.STONE;       // bruk placu
        else if (P.isPark && coreCol) surf = B.GRASS;
        else if (isBuilding && this._footAt(P, border, rrSelf, GROUND + 1)) surf = B.PLANKS;
        else surf = B.GRASS;                                                              // ogródek/park

        const moundTop = GROUND + P.H + Math.floor((border - C.CORE_B) * 0.6);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = B.AIR;
          if (y === 0) b = B.BEDROCK;
          else if (y < GROUND - 4) { b = B.STONE; const ore = this._oreAt(wx, y, wz); if (ore) b = ore; }
          else if (y < GROUND) b = B.DIRT;
          else if (y === GROUND) b = surf;
          else if (isBuilding) {
            const fy = this._footAt(P, border, rrSelf, y);
            if (fy) {
              b = wallAt(y) ? this._cityWall(P, y, ang, isDoorArc(ang), cornerAt(y))
                            : this._cityInterior(P, y, inShaft, wx, wz, scx, scz);
            } else {
              const fyPrev = this._footAt(P, border, rrSelf, y - 1);
              if (P.roofType === 'mound') { if (fyPrev || y <= moundTop) b = P.roofMat; }
              else if (fyPrev) b = P.roofMat;            // płaski/setback/spire: zaślepka co uskok/szczyt
            }
          }
          chunk.set(lx, y, lz, b);
        }

        // ── Balkony na piętrach (mieszkania/handel) ──────────────────────────
        // Platforma tuż przy elewacji (2 bloki głęboka) z barierką na krawędzi.
        if (!isBuilding && !P.isPark && (P.zone === 'residential' || P.zone === 'commercial')) {
          const dw = (C.CORE_B - border) / 2;                       // ~bloki od ściany
          const seg = Math.floor(((ang + Math.PI) / Math.PI) * 6);  // 12 wycinków po obwodzie
          if (dw > 0 && dw <= 2 && (((seg % 2) + 2) % 2) === 0) {
            const outer = dw > 1;
            for (let k = 1; GROUND + k * C.FLOOR_H <= GROUND + P.H - 1; k++) {
              const Ys = GROUND + k * C.FLOOR_H;                     // na równi ze stropem piętra
              chunk.set(lx, Ys, lz, P.roofMat);                     // podłoga balkonu
              if (outer) chunk.set(lx, Ys + 1, lz, P.trimMat);      // barierka
            }
          }
        }

        // ── Taras na dachu (budynki z płaskim dachem) ────────────────────────
        // Barierka wokół krawędzi dachu → chodliwy taras na szczycie.
        if (isBuilding && P.roofType === 'flat') {
          let sy = -1;
          for (let y = GROUND + P.H; y > GROUND; y--) if (this._footAt(P, border, rrSelf, y)) { sy = y; break; }
          if (sy > GROUND && wallAt(sy)) chunk.set(lx, sy + 2, lz, P.trimMat);   // dach na sy+1, barierka na sy+2
        }

        // ── Detale ponad kolumną ──────────────────────────────────────────────
        this._cityDetails(chunk, lx, lz, wx, wz, bx, bz, P, self, border, rrSelf, coreCol,
                          isRoad, isSide, isBuilding, scx, scz, memo);
      }
    }
  }

  // Detale: fontanna, maszt/rekwizyt dachu, latarnie, przejścia, ławki, żywopłoty, stawy, drzewa.
  _cityDetails(chunk, lx, lz, wx, wz, bx, bz, P, self, border, rrSelf, coreCol, isRoad, isSide, isBuilding, scx, scz) {
    const C = World.CITY, GROUND = C.GROUND;
    const atSiteCenter = Math.abs(wx - scx) === 0 && Math.abs(wz - scz) === 0;

    // Fontanna na placu (od środka komórki, bezszwowo)
    if (P.isPlaza && coreCol) {
      const d = Math.max(Math.abs(wx - scx), Math.abs(wz - scz));
      if (d === 0) { chunk.set(lx, GROUND+1, lz, B.STONE); chunk.set(lx, GROUND+2, lz, B.STONE); chunk.set(lx, GROUND+3, lz, B.WATER); }
      else if (d <= 2) { chunk.set(lx, GROUND, lz, B.STONE); chunk.set(lx, GROUND+1, lz, B.WATER); }
      else if (d === 3) chunk.set(lx, GROUND+1, lz, B.STONE);
    }

    // Rekwizyt na dachu (na środku bryły). „top" liczony z realnego footprintu.
    if (isBuilding && atSiteCenter) {
      let top = GROUND;
      for (let y = GROUND + P.H; y > GROUND; y--) if (this._footAt(P, border, rrSelf, y)) { top = y; break; }
      const rt = top + (P.roofType === 'mound' ? Math.floor((border - C.CORE_B) * 0.6) : 0);
      if (P.roofType === 'spire' || P.landmark) {
        const h = P.landmark ? 6 : 3;
        for (let y = rt + 1; y <= rt + h; y++) chunk.set(lx, y, lz, P.wallMat);
        chunk.set(lx, rt + h + 1, lz, B.TORCH); this.torches.add(`${wx},${rt + h + 1},${wz}`);
      } else if (P.prop === 'antenna') {
        for (let y = rt + 1; y <= rt + 3; y++) chunk.set(lx, y, lz, P.trimMat);
        chunk.set(lx, rt + 4, lz, B.TORCH); this.torches.add(`${wx},${rt + 4},${wz}`);
      } else if (P.prop === 'tank') {
        chunk.set(lx, rt + 1, lz, B.STONE); chunk.set(lx, rt + 2, lz, B.WATER);
      } else if (P.prop === 'ac') {
        chunk.set(lx, rt + 1, lz, B.WOOL_BLACK);
      } else if (P.prop === 'garden') {
        chunk.set(lx, rt + 1, lz, B.GRASS); this._placeTree(chunk, lx, rt + 2, lz, bx, bz);
      }
    }

    // Latarnie na słupach wzdłuż chodników
    if (isSide && (wx % 8 === 0) && (wz % 8 === 0)) {
      chunk.set(lx, GROUND + 1, lz, B.WOOD); chunk.set(lx, GROUND + 2, lz, B.WOOD);
      chunk.set(lx, GROUND + 3, lz, B.TORCH); this.torches.add(`${wx},${GROUND + 3},${wz}`);
    }

    // Parki: żywopłot na obrzeżu, staw w środku, kwiaty i drzewa
    if (P.isPark && coreCol && !isBuilding) {
      if (border < C.CORE_B + 1.2) chunk.set(lx, GROUND + 1, lz, B.LEAVES);         // żywopłot
      else if (border > C.CORE_B + 8 && this._rng(wx * 5, wz * 7) < 0.5) chunk.set(lx, GROUND + 1, lz, B.WATER); // staw
      else if (this._rng(wx * 9 + 1, wz * 3 + 2) < 0.05) chunk.set(lx, GROUND + 1, lz, B.CROP);                 // kwiaty
      else if (this._rng(wx * 11, wz * 13) < 0.02) this._placeTree(chunk, lx, GROUND + 1, lz, bx, bz);
    }

    // Ławki na placu; drzewa wzdłuż chodników i w ogródkach mieszkalnych
    if (P.isPlaza && coreCol) {
      const d = Math.max(Math.abs(wx - scx), Math.abs(wz - scz));
      if (d === 6 && ((wx + wz) & 1) === 0) chunk.set(lx, GROUND + 1, lz, B.PLANKS);   // ławka
      if (d === 8 && (wx % 4 === 0) && (wz % 4 === 0)) this._placeTree(chunk, lx, GROUND + 1, lz, bx, bz);
    } else if (isSide && (wx % 6 === 0) && (wz % 6 === 0) && this._rng(wx, wz) < 0.4) {
      this._placeTree(chunk, lx, GROUND + 1, lz, bx, bz);                              // drzewo przy chodniku
    } else if (P.zone === 'residential' && !P.isPark && !isBuilding && border >= C.SIDE_B && border < C.CORE_B
               && this._rng(wx * 2, wz * 2) < 0.06) {
      this._placeTree(chunk, lx, GROUND + 1, lz, bx, bz);                              // drzewo w ogródku
    }
  }

  // Ściana budynku: przechodnie drzwi, witryny parteru, okna wg wzoru, naroża (kwoiny).
  _cityWall(P, y, ang, isDoorArc, isCorner) {
    const C = World.CITY, GROUND = C.GROUND, lvl = y - GROUND;
    if (isDoorArc && (lvl === 1 || lvl === 2)) return B.DOOR_OPEN;             // przechodnie drzwi
    if (isCorner) return P.trimMat;                                            // naroże (kwoin)
    if ((P.glassy || P.zone === 'commercial') && lvl <= 2) return B.GLASS;     // witryna parteru
    // Poziomy pas stropowy zawsze pełny (spójna elewacja)
    if (lvl % C.FLOOR_H === 0) return P.wallMat;
    const hh = Math.round(ang * 6) + 100;                                      // indeks poziomy wzdłuż elewacji
    let win = false;
    switch (P.winPattern) {
      case 'band':   win = lvl % 3 === 2; break;
      case 'grid':   win = (lvl % 2 === 0) && (hh % 2 === 0); break;
      case 'strip':  win = hh % 3 !== 0; break;
      case 'checker':win = (lvl + hh) % 2 === 0; break;
    }
    return win ? B.GLASS : P.wallMat;
  }

  // Wnętrze budynku: stropy pięter, spiralne schody w szybie, ścianki działowe
  // dzielące kondygnację na pokoje oraz meble stojące na podłodze.
  _cityInterior(P, y, inShaft, wx, wz, scx, scz) {
    const C = World.CITY, GROUND = C.GROUND, FH = C.FLOOR_H, lvl = y - GROUND;
    if (inShaft) {
      const [sx, sz] = C.STAIR_RING[(lvl - 1 + 800) % 8];
      return (wx - scx + 1 === sx && wz - scz + 1 === sz) ? B.PLANKS : B.AIR;   // stopień schodów
    }
    if (y > GROUND && lvl % FH === 0) return B.PLANKS;                          // strop piętra
    // Ścianki działowe: siatka pokoi co ROOM z otworami drzwiowymi na środku ściany
    const ROOM = C.ROOM, MID = ROOM >> 1;
    const gx = ((wx % ROOM) + ROOM) % ROOM, gz = ((wz % ROOM) + ROOM) % ROOM;
    const onPartition = gx === 0 || gz === 0;
    const doorGap = (gx === 0 && (gz === MID || gz === MID + 1)) || (gz === 0 && (gx === MID || gx === MID + 1));
    if (onPartition && !doorGap) return B.PLANKS;                              // ścianka działowa
    // Meble: warstwa tuż nad stropem (na której się stoi)
    if ((lvl - 1) % FH === 0 && lvl >= 1) {
      const f = this._cityFurnish(P, wx, wz, Math.floor(lvl / FH), gx, gz);
      if (f === B.TORCH) this.torches.add(`${wx},${y},${wz}`);                 // lampka wnętrza
      return f;
    }
    return B.AIR;
  }

  // Meble w pokoju (współrzędne lokalne gx,gz w siatce pokoju). Rozstawione przy
  // ścianach dużego pokoju, ze stołem i lampką w centrum. Motyw per pokój+piętro.
  _cityFurnish(P, wx, wz, floorIdx, gx, gz) {
    const ROOM = World.CITY.ROOM, HI = ROOM - 1, MID = ROOM >> 1;
    if (gx === MID && gz === MID) return B.TORCH;                              // lampka na środku
    const roomX = Math.floor(wx / ROOM), roomZ = Math.floor(wz / ROOM);
    const theme = Math.floor(this._rng(roomX * 131 + floorIdx * 17 + 3, roomZ * 197 + 5) * 4);
    switch (theme) {
      case 0: // sypialnia
        if (gx === 1 && gz === 1) return B.BED;
        if (gx === HI - 1 && gz === 1) return B.BED;
        if (gx === 1 && gz === HI) return B.CHEST;
        if (gx === HI && gz === HI) return B.CROP;
        break;
      case 1: // kuchnia
        if (gx === 1 && gz === 1) return B.FURNACE;
        if (gx === 2 && gz === 1) return B.FURNACE;
        if (gx === HI && gz === 1) return B.CRAFTING_TABLE;
        if (gx === 1 && gz === HI) return B.CHEST;
        if (gx === HI && gz === HI) return B.CHEST;
        break;
      case 2: // gabinet / biblioteka
        if (gx === 1 && gz >= 1 && gz <= HI) return B.BOOKSHELF;               // regały wzdłuż ściany
        if (gx === HI && gz >= 1 && gz <= HI) return B.BOOKSHELF;
        if (gz === MID + 1 && (gx === MID - 1 || gx === MID + 1)) return B.CRAFTING_TABLE;
        break;
      case 3: // salon
        if (gx === MID && gz === MID + 1) return B.CRAFTING_TABLE;             // stół obok lampy
        if (gx === MID - 1 && gz === MID) return B.CRAFTING_TABLE;
        if (gx === HI && gz === 1) return B.CHEST;
        if (gx === 1 && gz === HI) return B.CROP;
        if (gx === HI && gz === HI) return B.CROP;
        break;
    }
    return B.AIR;
  }

  _placeTree(chunk, lx, by, lz, bx, bz) {
    // Seeded height based on world pos
    const wx = bx + lx, wz = bz + lz;
    const r = this._rng(wx * 3, wz * 7);
    const height = 4 + Math.floor(r * 3);
    // Trunk
    for (let y = by; y < by + height && y < WORLD_HEIGHT; y++) chunk.set(lx, y, lz, B.WOOD);
    const top = by + height - 1;
    // Leaves — placed within chunk + neighbors via world.setBlock if available
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 3) continue;
          const nx = lx + dx, ny = top + dy, nz = lz + dz;
          if (ny < 0 || ny >= WORLD_HEIGHT) continue;
          // Within-chunk placement
          if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
            if (chunk.get(nx, ny, nz) === B.AIR) chunk.set(nx, ny, nz, B.LEAVES);
          } else {
            // Cross-chunk: defer to world if world is already available
            // (will be handled by neighbor chunks generating their own trees)
          }
        }
  }

  spawnHeight(wx, wz) {
    return this.findLandSpawn(wx, wz).y;
  }

  // True if the column at (wx,wz) is dry land — i.e. its topmost solid ground
  // block is NOT water (and lies above sea level). Returns the ground height,
  // or -1 when the column is water/ocean and thus not a valid spawn.
  _landTop(wx, wz) {
    // Make sure the chunk exists so we read real generated blocks, not AIR.
    this.getOrCreateChunk(Math.floor(wx / CHUNK_SIZE), Math.floor(wz / CHUNK_SIZE));
    // Scan down from the sky to the first non-air block.
    for (let y = WORLD_HEIGHT - 1; y >= 1; y--) {
      const b = this.getBlock(wx, y, wz);
      if (b === B.AIR) continue;
      // Ignore trees so we don't perch the player on leaves/trunks.
      if (b === B.WOOD || b === B.LEAVES) continue;
      // First real surface block found: it's land only if it isn't water.
      return b === B.WATER ? -1 : y;
    }
    return -1;
  }

  findLandSpawn(wx, wz) {
    // Search outward in expanding rings until we hit a column that is dry land,
    // i.e. the spawn point is not in / under water.
    for (let r = 0; r <= 128; r += 2) {
      const candidates = r === 0
        ? [[wx, wz]]
        : [
            [wx + r, wz], [wx - r, wz], [wx, wz + r], [wx, wz - r],
            [wx + r, wz + r], [wx - r, wz + r], [wx + r, wz - r], [wx - r, wz - r],
          ];
      for (const [x, z] of candidates) {
        const top = this._landTop(x, z);
        if (top > 0) return { x: x + 0.5, y: top + 2, z: z + 0.5 };
      }
    }
    // Fallback (should never happen): drop in above sea level at the origin.
    return { x: wx + 0.5, y: SEA_LEVEL + 3, z: wz + 0.5 };
  }

  // ── Uprawy: sadzenie i wzrost ───────────────────────────────────────────────
  plantCrop(wx, wy, wz) {
    this.setBlock(wx, wy, wz, B.CROP);
    this.crops.set(`${wx},${wy},${wz}`, { t: 0 });
  }

  // Postęp wzrostu sadzonek; po GROW_TIME zmieniają się w dojrzałe zboże.
  tickCrops(dt) {
    const GROW_TIME = 40;   // sekundy do dojrzenia
    for (const [key, c] of [...this.crops]) {
      const [x,y,z] = key.split(',').map(Number);
      if (this.getBlock(x,y,z) !== B.CROP) { this.crops.delete(key); continue; }
      c.t += dt;
      if (c.t >= GROW_TIME) {
        this.setBlock(x, y, z, B.CROP_RIPE);
        this.crops.delete(key);
      }
    }
  }

  // Po wczytaniu świata odbuduj indeksy pochodni i rosnących upraw z bloków.
  _indexSpecialBlocks(chunk) {
    const bx = chunk.cx * CHUNK_SIZE, bz = chunk.cz * CHUNK_SIZE;
    for (let y=0; y<WORLD_HEIGHT; y++)
      for (let z=0; z<CHUNK_SIZE; z++)
        for (let x=0; x<CHUNK_SIZE; x++) {
          const b = chunk.get(x,y,z);
          if (b === B.TORCH) this.torches.add(`${bx+x},${y},${bz+z}`);
          else if (b === B.CROP) this.crops.set(`${bx+x},${y},${bz+z}`, { t:0 });
        }
  }

  // Update chunks around player, return arrays of added/removed chunks
  update(px, pz, radius) {
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    const needed = new Set();

    for (let dx = -radius; dx <= radius; dx++)
      for (let dz = -radius; dz <= radius; dz++)
        needed.add(this.key(cx+dx, cz+dz));

    const added = [], removed = [];

    for (const k of needed) {
      if (!this.chunks.has(k)) {
        const [cx2, cz2] = k.split(',').map(Number);
        const ch = new Chunk(cx2, cz2);
        this.generateChunk(ch);
        this.chunks.set(k, ch);
        added.push(ch);
      }
    }

    for (const [k, ch] of this.chunks) {
      if (!needed.has(k)) { removed.push(ch); this.chunks.delete(k); }
    }

    return { added, removed };
  }

  save() {
    const data = {};
    for (const [k, ch] of this.chunks) {
      // Only save modified chunks (heuristic: if any non-default block exists)
      data[k] = Array.from(ch.blocks);
    }
    try { localStorage.setItem(`mc_world_${this.seed}`, JSON.stringify(data)); } catch(e) {}
  }

  load() {
    try {
      const raw = localStorage.getItem(`mc_world_${this.seed}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      for (const [k, blocks] of Object.entries(data)) {
        const [cx, cz] = k.split(',').map(Number);
        if (!this.chunks.has(k)) {
          const ch = new Chunk(cx, cz);
          ch.blocks.set(blocks);
          ch.dirty = true;
          this.chunks.set(k, ch);
          this._indexSpecialBlocks(ch);
        }
      }
    } catch(e) {}
  }

  // ── Serializacja świata do zapisu na serwerze ────────────────────────────────
  // Bloki kodowane base64 (zwięźlej niż tablica liczb w JSON).
  exportState() {
    const chunks = {};
    for (const [k, ch] of this.chunks) chunks[k] = bytesToB64(ch.blocks);
    return { seed: this.seed, mode: this.mode, chunks };
  }

  importState(state) {
    if (!state || !state.chunks) return;
    for (const [k, b64] of Object.entries(state.chunks)) {
      const [cx, cz] = k.split(',').map(Number);
      const ch = new Chunk(cx, cz);
      ch.blocks.set(b64ToBytes(b64));
      ch.dirty = true;
      this.chunks.set(k, ch);
      this._indexSpecialBlocks(ch);
    }
  }
}

// Konwersje bajtów <-> base64 (dla zwartego zapisu chunków)
function bytesToB64(u8) {
  let s = '';
  const CH = 0x8000;   // fragmentami, by nie przepełnić stosu
  for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  return btoa(s);
}
function b64ToBytes(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
