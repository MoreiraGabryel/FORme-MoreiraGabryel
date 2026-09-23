import assert from 'node:assert/strict';
import test from 'node:test';

const sequenceModule = await import('../src/utils/technologyFrameSequence.ts').catch(() => null);

test('mantém new-cena_1 durante a interação e distribui os quatro crossfades na saída', () => {
  assert.ok(sequenceModule?.getTechnologyFrameSequence, 'Expected technology frame sequence helper to exist');

  const sequence = sequenceModule.getTechnologyFrameSequence(false);

  assert.deepEqual(sequence.entry, {start: 0, end: 0.1});
  assert.deepEqual(sequence.hold, {start: 0.1, end: 0.78});
  assert.deepEqual(sequence.exit, {start: 0.78, end: 0.96});
  assert.deepEqual(sequence.frames, [
    {src: '/media/new-cena_1.webp', enter: 0, exit: 0.825},
    {src: '/media/new-cena_2.webp', enter: 0.78, exit: 0.87},
    {src: '/media/new-cena_3.webp', enter: 0.825, exit: 0.915},
    {src: '/media/new-cena_4.webp', enter: 0.87, exit: 0.96},
    {src: '/media/new-cena_5.webp', enter: 0.915, exit: 1},
  ]);
});

test('mantém somente new-cena_1 estática sob prefers-reduced-motion', () => {
  assert.ok(sequenceModule?.getTechnologyFrameSequence, 'Expected technology frame sequence helper to exist');

  const sequence = sequenceModule.getTechnologyFrameSequence(true);

  assert.equal(sequence.entry, null);
  assert.equal(sequence.exit, null);
  assert.deepEqual(sequence.frames, [{src: '/media/new-cena_1.webp', enter: 0, exit: 1}]);
});
