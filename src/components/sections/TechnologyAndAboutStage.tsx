import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import type {Locale} from '../../i18n/useTranslation';
import {TECHNOLOGIES, TECHNOLOGIES_SECTION_COPY, type Technology} from '../../config/technologies';
import {useIsMobile} from '../../hooks/useIsMobile';
import {AboutCardsStage} from './AboutCardsStage';

gsap.registerPlugin(ScrollTrigger, SplitText);

type FloatingTechnologySpec = {
  id: string;
  size: number;
  left: number;
  top: number;
  revealOrder: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
  driftSpeed: number;
  driftOffset: number;
  depth: number;
  zIndex: number;
};

const DESKTOP_TECH_COUNT = 16;
const MOBILE_TECH_COUNT = 12;
const SCENE_TWO_IMAGE = '/media/scene-1.webp';
const MOBILE_FLOAT_POINTS = [
  {left: 0.16, top: 0.18},
  {left: 0.84, top: 0.18},
  {left: 0.1, top: 0.34},
  {left: 0.9, top: 0.34},
  {left: 0.14, top: 0.58},
  {left: 0.86, top: 0.58},
  {left: 0.22, top: 0.78},
  {left: 0.78, top: 0.78},
  {left: 0.36, top: 0.12},
  {left: 0.64, top: 0.12},
  {left: 0.3, top: 0.88},
  {left: 0.7, top: 0.88},
] as const;
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
  const safeRadiusX = isMobile ? 0.22 : 0.16;
  const safeRadiusY = isMobile ? 0.2 : 0.14;
  const normalizedX = (left - 0.5) / safeRadiusX;
  const normalizedY = (top - 0.5) / safeRadiusY;
  return normalizedX * normalizedX + normalizedY * normalizedY < 1;
}

function isInsideHeadingSafeZone(left: number, top: number, isMobile: boolean) {
  const minX = isMobile ? 0.2 : 0.24;
  const maxX = isMobile ? 0.8 : 0.76;
  const minY = isMobile ? 0.08 : 0.06;
  const maxY = isMobile ? 0.56 : 0.38;
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
  const minDistance = isMobile ? 0.13 : 0.092;
  const bandCounts = {top: 0, middle: 0, bottom: 0};
  const bandLimits = isMobile ? {top: 3, middle: 3, bottom: 2} : {top: 5, middle: 6, bottom: 5};
  const fallbackSafePoints = getFallbackSafePoints(isMobile);

  return orderedItems.map((item, index) => {
    let left: number | null = null;
    let top: number | null = null;

    if (isMobile) {
      const mobilePoint = MOBILE_FLOAT_POINTS[index % MOBILE_FLOAT_POINTS.length];
      left = mobilePoint.left;
      top = mobilePoint.top;
    }

    for (let attempt = 0; left === null && top === null && attempt < 240; attempt += 1) {
      const candidateLeft = randomBetween(0.07, 0.93);
      const candidateTop = randomBetween(0.07, 0.93);
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
      size: Math.round(lerp(isMobile ? 30 : 48, isMobile ? 46 : 76, depth)),
      left,
      top,
      revealOrder: orderedItems.length <= 1 ? 0 : index / (orderedItems.length - 1),
      driftAmplitudeX: lerp(isMobile ? 8 : 18, isMobile ? 20 : 52, depth),
      driftAmplitudeY: lerp(isMobile ? 10 : 20, isMobile ? 24 : 56, depth),
      driftSpeed: lerp(0.00055, 0.0014, depth),
      driftOffset: randomBetween(0, Math.PI * 2),
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

export function TechnologyAndAboutStage({
  locale,
  rawStageProgress,
  stageStyle,
}: {
  locale: Locale;
  rawStageProgress: number;
  stageStyle: CSSProperties;
}) {
  const isMobile = useIsMobile();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [aboutStageInteractive, setAboutStageInteractive] = useState(false);
  const [hoveredTechnologyId, setHoveredTechnologyId] = useState<string | null>(null);
  const [activeTechnologyId, setActiveTechnologyId] = useState<string | null>(null);
  const stageSectionRef = useRef<HTMLElement | null>(null);
  const pinnedShellRef = useRef<HTMLDivElement | null>(null);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const stageBackdropRef = useRef<HTMLDivElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleGlowRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const instructionRef = useRef<HTMLParagraphElement | null>(null);
  const stageOneLayerRef = useRef<HTMLDivElement | null>(null);
  const stageTwoLayerRef = useRef<HTMLDivElement | null>(null);
  const stageFieldRef = useRef<HTMLDivElement | null>(null);
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const introStartRef = useRef<number | null>(null);
  const outroStartRef = useRef<number | null>(null);
  const previousStageActiveRef = useRef(false);
  const hoveredTechnologyIdRef = useRef<string | null>(null);
  const activeTechnologyIdRef = useRef<string | null>(null);
  const rawStageProgressRef = useRef(rawStageProgress);
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

  useLayoutEffect(() => {
    const section = stageSectionRef.current;
    const pinnedShell = pinnedShellRef.current;
    const sceneBackground = sceneBackgroundRef.current;
    const stageBackdrop = stageBackdropRef.current;
    const titleText = titleTextRef.current;
    const titleGlow = titleGlowRef.current;
    const subtitle = subtitleRef.current;
    const instruction = instructionRef.current;
    const stageOneLayer = stageOneLayerRef.current;
    const stageTwoLayer = stageTwoLayerRef.current;

    if (
      !section ||
      !pinnedShell ||
      !sceneBackground ||
      !stageBackdrop ||
      !titleText ||
      !titleGlow ||
      !subtitle ||
      !instruction ||
      !stageOneLayer ||
      !stageTwoLayer
    ) return;

    let isAboutInteractive = false;
    let splitTitle: ReturnType<typeof SplitText.create> | null = null;

    const ctx = gsap.context(() => {
      splitTitle = SplitText.create(titleText, {type: 'chars', charsClass: 'technology-title-char'});

      gsap.set(sceneBackground, {
        autoAlpha: 0,
        scale: reducedMotion ? 1 : isMobile ? 1.2 : 1.45,
        yPercent: 0,
        filter: reducedMotion ? 'none' : 'blur(2px) brightness(0.72)',
        transformOrigin: 'center center',
        willChange: 'transform, opacity',
      });

      gsap.set(stageBackdrop, {
        autoAlpha: 0,
        scale: reducedMotion ? 1 : 0.96,
        willChange: 'transform, opacity',
      });

      gsap.set(titleGlow, {autoAlpha: 0, scale: reducedMotion ? 1 : 0.66});
      gsap.set(splitTitle.chars, {
        autoAlpha: 0,
        yPercent: reducedMotion ? 0 : 105,
        rotationX: reducedMotion ? 0 : -72,
        scale: reducedMotion ? 1 : 0.88,
        filter: reducedMotion ? 'none' : 'blur(9px)',
        transformOrigin: '50% 100%',
      });
      gsap.set([subtitle, instruction], {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 24,
        filter: reducedMotion ? 'none' : 'blur(7px)',
      });

      gsap.set(stageOneLayer, {
        autoAlpha: 1,
        y: 0,
        willChange: 'transform, opacity',
      });

      gsap.set(stageTwoLayer, {
        autoAlpha: 0,
        y: reducedMotion ? 16 : 88,
        willChange: 'transform, opacity',
      });

      gsap.timeline({
        defaults: {ease: 'none'},
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (reducedMotion ? 5.5 : 7.2))}`,
          scrub: reducedMotion ? 0.18 : 0.72,
          pin: pinnedShell,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const nextInteractive = self.progress >= 0.94;
            if (nextInteractive !== isAboutInteractive) {
              isAboutInteractive = nextInteractive;
              setAboutStageInteractive(nextInteractive);
            }
          },
          onLeaveBack: () => {
            isAboutInteractive = false;
            setAboutStageInteractive(false);
          },
        },
      })
        .to(
          sceneBackground,
          {
            autoAlpha: 1,
            scale: 1,
            yPercent: 0,
            filter: 'blur(0px) brightness(1)',
            duration: reducedMotion ? 0.06 : 0.08,
          },
          0,
        )
        .to(
          stageBackdrop,
          {autoAlpha: 1, scale: 1, duration: reducedMotion ? 0.1 : 0.2},
          reducedMotion ? 0.02 : 0.07,
        )
        .to(
          titleGlow,
          {autoAlpha: 0.72, scale: 1, duration: reducedMotion ? 0.08 : 0.2},
          reducedMotion ? 0.04 : 0.12,
        )
        .to(
          splitTitle.chars,
          {
            autoAlpha: 1,
            yPercent: 0,
            rotationX: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.08 : 0.18,
            stagger: reducedMotion ? 0 : 0.01,
          },
          reducedMotion ? 0.06 : 0.12,
        )
        .to(
          subtitle,
          {autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: reducedMotion ? 0.08 : 0.16},
          reducedMotion ? 0.1 : 0.27,
        )
        .to(
          instruction,
          {autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: reducedMotion ? 0.08 : 0.16},
          reducedMotion ? 0.14 : 0.34,
        )
        .to(
          sceneBackground,
          {
            scale: reducedMotion ? 1.006 : 1.028,
            yPercent: reducedMotion ? -0.4 : -1.8,
            duration: 0.6,
          },
          0.2,
        )
        .to(
          stageOneLayer,
          {
            autoAlpha: 0,
            y: reducedMotion ? -12 : -60,
            duration: 0.14,
          },
          0.78,
        )
        .to(
          stageTwoLayer,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.1,
          },
          0.9,
        );
    }, stageSectionRef);

    return () => {
      setAboutStageInteractive(false);
      ctx.revert();
      splitTitle?.revert();
    };
  }, [isMobile, locale, reducedMotion]);

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
    hoveredTechnologyIdRef.current = hoveredTechnologyId;
  }, [hoveredTechnologyId]);

  useEffect(() => {
    activeTechnologyIdRef.current = activeTechnologyId;
  }, [activeTechnologyId]);

  useEffect(() => {
    rawStageProgressRef.current = rawStageProgress;
  }, [rawStageProgress]);

  useEffect(() => {
    if (stageActive && !previousStageActiveRef.current) {
      introStartRef.current = null;
      outroStartRef.current = null;
      setHoveredTechnologyId(null);
    }

    if (!stageActive) {
      outroStartRef.current = performance.now();
      setHoveredTechnologyId(null);
    }

    previousStageActiveRef.current = stageActive;
  }, [stageActive]);

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
      const driftTime = time - introStartRef.current;
      const rect = field.getBoundingClientRect();
      const motionFactor = reducedMotion ? 0.38 : 1;
      const scrollProgress = rawStageProgressRef.current;
      const iconIntroProgress = clamp((scrollProgress - 0.045) / 0.5, 0, 1);
      const iconExitProgress = clamp((scrollProgress - 0.74) / 0.22, 0, 1);
      const scrollExitEase = iconExitProgress * iconExitProgress * iconExitProgress;

      floatingSpecs.forEach((spec) => {
        const anchor = anchorRefs.current[spec.id];
        const button = buttonRefs.current[spec.id];
        if (!anchor || !button) return;

        const isHovered = hoveredTechnologyIdRef.current === spec.id;
        const isActive = activeTechnologyIdRef.current === spec.id;
        const interactionStrength = isActive ? 1 : isHovered ? 0.72 : 0;
        const driftDamping = interactionStrength ? 0.28 : 1;
        const revealOffset = spec.revealOrder * (isMobile ? 0.16 : 0.42);
        const revealWindow = isMobile ? 0.42 : 0.28;
        const revealProgress = easeOutCubic(clamp((iconIntroProgress - revealOffset) / revealWindow, 0, 1));
        const driftProgress = easeOutCubic(clamp((iconIntroProgress - revealOffset + (isMobile ? 0.06 : 0.08)) / (isMobile ? 0.36 : 0.42), 0, 1));
        const targetX = (spec.left - 0.5) * rect.width;
        const targetY = (spec.top - 0.5) * rect.height;
        const targetDistance = Math.hypot(targetX, targetY) || 1;
        const directionX = targetX / targetDistance;
        const directionY = targetY / targetDistance;
        const spawnOrigin = getSafeSpawnOrigin(targetX, targetY, rect, isMobile);
        const tangentX = -directionY;
        const tangentY = directionX;
        const waveX = Math.sin(driftTime * spec.driftSpeed + spec.driftOffset) * spec.driftAmplitudeX * motionFactor * driftDamping;
        const waveY = Math.cos(driftTime * (spec.driftSpeed * 0.82) + spec.driftOffset * 1.17) * spec.driftAmplitudeY * motionFactor * driftDamping;
        const microX = reducedMotion ? 0 : Math.sin(driftTime * (spec.driftSpeed * 1.7) + spec.driftOffset * 2.4) * (spec.driftAmplitudeX * 0.14) * driftDamping;
        const microY = reducedMotion ? 0 : Math.cos(driftTime * (spec.driftSpeed * 1.42) + spec.driftOffset * 1.9) * (spec.driftAmplitudeY * 0.12) * driftDamping;
        const ejectionPulse = Math.sin(revealProgress * Math.PI) * lerp(reducedMotion ? 9 : 16, reducedMotion ? 24 : 42, spec.depth);
        const swirlDrift = reducedMotion ? 0 : Math.sin(driftTime * (spec.driftSpeed * 1.08) + spec.driftOffset * 1.6) * lerp(3, 9, spec.depth) * driftProgress * driftDamping;
        const driftX = (waveX + microX) * driftProgress + directionX * ejectionPulse + tangentX * swirlDrift;
        const driftY = (waveY + microY) * driftProgress + directionY * ejectionPulse + tangentY * swirlDrift;
        const baseX = lerp(spawnOrigin.x, targetX, revealProgress) + driftX;
        const baseY = lerp(spawnOrigin.y, targetY, revealProgress) + driftY;

        const depthScale = lerp(0.9, 1.18, spec.depth);
        const finalX = baseX;
        const finalY = baseY;
        const opacity = clamp(lerp(0.68, 1, spec.depth) * revealProgress, 0, 1);
        const scale = lerp(0.5, depthScale, revealProgress) + interactionStrength * (reducedMotion ? 0.025 : 0.07);
        const rotation = Math.sin(time * (spec.driftSpeed * 0.74) + spec.driftOffset) * lerp(0.7, 2.4, spec.depth) * motionFactor * driftDamping;
        const brightness = lerp(1, 1.12, spec.depth) + interactionStrength * (reducedMotion ? 0.04 : 0.1);
        const shadowOpacity = lerp(0.08, 0.18, spec.depth) + interactionStrength * 0.14;
        const shadowBlur = lerp(12, 22, spec.depth) + interactionStrength * (reducedMotion ? 8 : 16);
        const blur = (1 - revealProgress) * 3.4;

        let outroProgress = scrollExitEase;
        if (outroStartRef.current !== null) {
          outroProgress = Math.max(outroProgress, clamp((time - outroStartRef.current) / OUTRO_DURATION, 0, 1));
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

  const handleStagePointerLeave = () => {
    setHoveredTechnologyId(null);
  };

  return (
    <section
      ref={stageSectionRef}
      className={`transition-stage technologies-stage${stageActive ? ' is-active' : ''}${stageLeaving ? ' is-leaving' : ''}${reducedMotion ? ' reduce-motion' : ''}${hoveredTechnologyId || activeTechnologyId ? ' has-active-technology' : ''}${activeTechnology ? ' has-open-technology-card' : ''}`}
      style={{
        ...stageStyle,
        '--stage2-exit-progress': stageExitProgress,
      } as CSSProperties}
      onPointerLeave={handleStagePointerLeave}
    >
      <div ref={pinnedShellRef} className="technologies-pin-shell">
        <div ref={sceneBackgroundRef} className="transition-scene-background" aria-hidden="true">
          <img className="technology-scene-image" src={SCENE_TWO_IMAGE} alt="" />
        </div>

        <div ref={stageBackdropRef} className="transition-backdrop technologies-backdrop" aria-hidden="true">
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

        <div ref={stageOneLayerRef} className="technologies-stage-one-layer">
          <div className="sticky-stage technologies-sticky-stage">
            <div className="transition-stage-media technologies-stage-media" aria-hidden="true">
              <div className="transition-media technologies-media">
                <div ref={stageFieldRef} className="technologies-float-field">
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
                <div ref={titleGlowRef} className="technologies-title-glow" aria-hidden="true" />
                <div className="technologies-heading-stack">
                  <h2 className="technologies-title" aria-live="polite">
                    <span
                      ref={titleTextRef}
                      key={locale}
                      className="hero-statement-line hero-statement-real"
                    >
                      {sectionCopy.titlePhrases[0]}
                    </span>
                  </h2>
                  <p ref={subtitleRef} className="technologies-subtitle">{sectionCopy.subtitle}</p>
                </div>
                <p ref={instructionRef} className="technologies-instruction">{sectionCopy.instruction}</p>
              </div>
            </div>
          </div>
        </div>

        <div ref={stageTwoLayerRef} className={`about-stage-two-layer${aboutStageInteractive ? ' is-interactive' : ''}`}>
          <div className="about-stage-two-viewport">
            <AboutCardsStage reducedMotion={reducedMotion} isActive={aboutStageInteractive} />
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
