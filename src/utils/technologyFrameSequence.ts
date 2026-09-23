type TechnologyFrame = {
  src: string;
  enter: number;
  exit: number;
};

type TechnologyFrameSequence = {
  entry: {start: number; end: number} | null;
  hold: {start: number; end: number};
  exit: {start: number; end: number} | null;
  frames: TechnologyFrame[];
};

const FRAME_SOURCES = [
  '/media/new-cena_1.webp',
  '/media/new-cena_2.webp',
  '/media/new-cena_3.webp',
  '/media/new-cena_4.webp',
  '/media/new-cena_5.webp',
] as const;

export function getTechnologyFrameSequence(prefersReducedMotion: boolean): TechnologyFrameSequence {
  if (prefersReducedMotion) {
    return {
      entry: null,
      hold: {start: 0, end: 1},
      exit: null,
      frames: [{src: FRAME_SOURCES[0], enter: 0, exit: 1}],
    };
  }

  return {
    entry: {start: 0, end: 0.1},
    hold: {start: 0.1, end: 0.78},
    exit: {start: 0.78, end: 0.96},
    frames: [
      {src: FRAME_SOURCES[0], enter: 0, exit: 0.825},
      {src: FRAME_SOURCES[1], enter: 0.78, exit: 0.87},
      {src: FRAME_SOURCES[2], enter: 0.825, exit: 0.915},
      {src: FRAME_SOURCES[3], enter: 0.87, exit: 0.96},
      {src: FRAME_SOURCES[4], enter: 0.915, exit: 1},
    ],
  };
}
