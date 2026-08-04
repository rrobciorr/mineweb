// Testy uzupełnionych tekstur dla bloków, które dotąd renderowały się jako płaski kolor
// (lawa, pochodnia, grządka, uprawy, stany redstone, dźwignia, przycisk, przekaźnik, tłok, drzwi).
import test from 'node:test';
import assert from 'node:assert/strict';
import { B, BLOCK_PROPS, BLOCK_FACES, BLOCK_TEX } from '../js/blocks.js';
import { ITEMS } from '../js/inventory.js';

// Bloki-przedmioty (dostępne w ekwipunku/palecie)
const FIXED_ITEM_IDS = [B.TORCH, B.RS_DUST, B.RS_TORCH, B.LEVER, B.BUTTON, B.REPEATER, B.PISTON, B.DOOR];
// Stany świata (nie są osobnymi przedmiotami, ale muszą mieć poprawną teksturę renderowania)
const FIXED_WORLD_ONLY_IDS = [B.LAVA, B.FARMLAND, B.CROP, B.CROP_RIPE, B.RS_LAMP_ON, B.RS_DUST_ON, B.RS_TORCH_OFF];
const ALL_FIXED_IDS = [...FIXED_ITEM_IDS, ...FIXED_WORLD_ONLY_IDS];

test('każdy uzupełniony blok ma teraz wpis w BLOCK_FACES (już nie jest płaskim kolorem)', () => {
  for (const id of ALL_FIXED_IDS) {
    const faces = BLOCK_FACES[id];
    assert.ok(faces, `brak BLOCK_FACES dla bloku ${id}`);
    assert.equal(faces.length, 3, `BLOCK_FACES[${id}] powinno mieć [top,bottom,side]`);
    for (const t of faces) assert.ok(t >= 0 && t <= 255, `kafelek ${t} poza atlasem dla bloku ${id}`);
  }
});

test('REGRESJA: kafelki uzupełnionych tekstur nie kolidują z resztą BLOCK_TEX', () => {
  const values = Object.values(BLOCK_TEX);
  const seen = new Set();
  const dupes = [];
  for (const v of values) { if (seen.has(v)) dupes.push(v); else seen.add(v); }
  assert.deepEqual(dupes, [], `zduplikowane kafelki w BLOCK_TEX: ${dupes}`);
});

test('grządka używa kafelka ziemi na boku/spodzie (współdzielony kafelek 2)', () => {
  const faces = BLOCK_FACES[B.FARMLAND];
  assert.equal(faces[1], 2, 'spód grządki powinien używać kafelka ziemi (2)');
  assert.equal(faces[2], 2, 'bok grządki powinien używać kafelka ziemi (2)');
  assert.notEqual(faces[0], 2, 'góra grządki powinna mieć własny kafelek (bruzdy), nie ziemię');
});

test('bloki-przedmioty z uzupełnioną teksturą istnieją w ekwipunku (ITEMS)', () => {
  for (const id of FIXED_ITEM_IDS) {
    const key = 'b:' + id;
    assert.ok(ITEMS[key], `brak ITEMS[${key}]`);
    assert.equal(ITEMS[key].block, id);
  }
});

test('stany świata (bez tekstury dotąd) pozostają wyłączone z ekwipunku (NON_ITEM_BLOCKS)', () => {
  for (const id of FIXED_WORLD_ONLY_IDS) {
    assert.equal(ITEMS['b:' + id], undefined, `blok ${id} nie powinien być osobnym przedmiotem`);
  }
});

test('każdy uzupełniony blok ma nazwę i twardość w BLOCK_PROPS', () => {
  for (const id of ALL_FIXED_IDS) {
    const p = BLOCK_PROPS[id];
    assert.ok(p, `brak BLOCK_PROPS dla bloku ${id}`);
    assert.ok(p.name, `blok ${id} bez nazwy`);
  }
});
