import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [app, hero, technology, css] = await Promise.all([
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
]);

test('Hero activates pointer depth only after loading and owns an inner image plane separate from its scroll media', () => {
  assert.match(app, /pointerReady=\{loaded\}/);
  assert.match(hero, /usePointerDepth\(rootRef, depthPlaneRef,/);
  assert.match(hero, /getPointerDepthStrength\('hero', heroProgress, pointerReady\)/);
  assert.match(hero, /ref=\{mediaRef\} className="hero-media">\s*<div ref=\{depthPlaneRef\} className="hero-depth-plane"/);
  assert.match(css, /\.hero-depth-plane\s*\{[^}]*scene-0\.webp/);
});

test('technology depth wraps only the frame layers and suspends when its detail dialog owns interaction', () => {
  assert.match(technology, /usePointerDepth\(pinnedShellRef, depthPlaneRef,/);
  assert.match(technology, /getPointerDepthStrength\('technology', rawStageProgress, !activeTechnologyId\)/);
  assert.match(technology, /className="technology-depth-plane"[^>]*>\s*\{frameSequence\.frames\.map/);
  assert.match(css, /\.technology-depth-plane\s*\{[^}]*position: absolute/);
});
