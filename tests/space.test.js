// space.test.js — typ świata „Stacja kosmiczna" (tryb 'space'): brak grawitacji + kształt stacji.
// Geometria (hub + kopuła, promieniste szprychy, pierścień, panele) liczona funkcjami SDF,
// deterministycznie i bez zależności od przeglądarki — nadaje się do testów jednostkowych.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { B, BLOCK_PROPS } from '../js/blocks.js';

const S = World.STATION;
const PROPS = new Set([B.CHEST, B.FURNACE, B.BED, B.BOOKSHELF, B.CRAFTING_TABLE, B.PUMPKIN, B.MELON]);

// Skanuje bryłę stacji i zwraca zbiór wszystkich ID bloków (do testów obecności elementów).
function scanBlocks(w) {
  const seen = new Set();
  for (let wx = -S.SOLAR_OUT; wx <= S.SOLAR_OUT; wx += 1)
    for (let wz = -(S.RING_R + S.RING_TUBE); wz <= S.RING_R + S.RING_TUBE; wz += 1)
      for (let wy = S.Y_LO; wy <= S.Y_HI; wy += 1)
        seen.add(w._stationBlock(wx, wy, wz));
  return seen;
}

test('tryb space wyłącza grawitację; pozostałe tryby ją zachowują', () => {
  assert.equal(new World(1, 'space').gravity, false);
  assert.equal(new World(1).gravity, true);
  assert.equal(new World(1, 'city').gravity, true);
});

test('środek hubu i wnętrza modułów są przestronne (AIR)', () => {
  const w = new World(1, 'space');
  assert.equal(w._stationBlock(0, S.CY, 0), B.AIR);          // środek hubu
  assert.equal(w._stationBlock(S.RING_R, S.CY, 0), B.AIR);   // wnętrze pierścienia
  assert.equal(w._stationBlock(14, S.CY, 0), B.AIR);         // wnętrze szprychy X
  assert.equal(w._stationBlock(0, S.CY, 14), B.AIR);         // wnętrze szprychy Z
});

test('kadłub hubu i pierścienia to bloki solidne', () => {
  const w = new World(1, 'space');
  // Wysokość CY+10 (z dala od płaszczyzny CY, gdzie biegną szprychy i korytarze modułów
  // po przekątnych) — testuje czystą ścianę hubu, niezależnie od skrzyżowań z korytarzami.
  const hub = w._stationBlock(4, S.CY + 10, 4);
  const ring = w._stationBlock(S.RING_R + S.RING_TUBE, S.CY, 0); // zewnętrzna ściana pierścienia
  assert.ok(BLOCK_PROPS[hub].solid, `ściana hubu powinna być solidna (${hub})`);
  assert.ok(BLOCK_PROPS[ring].solid, `ściana pierścienia powinna być solidna (${ring})`);
});

test('przeszklona kopuła dowodzenia na szczycie hubu', () => {
  const w = new World(1, 'space');
  assert.equal(w._stationBlock(0, S.HUB_T + S.HUB_R, 0), B.GLASS);
});

test('szprychy łączą hub z pierścieniem bez ścian na złączach (ciągłe wnętrze)', () => {
  const w = new World(1, 'space');
  // Wzdłuż szprychy +X od hubu do pierścienia wnętrze jest nieprzerwane.
  for (let x = 0; x <= S.RING_R; x++) {
    assert.equal(w._stationBlock(x, S.CY, 0), B.AIR, `szprycha X przerwana @ x=${x}`);
  }
});

test('panele słoneczne (LAPIS) na wysięgnikach poza pierścieniem', () => {
  const w = new World(1, 'space');
  const x = S.RING_R + S.RING_TUBE + 3;
  assert.equal(w._stationBlock(x, S.CY, 4), B.LAPIS_BLOCK);
  assert.equal(w._stationBlock(-x, S.CY, 4), B.LAPIS_BLOCK);
  assert.equal(w._stationBlock(x, S.CY + 2, 4), B.AIR);   // panel tylko w płaszczyźnie CY
});

test('poza stacją panuje pusta przestrzeń (AIR)', () => {
  const w = new World(1, 'space');
  assert.equal(w._stationBlock(0, 120, 0), B.AIR);
  assert.equal(w._stationBlock(100, S.CY, 0), B.AIR);
  assert.equal(w._stationBlock(0, S.CY, 100), B.AIR);
});

test('stacja zawiera okna, oświetlenie i wyposażenie', () => {
  const seen = scanBlocks(new World(1, 'space'));
  assert.ok(seen.has(B.GLASS), 'brak okien/szkła');
  assert.ok(seen.has(B.RS_LAMP_ON), 'brak oświetlenia (lamp)');
  assert.ok(seen.has(B.IRON_BLOCK), 'brak kadłuba');
  assert.ok([...PROPS].some(p => seen.has(p)), 'brak jakiegokolwiek wyposażenia pomieszczeń');
});

test('generacja chunków zgodna z blueprintem; determinizm dla tego samego seeda', () => {
  const a = new World(42, 'space');
  const b = new World(42, 'space');
  a.getOrCreateChunk(0, 0);   // pokrywa wx,wz ∈ [0,15]
  b.getOrCreateChunk(0, 0);
  const pts = [[0, S.CY, 0], [4, S.CY, 4], [14, S.CY, 0], [0, S.HUB_T + S.HUB_R, 0]];
  for (const [x, y, z] of pts) {
    assert.equal(a.getBlock(x, y, z), a._stationBlock(x, y, z), `blueprint @ ${x},${y},${z}`);
    assert.equal(a.getBlock(x, y, z), b.getBlock(x, y, z), `determinizm @ ${x},${y},${z}`);
  }
});

test('generacja: panel słoneczny trafia do chunka po stronie skrzydła', () => {
  const w = new World(1, 'space');
  const x = S.RING_R + S.RING_TUBE + 3;
  w.getOrCreateChunk(Math.floor(x / 16), 0);
  assert.equal(w.getBlock(x, S.CY, 4), B.LAPIS_BLOCK);
});

test('chunk daleko poza stacją jest całkowicie pusty (kosmos)', () => {
  const w = new World(1, 'space');
  w.getOrCreateChunk(20, 0);   // wx ≈ 320
  assert.equal(w.getBlock(320, S.CY, 0), B.AIR);
  assert.equal(w.getBlock(325, S.CY, 5), B.AIR);
});

test('round-trip zapisu zachowuje tryb space', () => {
  assert.equal(new World(7, 'space').exportState().mode, 'space');
});

// ── Moduły po przekątnych (World.PODS): laboratorium, ładownia, obserwatorium, warsztat ──

test('moduły po przekątnych: wnętrze puste, kadłub solidny', () => {
  const w = new World(1, 'space');
  for (const pod of World.PODS) {
    const cx = Math.round(pod.dx * S.POD_DIST), cz = Math.round(pod.dz * S.POD_DIST);
    assert.equal(w._stationBlock(cx, S.CY, cz), B.AIR, `środek modułu ${pod.key} powinien być pusty`);
    // Szukaj solidnego bloku w promieniu ~1 bloku od oczekiwanej pozycji kadłuba —
    // przy kierunkach dokładnie po przekątnej zaokrąglenie siatki bloków może "ściąć róg".
    const bx = pod.dx * (S.POD_DIST + S.POD_R), bz = pod.dz * (S.POD_DIST + S.POD_R);
    let foundSolid = false;
    for (let ox = -1; ox <= 1 && !foundSolid; ox++)
      for (let oz = -1; oz <= 1 && !foundSolid; oz++) {
        const b = w._stationBlock(Math.round(bx) + ox, S.CY, Math.round(bz) + oz);
        if (b !== B.AIR && BLOCK_PROPS[b].solid) foundSolid = true;
      }
    assert.ok(foundSolid, `kadłub modułu ${pod.key} powinien być solidny w pobliżu (${Math.round(bx)},${Math.round(bz)})`);
  }
});

test('korytarze do modułów po przekątnych są przechodnie (brak ścian na złączu z hubem)', () => {
  const w = new World(1, 'space');
  for (const pod of World.PODS) {
    for (let d = 0; d <= S.POD_DIST; d += 2) {
      const x = Math.round(pod.dx * d), z = Math.round(pod.dz * d);
      assert.equal(w._stationBlock(x, S.CY, z), B.AIR, `korytarz do ${pod.key} przerwany @ d=${d}`);
    }
  }
});

test('każdy moduł po przekątnej ma własny, odróżniający motyw kadłuba', () => {
  const w = new World(1, 'space');
  const EXPECT = {
    laboratory:  new Set([B.GLASS, B.QUARTZ]),
    observatory: new Set([B.GLASS]),
    cargo:       new Set([B.IRON_BLOCK]),
    engineering: new Set([B.REDSTONE_BLOCK, B.IRON_BLOCK]),
  };
  for (const pod of World.PODS) {
    const cx = pod.dx * S.POD_DIST, cz = pod.dz * S.POD_DIST;
    const seen = new Set();
    for (let dx = -S.POD_R - 1; dx <= S.POD_R + 1; dx++)
      for (let dz = -S.POD_R - 1; dz <= S.POD_R + 1; dz++)
        for (let dy = -S.POD_R - 1; dy <= S.POD_R + 1; dy++) {
          const wx = Math.round(cx + dx), wy = S.CY + dy, wz = Math.round(cz + dz);
          if (Math.hypot(wx, wz) <= S.POD_DIST) continue;   // pomiń półkulę od strony korytarza (styka się z jego wnętrzem)
          const dist = w._podSphere(wx, wy, wz, pod);
          if (dist > S.POD_R || dist <= S.POD_R - 1) continue;   // tylko warstwa kadłuba (nie wnętrze/nie poza kulą)
          seen.add(w._stationBlock(wx, wy, wz));
        }
    assert.ok(seen.size > 0, `brak bloków kadłuba dla modułu ${pod.key}`);
    for (const b of seen) assert.ok(EXPECT[pod.key].has(b), `${pod.key}: nieoczekiwany blok kadłuba ${b}`);
  }
});

test('moduły po przekątnych mają wyposażenie zgodne z motywem', () => {
  const w = new World(1, 'space');
  const EXPECT = {
    laboratory:  new Set([B.CRAFTING_TABLE, B.FURNACE, B.BOOKSHELF]),
    cargo:       new Set([B.CHEST, B.IRON_BLOCK]),
    observatory: new Set([B.BOOKSHELF, B.CRAFTING_TABLE]),
    engineering: new Set([B.FURNACE, B.PISTON, B.RS_LAMP_ON]),
  };
  for (const pod of World.PODS) {
    const cx = pod.dx * S.POD_DIST, cz = pod.dz * S.POD_DIST;
    const seen = new Set();
    for (let dx = -S.POD_R; dx <= S.POD_R; dx++)
      for (let dz = -S.POD_R; dz <= S.POD_R; dz++)
        for (let dy = -S.POD_R; dy <= S.POD_R; dy++) {
          const b = w._stationBlock(Math.round(cx + dx), S.CY + dy, Math.round(cz + dz));
          if (b !== B.AIR) seen.add(b);
        }
    const found = [...seen].filter(b => EXPECT[pod.key].has(b));
    assert.ok(found.length > 0, `brak spodziewanego wyposażenia w module ${pod.key} (widziano: ${[...seen]})`);
  }
});

test('generacja: moduł po przekątnej trafia do odpowiedniego chunka (zgodność z blueprintem)', () => {
  const w = new World(1, 'space');
  for (const pod of World.PODS) {
    const x = Math.round(pod.dx * S.POD_DIST), z = Math.round(pod.dz * S.POD_DIST);
    w.getOrCreateChunk(Math.floor(x / 16), Math.floor(z / 16));
    assert.equal(w.getBlock(x, S.CY, z), w._stationBlock(x, S.CY, z), `chunk modułu ${pod.key} niezgodny z blueprintem`);
  }
});
