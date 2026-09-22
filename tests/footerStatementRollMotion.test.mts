import assert from 'node:assert/strict';
import test from 'node:test';
import {
  footerStatementIncomingFrom,
  getFooterStatementParallax,
  getFooterStatementRollMotion,
} from '../src/utils/footerStatementRollMotion.ts';

test('move o letreiro do Fake Footer em parallax de 5vh com escala contida', () => {
  const entry = getFooterStatementParallax(0.08, false);
  const exit = getFooterStatementParallax(0.92, false);

  assert.equal(entry.yVh, 2.5);
  assert.equal(entry.scale, 1);
  assert.equal(exit.yVh, -2.5);
  assert.equal(exit.scale, 1.03);
});

test('troca frases por tambor 3D e estabiliza tudo em reduced motion', () => {
  const motion = getFooterStatementRollMotion(false);
  const reduced = getFooterStatementRollMotion(true);

  assert.equal(motion.out.rotationX, -82);
  assert.equal(footerStatementIncomingFrom.rotationX, 76);
  assert.equal(motion.out.force3D, true);
  assert.equal(motion.in.force3D, true);
  assert.equal(reduced.out, null);
  assert.equal(reduced.in, null);
  assert.deepEqual(getFooterStatementParallax(0.5, true), {yVh: 0, scale: 1});
});
