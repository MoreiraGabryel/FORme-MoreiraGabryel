import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import test from 'node:test';

const stage = await readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

test('usa cards isolados, hover fora do campo recortado e dialog nativo com fechamento animado', async () => {
  const dialogUrl = new URL('../src/components/technology/TechnologyDialog.tsx', import.meta.url);
  const hoverUrl = new URL('../src/components/technology/TechnologyHoverCard.tsx', import.meta.url);
  assert.ok(existsSync(dialogUrl), 'O novo dialog ainda não existe');
  assert.ok(existsSync(hoverUrl), 'O novo hover ainda não existe');
  const dialog = await readFile(dialogUrl, 'utf8');
  const hover = await readFile(hoverUrl, 'utf8');
  assert.ok(dialog.includes('showModal()'));
  assert.ok(dialog.includes('createPortal'));
  assert.ok(dialog.includes('onCancel'));
  assert.ok(dialog.includes('event.preventDefault()'));
  assert.ok(dialog.includes('closeTechnologyCardTimeline'));
  assert.ok(dialog.includes('data-lenis-prevent'));
  assert.ok(dialog.includes('ctx.revert()'));
  assert.ok(dialog.includes('technology.description[locale]'));
  assert.ok(dialog.includes('uiCopy.close'));
  assert.ok(hover.includes('createPortal'));
  assert.ok(hover.includes('getTechnologyTooltipPosition'));
  assert.ok(stage.includes('<TechnologyDialog'));
  assert.ok(stage.includes('<TechnologyHoverCard'));
  assert.ok(!stage.includes('button.style.filter'), 'Ícones não devem animar filtros por frame');
  assert.ok(!css.includes('technologyModalIn'), 'A animação CSS antiga não deve competir com GSAP');
  assert.ok(css.includes('--technology-ice: #bfe2ff'));
  assert.ok(css.includes('max-height: calc(100dvh - 32px)'));
});
