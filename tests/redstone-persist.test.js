// redstone-persist.test.js — round-trip stanu redstone (RedstoneSim.export/import).
// Część zapisu świata (main.serializeState().redstone); błąd gubi bramki/dźwignie po wczytaniu.
import test from 'node:test';
import assert from 'node:assert/strict';
import { RedstoneSim } from '../js/redstone.js';

// RedstoneSim potrzebuje tylko dostępu do świata przez getBlock; export/import operuje
// na this.states, więc do samego round-tripu wystarczy atrapa świata.
const fakeWorld = { getBlock: () => 0 };

test('export→import odtwarza dokładnie te same stany komponentów', () => {
  const rs = new RedstoneSim(fakeWorld);
  rs.states.set('1,2,3', { type: 'lever', on: true });
  rs.states.set('4,5,6', { type: 'repeater', dir: 2, delay: 3, q: [1, 0], out: true });
  rs.states.set('7,8,9', { type: 'piston', dir: 1, ext: false });

  const dst = new RedstoneSim(fakeWorld);
  dst.import(rs.export());

  assert.equal(dst.states.size, 3);
  assert.deepEqual(dst.get(1, 2, 3), { type: 'lever', on: true });
  assert.deepEqual(dst.get(4, 5, 6), { type: 'repeater', dir: 2, delay: 3, q: [1, 0], out: true });
  assert.deepEqual(dst.get(7, 8, 9), { type: 'piston', dir: 1, ext: false });
});

test('import czyści poprzednie stany przed wczytaniem', () => {
  const rs = new RedstoneSim(fakeWorld);
  rs.states.set('0,0,0', { type: 'lamp' });
  rs.import([{ k: '9,9,9', st: { type: 'block' } }]);
  assert.equal(rs.states.size, 1);
  assert.equal(rs.get(0, 0, 0), undefined);
  assert.deepEqual(rs.get(9, 9, 9), { type: 'block' });
});

test('import jest odporny na brak danych', () => {
  const rs = new RedstoneSim(fakeWorld);
  rs.states.set('0,0,0', { type: 'lamp' });
  assert.doesNotThrow(() => rs.import(null));
  assert.equal(rs.states.size, 0, 'null czyści stany');
  assert.doesNotThrow(() => rs.import(undefined));
});

test('pusty eksport round-trip daje pusty stan', () => {
  const rs = new RedstoneSim(fakeWorld);
  const dst = new RedstoneSim(fakeWorld);
  dst.import(rs.export());
  assert.equal(dst.states.size, 0);
});
