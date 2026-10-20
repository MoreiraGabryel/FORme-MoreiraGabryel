import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {requestSceneRefresh} from '../../utils/sceneRefresh';
import {SplitText} from 'gsap/SplitText';
import type {Locale} from '../../i18n/useTranslation';
import {TECHNOLOGIES, TECHNOLOGIES_SECTION_COPY, TECHNOLOGY_UI_COPY, type Technology} from '../../config/technologies';
import {TECHNOLOGY_SCENE, TECHNOLOGY_SCENE_REDUCED_MOTION} from '../../config/scenes';
import {useIsMobile} from '../../hooks/useIsMobile';
import {usePointerDepth} from '../../hooks/usePointerDepth';
import {getPointerDepthStrength} from '../../utils/pointerDepthMotion';
import {getStableViewportHeight} from '../../utils/stableViewport';
import {getTechnologyFrameSequence} from '../../utils/technologyFrameSequence';
import {TECHNOLOGY_EXIT_PROGRESS} from '../../utils/technologyStageProgress';
import {getTechnologyPages, getTechnologyFloatPoints} from '../../utils/technologyStackLayout';
import {TechnologyIcon} from '../technology/TechnologyIcon';
import {TechnologyDialog} from '../technology/TechnologyDialog';
import {TechnologyHoverCard} from '../technology/TechnologyHoverCard';
import './TechnologyAndAboutStage.mobile.css';

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
  iconScale: number;
  iconOffsetX: number;
  iconOffsetY: number;
};

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

function getSafeSpawnOrigin(targetX: number, targetY: number, rect: {width: number; height: number}, isMobile: boolean) {
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

function createFloatingSpecs(items: Technology[], isMobile: boolean): FloatingTechnologySpec[] {
  const orderedItems = shuffleArray(items);
  const points = getTechnologyFloatPoints(items.length, isMobile);

  return orderedItems.map((item, index) => {
    const {left, top} = points[index];
    const centerDistance = Math.hypot(left - 0.5, top - 0.5);
    const depth = clamp(1 - centerDistance / (isMobile ? 0.52 : 0.58), 0.18, 1);

    return {
      id: item.id,
      size: Math.round(lerp(isMobile ? 44 : 48, isMobile ? 48 : 66, depth)),
      left,
      top,
      revealOrder: orderedItems.length <= 1 ? 0 : index / (orderedItems.length - 1),
      driftAmplitudeX: lerp(isMobile ? 8 : 3, isMobile ? 22 : 12, depth),
      driftAmplitudeY: lerp(isMobile ? 6 : 4, isMobile ? 16 : 13, depth),
      driftSpeed: lerp(0.00055, 0.0014, depth),
      driftOffset: randomBetween(0, Math.PI * 2),
      depth,
      zIndex: Math.round(lerp(2, 8, depth)),
      iconScale: item.iconScale ?? 1,
      iconOffsetX: item.iconOffsetX ?? 0,
      iconOffsetY: item.iconOffsetY ?? 0,
    };
  });
}

const TECHNOLOGY_EXIT_DURATION = 1 - TECHNOLOGY_EXIT_PROGRESS;

export function TechnologyAndAboutStage({
  locale,
  rawStageProgress,
  stageStyle,
  onProgress,
}: {
  locale: Locale;
  rawStageProgress: number;
  stageStyle: CSSProperties;
  onProgress: (progress: number) => void;
}) {
  const isMobile = useIsMobile();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [hoveredTechnologyId, setHoveredTechnologyId] = useState<string | null>(null);
  const [tooltipTechnologyIds, setTooltipTechnologyIds] = useState<string[]>([]);
  const [activeTechnologyId, setActiveTechnologyId] = useState<string | null>(null);
  const [mobilePageIndex, setMobilePageIndex] = useState(0);
  const mobilePageRevealedRef = useRef(false);
  const stageSectionRef = useRef<HTMLElement | null>(null);
  const pinnedShellRef = useRef<HTMLDivElement | null>(null);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const depthPlaneRef = useRef<HTMLDivElement | null>(null);
  const frameLayerRefs = useRef<HTMLImageElement[]>([]);
  const stageBackdropRef = useRef<HTMLDivElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleGlowRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const instructionRef = useRef<HTMLParagraphElement | null>(null);
  const stageOneLayerRef = useRef<HTMLDivElement | null>(null);

  const stageFieldRef = useRef<HTMLDivElement | null>(null);
  const copyInnerRef = useRef<HTMLDivElement | null>(null);
  const paginationRef = useRef<HTMLElement | null>(null);
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const introStartRef = useRef<number | null>(null);
  const outroStartRef = useRef<number | null>(null);
  const previousStageActiveRef = useRef(false);

  const hoveredTechnologyIdRef = useRef<string | null>(null);
  const activeTechnologyIdRef = useRef<string | null>(null);
  const rawStageProgressRef = useRef(rawStageProgress);
  const onProgressRef = useRef(onProgress);
  const OUTRO_DURATION = 680;
  usePointerDepth(pinnedShellRef, depthPlaneRef, getPointerDepthStrength('technology', rawStageProgress, !activeTechnologyId));

  const sectionCopy = TECHNOLOGIES_SECTION_COPY[locale];
  const frameSequence = useMemo(() => getTechnologyFrameSequence(reducedMotion), [reducedMotion]);
  const uiCopy = TECHNOLOGY_UI_COPY[locale];
  const technologyPages = useMemo(() => getTechnologyPages(TECHNOLOGIES, isMobile), [isMobile]);
  const currentPageIndex = Math.min(mobilePageIndex, technologyPages.length - 1);
  const visibleTechnologies = technologyPages[currentPageIndex];
  const floatingSpecs = useMemo(() => createFloatingSpecs(visibleTechnologies, isMobile), [visibleTechnologies, isMobile]);
  const activeTechnology = useMemo(
    () => TECHNOLOGIES.find((item) => item.id === activeTechnologyId) ?? null,
    [activeTechnologyId],
  );

  const handleTechnologyClosed = useCallback(() => setActiveTechnologyId(null), []);

  // O campo de ícones permanece vivo até a saída direta para o Fake Footer.
  const stageActive = rawStageProgress > 0.02 && rawStageProgress < TECHNOLOGY_EXIT_PROGRESS;
  const mobileIconsInScene = isMobile && rawStageProgress > 0.02 && rawStageProgress < 1;
  const iconAnimationActive = isMobile ? mobileIconsInScene : stageActive;
  const stageExitProgress = clamp(
    (rawStageProgress - TECHNOLOGY_EXIT_PROGRESS) / TECHNOLOGY_EXIT_DURATION,
    0,
    1,
  );
  const stageLeaving = stageExitProgress > 0.001;

  const showTechnologyTooltip = useCallback((id: string) => {
    hoveredTechnologyIdRef.current = id;
    setTooltipTechnologyIds((current) => current.includes(id) ? current : [...current, id]);
    setHoveredTechnologyId(id);
  }, []);
  const hideTechnologyTooltip = useCallback((id?: string) => {
    if (id && hoveredTechnologyIdRef.current !== id) return;
    hoveredTechnologyIdRef.current = null;
    setHoveredTechnologyId(null);
  }, []);
  const handleTooltipExited = useCallback((id: string) => {
    setTooltipTechnologyIds((current) => stageActive && !activeTechnologyId && hoveredTechnologyIdRef.current === id ? current : current.filter((value) => value !== id));
  }, [stageActive, activeTechnologyId]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const section = stageSectionRef.current;
    if (!isMobile || !section) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      // Prepare the existing frames ahead of the handoff without waiting on decode.
      frameLayerRefs.current.slice(0, frameSequence.frames.length).forEach(frame => {
        if (typeof frame.decode === 'function') void frame.decode().catch(() => undefined);
      });
      observer.disconnect();
    }, {rootMargin: `${getStableViewportHeight()}px 0px`, threshold: 0});
    observer.observe(section);
    return () => observer.disconnect();
  }, [frameSequence, isMobile]);

  useLayoutEffect(() => {
    const section = stageSectionRef.current;
    const pinnedShell = pinnedShellRef.current;
    const sceneBackground = sceneBackgroundRef.current;
    const frameLayers = frameLayerRefs.current.slice(0, frameSequence.frames.length);
    const stageBackdrop = stageBackdropRef.current;
    const titleText = titleTextRef.current;
    const titleGlow = titleGlowRef.current;
    const subtitle = subtitleRef.current;
    const instruction = instructionRef.current;
    const stageOneLayer = stageOneLayerRef.current;

    if (
      !section ||
      !pinnedShell ||
      !sceneBackground ||
      frameLayers.length !== frameSequence.frames.length ||
      !stageBackdrop ||
      !titleText ||
      !titleGlow ||
      !subtitle ||
      !instruction ||
      !stageOneLayer
    ) return;

    let splitTitle: ReturnType<typeof SplitText.create> | null = null;

    const ctx = gsap.context(() => {
      // `words` junto de `chars`: sem o agrupamento por palavra, cada caractere
      // vira um inline-block solto e a linha pode quebrar no meio da palavra.
      splitTitle = SplitText.create(titleText, {
        type: 'words,chars',
        charsClass: 'technology-title-char',
      });

      gsap.set(sceneBackground, {
        autoAlpha: 1,
        scale: 1,
        yPercent: 0,
        filter: 'none',
        transformOrigin: 'center center',
        willChange: 'opacity',
      });

      gsap.set(frameLayers, {autoAlpha: 0, willChange: 'opacity'});
      gsap.set(frameLayers[0], {autoAlpha: 1});

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


      const timeline = gsap.timeline({
        defaults: {ease: 'none'},
        // Mobile UI and the receiving scene follow the frame actually drawn by scrub.
        onUpdate: isMobile ? function (this: gsap.core.Timeline) {
          rawStageProgressRef.current = this.progress();
          onProgressRef.current(rawStageProgressRef.current);
        } : undefined,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () =>
            `+=${Math.round(
              getStableViewportHeight() *
                (reducedMotion
                  ? TECHNOLOGY_SCENE_REDUCED_MOTION.lengthInViewports
                  : TECHNOLOGY_SCENE.lengthInViewports),
            )}`,
          // Native touch owns the pace; do not leave the visual clock behind its pin.
          scrub: isMobile ? true : reducedMotion ? 0.18 : 0.72,
          pin: pinnedShell,
          refreshPriority: 2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Recarregar no meio da cena não dispara `onUpdate`: sem isto o `App`
          // ficaria em progresso 0 com a cena já rolada.
          onRefresh: (self) => {
            const progress = isMobile && self.animation ? self.animation.progress() : self.progress;
            if (isMobile) rawStageProgressRef.current = progress;
            onProgressRef.current(progress);
          },
          onUpdate: (self) => {
            if (!isMobile) onProgressRef.current(self.progress);
          },
        },
      });

      if (!reducedMotion && frameSequence.entry) {
        timeline.fromTo(frameLayers[0], {autoAlpha: 0}, {autoAlpha: 1, duration: frameSequence.entry.end}, frameSequence.entry.start);

        frameSequence.frames.slice(1).forEach((frame, index) => {
          const previousFrame = frameSequence.frames[index];
          const transitionDuration = previousFrame.exit - frame.enter;

          timeline
            .to(frameLayers[index], {autoAlpha: 0, duration: transitionDuration}, frame.enter)
            .to(frameLayers[index + 1], {autoAlpha: 1, duration: transitionDuration}, frame.enter);
        });
      }

      timeline
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
          stageOneLayer,
          {
            autoAlpha: 0,
            y: reducedMotion ? -12 : -60,
            duration: TECHNOLOGY_EXIT_DURATION,
          },
          TECHNOLOGY_EXIT_PROGRESS,
        )
        // O campo de tecnologias apaga diretamente para o portal do rodapé.
        .to(
          stageBackdrop,
          {
            autoAlpha: 0,
            duration: TECHNOLOGY_EXIT_DURATION,
          },
          TECHNOLOGY_EXIT_PROGRESS,
        );
    }, stageSectionRef);

    requestSceneRefresh();
    return () => {
      ctx.revert();
      splitTitle?.revert();
      requestSceneRefresh();
    };
  }, [frameSequence, isMobile, locale, reducedMotion]);

  useEffect(() => {
    hoveredTechnologyIdRef.current = hoveredTechnologyId;
  }, [hoveredTechnologyId]);

  useEffect(() => {
    activeTechnologyIdRef.current = activeTechnologyId;
  }, [activeTechnologyId]);

  useEffect(() => {
    if (!isMobile) rawStageProgressRef.current = rawStageProgress;
  }, [isMobile, rawStageProgress]);

  // Via ref porque o timeline só remonta em [isMobile, locale, reducedMotion];
  // a prop não pode entrar nas dependências sem rebuildar a cena a cada render.
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    // Returning from the frames keeps the selected mobile group revealed.
    if (!isMobile || rawStageProgressRef.current <= 0.02) mobilePageRevealedRef.current = false;
    if (stageActive && !previousStageActiveRef.current) {
      introStartRef.current = null;
      outroStartRef.current = null;
      setHoveredTechnologyId(null);
    }

    if (!stageActive) {
      outroStartRef.current = isMobile ? null : performance.now();
      setHoveredTechnologyId(null);
    }

    previousStageActiveRef.current = stageActive;
  }, [isMobile, stageActive]);

  useEffect(() => {
    if (!isMobile && !iconAnimationActive && outroStartRef.current === null) {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let previousTime: number | null = null;
    let driftTime = 0;
    const mobilePositions = new Map<string, {left: number; top: number}>();
    const animate = (time: number) => {
      const field = stageFieldRef.current;
      if (!field) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }

      if (introStartRef.current === null) introStartRef.current = time;
      const delta = previousTime === null ? 0 : Math.min(time - previousTime, 64);
      previousTime = time;
      if (!document.hidden && !reducedMotion && !hoveredTechnologyIdRef.current && !activeTechnologyIdRef.current) driftTime += delta;
      const rect = field.getBoundingClientRect();
      const fieldBounds = isMobile ? {width: field.clientWidth, height: field.clientHeight} : rect;
      if (isMobile && (fieldBounds.width <= 0 || fieldBounds.height <= 0)) {
        if (!iconAnimationActive) {animationFrameRef.current = null; return;}
        animationFrameRef.current = window.requestAnimationFrame(animate);
        return;
      }
      const scaleX = rect.width / fieldBounds.width || 1;
      const scaleY = rect.height / fieldBounds.height || 1;
      const copyRect = isMobile ? copyInnerRef.current?.getBoundingClientRect() : undefined;
      const paginationRect = isMobile ? paginationRef.current?.getBoundingClientRect() : undefined;
      const protectedAreas = [copyRect, paginationRect]
        .filter((area): area is DOMRect => area !== undefined)
        .map(area => ({
          left: (area.left - rect.left) / scaleX - fieldBounds.width / 2 - 12,
          right: (area.right - rect.left) / scaleX - fieldBounds.width / 2 + 12,
          top: (area.top - rect.top) / scaleY - fieldBounds.height / 2 - 12,
          bottom: (area.bottom - rect.top) / scaleY - fieldBounds.height / 2 + 12,
        }));
      // Batch layout reads before writes, including the SVG's own scale/offset.
      const buttonSizes = isMobile ? floatingSpecs.map(spec => {
        const button = buttonRefs.current[spec.id];
        const width = button?.offsetWidth ?? 0;
        const height = button?.offsetHeight ?? 0;
        return {
          width: Math.max(width, width * 0.82 * spec.iconScale + Math.abs(spec.iconOffsetX) * 2),
          height: Math.max(height, height * 0.82 * spec.iconScale + Math.abs(spec.iconOffsetY) * 2),
        };
      }) : [];
      const mobilePoints = isMobile ? getTechnologyFloatPoints(floatingSpecs.length, true, {
        ...fieldBounds,
        iconSize: Math.max(...buttonSizes.map(size => Math.max(size.width, size.height))) * 1.25 + 4,
        content: copyRect ? {
          left: (copyRect.left - rect.left) / scaleX,
          right: (copyRect.right - rect.left) / scaleX,
          top: (copyRect.top - rect.top) / scaleY,
          bottom: (copyRect.bottom - rect.top) / scaleY,
        } : undefined,
      }) : null;
      const motionFactor = reducedMotion ? 0 : 1;
      const scrollProgress = rawStageProgressRef.current;
      // Manual mobile selection must not wait for more vertical scrolling.
      const iconIntroProgress = isMobile && mobilePageRevealedRef.current
        ? 1
        : clamp((scrollProgress - 0.045) / 0.5, 0, 1);
      const iconExitProgress = clamp((scrollProgress - 0.74) / 0.22, 0, 1);
      const scrollExitEase = iconExitProgress * iconExitProgress * iconExitProgress;

      floatingSpecs.forEach((spec, index) => {
        const anchor = anchorRefs.current[spec.id];
        const button = buttonRefs.current[spec.id];
        if (!anchor || !button) return;

        const isHovered = hoveredTechnologyIdRef.current === spec.id;
        const isActive = activeTechnologyIdRef.current === spec.id;
        const interactionStrength = isActive ? 1 : isHovered ? 0.72 : 0;
        const driftDamping = 1;
        const revealOffset = spec.revealOrder * (isMobile ? 0.16 : 0.42);
        const revealWindow = isMobile ? 0.42 : 0.28;
        const revealProgress = easeOutCubic(clamp((iconIntroProgress - revealOffset) / revealWindow, 0, 1));
        const driftProgress = easeOutCubic(clamp((iconIntroProgress - revealOffset + (isMobile ? 0.06 : 0.08)) / (isMobile ? 0.36 : 0.42), 0, 1));
        let point = mobilePoints?.[index] ?? spec;
        if (isMobile) {
          const previous = mobilePositions.get(spec.id) ?? point;
          const reflow = reducedMotion ? 1 : 1 - Math.exp(-delta / 90);
          point = {left: lerp(previous.left, point.left, reflow), top: lerp(previous.top, point.top, reflow)};
          mobilePositions.set(spec.id, point);
        }
        const targetX = (point.left - 0.5) * fieldBounds.width;
        const targetY = (point.top - 0.5) * fieldBounds.height;
        const targetDistance = Math.hypot(targetX, targetY) || 1;
        const directionX = targetX / targetDistance;
        const directionY = targetY / targetDistance;
        const spawnOrigin = getSafeSpawnOrigin(targetX, targetY, fieldBounds, isMobile);
        const tangentX = -directionY;
        const tangentY = directionX;
        const waveX = Math.sin(driftTime * spec.driftSpeed + spec.driftOffset) * spec.driftAmplitudeX * motionFactor * driftDamping;
        const waveY = Math.cos(driftTime * (spec.driftSpeed * 0.82) + spec.driftOffset * 1.17) * spec.driftAmplitudeY * motionFactor * driftDamping;
        const microX = reducedMotion ? 0 : Math.sin(driftTime * (spec.driftSpeed * 1.7) + spec.driftOffset * 2.4) * (spec.driftAmplitudeX * 0.14) * driftDamping;
        const microY = reducedMotion ? 0 : Math.cos(driftTime * (spec.driftSpeed * 1.42) + spec.driftOffset * 1.9) * (spec.driftAmplitudeY * 0.12) * driftDamping;
        const ejectionPulse = reducedMotion ? 0 : Math.sin(revealProgress * Math.PI) * lerp(16, 32, spec.depth);
        const swirlDrift = reducedMotion ? 0 : Math.sin(driftTime * (spec.driftSpeed * 1.08) + spec.driftOffset * 1.6) * lerp(3, 9, spec.depth) * driftProgress * driftDamping;
        const driftX = (waveX + microX) * driftProgress + directionX * ejectionPulse + tangentX * swirlDrift;
        const driftY = (waveY + microY) * driftProgress + directionY * ejectionPulse + tangentY * swirlDrift;
        const baseX = (isMobile ? targetX : lerp(spawnOrigin.x, targetX, revealProgress)) + driftX;
        const baseY = (isMobile ? targetY : lerp(spawnOrigin.y, targetY, revealProgress)) + driftY;

        const depthScale = lerp(0.9, 1.18, spec.depth);
        const finalX = baseX;
        const finalY = baseY;
        const opacity = clamp(lerp(0.68, 1, spec.depth) * revealProgress, 0, 1);
        const scale = lerp(0.5, depthScale, revealProgress) + interactionStrength * (reducedMotion ? 0.025 : 0.07);
        const rotation = Math.sin(driftTime * (spec.driftSpeed * 0.74) + spec.driftOffset) * lerp(0.7, 2.4, spec.depth) * motionFactor * driftDamping;

        let outroProgress = scrollExitEase;
        if (!isMobile && outroStartRef.current !== null) {
          outroProgress = Math.max(outroProgress, clamp((time - outroStartRef.current) / OUTRO_DURATION, 0, 1));
        }
        const easeIn = outroProgress * outroProgress * outroProgress;
        let displayX = isMobile ? finalX : lerp(finalX, 0, easeIn);
        let displayY = isMobile ? finalY : lerp(finalY, 0, easeIn);
        if (isMobile) {
          // Clamp the actual centered, scaled/rotated button after all drift
          // and intro/outro offsets, not just its normalized spawn point.
          const radians = rotation * Math.PI / 180;
          const cosine = Math.abs(Math.cos(radians));
          const sine = Math.abs(Math.sin(radians));
          const size = buttonSizes[index];
          const halfWidth = (size.width * cosine + size.height * sine) * scale / 2;
          const halfHeight = (size.height * cosine + size.width * sine) * scale / 2;
          const viewport = window.visualViewport;
          const normalZoom = !viewport || Math.abs(viewport.scale - 1) <= 0.01;
          const left = normalZoom ? viewport?.offsetLeft ?? 0 : 0;
          const top = normalZoom ? viewport?.offsetTop ?? 0 : 0;
          const width = normalZoom ? viewport?.width ?? document.documentElement.clientWidth : window.innerWidth;
          const height = normalZoom ? viewport?.height ?? window.innerHeight : window.innerHeight;
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const minX = Math.max(-fieldBounds.width / 2 + halfWidth, (left + 8 - centerX) / scaleX + halfWidth);
          const maxX = Math.min(fieldBounds.width / 2 - halfWidth, (left + width - 8 - centerX) / scaleX - halfWidth);
          const minY = Math.max(-fieldBounds.height / 2 + halfHeight, (top + 8 - centerY) / scaleY + halfHeight);
          const maxY = Math.min(fieldBounds.height / 2 - halfHeight, (top + height - 8 - centerY) / scaleY - halfHeight);
          displayX = minX <= maxX ? clamp(displayX, minX, maxX) : 0;
          displayY = minY <= maxY ? clamp(displayY, minY, maxY) : 0;
          const overlaps = (x: number, y: number) => protectedAreas.some(area =>
            x + halfWidth > area.left && x - halfWidth < area.right &&
            y + halfHeight > area.top && y - halfHeight < area.bottom);
          let canPlace = minX <= maxX && minY <= maxY;
          if (canPlace && overlaps(displayX, displayY)) {
            const candidates = protectedAreas.flatMap(area => [
              {x: displayX, y: area.top - halfHeight - 1},
              {x: displayX, y: area.bottom + halfHeight + 1},
              {x: area.left - halfWidth - 1, y: displayY},
              {x: area.right + halfWidth + 1, y: displayY},
            ]);
            candidates.push({x: targetX, y: targetY});
            let safe: {x: number; y: number} | undefined;
            let nearest = Infinity;
            for (const candidate of candidates) {
              if (candidate.x < minX || candidate.x > maxX || candidate.y < minY || candidate.y > maxY || overlaps(candidate.x, candidate.y)) continue;
              const distance = Math.hypot(candidate.x - displayX, candidate.y - displayY);
              if (distance < nearest) {nearest = distance;safe = candidate;}
            }
            if (safe) {displayX = safe.x;displayY = safe.y;}
            else canPlace = false;
          }
          anchor.toggleAttribute('data-mobile-blocked', !canPlace);
        }
        const displayOpacity = opacity * (1 - easeIn);

        anchor.style.opacity = displayOpacity.toFixed(3);
        anchor.style.transform = `translate(-50%, -50%) translate3d(${displayX.toFixed(2)}px, ${displayY.toFixed(2)}px, 0)`;
        button.style.transform = `translate3d(0, 0, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });

      if (isMobile && !iconAnimationActive) {
        animationFrameRef.current = null;
        return;
      }

      if (!isMobile && !iconAnimationActive && outroStartRef.current !== null) {
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
  }, [floatingSpecs, iconAnimationActive, isMobile, reducedMotion]);

  const selectMobilePage = (index: number) => {
    mobilePageRevealedRef.current = true;
    setHoveredTechnologyId(null);
    setMobilePageIndex(index);
  };

  const handleStagePointerLeave = () => {
    hideTechnologyTooltip();
  };

  return (
    <section
      ref={stageSectionRef}
      className={`transition-stage technologies-stage${stageActive ? ' is-active' : ''}${stageLeaving ? ' is-leaving' : ''}${reducedMotion ? ' reduce-motion' : ''}${hoveredTechnologyId || activeTechnologyId ? ' has-active-technology' : ''}${activeTechnology ? ' has-open-technology-card' : ''}`}
      data-code-burst-surface
      style={{
        ...stageStyle,
        '--technology-exit-progress': stageExitProgress,
      } as CSSProperties}
      onPointerLeave={handleStagePointerLeave}
    >
      <div ref={pinnedShellRef} className="technologies-pin-shell">
        <div ref={sceneBackgroundRef} className="transition-scene-background" aria-hidden="true">
          <div ref={depthPlaneRef} className="technology-depth-plane">
          {frameSequence.frames.map((frame, index) => (
            <img
              key={frame.src}
              ref={(node) => {
                if (node) frameLayerRefs.current[index] = node;
              }}
              className="technology-frame-layer"
              src={frame.src}
              alt=""
              decoding="async"
            />
          ))}
          </div>
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
            <div className="transition-stage-media technologies-stage-media">
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
                          aria-haspopup="dialog"
                          aria-describedby={isHovered && !isMobile ? `technology-tooltip-${technology.id}` : undefined}
                          tabIndex={stageActive && !activeTechnology ? 0 : -1}
                          disabled={!stageActive}
                          onPointerEnter={(event) => {
                            if (event.pointerType === 'mouse') showTechnologyTooltip(technology.id);
                          }}
                          onFocus={() => showTechnologyTooltip(technology.id)}
                          onBlur={() => hideTechnologyTooltip(technology.id)}
                          onPointerLeave={() => hideTechnologyTooltip(technology.id)}
                          onClick={() => { hideTechnologyTooltip(); setActiveTechnologyId(technology.id); }}
                          style={{
                            '--technology-icon-size': `${spec.size}px`,
                          } as CSSProperties}
                        >
                          <TechnologyIcon
                            className="technology-inline-icon"
                            src={technology.icon}
                            label={technology.label}
                            style={{
                              '--icon-scale': technology.iconScale ?? 1,
                              '--icon-offset-x': `${technology.iconOffsetX ?? 0}px`,
                              '--icon-offset-y': `${technology.iconOffsetY ?? 0}px`,
                            } as CSSProperties}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="transition-overlay technologies-overlay" />
              </div>
            </div>

            <div className="transition-copy technologies-copy">
              <div ref={copyInnerRef} className="technologies-copy-inner">
                <div ref={titleGlowRef} className="technologies-title-glow" aria-hidden="true" />
                <div className="technologies-heading-stack">
                  <h2 className="technologies-title" aria-live="polite">
                    <span
                      ref={titleTextRef}
                      key={locale}
                      className="technologies-title-text"
                    >
                      {sectionCopy.titlePhrases[0]}
                    </span>
                  </h2>
                  <p ref={subtitleRef} className="technologies-subtitle">{sectionCopy.subtitle}</p>
                </div>
                <p ref={instructionRef} className="technologies-instruction">{sectionCopy.instruction}</p>
              </div>
            </div>
            {isMobile && technologyPages.length > 1 ? (
              <nav ref={paginationRef} className="technology-mobile-pagination" aria-label={locale === 'pt' ? 'Navegar entre tecnologias' : 'Browse technologies'} inert={!stageActive || Boolean(activeTechnology)}>
                <button type="button" aria-label={uiCopy.previous} disabled={currentPageIndex === 0} onClick={() => selectMobilePage(currentPageIndex - 1)}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
                <button type="button" aria-label={uiCopy.next} disabled={currentPageIndex === technologyPages.length - 1} onClick={() => selectMobilePage(currentPageIndex + 1)}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
                </button>
              </nav>
            ) : null}
          </div>
        </div>

      </div>

      {!isMobile ? tooltipTechnologyIds.map((id) => {
        const technology = TECHNOLOGIES.find((item) => item.id === id);
        return technology ? (
          <TechnologyHoverCard
            key={id}
            technology={technology}
            locale={locale}
            open={stageActive && hoveredTechnologyId === id && !activeTechnology}
            reducedMotion={reducedMotion}
            buttonsRef={buttonRefs}
            onExited={handleTooltipExited}
          />
        ) : null;
      }) : null}
      {activeTechnology ? (
        <TechnologyDialog
          key={activeTechnology.id}
          technology={activeTechnology}
          locale={locale}
          reducedMotion={reducedMotion}
          onClosed={handleTechnologyClosed}
        />
      ) : null}
    </section>
  );
}
