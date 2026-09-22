import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [app, hero, css] = await Promise.all([
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
]);

test('troca as faixas douradas por caracteres GSAP e pausa a rotação fora da Hero', () => {
  assert.match(app, /import \{shouldRotateHeroPhrase\} from '.\/utils\/heroStatementMotion';/);
  assert.match(app, /if \(!shouldRotateHeroPhrase\(heroProgress\)\) return;/);

  assert.match(hero, /splitHeroStatementLine/);
  assert.match(hero, /hero-statement-character/);
  assert.match(hero, /stagger: \{each: statementMotion\.entry\.stagger, from: statementMotion\.entry\.from\}/);
  assert.match(hero, /stagger: \{amount: prefersReducedMotion \? 0 : 0\.18, from: statementMotion\.exit\.from\}/);
  assert.doesNotMatch(hero, /HERO_SLICE_SEGMENTS|titleSliceRefs|hero-exit-sweep|hero-title-glow|hero-title-mask/);

  assert.match(css, /\.hero-statement-word \{/);
  assert.match(css, /\.hero-statement-character \{/);
  assert.doesNotMatch(css, /hero-statement-handshake::before|hero-statement-handshake::after|hero-statement-slice|heroPhraseReveal|heroLinePremiumReveal|hero-exit-sweep|hero-title-glow|hero-title-mask/);
});
