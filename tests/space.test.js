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
  const hub = w._stationBlock(4, S.CY, 4);                       // ściana hubu
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
