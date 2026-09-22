import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const hero = await readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8');

test('dá prioridade à saída por scroll quando uma troca de frase estiver pendente', () => {
  assert.match(hero, /shouldLockHeroStatementExit/);
  assert.match(hero, /const isHeroScrollExitActive = shouldLockHeroStatementExit/);
  assert.match(hero, /const phraseTransitionRef = useRef<gsap\.core\.Timeline \| null>\(null\)/);
  assert.match(hero, /const isHeroScrollExitActiveRef = useRef\(isHeroScrollExitActive\)/);
  assert.match(hero, /phraseTransitionRef\.current\?\.kill\(\)/);
  assert.match(hero, /if \(isHeroScrollExitActive\) return;/);
  assert.match(hero, /if \(isHeroScrollExitActiveRef\.current\) return;/);
});
