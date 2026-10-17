type PointerDepthInput = {x: number; y: number; width: number; height: number; strength: number};

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

export function getPointerDepthTarget({x, y, width, height, strength}: PointerDepthInput) {
  const amount = clamp01(strength);
  if (!amount || width <= 0 || height <= 0) return {x: 0, y: 0, scale: 1};
  const nx = clamp01(x / width) * 2 - 1;
  const ny = clamp01(y / height) * 2 - 1;
  return {
    x: nx === 0 ? 0 : -nx * Math.min(width * 0.015, 18) * amount,
    y: ny === 0 ? 0 : -ny * Math.min(height * 0.015, 12) * amount,
    scale: 1 + (0.04 + Math.max(Math.abs(nx), Math.abs(ny)) * 0.012) * amount,
  };
}

export function getPointerDepthStrength(scene: 'hero' | 'technology', progress: number, ready: boolean) {
  if (!ready || !Number.isFinite(progress)) return 0;
  if (scene === 'technology' && progress < 0.1) return 0;
  const fadeStart = scene === 'hero' ? 0.45 : 0.65;
  const fadeEnd = scene === 'hero' ? 0.6 : 0.74;
  const t = clamp01((progress - fadeStart) / (fadeEnd - fadeStart));
  return 1 - t * t * (3 - 2 * t);
}
