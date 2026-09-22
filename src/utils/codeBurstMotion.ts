export const CODE_FRAGMENTS = [
  'const timeline = gsap.timeline()',
  'type MotionProfile = { fps: 60 }',
  'useLayoutEffect(() => {})',
  'if (prefersReducedMotion) return',
  'transform: translate3d(0, 0, 0)',
  'aria-live="polite"',
  'await deploy({ preview: true })',
  'export default function Scene()',
  'ScrollTrigger.refresh()',
  'const viewport = getStableViewportHeight()',
  'interface Experience { fluid: true }',
  'requestAnimationFrame(render)',
  'const state = useMemo(() => ({}), [])',
  'return <MotionLayer />',
] as const;

export type CodeBurstMotion = {
  count: number;
  maxActive: number;
  minDistance: number;
  maxDistance: number;
  minDuration: number;
  maxDuration: number;
  force3D: true;
};

export function getCodeBurstMotion({
  isMobile,
  prefersReducedMotion,
}: {
  isMobile: boolean;
  prefersReducedMotion: boolean;
}): CodeBurstMotion {
  if (prefersReducedMotion) {
    return {
      count: 0,
      maxActive: 0,
      minDistance: 0,
      maxDistance: 0,
      minDuration: 0,
      maxDuration: 0,
      force3D: true,
    };
  }

  return isMobile
    ? {
        count: 5,
        maxActive: 20,
        minDistance: 38,
        maxDistance: 68,
        minDuration: 0.62,
        maxDuration: 0.92,
        force3D: true,
      }
    : {
        count: 7,
        maxActive: 28,
        minDistance: 52,
        maxDistance: 92,
        minDuration: 0.72,
        maxDuration: 1.08,
        force3D: true,
      };
}

export function shouldCreateCodeBurst({
  isBurstSurface,
  isInteractiveTarget,
  pointerType,
  movement,
  prefersReducedMotion,
}: {
  isBurstSurface: boolean;
  isInteractiveTarget: boolean;
  pointerType: string;
  movement: number;
  prefersReducedMotion: boolean;
}) {
  if (prefersReducedMotion || !isBurstSurface || isInteractiveTarget) return false;
  if (pointerType !== 'mouse' && pointerType !== 'touch' && pointerType !== 'pen') return false;
  return movement < 12;
}
