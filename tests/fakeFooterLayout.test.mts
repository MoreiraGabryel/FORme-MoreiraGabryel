import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

test('mantém o letreiro do Fake Footer centralizado durante a entrada', () => {
  const ctaRule = css.match(/\.fake-footer-left-column \.fake-footer-cta-block \{([\s\S]*?)\n\}/)?.[1] ?? '';
  const transform = ctaRule.match(/transform: [^;]+;/)?.[0] ?? '';

  assert.match(transform, /transform: translate3d\(0, calc\(-1svh \+ var\(--fake-footer-reverse, 0\) \* 1\.45rem\), 0\);/);
  assert.doesNotMatch(transform, /fake-footer-ease/);
});
