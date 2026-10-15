import assert from 'node:assert/strict';
import test from 'node:test';
import * as legacyMotion from '../src/utils/footerStatementRollMotion.ts';

const {getFooterStatementParallax} = legacyMotion;

test('preserves the footer scroll parallax independently of phrase animation', () => {
  assert.deepEqual(getFooterStatementParallax(.08, false), {yVh: 2.5, scale: 1});
  assert.deepEqual(getFooterStatementParallax(.92, false), {yVh: -2.5, scale: 1.03});
  assert.deepEqual(getFooterStatementParallax(.5, true), {yVh: 0, scale: 1});
});

test('retires the exclusive 3D drum profile rather than leaving a second animation path', () => {
  assert.equal('getFooterStatementRollMotion' in legacyMotion, false);
  assert.equal('footerStatementIncomingFrom' in legacyMotion, false);
});
