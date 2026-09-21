type FooterStatementMotionValues = {
  autoAlpha: number;
  yPercent: number;
};

type FooterStatementAnimationValues = FooterStatementMotionValues & {
  duration: number;
  stagger: number;
  ease: string;
  force3D: boolean;
  overwrite: 'auto';
};

export type FooterStatementMotion = {
  from: FooterStatementMotionValues;
  to: FooterStatementAnimationValues | null;
};

export function getFooterStatementMotion(reducedMotion: boolean): FooterStatementMotion {
  if (reducedMotion) {
    return {
      from: {
        autoAlpha: 1,
        yPercent: 0,
      },
      to: null,
    };
  }

  return {
    from: {
      autoAlpha: 0,
      yPercent: 16,
    },
    to: {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.54,
      stagger: 0.022,
      ease: 'power3.out',
      force3D: true,
      overwrite: 'auto',
    },
  };
}
