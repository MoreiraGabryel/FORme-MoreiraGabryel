import assert from 'node:assert/strict';
import test from 'node:test';

const motion = await import('../src/utils/pointerDepthMotion.ts').catch(() => null);

test('pointer depth moves only within the overscan margin, with subtle perceptible bounded zoom', () => {
  assert.ok(motion, 'pointer depth profile must exist');
  const center = motion.getPointerDepthTarget({x: 500, y: 350, width: 1000, height: 700, strength: 1});
  assert.equal(center.x, 0);
  assert.equal(center.y, 0);
  assert.equal(center.scale, 1.04);
  for (const width of [768, 1440, 2560]) {
    for (const height of [320, 720, 1080]) {
      for (const x of [-999, 0, width, width + 999]) {
        for (const y of [-999, 0, height, height + 999]) {
          const target = motion.getPointerDepthTarget({x, y, width, height, strength: 1});
          assert.ok(Math.abs(target.x) <= 18 && Math.abs(target.y) <= 12);
          assert.ok(Math.abs(target.x) <= width * (target.scale - 1) / 2);
          assert.ok(Math.abs(target.y) <= height * (target.scale - 1) / 2);
          assert.ok(target.scale >= 1.04 && target.scale <= 1.052);
        }
      }
    }
  }
  assert.deepEqual(motion.getPointerDepthTarget({x: 800, y: 500, width: 1000, height: 700, strength: 0}),
    {x: 0, y: 0, scale: 1});
});

test('pointer depth is unavailable before loading and returns neutral before both scene handoffs', () => {
  assert.ok(motion);
  assert.equal(motion.getPointerDepthStrength('hero', 0, false), 0);
  assert.equal(motion.getPointerDepthStrength('hero', 0, true), 1);
  assert.ok(motion.getPointerDepthStrength('hero', .5, true) < 1);
  assert.equal(motion.getPointerDepthStrength('hero', .6, true), 0);
  assert.equal(motion.getPointerDepthStrength('technology', .05, true), 0);
  assert.equal(motion.getPointerDepthStrength('technology', .3, true), 1);
  assert.ok(motion.getPointerDepthStrength('technology', .7, true) < 1);
  assert.equal(motion.getPointerDepthStrength('technology', .74, true), 0);
  assert.equal(motion.getPointerDepthStrength('technology', .78, true), 0);
});
