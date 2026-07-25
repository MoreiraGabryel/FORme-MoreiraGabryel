import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties, MutableRefObject} from 'react';
import {gsap} from 'gsap';

type Props = {onDone: () => void};

type DebugOptions = {
  freezeAt: number | null;
  forceMotion: boolean;
  forceReducedMotion: boolean;
  slowMo: number | null;
};

const BRAND_NAME = 'MoreiraGabryel';
const BRAND_CHARS = [...BRAND_NAME];

const COLOR = {
  // Estratégia 60:30:10 usando a paleta real do site.
  base: '#050608',
  baseAlt: '#0A0C10',
  surface: '#121A2A',
  surfaceDeep: '#18233A',
  surfaceLine: '#22304A',
  text: '#F5F7FA',
  textSoft: '#D7DCE5',
  muted: '#8E97A8',
  accent: '#F2C230',
  accentHot: '#FFD34D',
} as const;

const LOADING_BACKGROUND_STYLE = {
  background:
    `radial-gradient(circle at 50% 42%, rgba(242, 194, 48, 0.115), transparent 30%), ` +
    `radial-gradient(circle at 50% 62%, rgba(34, 48, 74, 0.34), transparent 46%), ` +
    `linear-gradient(145deg, ${COLOR.base} 0%, ${COLOR.baseAlt} 48%, ${COLOR.surface} 100%)`,
} satisfies CSSProperties;

const LOADING_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(215,220,229,0.034) 1px, transparent 1px), linear-gradient(90deg, rgba(34,48,74,0.18) 1px, transparent 1px)',
  backgroundSize: '118px 118px',
  maskImage: 'radial-gradient(circle at 50% 48%, black 25%, transparent 82%)',
} satisfies CSSProperties;

const STAGE_GLOW_STYLE = {
  opacity: 0,
  background:
    'radial-gradient(circle, rgba(242,194,48,0.18) 0%, rgba(242,194,48,0.085) 18%, rgba(34,48,74,0.2) 44%, transparent 74%)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

const FLASH_OVERLAY_STYLE = {
  opacity: 0,
  background:
    'linear-gradient(90deg, rgba(5,6,8,0) 0%, rgba(242,194,48,0.06) 24%, rgba(255,211,77,0.22) 50%, rgba(34,48,74,0.08) 76%, rgba(5,6,8,0) 100%)',
  mixBlendMode: 'screen',
  willChange: 'opacity',
} satisfies CSSProperties;

const BRIDGE_OVERLAY_STYLE = {
  opacity: 0,
  background:
    'radial-gradient(circle at 50% 42%, rgba(34,48,74,0.28) 0%, rgba(18,26,42,0.24) 30%, rgba(10,12,16,0.42) 60%, rgba(5,6,8,0.62) 100%), linear-gradient(180deg, rgba(18,26,42,0.4), rgba(18,26,42,0.2) 34%, rgba(5,6,8,0.08) 68%, rgba(5,6,8,0))',
  willChange: 'opacity',
} satisfies CSSProperties;

const WORDMARK_GUIDE_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(34,48,74,0.28) 18%, rgba(242,194,48,0.22) 50%, rgba(34,48,74,0.28) 82%, transparent)',
} satisfies CSSProperties;

const WRITE_HEAD_STYLE = {
  background:
    'linear-gradient(180deg, rgba(255,211,77,0) 0%, rgba(255,211,77,0.95) 18%, rgba(242,194,48,1) 50%, rgba(255,211,77,0.95) 82%, rgba(255,211,77,0) 100%)',
  boxShadow: '0 0 24px rgba(242,194,48,0.36), 0 0 54px rgba(242,194,48,0.16)',
  filter: 'blur(0.2px)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

const PROGRESS_FILL_STYLE = {
  background: 'linear-gradient(90deg, rgba(242,194,48,0.18), rgba(255,211,77,0.98) 58%, rgba(242,194,48,0.36))',
  boxShadow: '0 0 14px rgba(242,194,48,0.28), 0 0 34px rgba(242,194,48,0.16)',
} satisfies CSSProperties;

const PROGRESS_BEAM_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(242,194,48,0.12) 18%, rgba(255,211,77,1) 50%, rgba(242,194,48,0.3) 82%, transparent)',
  filter: 'blur(5px)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

const SCAN_BEAM_STYLE = {
  opacity: 0,
  background:
    'linear-gradient(180deg, rgba(242,194,48,0) 0%, rgba(242,194,48,0.16) 14%, rgba(255,211,77,0.74) 50%, rgba(242,194,48,0.22) 82%, rgba(242,194,48,0) 100%)',
  boxShadow: '0 0 44px rgba(242,194,48,0.24)',
  filter: 'blur(7px)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

function readDebugOptions(): DebugOptions {
  if (typeof window === 'undefined') {
    return {freezeAt: null, forceMotion: false, forceReducedMotion: false, slowMo: null};
  }

  const params = new URLSearchParams(window.location.search);
  const freezeRaw = params.get('loading-freeze');
  const slowMoRaw = params.get('loading-slow');
  const freezeAt = freezeRaw ? Number(freezeRaw) : null;
  const slowMo = slowMoRaw ? Number(slowMoRaw) : null;

  return {
    freezeAt: Number.isFinite(freezeAt) ? freezeAt : null,
    forceMotion: params.get('loading-motion') === '1',
    forceReducedMotion: params.get('loading-reduce') === '1',
    slowMo: typeof slowMo === 'number' && Number.isFinite(slowMo) && slowMo > 0 ? slowMo : null,
  };
}

function setSpanNode(listRef: MutableRefObject<HTMLSpanElement[]>, index: number, node: HTMLSpanElement | null) {
  if (node) listRef.current[index] = node;
}

function loadingStatusForProgress(progress: number) {
  if (progress < 24) return 'Inicializando';
  if (progress < 56) return 'Carregando recursos';
  if (progress < 86) return 'Preparando interface';
  if (progress < 100) return 'Finalizando';
  return 'Concluído';
}

export function LoadingScreen({onDone}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);
  const flareRefs = useRef<HTMLSpanElement[]>([]);
  const writeHeadRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const progressNumberRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const scanBeamRef = useRef<HTMLDivElement>(null);
  const stageGlowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const doneTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const backdrop = backdropRef.current;
    const bridge = bridgeRef.current;
    const content = contentRef.current;
    const panel = panelRef.current;
    const word = wordRef.current;
    const writeHead = writeHeadRef.current;
    const status = statusRef.current;
    const progressNumber = progressNumberRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    const beam = beamRef.current;
    const scanBeam = scanBeamRef.current;
    const stageGlow = stageGlowRef.current;
    const flash = flashRef.current;
    const chars = charRefs.current.slice(0, BRAND_CHARS.length);
    const flares = flareRefs.current.slice(0, BRAND_CHARS.length);

    if (
      !container ||
      !backdrop ||
      !bridge ||
      !content ||
      !panel ||
      !word ||
      !writeHead ||
      !status ||
      !progressNumber ||
      !track ||
      !fill ||
      !beam ||
      !scanBeam ||
      !stageGlow ||
      !flash ||
      chars.length !== BRAND_CHARS.length ||
      flares.length !== BRAND_CHARS.length
    ) {
      return;
    }

    const debug = readDebugOptions();
    const isMobile = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
    const rawReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedMotion = (rawReducedMotion || debug.forceReducedMotion) && !debug.forceMotion;
    const progressState = {value: 0};

    const writingStart = prefersReducedMotion ? 0.08 : 0.18;
    const letterStagger = prefersReducedMotion ? 0.024 : isMobile ? 0.055 : 0.05;
    const letterDuration = prefersReducedMotion ? 0.1 : isMobile ? 0.34 : 0.32;
    const letterTravel = prefersReducedMotion ? 3 : isMobile ? 12 : 14;
    const letterRotation = prefersReducedMotion ? 0 : isMobile ? 1.5 : 2;
    const letterBlur = prefersReducedMotion ? 1.5 : 4;
    const writingDuration = (chars.length - 1) * letterStagger + letterDuration;
    const minimumLoadingTime = prefersReducedMotion ? 1.05 : isMobile ? 2.15 : 2.28;
    const holdStart = Math.max(writingStart + writingDuration + 0.18, minimumLoadingTime);
    const progressFinalDuration = prefersReducedMotion ? 0.2 : 0.32;
    const revealDuration = prefersReducedMotion ? 0.18 : 0.34;
    const cleanupDuration = prefersReducedMotion ? 0.16 : 0.24;
    const fallbackDoneAt = debug.freezeAt ?? holdStart + progressFinalDuration + revealDuration + cleanupDuration + 0.82;
    let isDone = false;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverscroll = body.style.overscrollBehavior;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const lockScrollY = window.scrollY;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${lockScrollY}px`;
    body.style.width = '100%';

    const renderProgress = () => {
      const normalizedProgress = Math.round(progressState.value);
      progressNumber.textContent = `${normalizedProgress}%`;
      status.textContent = loadingStatusForProgress(normalizedProgress);
      track.setAttribute('aria-valuenow', String(normalizedProgress));
    };

    const finish = () => {
      if (isDone || debug.freezeAt !== null) return;
      isDone = true;
      onDone();
    };

    renderProgress();
    gsap.set(container, {
      opacity: 1,
      pointerEvents: 'auto',
      visibility: 'visible',
      scale: 1,
      filter: 'none',
    });
    doneTimeoutRef.current = window.setTimeout(finish, Math.ceil(fallbackDoneAt * 1000));

    const ctx = gsap.context(() => {
      const wordWidth = word.getBoundingClientRect().width;
      const writeHeadTravel = Math.max(wordWidth + (isMobile ? 12 : 20), 24);
      const stageGlowPeak = prefersReducedMotion ? 0.3 : 0.48;
      const flashPeak = prefersReducedMotion ? 0.06 : 0.12;
      const bridgePeak = prefersReducedMotion ? 0.12 : 0.24;
      const scanPeak = prefersReducedMotion ? 0.28 : 0.64;
      const scanDuration = prefersReducedMotion ? 0.18 : 0.34;
      const dispatchHeroHandoff = () => {
        window.dispatchEvent(new CustomEvent('mg:loading-handoff', {
          detail: {reducedMotion: prefersReducedMotion},
        }));
      };

      gsap.set(panel, {
        opacity: 0,
        y: prefersReducedMotion ? 4 : isMobile ? 12 : 14,
        scale: 0.99,
        filter: `blur(${prefersReducedMotion ? 3 : 9}px)`,
      });
      gsap.set(status, {
        opacity: 0,
        y: prefersReducedMotion ? 2 : 8,
        letterSpacing: prefersReducedMotion ? '0.18em' : '0.36em',
      });
      gsap.set(progressNumber, {
        opacity: 0,
        y: prefersReducedMotion ? 2 : 8,
        filter: `blur(${prefersReducedMotion ? 2 : 6}px)`,
      });
      gsap.set(chars, {
        opacity: 0,
        y: letterTravel,
        rotateZ: letterRotation,
        transformOrigin: '50% 85%',
        filter: `blur(${letterBlur}px)`,
        color: COLOR.text,
        willChange: 'transform, opacity, filter, color',
      });
      gsap.set(flares, {
        opacity: 0,
        y: letterTravel,
        rotateZ: letterRotation,
        scale: 1.05,
        color: COLOR.accent,
        filter: `blur(${prefersReducedMotion ? 2 : 6}px)`,
        willChange: 'transform, opacity, filter',
      });
      gsap.set(writeHead, {
        opacity: 0,
        x: -16,
        scaleY: prefersReducedMotion ? 0.86 : 0.92,
        transformOrigin: '50% 50%',
      });
      gsap.set(track, {
        opacity: 0,
        scaleX: 0.96,
        transformOrigin: '50% 50%',
      });
      gsap.set(fill, {
        scaleX: 0,
        transformOrigin: '0% 50%',
      });
      gsap.set(beam, {
        opacity: 0,
        xPercent: -120,
        scaleX: 0.72,
        transformOrigin: '50% 50%',
      });
      gsap.set(scanBeam, {
        opacity: 0,
        yPercent: -140,
      });
      gsap.set(stageGlow, {
        opacity: 0,
        scale: 0.92,
        transformOrigin: '50% 50%',
      });
      gsap.set(backdrop, {opacity: 1});
      gsap.set(bridge, {opacity: 0});
      gsap.set(content, {opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'});
      gsap.set(flash, {opacity: 0});

      const pulseTl = gsap.timeline({repeat: -1, yoyo: true, paused: true, defaults: {ease: 'sine.inOut'}})
        .to(chars, {
          y: prefersReducedMotion ? 0 : -1.5,
          color: COLOR.accentHot,
          duration: prefersReducedMotion ? 0.28 : 0.9,
          stagger: prefersReducedMotion ? 0 : 0.018,
        }, 0)
        .to(flares, {
          opacity: prefersReducedMotion ? 0.04 : 0.18,
          y: prefersReducedMotion ? 0 : -1.5,
          duration: prefersReducedMotion ? 0.28 : 0.9,
          stagger: prefersReducedMotion ? 0 : 0.018,
        }, 0);

      const tl = gsap.timeline({
        defaults: {ease: 'power2.out'},
        onComplete: finish,
      });

      tl.addLabel('intro', 0)
        .to(stageGlow, {
          opacity: prefersReducedMotion ? 0.14 : 0.24,
          scale: 1,
          duration: prefersReducedMotion ? 0.28 : 0.46,
          ease: 'sine.out',
        }, 'intro')
        .to(panel, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: prefersReducedMotion ? 0.2 : 0.34,
          ease: 'power3.out',
        }, 'intro+=0.04')
        .to(status, {
          opacity: 0.62,
          y: 0,
          letterSpacing: isMobile ? '0.16em' : '0.26em',
          duration: prefersReducedMotion ? 0.18 : 0.26,
        }, 'intro+=0.1')
        .to(progressNumber, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: prefersReducedMotion ? 0.16 : 0.24,
        }, 'intro+=0.12')
        .to(track, {
          opacity: 1,
          scaleX: 1,
          duration: prefersReducedMotion ? 0.16 : 0.25,
        }, 'intro+=0.14')
        .addLabel('writing', writingStart)
        .to(writeHead, {
          opacity: prefersReducedMotion ? 0.54 : 0.84,
          duration: 0.12,
        }, 'writing')
        .to(writeHead, {
          x: writeHeadTravel,
          duration: writingDuration,
          ease: 'none',
        }, 'writing')
        .to(chars, {
          opacity: 1,
          y: 0,
          rotateZ: 0,
          filter: 'blur(0px)',
          color: COLOR.text,
          duration: letterDuration,
          stagger: letterStagger,
          ease: 'power3.out',
        }, 'writing')
        .to(flares, {
          opacity: prefersReducedMotion ? 0.08 : 0.16,
          y: 0,
          rotateZ: 0,
          scale: 1,
          duration: letterDuration,
          stagger: letterStagger,
          ease: 'power3.out',
        }, 'writing')
        .to(progressState, {
          value: 72,
          duration: writingDuration,
          ease: 'none',
          onUpdate: renderProgress,
        }, 'writing')
        .to(fill, {
          scaleX: 0.72,
          duration: writingDuration,
          ease: 'none',
        }, 'writing')
        .to(beam, {
          opacity: prefersReducedMotion ? 0.2 : 0.54,
          scaleX: 1,
          duration: prefersReducedMotion ? 0.12 : 0.18,
        }, 'writing+=0.04')
        .to(beam, {
          xPercent: 132,
          duration: writingDuration + 0.04,
          ease: 'none',
        }, 'writing-=0.01')
        .call(() => pulseTl.play(0), [], writingStart + writingDuration + 0.02)
        .to(progressState, {
          value: 88,
          duration: prefersReducedMotion ? 0.12 : 0.22,
          ease: 'power1.out',
          onUpdate: renderProgress,
        }, writingStart + writingDuration)
        .to(fill, {
          scaleX: 0.88,
          duration: prefersReducedMotion ? 0.12 : 0.22,
          ease: 'power1.out',
        }, writingStart + writingDuration)
        .to(writeHead, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.08 : 0.14,
        }, writingStart + writingDuration)
        .addLabel('hold', holdStart)
        .call(() => pulseTl.pause(), [], 'hold-=0.05')
        .to(chars, {
          color: COLOR.text,
          y: 0,
          scale: 1,
          duration: 0.08,
          stagger: 0.006,
        }, 'hold-=0.03')
        .to(flares, {
          opacity: 0,
          duration: 0.1,
          stagger: 0.004,
        }, 'hold-=0.03')
        .to(progressState, {
          value: 100,
          duration: progressFinalDuration,
          ease: 'power1.inOut',
          onUpdate: renderProgress,
        }, 'hold')
        .to(fill, {
          scaleX: 1,
          duration: progressFinalDuration,
          ease: 'power1.inOut',
        }, 'hold')
        .to(beam, {
          opacity: 0,
          xPercent: 184,
          duration: prefersReducedMotion ? 0.18 : 0.22,
          ease: 'power2.out',
        }, 'hold')
        .to(chars, {
          color: COLOR.accentHot,
          y: prefersReducedMotion ? 0 : -3,
          scale: prefersReducedMotion ? 1 : 1.018,
          duration: prefersReducedMotion ? 0.12 : 0.18,
          stagger: 0.014,
          ease: 'power2.out',
        }, 'hold+=0.04')
        .to(chars, {
          color: COLOR.text,
          y: 0,
          scale: 1,
          duration: prefersReducedMotion ? 0.1 : 0.22,
          stagger: 0.01,
          ease: 'power2.out',
        }, 'hold+=0.24')
        .to(status, {
          opacity: 0,
          y: prefersReducedMotion ? -2 : -6,
          duration: revealDuration,
        }, 'hold+=0.06')
        .to(track, {
          opacity: prefersReducedMotion ? 0.42 : 0.58,
          duration: revealDuration,
        }, 'hold+=0.06')
        .to(stageGlow, {
          opacity: stageGlowPeak,
          scale: prefersReducedMotion ? 1.04 : 1.12,
          duration: revealDuration,
          ease: 'power2.out',
        }, 'hold+=0.06')
        .addLabel('reveal', holdStart + revealDuration * 0.68)
        .call(dispatchHeroHandoff, [], 'reveal-=0.03')
        .to(scanBeam, {
          opacity: scanPeak,
          yPercent: -12,
          duration: scanDuration,
          ease: 'power2.out',
        }, 'reveal-=0.02')
        .to(content, {
          opacity: 0,
          y: prefersReducedMotion ? -2 : -8,
          scale: prefersReducedMotion ? 1.004 : 1.018,
          filter: `blur(${prefersReducedMotion ? 2 : 7}px)`,
          duration: prefersReducedMotion ? 0.16 : 0.34,
          ease: 'power2.out',
        }, 'reveal')
        .to(stageGlow, {
          opacity: prefersReducedMotion ? 0.18 : 0.26,
          scale: prefersReducedMotion ? 1.06 : 1.14,
          duration: prefersReducedMotion ? 0.16 : 0.32,
          ease: 'power1.out',
        }, 'reveal')
        .addLabel('flash', 'reveal+=0.03')
        .to(flash, {
          opacity: flashPeak,
          duration: prefersReducedMotion ? 0.06 : 0.08,
          ease: 'sine.out',
        }, 'flash')
        .to(flash, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.08 : 0.12,
          ease: 'sine.inOut',
        }, 'flash+=0.08')
        .addLabel('aperture', 'reveal+=0.09')
        .to(scanBeam, {
          opacity: 0,
          yPercent: 124,
          duration: prefersReducedMotion ? 0.16 : 0.28,
          ease: 'power3.out',
        }, 'aperture')
        .to(bridge, {
          opacity: bridgePeak,
          duration: prefersReducedMotion ? 0.08 : 0.14,
          ease: 'power2.out',
        }, 'aperture')
        .to(backdrop, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.16 : 0.3,
          ease: 'power2.out',
        }, 'aperture')
        .to(bridge, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.12 : 0.2,
          ease: 'power1.inOut',
        }, 'aperture+=0.11')
        .addLabel('cleanup', 'aperture+=0.26')
        .to(stageGlow, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.08 : 0.12,
          ease: 'power1.out',
        }, 'cleanup')
        .to(container, {
          autoAlpha: 0,
          duration: prefersReducedMotion ? 0.06 : 0.1,
          ease: 'none',
        }, 'cleanup')
        .set(container, {pointerEvents: 'none'}, 'cleanup');

      if (debug.slowMo) tl.timeScale(debug.slowMo);
      if (debug.freezeAt !== null) {
        tl.pause(debug.freezeAt);
        renderProgress();
      }
    }, container);

    return () => {
      ctx.revert();
      if (doneTimeoutRef.current) {
        window.clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overscrollBehavior = previousBodyOverscroll;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, lockScrollY);
    };
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-5 py-8"
      role="status"
      aria-live="polite"
      aria-label="Carregando o portfólio MoreiraGabryel"
      style={{contain: 'layout paint style'}}
    >
      <div ref={backdropRef} className="pointer-events-none absolute inset-0 bg-[#050608]" aria-hidden="true">
        <div className="absolute inset-0" style={LOADING_BACKGROUND_STYLE} />
        <div className="absolute inset-0 opacity-35" style={LOADING_GRID_STYLE} />
        <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-[#22304A]/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-[18%] h-px bg-gradient-to-r from-transparent via-[#22304A]/40 to-transparent" />

        <div
          ref={stageGlowRef}
          className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] max-h-[92vw] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={STAGE_GLOW_STYLE}
        />
      </div>

      <div ref={flashRef} className="pointer-events-none absolute inset-0" aria-hidden="true" style={FLASH_OVERLAY_STYLE} />

      <div
        ref={scanBeamRef}
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[16vh] min-h-[5rem] -translate-y-1/2"
        aria-hidden="true"
        style={SCAN_BEAM_STYLE}
      />

      <div ref={bridgeRef} className="pointer-events-none absolute inset-0" aria-hidden="true" style={BRIDGE_OVERLAY_STYLE} />

      <div ref={contentRef} className="relative w-full max-w-[min(60rem,94vw)] text-center">
        <div ref={panelRef} className="relative mx-auto w-full text-center opacity-0">
          <div className="mx-auto flex w-full max-w-[min(54rem,86vw)] items-center justify-between gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#D7DCE5]/60 sm:text-[0.7rem] sm:tracking-[0.26em]">
            <div ref={statusRef} className="min-w-0 truncate text-left">Inicializando</div>
            <div ref={progressNumberRef} className="shrink-0 text-[#F5F7FA]/85">0%</div>
          </div>

          <div className="relative mx-auto mt-8 w-fit max-w-full overflow-hidden px-[clamp(0.25rem,1.8vw,1.3rem)] py-[clamp(0.55rem,2.4vw,1.15rem)] sm:mt-9">
            <div className="pointer-events-none absolute inset-x-[6%] top-1/2 h-px -translate-y-1/2 opacity-60" aria-hidden="true" style={WORDMARK_GUIDE_STYLE} />

            <div
              ref={writeHeadRef}
              className="pointer-events-none absolute left-[4%] top-1/2 z-[4] h-[1.18em] w-[0.14em] -translate-y-1/2 rounded-full opacity-0 mix-blend-screen"
              aria-hidden="true"
              style={WRITE_HEAD_STYLE}
            />

            <div
              ref={wordRef}
              className="display-font relative z-[5] flex max-w-full select-none items-end justify-center whitespace-nowrap text-[clamp(2.15rem,10.8vw,7rem)] font-black leading-none tracking-[-0.065em] text-[#F5F7FA] sm:text-[clamp(2.4rem,7.2vw,7.4rem)]"
              aria-label={BRAND_NAME}
            >
              {BRAND_CHARS.map((char, index) => (
                <span key={`${char}-${index}`} className="relative inline-block align-top leading-none" aria-hidden="true">
                  <span
                    ref={(node) => setSpanNode(charRefs, index, node)}
                    className="relative z-[2] inline-block leading-none"
                    style={{opacity: 0, color: COLOR.text}}
                    aria-hidden="true"
                  >
                    {char}
                  </span>
                  <span
                    ref={(node) => setSpanNode(flareRefs, index, node)}
                    className="pointer-events-none absolute inset-0 z-[1] inline-block leading-none text-[#F2C230]"
                    style={{opacity: 0}}
                    aria-hidden="true"
                  >
                    {char}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div
            ref={trackRef}
            className="relative mx-auto mt-7 h-[4px] w-[min(420px,78vw)] overflow-hidden rounded-full border border-[#D7DCE5]/10 bg-[#22304A]/45 opacity-0 shadow-[0_0_0_1px_rgba(5,6,8,0.42)] sm:mt-8"
            role="progressbar"
            aria-label="Progresso de carregamento"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <div ref={fillRef} className="absolute inset-y-0 left-0 w-full origin-left rounded-full" style={PROGRESS_FILL_STYLE} />
            <div
              ref={beamRef}
              className="pointer-events-none absolute left-0 top-1/2 h-[0.55rem] w-[34%] -translate-y-1/2 rounded-full opacity-0 sm:w-[22%]"
              aria-hidden="true"
              style={PROGRESS_BEAM_STYLE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
