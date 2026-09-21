export type AboutCardsAutoplayState = {
  isActive: boolean;
  isCardOpen: boolean;
  isHovered: boolean;
  isFocusWithin: boolean;
  isPageVisible: boolean;
  reducedMotion: boolean;
};

export const ABOUT_CARDS_AUTOPLAY_DELAY = 4000;

export function canAutoAdvanceAboutCards({
  isActive,
  isCardOpen,
  isHovered,
  isFocusWithin,
  isPageVisible,
  reducedMotion,
}: AboutCardsAutoplayState) {
  return isActive && !isCardOpen && !isHovered && !isFocusWithin && isPageVisible && !reducedMotion;
}
