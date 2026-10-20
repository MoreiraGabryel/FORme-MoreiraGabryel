import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import test from 'node:test';

const motionUrl = new URL('../src/utils/technologyCardMotion.ts', import.meta.url);

function targets() {
  return {
    root: {opacity: 1, force3D: true},
    blades: [
      {x: 0, y: 0, rotationY: 0, opacity: 1, force3D: true},
      {x: 0, y: 0, rotationY: 0, opacity: 1, force3D: true},
    ],
    seam: {scaleY: 1, opacity: 1, force3D: true},
    content: [{y: 0, opacity: 1, force3D: true}, {y: 0, opacity: 1, force3D: true}],
    shade: {opacity: 1, force3D: true},
  };
}

test('coordena lâminas e conteúdo com GSAP real e só conclui o fechamento no fim da reversão', async () => {
  assert.ok(existsSync(motionUrl), 'O movimento dos cards ainda não existe');
  const {createTechnologyCardTimeline, closeTechnologyCardTimeline} = await import(motionUrl.href);
  const elements = targets();
  const timeline = createTechnologyCardTimeline(elements, 'dialog', false);
  timeline.progress(1);
  assert.equal(elements.root.opacity, 1);
  assert.ok(elements.blades.every((blade) => blade.x === 0 && blade.y === 0 && blade.rotationY === 0 && blade.opacity === 1));
  assert.ok(elements.content.every((item) => item.opacity === 1 && item.y === 0));
  let closed = 0;
  closeTechnologyCardTimeline(timeline, () => closed++, false);
  assert.equal(closed, 0, 'O card não deve desmontar no clique');
  timeline.totalTime(0, false);
  assert.equal(closed, 1);
  timeline.kill();
});

test('fechar antes da entrada ou com movimento reduzido não deixa o card preso', async () => {
  assert.ok(existsSync(motionUrl));
  const {createTechnologyCardTimeline, closeTechnologyCardTimeline} = await import(motionUrl.href);
  for (const reduced of [false, true]) {
    const elements = targets();
    const timeline = createTechnologyCardTimeline(elements, 'hover', reduced);
    let closed = 0;
    closeTechnologyCardTimeline(timeline, () => closed++, reduced);
    assert.equal(closed, 1);
    if (reduced) {
      assert.equal(elements.root.opacity, 1);
      assert.ok(elements.blades.every((blade) => blade.x === 0 && blade.rotationY === 0));
    }
    timeline.kill();
  }
});
