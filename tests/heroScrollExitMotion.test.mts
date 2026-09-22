import assert from 'node:assert/strict';
import test from 'node:test';
import {HERO_SCENE, HERO_SCENE_REDUCED_MOTION} from '../src/config/scenes.ts';
import {getHeroScrollExitMotion} from '../src/utils/heroScrollExitMotion.ts';

test('alongar a Hero preserva um blackout final após o acompanhamento do fundo', () => {
  assert.equal(HERO_SCENE.lengthInViewports, 3.5);
  assert.equal(HERO_SCENE_REDUCED_MOTION.lengthInViewports, 1.5);

  const desktop = getHeroScrollExitMotion({isMobile: false, prefersReducedMotion: false});
  const mobile = getHeroScrollExitMotion({isMobile: true, prefersReducedMotion: false});

  assert.deepEqual(desktop.background, {end: 0.82, scale: 1.08, yPercent: -7});
  assert.deepEqual(mobile.background, {end: 0.82, scale: 1.045, yPercent: -4});
  assert.deepEqual(desktop.blackout, {start: 0.82, end: 1});
});

test('retira o letreiro de baixo para cima sem custo de blur no scroll', () => {
  const desktop = getHeroScrollExitMotion({isMobile: false, prefersReducedMotion: false});
  const mobile = getHeroScrollExitMotion({isMobile: true, prefersReducedMotion: false});
  const reduced = getHeroScrollExitMotion({isMobile: false, prefersReducedMotion: true});

  assert.deepEqual(desktop.statement, {
    start: 0.68,
    end: 0.82,
    y: -42,
    duration: 0.08,
    staggerAmount: 0.06,
    from: 'end',
  });
  assert.equal(mobile.statement.y, -28);
  assert.deepEqual(reduced.statement, {
    start: 0.68,
    end: 0.76,
    y: 0,
    duration: 0.08,
    staggerAmount: 0,
    from: 'end',
  });
});
