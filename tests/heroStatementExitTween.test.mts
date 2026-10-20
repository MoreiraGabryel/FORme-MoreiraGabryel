import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {gsap} from 'gsap';
import {getHeroScrollExitMotion} from '../src/utils/heroScrollExitMotion.ts';
import {replaceHeroStatementExit} from '../src/utils/heroStatementExitTween.ts';

type Char = {autoAlpha: number; y: number};
const makeChars = (count: number): Char[] => Array.from({length: count}, () => ({autoAlpha: 1, y: 0}));

function makeScrollTimeline() {
  const timeline = gsap.timeline({paused: true, defaults: {ease: 'none'}});
  const media = {scale: 1};
  timeline.to(media, {scale: 1.08, duration: 0.82}, 0).to({opacity: 1}, {opacity: 0, duration: 0.18}, 0.82);
  return timeline;
}

const variants = [
  {name: 'mobile', isMobile: true, prefersReducedMotion: false},
  {name: 'desktop', isMobile: false, prefersReducedMotion: false},
  {name: 'reduced motion', isMobile: true, prefersReducedMotion: true},
];

for (const variant of variants) {
  test(`the exit tween ends exactly at the configured window (${variant.name})`, () => {
    const motion = getHeroScrollExitMotion(variant).statement;
    // Last character starts at start + amount and runs for `duration`.
    assert.ok(Math.abs(motion.start + motion.staggerAmount + motion.duration - motion.end) < 1e-9);
  });

  test(`swapping the phrase keeps the timeline length and retargets the characters (${variant.name})`, () => {
    const motion = getHeroScrollExitMotion(variant).statement;
    const timeline = makeScrollTimeline();
    const before = timeline.duration();
    const oldChars = makeChars(20);
    let tween = replaceHeroStatementExit({timeline, previous: null, chars: oldChars, motion});
    const childrenWithExit = timeline.getChildren(false, true, true).length;
    assert.equal(timeline.duration(), before);

    const newChars = makeChars(31);
    tween = replaceHeroStatementExit({timeline, previous: tween, chars: newChars, motion});
    assert.equal(timeline.getChildren(false, true, true).length, childrenWithExit);
    assert.equal(timeline.duration(), before);

    timeline.progress(motion.start - 0.001);
    assert.ok(newChars.every(char => char.y === 0 && char.autoAlpha === 1));
    timeline.progress(motion.end);
    assert.ok(newChars.every(char => Math.abs(char.y - motion.y) < 1e-9 && char.autoAlpha === 0));
    assert.ok(oldChars.every(char => char.y === 0 && char.autoAlpha === 1), 'the previous phrase must not be animated anymore');
  });
}

test('fifty phrase rotations never accumulate tweens or change the timeline length', () => {
  const motion = getHeroScrollExitMotion({isMobile: true, prefersReducedMotion: false}).statement;
  const timeline = makeScrollTimeline();
  const before = timeline.duration();
  let tween = replaceHeroStatementExit({timeline, previous: null, chars: makeChars(10), motion});
  const children = timeline.getChildren(false, true, true).length;
  for (let index = 0; index < 50; index += 1) {
    tween = replaceHeroStatementExit({timeline, previous: tween, chars: makeChars(10 + (index % 7)), motion});
  }
  assert.equal(timeline.getChildren(false, true, true).length, children);
  assert.equal(timeline.duration(), before);
});

test('changing the phrase does not recreate the pinned ScrollTrigger nor refresh every scene', async () => {
  const hero = await readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8');
  const start = hero.indexOf('const ctx = gsap.context');
  const end = hero.indexOf('], root', start) === -1 ? hero.indexOf('}, root);', start) : hero.indexOf('], root', start);
  const effectStart = hero.lastIndexOf('useLayoutEffect(() => {', start);
  const effectEnd = hero.indexOf('\n  }, [', end) + 1;
  const effectDependencies = hero.slice(effectEnd, hero.indexOf(']);', effectEnd) + 3);
  const effect = hero.slice(effectStart, effectEnd);

  assert.equal((effect.match(/scrollTrigger:/g) ?? []).length, 1);
  assert.match(effectDependencies, /\[isMobileViewport\]\);/);
  assert.doesNotMatch(effectDependencies, /displayedPhrase|statementCharacterCount/);
  assert.match(hero, /replaceHeroStatementExit\(/);
});
