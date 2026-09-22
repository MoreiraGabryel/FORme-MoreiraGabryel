import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const footerStage = await readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8');

test('organiza a área utilitária móvel com redes, legal e copyright no rodapé', () => {
  const mobileCss = css.slice(css.indexOf('@media (max-width: 980px)'));

  assert.match(mobileCss, /grid-template-areas:\s*'social'\s*'legal'\s*'copyright';/);
  assert.match(mobileCss, /\.fake-footer-utility-center-icons\s*\{[\s\S]*?grid-area: social;/);
  assert.match(mobileCss, /\.fake-footer-bottom-row-legal-only\s*\{[\s\S]*?grid-area: legal;/);
  assert.match(mobileCss, /\.fake-footer-copyright-row-inline\s*\{[\s\S]*?grid-area: copyright;/);
});

test('antecipa o portal sem uma faixa preta entre tecnologia e Fake Footer', () => {
  const flowRule = css.match(/\.fake-footer-flow\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const stageRule = css.match(/\.fake-footer-stage\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const stickyRule = css.match(/\.fake-footer-sticky\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(flowRule, /--fake-footer-handoff-overlap:/);
  assert.match(flowRule, /margin-top: calc\(var\(--fake-footer-handoff-overlap\) \* -1\);/);
  assert.match(flowRule, /background: transparent;/);
  assert.match(stageRule, /background: transparent;/);
  assert.match(stickyRule, /top: calc\(var\(--fake-footer-handoff-overlap\) \* -1\);/);
  assert.doesNotMatch(css, /\.fake-footer-flow::before/);
  assert.match(footerStage, /getFakeFooterHandoffOverlap/);
  assert.match(footerStage, /start: \(\) => `top top\+=\$\{Math\.round\(getFakeFooterHandoffOverlap\(getStableViewportHeight\(\)\)\)\}`/);
});

test('mantém os controles do rodapé acima do blackout e adia o blackout final', () => {
  const utilityRule = css.match(/\.fake-footer-utility-row\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(utilityRule, /z-index: 7;/);
  assert.match(app, /const FAKE_FOOTER_BLACKOUT_START = 0\.92;/);
});
