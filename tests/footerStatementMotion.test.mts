import assert from 'node:assert/strict';
import test from 'node:test';
import {getFooterStatementMotion} from '../src/utils/footerStatementMotion.ts';
import {getHeroStatementMotion} from '../src/utils/heroStatementMotion.ts';

test('shares the Hero upward blurred entrance and edge-first dissolve with bounded phrase timing', () => {
  const hero = getHeroStatementMotion(false);
  const motion = getFooterStatementMotion(false);
  assert.deepEqual(motion.from, {autoAlpha: 0, y: hero.entry.y, filter: 'blur(3px)'});
  assert.equal(motion.to!.duration, hero.entry.duration);
  assert.equal(motion.to!.filter, 'blur(0px)');
  assert.equal(motion.to!.y, 0);
  assert.equal(motion.to!.autoAlpha, 1);
  assert.deepEqual(motion.to!.stagger, {amount: .24, from: 'center'});
  assert.equal(motion.to!.force3D, true);
  assert.equal(motion.out!.y, hero.exit.y);
  assert.equal(motion.out!.duration, hero.exit.duration);
  assert.equal(motion.out!.filter, 'blur(3px)');
  assert.equal(motion.out!.autoAlpha, 0);
  assert.deepEqual(motion.out!.stagger, {amount: .18, from: 'edges'});
  assert.equal(motion.phraseGap, hero.phraseGap);
  assert.ok(motion.to!.duration + motion.to!.stagger.amount <= .7);
});

test('mobile keeps the same upward direction with a shorter bounded spread', () => {
  const desktop = getFooterStatementMotion(false);
  const mobile = getFooterStatementMotion(false, true);
  assert.equal(mobile.from.y, 8);
  assert.equal(mobile.out!.y, -8);
  assert.equal(mobile.to!.duration, .36);
  assert.equal(mobile.to!.stagger.amount, .18);
  assert.equal(mobile.out!.duration, .24);
  assert.equal(mobile.out!.stagger.amount, .12);
  assert.ok(mobile.to!.duration + mobile.to!.stagger.amount < desktop.to!.duration + desktop.to!.stagger.amount);
});

test('reduced motion is immediately clear and stationary with no tweens or gap', () => {
  assert.deepEqual(getFooterStatementMotion(true), {
    from: {autoAlpha: 1, y: 0, filter: 'blur(0px)'}, to: null, out: null, phraseGap: 0,
  });
});
