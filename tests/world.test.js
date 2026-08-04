// Testy generacji rud (_oreAt) — czysta logika, bez renderu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World, CHUNK_SIZE } from '../js/world.js';
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

// ── REGRESJA: sąsiedzi nowo wczytanego chunka muszą się przebudować ──────────────
// Bug: World.update() dodawał nowe chunki, ale nie oznaczał już wczytanych sąsiadów
// jako dirty. Sąsiad zmeshowany PRZED wygenerowaniem tego chunka rysował swoją ścianę
// graniczną zakładając, że za nią jest AIR (getBlock dla niewczytanego chunka zwraca
// AIR) — po wygenerowaniu sąsiada ta „widmowa" ściana nakłada się na jego bryłę,
// dając z-fighting nieprzezroczystych powierzchni, migoczący przy ruchu kamery
// (najbardziej widoczne w gęstej zabudowie trybu miasto).
test('REGRESJA: nowo wczytany chunk oznacza już wczytanych sąsiadów (orto) jako dirty', () => {
  const world = new World(1, 'normal');
  const cx = CHUNK_SIZE / 2;   // środek chunka (0,0)
  world.update(cx, cx, 0);     // wczytaj tylko chunk (0,0)
  const a = world.getChunk(0, 0);
  assert.ok(a, 'chunk (0,0) powinien być wczytany');
  a.dirty = false;             // symuluj, że renderer już go zmeshował (patrz buildChunkMesh)

  world.update(cx, cx, 1);     // teraz dociągnij pierścień sąsiadów, w tym (1,0)
  assert.ok(world.getChunk(1, 0), 'chunk (1,0) powinien być teraz wczytany');
  assert.equal(a.dirty, true, 'chunk (0,0) powinien zostać oznaczony dirty po dodaniu sąsiada (1,0)');
});

test('chunk NIE jest oznaczany dirty, gdy żaden nowy sąsiad się nie pojawia', () => {
  const world = new World(2, 'normal');
  const cx = CHUNK_SIZE / 2;
  world.update(cx, cx, 1);
  const a = world.getChunk(0, 0);
  a.dirty = false;
  world.update(cx, cx, 1);     // powtórka bez zmiany promienia/pozycji — nic nowego
  assert.equal(a.dirty, false, 'chunk nie powinien być oznaczany dirty bez nowego sąsiada');
});

test('diagonalny (nie-ortogonalny) nowy sąsiad NIE oznacza chunka dirty (brak wspólnej ściany)', () => {
  const world = new World(3, 'normal');
  const cx = CHUNK_SIZE / 2;
  // Wczytaj (0,0) i jego bezpośredni pierścień OPRÓCZ rogu (1,1), symulując, że róg
  // dojdzie później (asymetryczny ruch gracza).
  world.update(cx, cx, 1);
  const corner = world.getChunk(1, 1);
  assert.ok(corner, 'chunk narożny powinien być wczytany przy promieniu 1');
  // Usuń go i wymuś ponowne "dodanie" jako nowego sąsiada chunka (0,0).
  world.chunks.delete('1,1');
  const a = world.getChunk(0, 0);
  a.dirty = false;
  world.update(cx, cx, 1);     // odtwarza chunk (1,1) jako "nowy"
  assert.equal(a.dirty, false, 'chunk (0,0) nie dzieli ściany z narożnym (1,1) — nie powinien być dirty');
});
