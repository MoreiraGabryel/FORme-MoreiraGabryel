import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [app, hero, technologies, footer, layer, css] = await Promise.all([
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/effects/CodeBurstLayer.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
]);

test('ativa fragmentos de código apenas nos fundos do Home sem bloquear controles', () => {
  assert.match(app, /CodeBurstLayer/);
  assert.match(app, /<CodeBurstLayer/);
  assert.match(hero, /data-code-burst-surface/);
  assert.match(technologies, /data-code-burst-surface/);
  assert.match(footer, /data-code-burst-surface/);
  assert.match(layer, /pointerdown/);
  assert.match(layer, /pointerup/);
  assert.match(layer, /NON_BURST_SELECTOR/);
  assert.match(layer, /technology-modal-backdrop/);
  assert.match(layer, /technology-float-anchor/);
  assert.match(layer, /video/);
  assert.match(css, /\.code-burst-layer/);
  assert.match(css, /\.code-burst-particle/);
});
