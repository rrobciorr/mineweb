// world-persist.test.js — round-trip zapisu/odczytu świata (World.exportState/importState).
// Ta ścieżka stoi za save/load gracza (main.serializeState → applyState); błąd tu psuje zapisy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { World, Chunk, CHUNK_SIZE, WORLD_HEIGHT } from '../js/world.js';
import { B } from '../js/blocks.js';

test('export→import zachowuje seed i tryb', () => {
  const w = new World(12345, 'city');
  const dst = new World(0, 'normal');
  const state = w.exportState();
  assert.equal(state.seed, 12345);
  assert.equal(state.mode, 'city');
  // importState nie nadpisuje seed/mode instancji, ale eksport musi je nieść dalej
  // (main.startGame odtwarza świat z state.seed/state.mode).
  assert.ok('chunks' in state);
});

test('round-trip zachowuje bloki w wielu chunkach (też ujemne współrzędne)', () => {
  const w = new World(777);
  // Rozmieść bloki w różnych chunkach, w tym na granicach i przy ujemnych osiach.
  const placed = [
    [0, 10, 0, B.STONE],
    [15, 20, 15, B.DIRT],     // róg chunka 0,0
    [16, 30, 0, B.GRASS],     // chunk 1,0
    [-1, 40, -1, B.WOOD],     // chunk -1,-1
    [-17, 5, 3, B.SAND],      // chunk -2,0
    [5, WORLD_HEIGHT - 1, 5, B.GLASS], // maks. wysokość
  ];
  for (const [x, y, z, b] of placed) w.setBlock(x, y, z, b);

  const dst = new World(777);
  dst.importState(w.exportState());

  for (const [x, y, z, b] of placed) {
    assert.equal(dst.getBlock(x, y, z), b, `blok @ ${x},${y},${z}`);
  }
});

test('round-trip zachowuje wierność bajtów całego pełnego chunka', () => {
  // Chunk = 16*128*16 = 32768 bajtów = dokładnie próg 0x8000 w bytesToB64 → warty testu.
  const w = new World(1);
  const ch = new Chunk(0, 0);
  for (let i = 0; i < ch.blocks.length; i++) ch.blocks[i] = i % 256;
  w.chunks.set(w.key(0, 0), ch);

  const dst = new World(1);
  dst.importState(w.exportState());
  const out = dst.getChunk(0, 0);
  assert.ok(out, 'chunk został odtworzony');
  assert.deepEqual([...out.blocks], [...ch.blocks]);
  assert.equal(out.blocks.length, CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
});

test('importState jest odporne na brak/niepełne dane', () => {
  const w = new World(1);
  assert.doesNotThrow(() => w.importState(null));
  assert.doesNotThrow(() => w.importState({}));
  assert.doesNotThrow(() => w.importState({ chunks: {} }));
});

test('importowany chunk jest oznaczony dirty (do przebudowy mesha)', () => {
  const w = new World(1);
  w.setBlock(3, 3, 3, B.STONE);
  const dst = new World(1);
  dst.importState(w.exportState());
  assert.equal(dst.getChunk(0, 0).dirty, true);
});
