import assert from 'node:assert/strict';
import test from 'node:test';
import {getFakeFooterHandoffOverlap} from '../src/utils/fakeFooterHandoff.ts';

test('calcula a sobreposição do portal dentro dos mesmos limites do CSS', () => {
  assert.equal(getFakeFooterHandoffOverlap(400), 72);
  assert.equal(getFakeFooterHandoffOverlap(800), 104);
  assert.equal(getFakeFooterHandoffOverlap(1200), 128);
});
