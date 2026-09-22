import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

test('suaviza a borda do portal enquanto o Fake Footer entra no viewport', () => {
  const stickyRule = css.match(/\.fake-footer-sticky\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(stickyRule, /--fake-footer-entry-feather: max\(1px, calc\(\(1 - var\(--fake-footer-entrance, 1\)\) \* 18vh\)\);/);
  assert.match(stickyRule, /-webkit-mask-image: linear-gradient\(to bottom, transparent 0, #000 var\(--fake-footer-entry-feather\), #000 100%\);/);
  assert.match(stickyRule, /mask-image: linear-gradient\(to bottom, transparent 0, #000 var\(--fake-footer-entry-feather\), #000 100%\);/);
});
