const MIN_HANDOFF_OVERLAP = 72;
const MAX_HANDOFF_OVERLAP = 128;
const VIEWPORT_OVERLAP_RATIO = 0.13;

export function getFakeFooterHandoffOverlap(viewportHeight: number) {
  return Math.min(
    Math.max(viewportHeight * VIEWPORT_OVERLAP_RATIO, MIN_HANDOFF_OVERLAP),
    MAX_HANDOFF_OVERLAP,
  );
}
