import type {CSSProperties} from 'react';

const scenes = [
  '/media/scene-0.webp',
  '/media/scene-1.webp',
  '/media/scene-2.webp',
  '/media/scene-3.webp',
];

const peaks = [0, 0.24, 0.5, 0.82];
const fadeWindow = 0.24;

function sceneOpacity(index: number, progress: number): number {
  const peak = peaks[index];
  const dist = Math.abs(progress - peak);
  return Math.min(1, Math.max(0, 1 - dist / fadeWindow));
}

export function SceneCrossfade({progress}: {progress: number}) {
  return (
    <div className="scene-crossfade" aria-hidden="true">
      {scenes.map((src, i) => (
        <img
          key={src}
          className="scene-frame"
          src={src}
          alt=""
          loading="eager"
          decoding="async"
          style={{'--scene-opacity': sceneOpacity(i, progress)} as CSSProperties}
        />
      ))}
    </div>
  );
}
