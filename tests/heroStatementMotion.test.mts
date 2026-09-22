import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getHeroStatementMotion,
  shouldRotateHeroPhrase,
  splitHeroStatementLine,
} from '../src/utils/heroStatementMotion.ts';

test('preserva palavras completas ao separar o letreiro em caracteres', () => {
  assert.deepEqual(splitHeroStatementLine('Código com intenção.'), [
    ['C', 'ó', 'd', 'i', 'g', 'o'],
    ['c', 'o', 'm'],
    ['i', 'n', 't', 'e', 'n', 'ç', 'ã', 'o', '.'],
  ]);
});

test('configura dissolução moderada e reversa para o letreiro', () => {
  assert.deepEqual(getHeroStatementMotion(false), {
    entry: {y: 12, blur: 3, duration: 0.42, stagger: 0.016, from: 'center'},
    exit: {y: -12, blur: 3, duration: 0.3, stagger: 0.012, from: 'edges'},
    phraseGap: 0.06,
  });
  assert.deepEqual(getHeroStatementMotion(true), {
    entry: {y: 0, blur: 0, duration: 0.18, stagger: 0, from: 'center'},
    exit: {y: 0, blur: 0, duration: 0.14, stagger: 0, from: 'edges'},
    phraseGap: 0,
  });
});

test('pausa a rotação quando a Hero começa a sair', () => {
  assert.equal(shouldRotateHeroPhrase(0), true);
  assert.equal(shouldRotateHeroPhrase(0.01), true);
  assert.equal(shouldRotateHeroPhrase(0.011), false);
});
