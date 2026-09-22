import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const hero = await readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8');

test('sincroniza a saída longa da Hero com o perfil de scroll e composição GPU', () => {
  const scrollTimeline = hero.slice(hero.indexOf('const heroScrollTimeline'), hero.indexOf('let handoffTl'));

  assert.match(hero, /getHeroScrollExitMotion/);
  assert.match(hero, /const scrollExitMotion = getHeroScrollExitMotion/);
  assert.match(scrollTimeline, /scale: scrollExitMotion\.background\.scale,/);
  assert.match(scrollTimeline, /yPercent: scrollExitMotion\.background\.yPercent,/);
  assert.match(scrollTimeline, /\},\s*0,\s*\)/);
  assert.match(scrollTimeline, /y: scrollExitMotion\.statement\.y,/);
  assert.match(scrollTimeline, /duration: scrollExitMotion\.statement\.duration,/);
  assert.match(scrollTimeline, /stagger: \{amount: scrollExitMotion\.statement\.staggerAmount, from: scrollExitMotion\.statement\.from\}/);
  assert.match(scrollTimeline, /\}, scrollExitMotion\.statement\.start\)/);
  assert.match(scrollTimeline, /\}, scrollExitMotion\.blackout\.start\)/);
  assert.doesNotMatch(scrollTimeline, /filter:/);
});
