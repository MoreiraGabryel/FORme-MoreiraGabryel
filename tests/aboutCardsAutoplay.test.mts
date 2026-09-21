import assert from 'node:assert/strict';
import test from 'node:test';

const autoplayModule = await import('../src/utils/aboutCardsAutoplay.ts').catch(() => null);

test('avança automaticamente a cada quatro segundos', () => {
  assert.equal(autoplayModule?.ABOUT_CARDS_AUTOPLAY_DELAY, 4000);
});

test('permite a rotação automática apenas quando o estágio pode avançar', () => {
  assert.ok(autoplayModule?.canAutoAdvanceAboutCards, 'Expected About cards autoplay decision helper to exist');

  assert.equal(
    autoplayModule.canAutoAdvanceAboutCards({
      isActive: true,
      isCardOpen: false,
      isHovered: false,
      isFocusWithin: false,
      isPageVisible: true,
      reducedMotion: false,
    }),
    true,
  );
});

test('pausa a rotação automática durante interação, card aberto, aba oculta ou redução de movimento', () => {
  assert.ok(autoplayModule?.canAutoAdvanceAboutCards, 'Expected About cards autoplay decision helper to exist');

  const baseState = {
    isActive: true,
    isCardOpen: false,
    isHovered: false,
    isFocusWithin: false,
    isPageVisible: true,
    reducedMotion: false,
  };

  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, isCardOpen: true}), false);
  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, isHovered: true}), false);
  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, isFocusWithin: true}), false);
  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, isPageVisible: false}), false);
  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, reducedMotion: true}), false);
  assert.equal(autoplayModule.canAutoAdvanceAboutCards({...baseState, isActive: false}), false);
});
