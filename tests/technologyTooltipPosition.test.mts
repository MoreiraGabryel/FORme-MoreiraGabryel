import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import test from 'node:test';

const positionUrl = new URL('../src/utils/technologyTooltipPosition.ts', import.meta.url);

test('mantém o hover inteiro na viewport, inclusive nas bordas e em telas baixas', async () => {
  assert.ok(existsSync(positionUrl), 'O posicionamento protegido do hover ainda não existe');
  const {getTechnologyTooltipPosition} = await import(positionUrl.href);
  for (const [width, height] of [[1440, 900], [800, 400], [768, 600]]) {
    for (const anchor of [{left: 0, top: 0}, {left: width - 44, top: 0}, {left: width - 44, top: height - 44}, {left: 0, top: height - 44}]) {
      const result = getTechnologyTooltipPosition({...anchor, width: 44, height: 44}, {width: 260, height: 154}, {width, height});
      assert.ok(result.left >= 14);
      assert.ok(result.top >= 14);
      assert.ok(result.left + 260 <= width - 14);
      assert.ok(result.top + 154 <= height - 14);
    }
  }
});
