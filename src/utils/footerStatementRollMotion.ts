type FooterStatementRollValues = {
  autoAlpha: number;
  yPercent: number;
  rotationX: number;
  transformOrigin: string;
  duration: number;
  ease: string;
  force3D: boolean;
  overwrite: 'auto';
};

export type FooterStatementRollMotion = {
  out: FooterStatementRollValues | null;
  in: FooterStatementRollValues | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getFooterStatementParallax(progress: number, reducedMotion: boolean) {
  if (reducedMotion) return {yVh: 0, scale: 1};

  const normalized = clamp((progress - 0.08) / 0.84, 0, 1);
  return {
    yVh: 2.5 - normalized * 5,
    scale: 1 + normalized * 0.03,
  };
}

export function getFooterStatementRollMotion(reducedMotion: boolean): FooterStatementRollMotion {
  if (reducedMotion) {
    return {out: null, in: null};
  }

  return {
    out: {
      autoAlpha: 0,
      yPercent: -26,
      rotationX: -82,
      transformOrigin: '50% 100%',
      duration: 0.42,
      ease: 'power2.in',
      force3D: true,
      overwrite: 'auto',
    },
    in: {
      autoAlpha: 1,
      yPercent: 0,
      rotationX: 0,
      transformOrigin: '50% 0%',
      duration: 0.56,
      ease: 'power3.out',
      force3D: true,
      overwrite: 'auto',
    },
  };
}

export const footerStatementIncomingFrom = {
  autoAlpha: 0,
  yPercent: 30,
  rotationX: 76,
  transformOrigin: '50% 0%',
};
