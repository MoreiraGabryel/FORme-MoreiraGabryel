import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [hero, css, statementExitTween] = await Promise.all([
  readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/utils/heroStatementExitTween.ts', import.meta.url), 'utf8'),
]);

test('estende a Hero com parallax composto, blackout final e ascensão do letreiro', () => {
  assert.match(hero, /getHeroScrollExitMotion/);
  assert.match(hero, /const scrollExitMotion = getHeroScrollExitMotion\(\{isMobile: isMobileViewport, prefersReducedMotion\}\);/);
  assert.match(hero, /scale: scrollExitMotion\.background\.scale/);
  assert.match(hero, /yPercent: scrollExitMotion\.background\.yPercent/);
  assert.match(statementExitTween, /y: motion\.y/);
  assert.match(statementExitTween, /stagger: \{amount: motion\.staggerAmount, from: motion\.from\}/);
  assert.match(statementExitTween, /timeline\.add\(tween, motion\.start\)/);
  assert.match(hero, /\}, scrollExitMotion\.blackout\.start\)/);

  const scrollExit = statementExitTween.match(/gsap\.to\(chars, \{([\s\S]*?)\}\);/)?.[1] ?? '';
  assert.doesNotMatch(scrollExit, /filter:/);
  assert.match(scrollExit, /force3D: true/);
  assert.match(css, /\.hero-media \{[\s\S]*?will-change: transform, opacity;/);
});
