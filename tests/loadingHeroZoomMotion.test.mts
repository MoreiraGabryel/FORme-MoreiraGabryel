import assert from 'node:assert/strict';
import test from 'node:test';
import {getLoadingHeroZoomMotion} from '../src/utils/loadingHeroZoomMotion.ts';

test('configura mergulho de câmera médio no desktop', () => {
  const motion = getLoadingHeroZoomMotion({isMobile: false, prefersReducedMotion: false});

  assert.deepEqual(motion, {
    heroStartScale: 1.14,
    heroStartBlur: 6,
    heroSettleDuration: 0.64,
    loadingExitScale: 1.06,
    loadingExitBlur: 6,
    loadingExitDuration: 0.56,
  });
});

test('preserva o enquadramento no mobile e reduz o movimento quando necessário', () => {
  assert.equal(getLoadingHeroZoomMotion({isMobile: true, prefersReducedMotion: false}).heroStartScale, 1.1);
  assert.deepEqual(getLoadingHeroZoomMotion({isMobile: false, prefersReducedMotion: true}), {
    heroStartScale: 1,
    heroStartBlur: 0,
    heroSettleDuration: 0.2,
    loadingExitScale: 1.01,
    loadingExitBlur: 0,
    loadingExitDuration: 0.18,
  });
});
