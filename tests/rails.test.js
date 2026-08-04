// Testy czystej logiki torów (kształt + skręt wagonika).
import test from 'node:test';
import assert from 'node:assert/strict';
import { railShape, railTurn } from '../js/rails.js';

// Pomocnik: neighbors(w,e,n,s)
const S = (w,e,n,s,canCurve=true) => railShape(!!w,!!e,!!n,!!s,canCurve);

test('prosty tor wzdłuż osi Z (north/south)', () => {
  assert.deepEqual(S(0,0,1,1), { shape:'straight', orient:'ns' });
  assert.deepEqual(S(0,0,1,0), { shape:'straight', orient:'ns' });
  assert.deepEqual(S(0,0,0,1), { shape:'straight', orient:'ns' });
});

test('prosty tor wzdłuż osi X (west/east)', () => {
  assert.deepEqual(S(1,1,0,0), { shape:'straight', orient:'ew' });
  assert.deepEqual(S(1,0,0,0), { shape:'straight', orient:'ew' });
  assert.deepEqual(S(0,1,0,0), { shape:'straight', orient:'ew' });
});

test('izolowany tor → domyślnie ns', () => {
  assert.deepEqual(S(0,0,0,0), { shape:'straight', orient:'ns' });
});

test('cztery narożniki łuku łączą właściwe krawędzie', () => {
  assert.deepEqual(S(0,1,1,0), { shape:'curve', orient:'ne' }); // north+east
  assert.deepEqual(S(0,1,0,1), { shape:'curve', orient:'es' }); // east+south
  assert.deepEqual(S(1,0,0,1), { shape:'curve', orient:'sw' }); // south+west
  assert.deepEqual(S(1,0,1,0), { shape:'curve', orient:'wn' }); // west+north
});

test('bloki bez zakrętu (canCurve=false) nigdy nie zakręcają', () => {
  const r = S(0,1,1,0, false);
  assert.equal(r.shape, 'straight');
  assert.ok(r.orient === 'ns' || r.orient === 'ew');
});

test('złącze/skrzyżowanie jest deterministyczne (bez wyjątku, poprawny orient)', () => {
  for (let m=0; m<16; m++) {
    const r = S(m&1, m&2, m&4, m&8);
    assert.ok(['straight','curve'].includes(r.shape));
    assert.ok(['ns','ew','ne','es','sw','wn'].includes(r.orient));
  }
});

test('railTurn: jazda po X skręca na dostępny tor Z', () => {
  assert.deepEqual(railTurn('x', 1, false,false, false,true), { axis:'z', dir:1 });  // south
  assert.deepEqual(railTurn('x', 1, false,false, true,false), { axis:'z', dir:-1 }); // north
  assert.equal(railTurn('x', 1, false,false, false,false), null);                     // ślepy koniec
});

test('railTurn: jazda po Z skręca na dostępny tor X', () => {
  assert.deepEqual(railTurn('z', 1, false,true, false,false), { axis:'x', dir:1 });   // east
  assert.deepEqual(railTurn('z', -1, true,false, false,false), { axis:'x', dir:-1 }); // west
});
