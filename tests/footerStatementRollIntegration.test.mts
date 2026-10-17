import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [app, footerStage, css] = await Promise.all([
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
]);

test('preserves the existing footer cycling window and scene pin while replacing only the phrase drum', () => {
  assert.match(app, /canRotateFooterPhrase/);
  assert.match(app, /fakeFooterProgress >= 0\.12/);
  assert.match(app, /fakeFooterProgress < FAKE_FOOTER_BLACKOUT_START/);
  assert.match(footerStage, /getFooterStatementMotion/);
  assert.match(footerStage, /fake-footer-statement-layers/);
  assert.doesNotMatch(footerStage, /fake-footer-statement-drum|getFooterStatementRollMotion|rotationX|yPercent/);
  assert.match(footerStage, /fake-footer-statement-line--outgoing/);
  assert.match(footerStage, /aria-hidden="true"/);
  assert.match(footerStage, /getFooterStatementParallax/);
  assert.match(footerStage, /pin: sticky/);
  assert.match(footerStage, /getFakeFooterHandoffOverlap\(getStableViewportHeight\(\)\)/);
});

test('replacement phrase layers retain shared grid placement without obsolete drum perspective', () => {
  const layers = css.match(/\.fake-footer-statement-layers\s*\{([^}]+)\}/)?.[1];
  assert.ok(layers, 'renamed phrase layers need their grid rules');
  assert.match(layers, /display: grid/);
  assert.match(layers, /grid-template-areas: 'statement'/);
  assert.match(layers, /place-items: center/);
  assert.doesNotMatch(layers, /perspective|preserve-3d/);
  assert.doesNotMatch(css, /\.fake-footer-statement-drum/);
});
