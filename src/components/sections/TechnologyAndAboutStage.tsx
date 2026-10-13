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
import {getStableViewportHeight} from '../../utils/stableViewport';
import {getTechnologyFrameSequence} from '../../utils/technologyFrameSequence';
import {TECHNOLOGY_EXIT_PROGRESS} from '../../utils/technologyStageProgress';
import {getTechnologyPages, getTechnologyFloatPoints} from '../../utils/technologyStackLayout';
import {TechnologyIcon} from '../technology/TechnologyIcon';
import {TechnologyDialog} from '../technology/TechnologyDialog';
import {TechnologyHoverCard} from '../technology/TechnologyHoverCard';

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
      driftAmplitudeX: lerp(3, isMobile ? 7 : 12, depth),
      driftAmplitudeY: lerp(4, isMobile ? 8 : 13, depth),
      driftSpeed: lerp(0.00055, 0.0014, depth),
      driftOffset: randomBetween(0, Math.PI * 2),
      depth,
      zIndex: Math.round(lerp(2, 8, depth)),
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
  const stageSectionRef = useRef<HTMLElement | null>(null);
  const pinnedShellRef = useRef<HTMLDivElement | null>(null);
  const sceneBackgroundRef = useRef<HTMLDivElement | null>(null);
  const frameLayerRefs = useRef<HTMLImageElement[]>([]);
  const stageBackdropRef = useRef<HTMLDivElement | null>(null);
  const titleTextRef = useRef<HTMLSpanElement | null>(null);
  const titleGlowRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const instructionRef = useRef<HTMLParagraphElement | null>(null);
  const stageOneLayerRef = useRef<HTMLDivElement | null>(null);

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
  const onProgressRef = useRef(onProgress);
  const OUTRO_DURATION = 680;

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
          scrub: reducedMotion ? 0.18 : 0.72,
          pin: pinnedShell,
          refreshPriority: 2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Recarregar no meio da cena não dispara `onUpdate`: sem isto o `App`
          // ficaria em progresso 0 com a cena já rolada.
          onRefresh: (self) => onProgressRef.current(self.progress),
          onUpdate: (self) => onProgressRef.current(self.progress),
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
    rawStageProgressRef.current = rawStageProgress;
  }, [rawStageProgress]);

  // Via ref porque o timeline só remonta em [isMobile, locale, reducedMotion];
  // a prop não pode entrar nas dependências sem rebuildar a cena a cada render.
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

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

    let previousTime: number | null = null;
    let driftTime = 0;
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
      const motionFactor = reducedMotion ? 0 : 1;
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
        const driftDamping = 1;
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
        const ejectionPulse = reducedMotion ? 0 : Math.sin(revealProgress * Math.PI) * lerp(16, 32, spec.depth);
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
        const rotation = Math.sin(driftTime * (spec.driftSpeed * 0.74) + spec.driftOffset) * lerp(0.7, 2.4, spec.depth) * motionFactor * driftDamping;

        let outroProgress = scrollExitEase;
        if (outroStartRef.current !== null) {
          outroProgress = Math.max(outroProgress, clamp((time - outroStartRef.current) / OUTRO_DURATION, 0, 1));
        }
        const easeIn = outroProgress * outroProgress * outroProgress;
        let displayX = lerp(finalX, 0, easeIn);
        let displayY = lerp(finalY, 0, easeIn);
        if (isMobile) {
          // Clamp the actual centered, scaled/rotated button after all drift
          // and intro/outro offsets, not just its normalized spawn point.
          const radians = rotation * Math.PI / 180;
          const cosine = Math.abs(Math.cos(radians));
          const sine = Math.abs(Math.sin(radians));
          const halfWidth = (button.offsetWidth * cosine + button.offsetHeight * sine) * scale / 2;
          const halfHeight = (button.offsetHeight * cosine + button.offsetWidth * sine) * scale / 2;
          const limitX = Math.max(0, rect.width / 2 - halfWidth);
          const limitY = Math.max(0, rect.height / 2 - halfHeight);
          displayX = clamp(displayX, -limitX, limitX);
          displayY = clamp(displayY, -limitY, limitY);
        }
        const displayOpacity = opacity * (1 - easeIn);

        anchor.style.opacity = displayOpacity.toFixed(3);
        anchor.style.transform = `translate(-50%, -50%) translate3d(${displayX.toFixed(2)}px, ${displayY.toFixed(2)}px, 0)`;
        button.style.transform = `translate3d(0, 0, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
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
              <div className="technologies-copy-inner">
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
                {isMobile && technologyPages.length > 1 ? (
                  <nav className="technology-mobile-pagination" aria-label={locale === 'pt' ? 'Grupos de tecnologias' : 'Technology groups'} inert={!stageActive || Boolean(activeTechnology)}>
                    <button type="button" aria-label={uiCopy.previous} disabled={currentPageIndex === 0} onClick={() => {
                      setHoveredTechnologyId(null);
                      setMobilePageIndex(currentPageIndex - 1);
                    }}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m14 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                    <span aria-live="polite" aria-atomic="true">{uiCopy.group} {currentPageIndex + 1} / {technologyPages.length}</span>
                    <button type="button" aria-label={uiCopy.next} disabled={currentPageIndex === technologyPages.length - 1} onClick={() => {
                      setHoveredTechnologyId(null);
                      setMobilePageIndex(currentPageIndex + 1);
                    }}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m10 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                  </nav>
                ) : null}
              </div>
            </div>
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
