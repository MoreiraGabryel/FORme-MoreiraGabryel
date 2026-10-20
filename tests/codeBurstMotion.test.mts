import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CODE_FRAGMENTS,
  getCodeBurstMotion,
  shouldCreateCodeBurst,
} from '../src/utils/codeBurstMotion.ts';

test('configura bursts coerentes e limitados para desktop e mobile', () => {
  const desktop = getCodeBurstMotion({isMobile: false, prefersReducedMotion: false});
  const mobile = getCodeBurstMotion({isMobile: true, prefersReducedMotion: false});

  assert.equal(desktop.count, 7);
  assert.equal(desktop.maxActive, 28);
  assert.equal(mobile.count, 5);
  assert.equal(mobile.maxActive, 20);
  assert.equal(desktop.force3D, true);
  assert.ok(CODE_FRAGMENTS.includes('const timeline = gsap.timeline()'));
  assert.ok(CODE_FRAGMENTS.includes('if (prefersReducedMotion) return'));
});

test('só dispara em superfícies decorativas com clique ou toque curto', () => {
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: false,
      pointerType: 'mouse',
      movement: 0,
      prefersReducedMotion: false,
    }),
    true,
  );
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: false,
      pointerType: 'touch',
      movement: 9,
      prefersReducedMotion: false,
    }),
    true,
  );
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: false,
      pointerType: 'touch',
      movement: 12,
      prefersReducedMotion: false,
    }),
    false,
  );
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: false,
      pointerType: 'mouse',
      movement: 12,
      prefersReducedMotion: false,
    }),
    false,
  );
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: true,
      pointerType: 'mouse',
      movement: 0,
      prefersReducedMotion: false,
    }),
    false,
  );
  assert.equal(
    shouldCreateCodeBurst({
      isBurstSurface: true,
      isInteractiveTarget: false,
      pointerType: 'mouse',
      movement: 0,
      prefersReducedMotion: true,
    }),
    false,
  );
});
