export const TECHNOLOGY_EXIT_PROGRESS = 0.78;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getTechnologyStageProgress(rawProgress: number) {
  const stageProgress = clamp(rawProgress / TECHNOLOGY_EXIT_PROGRESS, 0, 1);
  const releaseProgress = clamp(
    (rawProgress - TECHNOLOGY_EXIT_PROGRESS) / (1 - TECHNOLOGY_EXIT_PROGRESS),
    0,
    1,
  );

  return {stageProgress, releaseProgress};
}
