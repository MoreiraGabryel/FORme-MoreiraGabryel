import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const stage = await readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8');

test('atenua apenas as imagens da etapa 2 com uma camada estática sem disputar opacidade com GSAP', () => {
  const veil = css.match(/\.technologies-stage \.transition-scene-background::after\s*\{([^}]+)\}/)?.[1];
  assert.ok(veil, 'A camada de atenuação da etapa 2 ainda não existe');
  assert.ok(veil.includes('var(--technology-image-dim)'));
  assert.ok(veil.includes('pointer-events: none'));
  assert.ok(!/animation|transition|filter/.test(veil));
  assert.ok(css.includes('--technology-image-dim: 0.18'));
  assert.ok(css.includes('--technology-image-dim: 0.22'));
  assert.ok(stage.includes('gsap.set(frameLayers[0], {autoAlpha: 1})'));
  assert.ok(stage.includes('frameSequence.frames.slice(1).forEach'));
});
