export type HeroScrollExitMotion = {
  background: {
    end: number;
    scale: number;
    yPercent: number;
  };
  statement: {
    start: number;
    end: number;
    y: number;
    duration: number;
    staggerAmount: number;
    from: 'end';
  };
  blackout: {
    start: number;
    end: number;
  };
};

export function getHeroScrollExitMotion({
  isMobile,
  prefersReducedMotion,
}: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
}): HeroScrollExitMotion {
  if (prefersReducedMotion) {
    return {
      background: {end: 0.76, scale: 1, yPercent: 0},
      statement: {start: 0.68, end: 0.76, y: 0, duration: 0.08, staggerAmount: 0, from: 'end'},
      blackout: {start: 0.76, end: 1},
    };
  }

  return {
    background: {
      end: 0.82,
      scale: isMobile ? 1.045 : 1.08,
      yPercent: isMobile ? -4 : -7,
    },
    statement: {
      start: 0.68,
      end: 0.82,
      y: isMobile ? -28 : -42,
      duration: 0.08,
      staggerAmount: 0.06,
      from: 'end',
    },
    blackout: {start: 0.82, end: 1},
  };
}

export function shouldLockHeroStatementExit({
  heroProgress,
  isMobile,
  prefersReducedMotion,
}: {
  heroProgress: number;
  isMobile: boolean;
  prefersReducedMotion: boolean;
}) {
  return heroProgress >= getHeroScrollExitMotion({isMobile, prefersReducedMotion}).statement.start;
}
