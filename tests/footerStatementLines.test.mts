import assert from 'node:assert/strict';
import test from 'node:test';

const linesModule = await import('../src/utils/footerStatementLines.ts').catch(() => null);

const phrase = {
  desktop: ['Ideia clara.', 'Execução precisa.'],
  mobile: ['Ideia clara.', 'Execução precisa.'],
};

test('usa linhas editoriais completas no letreiro móvel', () => {
  assert.ok(linesModule?.getFooterStatementLines, 'Expected footer statement line helper to exist');

  assert.deepEqual(linesModule.getFooterStatementLines(phrase, true), [
    'Ideia clara.',
    'Execução precisa.',
  ]);
});

test('mantém a variante desktop independente da variante móvel', () => {
  assert.ok(linesModule?.getFooterStatementLines, 'Expected footer statement line helper to exist');

  const responsivePhrase = {
    desktop: ['Seu projeto', 'começa aqui.'],
    mobile: ['Seu projeto', 'aqui.'],
  };

  assert.deepEqual(linesModule.getFooterStatementLines(responsivePhrase, false), [
    'Seu projeto',
    'começa aqui.',
  ]);
  assert.deepEqual(linesModule.getFooterStatementLines(responsivePhrase, true), [
    'Seu projeto',
    'aqui.'],
  );
});
