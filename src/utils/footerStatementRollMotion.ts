// Retained independently of the retired phrase-roll animation: scroll still
// moves the whole statement subtly through the existing pinned footer scene.
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
