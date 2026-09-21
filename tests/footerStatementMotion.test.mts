import assert from 'node:assert/strict';
import test from 'node:test';

const motionModule = await import('../src/utils/footerStatementMotion.ts').catch(() => null);

test('revela o letreiro com propriedades compostáveis pelo GPU', () => {
  assert.ok(motionModule?.getFooterStatementMotion, 'Expected footer statement motion helper to exist');

  const motion = motionModule.getFooterStatementMotion(false);

  assert.deepEqual(motion.from, {
    autoAlpha: 0,
    yPercent: 16,
  });
  assert.equal(motion.to.autoAlpha, 1);
  assert.equal(motion.to.yPercent, 0);
  assert.equal(motion.to.duration, 0.54);
  assert.equal(motion.to.stagger, 0.022);
  assert.equal(motion.to.force3D, true);
  assert.equal('filter' in motion.from, false);
  assert.equal('filter' in motion.to, false);
});

test('remove a cascata de letras para quem prefere menos movimento', () => {
  assert.ok(motionModule?.getFooterStatementMotion, 'Expected footer statement motion helper to exist');

  assert.deepEqual(motionModule.getFooterStatementMotion(true), {
    from: {
      autoAlpha: 1,
      yPercent: 0,
    },
    to: null,
  });
});
