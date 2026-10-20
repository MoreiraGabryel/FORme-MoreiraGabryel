import {getHeroStatementMotion} from './heroStatementMotion.ts';

type FooterStatementMotionValues = {
  autoAlpha: number;
  y: number;
  filter: string;
};

type FooterStatementAnimationValues = FooterStatementMotionValues & {
  duration: number;
  stagger: {amount: number; from: 'center' | 'edges'};
  ease: string;
  force3D: boolean;
  overwrite: 'auto';
};

export type FooterStatementMotion = {
  from: FooterStatementMotionValues;
  to: FooterStatementAnimationValues | null;
  out: FooterStatementAnimationValues | null;
  phraseGap: number;
};

export function getFooterStatementMotion(reducedMotion: boolean, isCompactViewport = false): FooterStatementMotion {
  if (reducedMotion) {
    return {from: {autoAlpha: 1, y: 0, filter: 'blur(0px)'}, to: null, out: null, phraseGap: 0};
  }

  const hero = getHeroStatementMotion(false);
  // Reuse the Hero's direction/blur/beats, but bound the stagger spread:
  // footer phrases are longer, so per-character delays would grow unbounded.
  return {
    from: {autoAlpha: 0, y: isCompactViewport ? 8 : hero.entry.y, filter: `blur(${hero.entry.blur}px)`},
    to: {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: isCompactViewport ? 0.36 : hero.entry.duration,
      stagger: {amount: isCompactViewport ? 0.18 : 0.24, from: hero.entry.from},
      ease: 'power3.out',
      force3D: true,
      overwrite: 'auto',
    },
    out: {
      autoAlpha: 0,
      y: isCompactViewport ? -8 : hero.exit.y,
      filter: `blur(${hero.exit.blur}px)`,
      duration: isCompactViewport ? 0.24 : hero.exit.duration,
      stagger: {amount: isCompactViewport ? 0.12 : 0.18, from: hero.exit.from},
      ease: 'power2.in',
      force3D: true,
      overwrite: 'auto',
    },
    phraseGap: hero.phraseGap,
  };
}
