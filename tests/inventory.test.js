// Testy rejestru przedmiotów, recept, wytapiania i dropów.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, RECIPES, smeltResult, blockDrop } from '../js/inventory.js';
import { B, BLOCK_PROPS } from '../js/blocks.js';

const isItemKey = (k) => k != null && Object.prototype.hasOwnProperty.call(ITEMS, k);

test('każdy przedmiot ma nazwę i kolor', () => {
  for (const k in ITEMS) {
    assert.ok(ITEMS[k].name, `przedmiot ${k} bez nazwy`);
    assert.ok(ITEMS[k].color, `przedmiot ${k} bez koloru`);
  }
});

test('każda recepta ma poprawny wynik i składniki (istniejące klucze ITEMS)', () => {
  for (const R of RECIPES) {
    assert.ok(isItemKey(R.out), `recepta → nieistniejący wynik: ${R.out}`);
    assert.ok(R.n >= 1, `recepta ${R.out} z n<1`);
    const ings = R.shapeless ? R.shapeless : R.shaped.flat();
    for (const g of ings) {
      if (g == null) continue;
      assert.ok(isItemKey(g), `recepta ${R.out}: nieistniejący składnik ${g}`);
    }
  }
});

test('wytapianie celuje w istniejące przedmioty', () => {
  for (const key of ['raw_iron','raw_gold','clay_ball','potato','raw_chicken',
                     'Wołowina 🥩','Wieprzowina 🥓', 'b:'+B.SAND, 'b:'+B.CLAY, 'b:'+B.COBBLE]) {
    const out = smeltResult(key);
    if (out) assert.ok(isItemKey(out), `smelt ${key} → nieistniejący ${out}`);
  }
});

test('blockDrop zwraca istniejący przedmiot lub null (dla bloków-przedmiotów)', () => {
  for (const idStr in BLOCK_PROPS) {
    // interesują nas tylko bloki, które są normalnymi przedmiotami (dają się mieć w ręce);
    // bloki nie-przedmiotowe (AIR/WATER/LAVA/warianty stanu) pomijamy — ich drop jest nieistotny.
    if (!isItemKey('b:'+idStr)) continue;
    const d = blockDrop(+idStr);
    if (d !== null) assert.ok(isItemKey(d), `blok ${idStr} → drop ${d} nie istnieje`);
  }
});

test('dodane przedmioty istnieją (warianty wagonika, tory, wybrane jedzenie/rudy)', () => {
  const must = [
    'minecart','chest_minecart','furnace_minecart','tnt_minecart',
    'b:'+B.RAIL, 'b:'+B.POWERED_RAIL, 'b:'+B.DETECTOR_RAIL, 'b:'+B.ACTIVATOR_RAIL,
    'emerald','lapis','cooked_beef','baked_potato','apple',
  ];
  for (const k of must) assert.ok(isItemKey(k), `brak przedmiotu ${k}`);
});

test('istnieją recepty na nowe tory i warianty wagonika', () => {
  const outs = new Set(RECIPES.map(R => R.out));
  for (const k of ['b:'+B.DETECTOR_RAIL, 'b:'+B.ACTIVATOR_RAIL,
                   'chest_minecart','furnace_minecart','tnt_minecart']) {
    assert.ok(outs.has(k), `brak recepty na ${k}`);
  }
});
