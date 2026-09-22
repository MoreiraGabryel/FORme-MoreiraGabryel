import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [app, footerStage, css] = await Promise.all([
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
]);

test('limita a rotação do letreiro ao Footer visível e antes do blackout', () => {
  assert.match(app, /canRotateFooterPhrase/);
  assert.match(app, /fakeFooterProgress >= 0\.12/);
  assert.match(app, /fakeFooterProgress < FAKE_FOOTER_BLACKOUT_START/);
  assert.match(footerStage, /getFooterStatementRollMotion/);
  assert.match(footerStage, /fake-footer-statement-drum/);
  assert.match(footerStage, /fake-footer-statement-line--outgoing/);
  assert.match(footerStage, /aria-hidden="true"/);
  assert.match(css, /\.fake-footer-statement-parallax/);
  assert.match(css, /\.fake-footer-statement-drum/);
  assert.match(css, /perspective:/);
});
