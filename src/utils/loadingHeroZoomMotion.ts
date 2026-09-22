export type LoadingHeroZoomMotion = {
  heroStartScale: number;
  heroStartBlur: number;
  heroSettleDuration: number;
  loadingExitScale: number;
  loadingExitBlur: number;
  loadingExitDuration: number;
};

export function getLoadingHeroZoomMotion({
  isMobile,
  prefersReducedMotion,
}: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
}): LoadingHeroZoomMotion {
  if (prefersReducedMotion) {
    return {
      heroStartScale: 1,
      heroStartBlur: 0,
      heroSettleDuration: 0.2,
      loadingExitScale: 1.01,
      loadingExitBlur: 0,
      loadingExitDuration: 0.18,
    };
  }

  return {
    heroStartScale: isMobile ? 1.1 : 1.14,
    heroStartBlur: 6,
    heroSettleDuration: 0.64,
    loadingExitScale: 1.06,
    loadingExitBlur: 6,
    loadingExitDuration: isMobile ? 0.52 : 0.56,
  };
}
