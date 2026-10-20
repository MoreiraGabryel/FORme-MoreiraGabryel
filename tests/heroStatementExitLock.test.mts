import assert from 'node:assert/strict';
import test from 'node:test';
import {shouldLockHeroStatementExit} from '../src/utils/heroScrollExitMotion.ts';

test('trava a troca de frase no início da saída, no desktop e no mobile', () => {
  for (const isMobile of [false, true]) {
    assert.equal(
      shouldLockHeroStatementExit({heroProgress: 0.649, isMobile, prefersReducedMotion: false}),
      false,
    );
    assert.equal(
      shouldLockHeroStatementExit({heroProgress: 0.65, isMobile, prefersReducedMotion: false}),
      true,
    );
  }
});

test('respeita o ponto reduzido de saída para quem prefere menos movimento', () => {
  assert.equal(
    shouldLockHeroStatementExit({heroProgress: 0.679, isMobile: false, prefersReducedMotion: true}),
    false,
  );
  assert.equal(
    shouldLockHeroStatementExit({heroProgress: 0.68, isMobile: true, prefersReducedMotion: true}),
    true,
  );
});
