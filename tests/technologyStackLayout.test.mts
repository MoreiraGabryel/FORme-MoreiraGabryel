import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import test from 'node:test';

const layoutUrl = new URL('../src/utils/technologyStackLayout.ts', import.meta.url);

test('mantém toda a stack no desktop e distribui todos os itens em grupos mobile de até 8', async () => {
  assert.ok(existsSync(layoutUrl), 'A seleção responsiva da stack ainda não existe');
  const {getTechnologyPages} = await import(layoutUrl.href);
  for (const count of [0, 1, 8, 9, 16, 25, 40]) {
    const items = Array.from({length: count}, (_, id) => ({id}));
    const desktop = getTechnologyPages(items, false);
    assert.deepEqual(desktop, [items]);
    const mobile = getTechnologyPages(items, true);
    assert.deepEqual(mobile.flat(), items);
    assert.ok(mobile.every((page: unknown[]) => page.length <= 8));
    assert.equal(new Set(mobile.flat().map((item: {id: number}) => item.id)).size, count);
    const sizes = mobile.map((page: unknown[]) => page.length);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, 'Os grupos devem ter densidade equilibrada');
  }
});

test('distribui 25 ícones desktop e até 8 mobile sem repetir pontos ou cobrir o centro de leitura', async () => {
  const layout = await import(layoutUrl.href);
  assert.equal(typeof layout.getTechnologyFloatPoints, 'function', 'A distribuição ampliada ainda não existe');
  for (const [count, mobile] of [[25, false], [8, true], [7, true], [1, true]] as const) {
    const points = layout.getTechnologyFloatPoints(count, mobile);
    assert.equal(points.length, count);
    assert.equal(new Set(points.map((p: {left: number; top: number}) => `${p.left}/${p.top}`)).size, count);
    for (const point of points) {
      assert.ok(point.left >= 0.07 && point.left <= 0.93);
      assert.ok(point.top >= 0.1 && point.top <= 0.9);
      assert.ok(!(point.left > 0.25 && point.left < 0.75 && point.top > 0.45 && point.top < 0.82));
    }
  }
});
