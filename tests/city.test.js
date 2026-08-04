// Testy generacji miasta (tryb 'city', model Voronoi) — strefy, wnętrza, plac,
// szczelność ścian, determinizm i bezszwowość między chunkami.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World, WORLD_HEIGHT } from '../js/world.js';
import { B, BLOCK_PROPS } from '../js/blocks.js';

const GROUND = 40;

// Generuje siatkę chunków wokół centrum i zwraca gotowy świat-miasto.
function cityWorld(seed = 2026, R = 6) {
  const w = new World(seed, 'city');
  for (let cx = -R; cx <= R; cx++) for (let cz = -R; cz <= R; cz++) w.getOrCreateChunk(cx, cz);
  return w;
}

test('tryb city zapisuje się w exportState', () => {
  const w = new World(1, 'city');
  assert.equal(w.mode, 'city');
  assert.equal(w.exportState().mode, 'city');
});

test('Voronoi: strefy rosną ku centrum (centrum wyższe niż peryferia)', () => {
  const w = cityWorld();
  const seen = new Set(); const maxH = {};
  for (let x = -90; x <= 90; x += 3) for (let z = -90; z <= 90; z += 3) {
    const c = w._cityCell(x, z), p = w._cityBlock(c.i, c.j);
    seen.add(p.zone); maxH[p.zone] = Math.max(maxH[p.zone] || 0, p.H);
  }
  for (const z of ['plaza', 'downtown', 'commercial', 'residential']) assert.ok(seen.has(z), `brak strefy ${z}`);
  assert.ok(maxH.downtown > maxH.residential, 'wieżowce powinny być wyższe niż domki');
});

test('budynki nie przekraczają wysokości świata', () => {
  const w = cityWorld();
  for (let x = -120; x <= 120; x += 5) for (let z = -120; z <= 120; z += 5) {
    const c = w._cityCell(x, z), p = w._cityBlock(c.i, c.j);
    assert.ok(GROUND + p.H + 10 < WORLD_HEIGHT, `kwartał za wysoki (${p.zone}, H=${p.H})`);
  }
});

test('plac centralny ma fontannę z wodą', () => {
  const w = cityWorld();
  let water = 0;
  for (let x = -90; x <= 90; x++) for (let z = -90; z <= 90; z++)
    for (let y = GROUND; y < GROUND + 5; y++) if (w.getBlock(x, y, z) === B.WATER) water++;
  assert.ok(water > 0, 'brak wody (fontanna/staw) w mieście');
});

test('drzwi wejściowe są przechodnie (DOOR_OPEN)', () => {
  const w = cityWorld();
  let doors = 0;
  for (let x = -90; x <= 90; x++) for (let z = -90; z <= 90; z++)
    if (w.getBlock(x, GROUND + 1, z) === B.DOOR_OPEN) doors++;
  assert.ok(doors > 0, 'brak drzwi w mieście');
  assert.equal(BLOCK_PROPS[B.DOOR_OPEN].solid, false, 'drzwi muszą być przechodnie');
});

test('budynki mają wnętrza: stropy pięter', () => {
  const w = cityWorld();
  let slabs = 0;
  for (let x = -90; x <= 90; x++) for (let z = -90; z <= 90; z++) {
    // kolumna wnętrza: podłoga budynku na gruncie, powietrze tuż nad
    if (w.getBlock(x, GROUND, z) !== B.PLANKS) continue;
    for (let y = GROUND + 4; y < GROUND + 40; y += 4)
      if (w.getBlock(x, y, z) === B.PLANKS && w.getBlock(x, y - 1, z) === B.AIR) slabs++;
  }
  assert.ok(slabs > 50, `za mało stropów pięter (${slabs})`);
});

test('ściany są szczelne — wnętrza nie wyciekają na ulicę', () => {
  const w = cityWorld();
  let leaks = 0, interior = 0;
  for (let x = -89; x <= 89; x++) for (let z = -89; z <= 89; z++) {
    if (w.getBlock(x, GROUND + 2, z) !== B.AIR) continue;
    if (w.getBlock(x, GROUND, z) !== B.PLANKS) continue;      // tylko kolumny podłogi budynku
    interior++;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const g0 = w.getBlock(x + dx, GROUND, z + dz), g2 = w.getBlock(x + dx, GROUND + 2, z + dz);
      if (g2 === B.AIR && (g0 === B.STONE || g0 === B.QUARTZ || g0 === B.GRASS)) { leaks++; break; }
    }
  }
  assert.ok(interior > 100, 'próbka wnętrz zbyt mała');
  assert.equal(leaks, 0, `wnętrza wyciekają na zewnątrz (${leaks})`);
});

test('wnętrza są umeblowane (łóżka, stoły, skrzynie, regały) i mają pokoje', () => {
  const w = cityWorld();
  const FURN = new Set([B.BED, B.CHEST, B.CRAFTING_TABLE, B.FURNACE, B.BOOKSHELF, B.CROP]);
  const found = new Set(); let total = 0;
  for (let x = -80; x <= 80; x++) for (let z = -80; z <= 80; z++)
    for (let y = GROUND + 1; y < GROUND + 30; y++) {
      const b = w.getBlock(x, y, z);
      if (FURN.has(b)) { found.add(b); total++; }
    }
  assert.ok(total > 200, `za mało mebli (${total})`);
  assert.ok(found.size >= 4, `za mało typów mebli (${found.size})`);
  // meble muszą stać na podłodze/stropie (blok pod nimi nie jest powietrzem)
  for (let x = -80, checked = 0; x <= 80 && checked < 20; x++)
    for (let z = -80; z <= 80 && checked < 20; z++)
      for (let y = GROUND + 1; y < GROUND + 20; y++)
        if (FURN.has(w.getBlock(x, y, z))) { assert.notEqual(w.getBlock(x, y - 1, z), B.AIR, `mebel wisi w powietrzu (${x},${y},${z})`); checked++; break; }
});

test('budynki mają wiele wejść, balkony i tarasy na dachach', () => {
  const w = cityWorld();
  // Wiele wejść: każdy kwartał-budynek ma zaplanowane 2–4 drzwi
  let multi = 0;
  for (let x = -80; x <= 80; x += 6) for (let z = -80; z <= 80; z += 6) {
    const c = w._cityCell(x, z), p = w._cityBlock(c.i, c.j);
    if (p.zone !== 'plaza') { assert.ok(p.doorN >= 2 && p.doorN <= 4, `doorN=${p.doorN}`); if (p.doorN >= 3) multi++; }
  }
  assert.ok(multi > 0, 'brak budynków z ≥3 wejściami');
  // Balkony: podłoga (roofMat) w powietrzu przy elewacji, poza obrysem budynku
  let balconies = 0, terraces = 0;
  for (let x = -80; x <= 80; x++) for (let z = -80; z <= 80; z++) {
    const c = w._cityCell(x, z), p = w._cityBlock(c.i, c.j);
    // Balkony: podłoga w powietrzu przy elewacji, poza obrysem budynku
    if (w.getBlock(x, GROUND, z) !== B.PLANKS)
      for (let k = 1; GROUND + k * 4 <= GROUND + p.H - 1; k++)
        if (w.getBlock(x, GROUND + k * 4, z) === p.roofMat) { balconies++; break; }
    // Tarasy: barierka (trimMat) tuż nad płaskim dachem (na kolumnie budynku)
    if (p.roofType === 'flat' && w.getBlock(x, GROUND + p.H + 2, z) === p.trimMat
        && w.getBlock(x, GROUND + p.H + 1, z) === p.roofMat) terraces++;
  }
  assert.ok(balconies > 50, `za mało balkonów (${balconies})`);
  assert.ok(terraces > 20, `za mało barierek tarasów (${terraces})`);
});

test('generacja jest deterministyczna (ten sam seed → ten sam chunk)', () => {
  const a = new World(42, 'city'), b = new World(42, 'city');
  const ca = a.getOrCreateChunk(1, -2), cb = b.getOrCreateChunk(1, -2);
  assert.deepEqual(Array.from(ca.blocks), Array.from(cb.blocks));
});

test('struktury są bezszwowe przez granicę chunków', () => {
  // Ta sama kolumna świata na granicy chunka x=16 musi dać ten sam stos bloków
  // niezależnie od kolejności generacji chunków sąsiednich.
  const w1 = new World(7, 'city'); w1.getOrCreateChunk(0, 0); w1.getOrCreateChunk(1, 0);
  const w2 = new World(7, 'city'); w2.getOrCreateChunk(1, 0); w2.getOrCreateChunk(0, 0);
  for (const [x, z] of [[15, 5], [16, 5], [16, 8], [17, 11]])
    for (let y = GROUND; y < GROUND + 30; y++)
      assert.equal(w1.getBlock(x, y, z), w2.getBlock(x, y, z), `niespójność na granicy (${x},${y},${z})`);
});
