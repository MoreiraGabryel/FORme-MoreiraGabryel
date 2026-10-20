import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [loader, hero] = await Promise.all([
  readFile(new URL('../src/components/sections/LoadingScreen.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/sections/HeroIntro.tsx', import.meta.url), 'utf8'),
]);

test('conecta o mergulho do Loading ao zoom central da Hero sem flash ou lâminas', () => {
  assert.doesNotMatch(loader, /loading-aperture-panel|flashRef|FLASH_OVERLAY_STYLE/);
  assert.match(loader, /getLoadingHeroZoomMotion/);
  assert.match(loader, /scale: zoomMotion\.loadingExitScale/);
  assert.match(loader, /filter: `blur\(\$\{zoomMotion\.loadingExitBlur\}px\)`/);
  assert.match(loader, /\.call\(dispatchHeroHandoff, \[\], 'reveal'\)/);

  assert.match(hero, /getLoadingHeroZoomMotion/);
  assert.match(hero, /const zoomMotion = getLoadingHeroZoomMotion\(\{isMobile: isMobileViewport, prefersReducedMotion: reducedMotion\}\);/);
  assert.match(hero, /transformOrigin: '50% 50%'/);
  assert.match(hero, /scale: zoomMotion\.heroStartScale/);
  assert.match(hero, /filter: `blur\(\$\{zoomMotion\.heroStartBlur\}px\)/);
  assert.match(hero, /duration: zoomMotion\.heroSettleDuration/);
  assert.match(hero, /duration: zoomMotion\.heroSettleDuration,\n            ease: 'power2\.inOut'/);
});
