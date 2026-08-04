// Testy walidacji trybu gry (creative/survival) zapamiętywanego dla konta.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidMode } from '../js/net.js';

test('isValidMode akceptuje tylko creative/survival', () => {
  assert.equal(isValidMode('creative'), true);
  assert.equal(isValidMode('survival'), true);
});

test('isValidMode odrzuca nieprawidłowe wartości', () => {
  for (const v of ['', 'Creative', 'SURVIVAL', 'hardcore', null, undefined, 0, 1, {}]) {
    assert.equal(isValidMode(v), false, `powinno odrzucić: ${String(v)}`);
  }
});
