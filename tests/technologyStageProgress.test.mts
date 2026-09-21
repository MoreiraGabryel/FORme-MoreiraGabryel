import assert from 'node:assert/strict';
import test from 'node:test';

const progressModule = await import('../src/utils/technologyStageProgress.ts').catch(() => null);

test('mantém os ícones flutuantes em cena até a transição final da tecnologia', () => {
  assert.ok(progressModule?.getTechnologyStageProgress, 'Expected technology stage progress helper to exist');

  assert.deepEqual(progressModule.getTechnologyStageProgress(0.39), {
    stageProgress: 0.5,
    releaseProgress: 0,
  });
});

test('libera a saída direta para o Fake Footer sem etapa intermediária', () => {
  assert.ok(progressModule?.getTechnologyStageProgress, 'Expected technology stage progress helper to exist');

  assert.deepEqual(progressModule.getTechnologyStageProgress(0.78), {
    stageProgress: 1,
    releaseProgress: 0,
  });

  assert.deepEqual(progressModule.getTechnologyStageProgress(0.89), {
    stageProgress: 1,
    releaseProgress: 0.5,
  });
});
