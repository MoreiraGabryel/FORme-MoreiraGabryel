import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const stage = await readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

test('conecta páginas manuais mobile à stack inteira e mantém controles acessíveis', () => {
  assert.match(stage, /getTechnologyPages\(TECHNOLOGIES, isMobile\)/);
  assert.doesNotMatch(stage, /TECHNOLOGIES\.slice\(0/);
  assert.match(stage, /technology-mobile-pagination/);
  assert.match(stage, /uiCopy\.previous/);
  assert.match(stage, /uiCopy\.next/);
  assert.match(stage, /aria-live="polite"/);
  assert.match(stage, /aria-haspopup="dialog"/);
  assert.doesNotMatch(stage, /className="transition-stage-media technologies-stage-media" aria-hidden="true"/);
  assert.match(css, /@media \(max-width: 767\.98px\)/);
});
