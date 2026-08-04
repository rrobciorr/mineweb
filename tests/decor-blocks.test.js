// Testy nowych bloków dekoracyjnych: kolorowe szkło, dywany, warianty drewna, dekoracje kamienne.
import test from 'node:test';
import assert from 'node:assert/strict';
import { B, BLOCK_PROPS, BLOCK_COLORS, BLOCK_FACES, BLOCK_TEX } from '../js/blocks.js';
import { ITEMS, RECIPES, matchRecipe } from '../js/inventory.js';

const DECOR_IDS = [
  B.GLASS_WHITE, B.GLASS_RED, B.GLASS_BLUE, B.GLASS_GREEN, B.GLASS_YELLOW, B.GLASS_BLACK,
  B.CARPET_WHITE, B.CARPET_RED, B.CARPET_BLUE, B.CARPET_GREEN, B.CARPET_YELLOW, B.CARPET_BLACK,
  B.DARK_WOOD, B.DARK_PLANKS, B.PALE_WOOD, B.PALE_PLANKS,
  B.POLISHED_STONE, B.GRANITE, B.MARBLE,
];

test('każdy nowy blok dekoracyjny ma unikalne ID i wpis w BLOCK_PROPS', () => {
  assert.equal(new Set(DECOR_IDS).size, DECOR_IDS.length, 'zduplikowane ID bloków');
  for (const id of DECOR_IDS) {
    const p = BLOCK_PROPS[id];
    assert.ok(p, `brak BLOCK_PROPS dla bloku ${id}`);
    assert.ok(p.name, `blok ${id} bez nazwy`);
    assert.ok(p.hardness > 0, `blok ${id} bez twardości`);
  }
});

test('każdy nowy blok dekoracyjny ma kolor zapasowy (BLOCK_COLORS)', () => {
  for (const id of DECOR_IDS) {
    const c = BLOCK_COLORS[id];
    assert.ok(c, `brak BLOCK_COLORS dla bloku ${id}`);
    for (const face of ['top','side','bot']) {
      for (const ch of c[face]) assert.ok(ch >= 0 && ch <= 1, `kolor poza zakresem [0,1] dla ${id}.${face}`);
    }
  }
});

test('każdy nowy blok dekoracyjny ma poprawne kafelki w BLOCK_FACES (w granicach atlasu 0-255)', () => {
  for (const id of DECOR_IDS) {
    const faces = BLOCK_FACES[id];
    assert.ok(faces, `brak BLOCK_FACES dla bloku ${id}`);
    assert.equal(faces.length, 3, `BLOCK_FACES[${id}] powinno mieć [top,bottom,side]`);
    for (const t of faces) assert.ok(t >= 0 && t <= 255, `kafelek ${t} poza atlasem dla bloku ${id}`);
  }
});

test('REGRESJA: nowe kafelki tekstur (BLOCK_TEX) są unikalne w całym atlasie', () => {
  const values = Object.values(BLOCK_TEX);
  const seen = new Set();
  const dupes = [];
  for (const v of values) { if (seen.has(v)) dupes.push(v); else seen.add(v); }
  assert.deepEqual(dupes, [], `zduplikowane kafelki w BLOCK_TEX: ${dupes}`);
});

test('każdy nowy blok dekoracyjny istnieje jako przedmiot w ekwipunku (ITEMS)', () => {
  for (const id of DECOR_IDS) {
    const key = 'b:' + id;
    assert.ok(ITEMS[key], `brak ITEMS[${key}]`);
    assert.ok(ITEMS[key].name, `ITEMS[${key}] bez nazwy`);
    assert.equal(ITEMS[key].block, id);
  }
});

test('receptury nowych bloków dekoracyjnych są kompletne i poprawne', () => {
  const isItemKey = (k) => k != null && Object.prototype.hasOwnProperty.call(ITEMS, k);
  const outs = new Set();
  for (const id of DECOR_IDS) outs.add('b:' + id);
  const covered = new Set();
  for (const R of RECIPES) {
    if (!outs.has(R.out)) continue;
    covered.add(R.out);
    const ings = R.shapeless ? R.shapeless : R.shaped.flat();
    for (const g of ings) { if (g == null) continue; assert.ok(isItemKey(g), `receptura ${R.out}: nieistniejący składnik ${g}`); }
    assert.ok(R.n >= 1, `receptura ${R.out} z n<1`);
  }
  assert.equal(covered.size, DECOR_IDS.length, `brak receptur dla: ${DECOR_IDS.map(id=>'b:'+id).filter(k=>!covered.has(k))}`);
});

test('matchRecipe rozpoznaje kolorowe szkło, dywan, kłodę i deski', () => {
  const slot = (key) => ({ key, n: 1 });
  // szkło + biała wełna → białe szkło
  let r = matchRecipe([slot('b:'+B.GLASS), slot('b:'+B.WOOL_WHITE), null, null, null, null, null, null, null]);
  assert.ok(r && r.out === 'b:'+B.GLASS_WHITE, 'białe szkło nie rozpoznane');
  // 2x czerwona wełna → 3 dywany czerwone
  r = matchRecipe([slot('b:'+B.WOOL_RED), slot('b:'+B.WOOL_RED), null, null, null, null, null, null, null]);
  assert.ok(r && r.out === 'b:'+B.CARPET_RED && r.n === 3, 'czerwony dywan nie rozpoznany');
  // drewno + węgiel → ciemna kłoda
  r = matchRecipe([slot('b:'+B.WOOD), slot('coal'), null, null, null, null, null, null, null]);
  assert.ok(r && r.out === 'b:'+B.DARK_WOOD, 'ciemna kłoda nie rozpoznana');
});

test('REGRESJA: polerowany kamień (bruk 2×2) nie koliduje z recepturą kamiennych cegieł (kamień 2×2)', () => {
  const slot = (key) => ({ key, n: 1 });
  const cobbleGrid = [slot('b:'+B.COBBLE), slot('b:'+B.COBBLE), null, slot('b:'+B.COBBLE), slot('b:'+B.COBBLE), null, null, null, null];
  const stoneGrid  = [slot('b:'+B.STONE),  slot('b:'+B.STONE),  null, slot('b:'+B.STONE),  slot('b:'+B.STONE),  null, null, null, null];
  const rCobble = matchRecipe(cobbleGrid);
  const rStone  = matchRecipe(stoneGrid);
  assert.equal(rCobble.out, 'b:'+B.POLISHED_STONE);
  assert.equal(rStone.out, 'b:'+B.STONE_BRICKS);
});
