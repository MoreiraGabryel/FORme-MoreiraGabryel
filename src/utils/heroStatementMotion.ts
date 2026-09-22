export type HeroStatementCharacterMotion = {
  y: number;
  blur: number;
  duration: number;
  stagger: number;
  from: 'center' | 'edges';
};

export type HeroStatementMotion = {
  entry: HeroStatementCharacterMotion;
  exit: HeroStatementCharacterMotion;
  phraseGap: number;
};

export function splitHeroStatementLine(line: string) {
  return line.split(' ').filter(Boolean).map((word) => Array.from(word));
}

export function getHeroStatementMotion(prefersReducedMotion: boolean): HeroStatementMotion {
  if (prefersReducedMotion) {
    return {
      entry: {y: 0, blur: 0, duration: 0.18, stagger: 0, from: 'center'},
      exit: {y: 0, blur: 0, duration: 0.14, stagger: 0, from: 'edges'},
      phraseGap: 0,
    };
  }

  return {
    entry: {y: 12, blur: 3, duration: 0.42, stagger: 0.016, from: 'center'},
    exit: {y: -12, blur: 3, duration: 0.3, stagger: 0.012, from: 'edges'},
    phraseGap: 0.06,
  };
}

export function shouldRotateHeroPhrase(heroProgress: number) {
  return heroProgress <= 0.01;
}
