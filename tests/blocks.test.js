// Testy rejestru bloków, atlasu i tekstur torów.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  B, BLOCK_PROPS, BLOCK_COLORS, RAIL_IDS, isRailBlock,
  RAIL_TEX, railTexTile, faceUV, ICON_TILE,
} from '../js/blocks.js';

test('isRailBlock zgodne z RAIL_IDS i nowymi torami', () => {
  for (const id of [B.RAIL, B.POWERED_RAIL, B.DETECTOR_RAIL, B.ACTIVATOR_RAIL]) {
    assert.ok(isRailBlock(id), `blok ${id} powinien być torem`);
    assert.ok(RAIL_IDS.has(id));
  }
  assert.equal(isRailBlock(B.STONE), false);
});

test('tory są niesolidne i przechodnie (płaskie)', () => {
  for (const id of RAIL_IDS) {
    const p = BLOCK_PROPS[id];
    assert.ok(p, `brak BLOCK_PROPS dla toru ${id}`);
    assert.equal(p.solid, false);
    assert.equal(p.transparent, true);
  }
});

test('railTexTile zwraca istniejący kafelek dla każdego toru/orientacji', () => {
  const tiles = new Set(Object.values(RAIL_TEX));
  for (const id of RAIL_IDS) {
    for (const orient of ['ns','ew']) {
      const t = railTexTile(id, 'straight', orient);
      assert.ok(tiles.has(t), `brak kafelka prostego ${id}/${orient}`);
    }
  }
  for (const orient of ['ne','es','sw','wn']) {
    const t = railTexTile(B.RAIL, 'curve', orient);
    assert.ok(tiles.has(t), `brak kafelka łuku ${orient}`);
  }
});

test('REGRESJA: kafelki torów nie kolidują z ikonami', () => {
  const railTiles = Object.values(RAIL_TEX);
  const iconTiles = new Set(Object.values(ICON_TILE));
  const clash = railTiles.filter(t => iconTiles.has(t));
  assert.deepEqual(clash, [], `kolizja kafelków torów z ikonami: ${clash}`);
});

test('faceUV każdego kafelka toru mieści się w [0,1]', () => {
  for (const t of Object.values(RAIL_TEX)) {
    for (const uv of faceUV(t)) { assert.ok(uv >= 0 && uv <= 1, `UV poza zakresem dla ${t}`); }
  }
});

test('każdy blok w BLOCK_PROPS ma nazwę', () => {
  for (const id in BLOCK_PROPS) assert.ok(BLOCK_PROPS[id].name, `blok ${id} bez nazwy`);
});
