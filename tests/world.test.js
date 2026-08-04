// Testy generacji rud (_oreAt) — czysta logika, bez renderu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../js/world.js';
import { B } from '../js/blocks.js';

const w = new World(12345);
const ORES = new Set([B.COAL_ORE,B.IRON_ORE,B.GOLD_ORE,B.DIAMOND_ORE,
                      B.EMERALD_ORE,B.LAPIS_ORE,B.REDSTONE_ORE]);

test('_oreAt zwraca 0 albo prawidłowe ID rudy', () => {
  for (let i=0;i<2000;i++){
    const x=(i*7)%64, z=(i*13)%64, y=1+((i*3)%80);
    const o = w._oreAt(x,y,z);
    assert.ok(o === 0 || ORES.has(o), `nieprawidłowy wynik _oreAt: ${o}`);
  }
});

test('nowe rudy pojawiają się w dozwolonych głębokościach', () => {
  const found = new Set();
  for (let x=0;x<48;x++) for (let z=0;z<48;z++) for (let y=1;y<=30;y++){
    const o = w._oreAt(x,y,z);
    if (ORES.has(o)) found.add(o);
  }
  for (const ore of [B.EMERALD_ORE, B.LAPIS_ORE, B.REDSTONE_ORE]) {
    assert.ok(found.has(ore), `ruda ${ore} nie wygenerowała się w próbce`);
  }
});

test('rudy głębinowe nie pojawiają się nad swoim limitem', () => {
  // diament tylko <=15, redstone <=16 — sprawdź, że wysoko ich nie ma
  for (let x=0;x<32;x++) for (let z=0;z<32;z++){
    for (let y=40;y<80;y++){
      const o = w._oreAt(x,y,z);
      assert.notEqual(o, B.DIAMOND_ORE, `diament za wysoko (y=${y})`);
      assert.notEqual(o, B.REDSTONE_ORE, `redstone za wysoko (y=${y})`);
    }
  }
});
