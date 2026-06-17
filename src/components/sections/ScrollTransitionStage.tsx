import {useEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent as ReactPointerEvent} from 'react';
import type {Locale} from '../../i18n/useTranslation';
import {TECHNOLOGIES, TECHNOLOGIES_SECTION_COPY, type Technology} from '../../config/technologies';
import {useIsMobile} from '../../hooks/useIsMobile';
import {TypewriterText} from '../motion/TypewriterText';

type FloatingTechnologySpec = {
  id: string;
  size: number;
  left: number;
  top: number;
  revealDelay: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
  driftSpeed: number;
  driftOffset: number;
  jitterDuration: number;
  jitterDelay: number;
  depth: number;
  zIndex: number;
};

const DESKTOP_TECH_COUNT = 16;
const MOBILE_TECH_COUNT = 8;
const svgCache = new Map<string, string>();

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

function shuffleArray<T>(items: readonly T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[swapIndex]] = [nextItems[swapIndex], nextItems[index]];
  }

  return nextItems;
}

function sanitizeSvgMarkup(markup: string) {
  let nextMarkup = markup;

  if (!/preserveAspectRatio=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');
  }

  if (!/\swidth=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg width="100%" ');
  }

  if (!/\sheight=/.test(nextMarkup)) {
    nextMarkup = nextMarkup.replace('<svg ', '<svg height="100%" ');
  }

  return nextMarkup;
}

function isTooClose(candidateLeft: number, candidateTop: number, existing: Array<{left: number; top: number}>, minDistance: number) {
  return existing.some((item) => {
    const deltaX = candidateLeft - item.left;
    const deltaY = candidateTop - item.top;
    return Math.hypot(deltaX, deltaY) < minDistance;
  });
}

function isInsideCenterSafeZone(left: number, top: number, isMobile: boolean) {
  const safeRadiusX = isMobile ? 0.185 : 0.16;
  const safeRadiusY = isMobile ? 0.16 : 0.14;
  const normalizedX = (left - 0.5) / safeRadiusX;
  const normalizedY = (top - 0.5) / safeRadiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY < 1;
}

function isInsideHeadingSafeZone(left: number, top: number, isMobile: boolean) {
  const minX = isMobile ? 0.18 : 0.24;
  const maxX = isMobile ? 0.82 : 0.76;
  const minY = isMobile ? 0.08 : 0.06;
  const maxY = isMobile ? 0.42 : 0.38;
  return left >= minX && left <= maxX && top >= minY && top <= maxY;
}

function getSafeSpawnOrigin(targetX: number, targetY: number, rect: DOMRect, isMobile: boolean) {
  const minCenterDistance = Math.min(rect.width, rect.height) * (isMobile ? 0.28 : 0.24);
  const boundsPaddingX = rect.width * (isMobile ? 0.16 : 0.12);
  const boundsPaddingY = rect.height * (isMobile ? 0.14 : 0.1);
  const targetDistance = Math.hypot(targetX, targetY) || 1;
  const directionX = targetX / targetDistance;
  const directionY = targetY / targetDistance;
  const unclampedX = directionX * minCenterDistance;
  const unclampedY = directionY * minCenterDistance;

  return {
    x: clamp(unclampedX, -rect.width / 2 + boundsPaddingX, rect.width / 2 - boundsPaddingX),
    y: clamp(unclampedY, -rect.height / 2 + boundsPaddingY, rect.height / 2 - boundsPaddingY),
  };
}

function getFallbackSafePoints(isMobile: boolean) {
  return isMobile
    ? [
        {left: 0.18, top: 0.2},
        {left: 0.82, top: 0.2},
        {left: 0.16, top: 0.5},
        {left: 0.84, top: 0.5},
        {left: 0.22, top: 0.8},
        {left: 0.78, top: 0.8},
        {left: 0.32, top: 0.12},
        {left: 0.68, top: 0.12},
      ]
    : [
        {left: 0.14, top: 0.16},
        {left: 0.86, top: 0.16},
        {left: 0.1, top: 0.34},
        {left: 0.9, top: 0.34},
        {left: 0.08, top: 0.56},
        {left: 0.92, top: 0.56},
        {left: 0.16, top: 0.8},
        {left: 0.84, top: 0.8},
        {left: 0.28, top: 0.1},
        {left: 0.72, top: 0.1},
        {left: 0.22, top: 0.9},
        {left: 0.78, top: 0.9},
      ];
}

function createFloatingSpecs(items: Technology[], isMobile: boolean) {
  const orderedItems = shuffleArray(items);
  const placedPoints: Array<{left: number; top: number}> = [];
  const minDistance = isMobile ? 0.15 : 0.092;
  const bandCounts = {top: 0, middle: 0, bottom: 0};
  const bandLimits = isMobile ? {top: 3, middle: 3, bottom: 2} : {top: 5, middle: 6, bottom: 5};
  const fallbackSafePoints = getFallbackSafePoints(isMobile);

  return orderedItems.map((item, index) => {
    let left: number | null = null;
    let top: number | null = null;

    for (let attempt = 0; attempt < 240; attempt += 1) {
      const candidateLeft = randomBetween(isMobile ? 0.11 : 0.07, isMobile ? 0.89 : 0.93);
      const candidateTop = randomBetween(isMobile ? 0.1 : 0.07, isMobile ? 0.9 : 0.93);
      const band = candidateTop < 0.34 ? 'top' : candidateTop > 0.68 ? 'bottom' : 'middle';

      if (bandCounts[band] >= bandLimits[band]) continue;
      if (isInsideCenterSafeZone(candidateLeft, candidateTop, isMobile)) continue;
      if (isInsideHeadingSafeZone(candidateLeft, candidateTop, isMobile)) continue;
      if (isTooClose(candidateLeft, candidateTop, placedPoints, minDistance)) continue;

      left = candidateLeft;
      top = candidateTop;
      bandCounts[band] += 1;
      break;
    }

    if (left === null || top === null) {
      const fallbackPoint = fallbackSafePoints.find(
        (point) => !isInsideHeadingSafeZone(point.left, point.top, isMobile) && !isTooClose(point.left, point.top, placedPoints, minDistance * 0.9),
      );

      if (fallbackPoint) {
        left = fallbackPoint.left;
        top = fallbackPoint.top;
      } else {
        left = isMobile ? 0.12 + (index % 2) * 0.76 : 0.08 + (index % 2) * 0.84;
        top = isMobile ? 0.56 + ((Math.floor(index / 2) % 2) * 0.22) : 0.5 + ((Math.floor(index / 2) % 2) * 0.28);
      }
    }

    placedPoints.push({left, top});
    const centerDistance = Math.hypot(left - 0.5, top - 0.5);
    const depth = clamp(1 - centerDistance / (isMobile ? 0.52 : 0.58), 0.18, 1);

    return {
      id: item.id,
      size: Math.round(lerp(isMobile ? 40 : 48, isMobile ? 60 : 76, depth)),
      left,
      top,
      revealDelay: index * (isMobile ? 110 : 82),
      driftAmplitudeX: lerp(isMobile ? 12 : 18, isMobile ? 28 : 52, depth),
      driftAmplitudeY: lerp(isMobile ? 14 : 20, isMobile ? 32 : 56, depth),
      driftSpeed: lerp(0.00055, 0.0014, depth),
      driftOffset: randomBetween(0, Math.PI * 2),
      jitterDuration: Number(randomBetween(3.1, 4.8).toFixed(2)),
      jitterDelay: Number(randomBetween(-2.6, -0.15).toFixed(2)),
      depth,
      zIndex: Math.round(lerp(2, 8, depth)),
    };
  });
}

function InlineTechnologyIcon({
  src,
  label,
  className,
  style,
}: {
  src: string;
  label: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [markup, setMarkup] = useState<string | null>(() => svgCache.get(src) ?? null);

  useEffect(() => {
    let cancelled = false;

    if (svgCache.has(src)) {
      setMarkup(svgCache.get(src) ?? null);
      return;
    }

    fetch(src)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(`Failed to load ${src}`))))
      .then((text) => {
        if (cancelled) return;
        const sanitized = sanitizeSvgMarkup(text);
        svgCache.set(src, sanitized);
        setMarkup(sanitized);
      })
      .catch(() => {
        if (cancelled) return;
        setMarkup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return markup ? (
    <span aria-hidden="true" className={className} style={style} dangerouslySetInnerHTML={{__html: markup}} />
  ) : (
    <span aria-hidden="true" className={`${className ?? ''} technology-icon-fallback`} style={style}>
      {label.slice(0, 2)}
    </span>
  );
}

export function ScrollTransitionStage({
  locale,
  stageProgress,
  rawStageProgress,
  stageStyle,
}: {
  locale: Locale;
  stageProgress: number;
  rawStageProgress: number;
  stageStyle: CSSProperties;
}) {
  const isMobile = useIsMobile();
  void stageProgress;

  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredTechnologyId, setHoveredTechnologyId] = useState<string | null>(null);
  const [activeTechnologyId, setActiveTechnologyId] = useState<string | null>(null);
  const stageFieldRef = useRef<HTMLDivElement | null>(null);
  const cursorFieldRef = useRef<HTMLDivElement | null>(null);
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const introStartRef = useRef<number | null>(null);
  const outroStartRef = useRef<number | null>(null);
  const previousStageActiveRef = useRef(false);
  const mouseStateRef = useRef({x: 0, y: 0, inside: false});
  const smoothMouseRef = useRef({x: 0, y: 0});
  const OUTRO_DURATION = 680;

  const sectionCopy = TECHNOLOGIES_SECTION_COPY[locale];
  const visibleTechnologies = useMemo(
    () => TECHNOLOGIES.slice(0, isMobile ? MOBILE_TECH_COUNT : DESKTOP_TECH_COUNT),
    [isMobile],
  );
  const [floatingSpecs, setFloatingSpecs] = useState<FloatingTechnologySpec[]>(() => createFloatingSpecs(visibleTechnologies, isMobile));
  const activeTechnology = useMemo(
    () => visibleTechnologies.find((item) => item.id === activeTechnologyId) ?? null,
    [activeTechnologyId, visibleTechnologies],
  );

  const stageActive = rawStageProgress > 0.02 && rawStageProgress < 0.985;
  const stageExitProgress = clamp((rawStageProgress - 0.78) / 0.16, 0, 1);
  const stageLeaving = stageExitProgress > 0.001;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!activeTechnologyId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveTechnologyId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTechnologyId]);

  useEffect(() => {
    setFloatingSpecs(createFloatingSpecs(visibleTechnologies, isMobile));
  }, [isMobile, visibleTechnologies]);

  useEffect(() => {
    if (stageActive && !previousStageActiveRef.current) {
      introStartRef.current = null;
      outroStartRef.current = null;
      setHoveredTechnologyId(null);
      setFloatingSpecs(createFloatingSpecs(visibleTechnologies, isMobile));
    }

    if (!stageActive) {
      outroStartRef.current = performance.now();
      mouseStateRef.current.inside = false;
      setHoveredTechnologyId(null);
      if (cursorFieldRef.current) cursorFieldRef.current.style.opacity = '0';
    }

    previousStageActiveRef.current = stageActive;
  }, [isMobile, stageActive, visibleTechnologies]);

  useEffect(() => {
    if (!stageActive && outroStartRef.current === null) {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      const field = stageFieldRef.current;
      if (!field) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      if (introStartRef.current === null) introStartRef.current = time;
      const introElapsed = time - introStartRef.current;
      const rect = field.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      smoothMouseRef.current.x = lerp(smoothMouseRef.current.x, mouseStateRef.current.x, 0.08);
      smoothMouseRef.current.y = lerp(smoothMouseRef.current.y, mouseStateRef.current.y, 0.08);

      const mouseLocalX = smoothMouseRef.current.x - centerX;
      const mouseLocalY = smoothMouseRef.current.y - centerY;
      const pointerEnabled = mouseStateRef.current.inside && !isMobile;
      const motionFactor = reducedMotion ? 0.38 : 1;
      const parallaxX = pointerEnabled ? clamp((smoothMouseRef.current.x - centerX) / rect.width, -0.5, 0.5) * motionFactor : 0;
      const parallaxY = pointerEnabled ? clamp((smoothMouseRef.current.y - centerY) / rect.height, -0.5, 0.5) * motionFactor : 0;

      field.style.setProperty('--field-parallax-x', `${(parallaxX * 18).toFixed(2)}px`);
      field.style.setProperty('--field-parallax-y', `${(parallaxY * 18).toFixed(2)}px`);

      floatingSpecs.forEach((spec) => {
        const anchor = anchorRefs.current[spec.id];
        const button = buttonRefs.current[spec.id];
        if (!anchor || !button) return;

        const revealDuration = reducedMotion ? 420 : 980;
        const revealProgress = easeOutCubic(clamp((introElapsed - spec.revealDelay) / revealDuration, 0, 1));
        const driftProgress = clamp((introElapsed - spec.revealDelay - (reducedMotion ? 40 : 240)) / (reducedMotion ? 420 : 1200), 0, 1);
        const targetX = (spec.left - 0.5) * rect.width;
        const targetY = (spec.top - 0.5) * rect.height;
        const targetDistance = Math.hypot(targetX, targetY) || 1;
        const directionX = targetX / targetDistance;
        const directionY = targetY / targetDistance;
        const spawnOrigin = getSafeSpawnOrigin(targetX, targetY, rect, isMobile);
        const tangentX = -directionY;
        const tangentY = directionX;
        const waveX = Math.sin(time * spec.driftSpeed + spec.driftOffset) * spec.driftAmplitudeX * motionFactor;
        const waveY = Math.cos(time * (spec.driftSpeed * 0.82) + spec.driftOffset * 1.17) * spec.driftAmplitudeY * motionFactor;
        const microX = reducedMotion ? 0 : Math.sin(time * (spec.driftSpeed * 1.7) + spec.driftOffset * 2.4) * (spec.driftAmplitudeX * 0.22);
        const microY = reducedMotion ? 0 : Math.cos(time * (spec.driftSpeed * 1.42) + spec.driftOffset * 1.9) * (spec.driftAmplitudeY * 0.18);
        const ejectionPulse = Math.sin(revealProgress * Math.PI) * lerp(reducedMotion ? 9 : 16, reducedMotion ? 24 : 42, spec.depth);
        const swirlDrift = reducedMotion ? 0 : Math.sin(time * (spec.driftSpeed * 1.08) + spec.driftOffset * 1.6) * lerp(4, 13, spec.depth) * driftProgress;
        const driftX = (waveX + microX) * driftProgress + parallaxX * spec.depth * 16 + directionX * ejectionPulse + tangentX * swirlDrift;
        const driftY = (waveY + microY) * driftProgress + parallaxY * spec.depth * 16 + directionY * ejectionPulse + tangentY * swirlDrift;
        const baseX = lerp(spawnOrigin.x, targetX, revealProgress) + driftX;
        const baseY = lerp(spawnOrigin.y, targetY, revealProgress) + driftY;

        let forceX = 0;
        let forceY = 0;
        let influence = 0;

        if (pointerEnabled) {
          const deltaX = baseX - mouseLocalX;
          const deltaY = baseY - mouseLocalY;
          const distance = Math.hypot(deltaX, deltaY) || 1;
          const influenceRadius = lerp(100, 160, spec.depth);
          influence = clamp(1 - distance / influenceRadius, 0, 1);
          const force = influence * influence;
          const repulsion = force * lerp(52, 96, spec.depth) * motionFactor;
          forceX = (deltaX / distance) * repulsion;
          forceY = (deltaY / distance) * repulsion;
        }

        const depthScale = lerp(0.9, 1.18, spec.depth);
        const finalX = baseX + forceX;
        const finalY = baseY + forceY;
        const opacity = clamp(lerp(0.68, 1, spec.depth) * revealProgress, 0, 1);
        const scale = lerp(0.5, depthScale, revealProgress) + influence * (reducedMotion ? 0.03 : 0.075);
        const rotation = (Math.sin(time * (spec.driftSpeed * 0.9) + spec.driftOffset) * lerp(1.6, 4.8, spec.depth) + forceX * 0.065) * motionFactor;
        const brightness = lerp(1, 1.14, spec.depth) + influence * (reducedMotion ? 0.05 : 0.12);
        const shadowOpacity = lerp(0.08, 0.18, spec.depth) + influence * 0.16;
        const shadowBlur = lerp(12, 22, spec.depth) + influence * (reducedMotion ? 10 : 18);
        const blur = (1 - revealProgress) * 3.4;

        let outroProgress = 0;
        if (outroStartRef.current !== null) {
          outroProgress = clamp((time - outroStartRef.current) / OUTRO_DURATION, 0, 1);
        }
        const easeIn = outroProgress * outroProgress * outroProgress;
        const displayX = lerp(finalX, 0, easeIn);
        const displayY = lerp(finalY, 0, easeIn);
        const displayOpacity = opacity * (1 - easeIn);

        anchor.style.opacity = displayOpacity.toFixed(3);
        anchor.style.transform = `translate(-50%, -50%) translate3d(${displayX.toFixed(2)}px, ${displayY.toFixed(2)}px, 0)`;
        button.style.transform = `translate3d(0, 0, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        button.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px) drop-shadow(0 0 ${shadowBlur.toFixed(2)}px rgba(255,255,255,${shadowOpacity.toFixed(3)}))`;
      });

      const cursorField = cursorFieldRef.current;
      if (cursorField) {
        if (pointerEnabled) {
          cursorField.style.opacity = '1';
          cursorField.style.transform = `translate3d(${(smoothMouseRef.current.x - rect.left).toFixed(2)}px, ${(smoothMouseRef.current.y - rect.top).toFixed(2)}px, 0) translate(-50%, -50%) scale(1)`;
        } else {
          cursorField.style.opacity = '0';
        }
      }

      if (!stageActive && outroStartRef.current !== null) {
        const outroProgress = clamp((time - outroStartRef.current) / OUTRO_DURATION, 0, 1);
        if (outroProgress >= 1) {
          outroStartRef.current = null;
          if (animationFrameRef.current) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [floatingSpecs, isMobile, reducedMotion, stageActive]);

  const updatePointerState = (clientX: number, clientY: number) => {
    mouseStateRef.current.x = clientX;
    mouseStateRef.current.y = clientY;
    mouseStateRef.current.inside = true;
  };

  const handleStagePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!stageActive) return;
    updatePointerState(event.clientX, event.clientY);
  };

  const handleStagePointerLeave = () => {
    mouseStateRef.current.inside = false;
    setHoveredTechnologyId(null);
    if (cursorFieldRef.current) cursorFieldRef.current.style.opacity = '0';
  };

  return (
    <section
      className={`transition-stage technologies-stage${stageActive ? ' is-active' : ''}${stageLeaving ? ' is-leaving' : ''}${reducedMotion ? ' reduce-motion' : ''}${hoveredTechnologyId || activeTechnologyId ? ' has-active-technology' : ''}${activeTechnology ? ' has-open-technology-card' : ''}`}
      style={{
        ...stageStyle,
        '--stage2-exit-progress': stageExitProgress,
      } as CSSProperties}
      onPointerMove={handleStagePointerMove}
      onPointerLeave={handleStagePointerLeave}
    >
      <div className="sticky-stage technologies-sticky-stage">
        <div className="transition-backdrop technologies-backdrop" aria-hidden="true">
          <div className="technologies-backdrop-grid" />
          <div className="technologies-backdrop-radial" />
          <div className="technologies-backdrop-orbits">
            <span className="technologies-orbit-line orbit-line-1" />
            <span className="technologies-orbit-line orbit-line-2" />
            <span className="technologies-orbit-line orbit-line-3" />
          </div>
          <div className="technologies-backdrop-particles" />
          <div className="technologies-backdrop-noise" />
        </div>

        <div className="transition-stage-media technologies-stage-media" aria-hidden="true">
          <div className="transition-media technologies-media">
            <div ref={stageFieldRef} className="technologies-float-field">
              <div ref={cursorFieldRef} className="technologies-cursor-field" />
              {floatingSpecs.map((spec) => {
                const technology = visibleTechnologies.find((item) => item.id === spec.id);
                if (!technology) return null;

                const isHovered = hoveredTechnologyId === technology.id;
                const isActive = activeTechnologyId === technology.id;

                return (
                  <div
                    key={spec.id}
                    ref={(node) => {
                      anchorRefs.current[spec.id] = node;
                    }}
                    className={`technology-float-anchor${isHovered ? ' is-hovered' : ''}${isActive ? ' is-active' : ''}`}
                    style={{
                      left: '50%',
                      top: '50%',
                      zIndex: isActive ? 26 : isHovered ? 22 : spec.zIndex,
                      opacity: 0,
                    } as CSSProperties}
                  >
                    <button
                      ref={(node) => {
                        buttonRefs.current[spec.id] = node;
                      }}
                      type="button"
                      className="technology-float-button"
                      aria-label={technology.label}
                      aria-expanded={isActive}
                      onPointerEnter={() => setHoveredTechnologyId(technology.id)}
                      onPointerLeave={() => setHoveredTechnologyId((current) => (current === technology.id ? null : current))}
                      onClick={() => setActiveTechnologyId(technology.id)}
                      style={{
                        width: `${spec.size}px`,
                        height: `${spec.size}px`,
                        '--icon-jitter-duration': `${spec.jitterDuration}s`,
                        '--icon-jitter-delay': `${spec.jitterDelay}s`,
                      } as CSSProperties}
                    >
                      <InlineTechnologyIcon
                        className="technology-inline-icon"
                        src={technology.icon}
                        label={technology.label}
                        style={{
                          '--icon-scale': technology.iconScale ?? 1,
                          '--icon-offset-x': `${technology.iconOffsetX ?? 0}px`,
                          '--icon-offset-y': `${technology.iconOffsetY ?? 0}px`,
                        } as CSSProperties}
                      />
                      <span className={`technology-hover-card${isHovered && !activeTechnology ? ' is-visible' : ''}`} role="tooltip">
                        <strong>{technology.label}</strong>
                        <span>{technology.tooltip[locale]}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="transition-overlay technologies-overlay" />
          </div>
        </div>

        <div className="transition-copy technologies-copy">
          <div className="technologies-copy-inner">
            <div className="technologies-title-glow" aria-hidden="true" />
            <div className="technologies-heading-stack">
              <TypewriterText
                as="h2"
                phrases={sectionCopy.titlePhrases}
                active={stageActive}
                paused={stageLeaving}
                className="technologies-title"
                typingSpeedMs={30}
                deletingSpeedMs={20}
                holdDurationMs={3100}
                initialDelayMs={240}
              />
              <p className="technologies-subtitle">{sectionCopy.subtitle}</p>
            </div>
            <p className="technologies-instruction">{sectionCopy.instruction}</p>
          </div>
        </div>
      </div>

      {activeTechnology ? (
        <div className="technology-modal-backdrop" role="presentation" onClick={() => setActiveTechnologyId(null)}>
          <div
            className="technology-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`technology-modal-title-${activeTechnology.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="technology-modal-close" aria-label="Fechar" onClick={() => setActiveTechnologyId(null)}>
              ×
            </button>
            <div className="technology-modal-icon-wrap" aria-hidden="true">
              <InlineTechnologyIcon
                className="technology-modal-icon"
                src={activeTechnology.icon}
                label={activeTechnology.label}
                style={{
                  '--icon-scale': activeTechnology.iconScale ?? 1,
                  '--icon-offset-x': `${activeTechnology.iconOffsetX ?? 0}px`,
                  '--icon-offset-y': `${activeTechnology.iconOffsetY ?? 0}px`,
                } as CSSProperties}
              />
            </div>
            <h3 id={`technology-modal-title-${activeTechnology.id}`}>{activeTechnology.label}</h3>
            <p>{activeTechnology.description[locale]}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
