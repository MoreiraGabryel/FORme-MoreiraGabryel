import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const footerStage = await readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8');
const hero = await readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('remove somente a deixa de scroll do Fake Footer', () => {
  assert.doesNotMatch(footerStage, /unlock-scroll-indicator|unlock-arrow/);
  assert.doesNotMatch(css, /\.unlock-scroll-indicator|\.unlock-arrow|unlockArrowFloat/);
  assert.doesNotMatch(`${footerStage}\n${css}\n${app}`, /fake-footer-unlock|FAKE_FOOTER_UNLOCK/);
  assert.match(hero, /scroll-cue-arrows/);
});
