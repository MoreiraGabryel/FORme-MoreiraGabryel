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

const LOADING_BACKGROUND_STYLE = {
  background:
    'radial-gradient(circle at 50% 44%, rgba(170,218,255,0.08) 0%, rgba(170,218,255,0.03) 20%, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%), linear-gradient(90deg, rgba(255,255,255,0.012), transparent 24%, transparent 76%, rgba(255,255,255,0.012))',
} satisfies CSSProperties;

const LOADING_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
  backgroundSize: '118px 118px',
  maskImage: 'radial-gradient(circle at 50% 48%, black 26%, transparent 82%)',
} satisfies CSSProperties;

const STAGE_GLOW_STYLE = {
  opacity: 0,
  background:
    'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(170,218,255,0.08) 16%, rgba(170,218,255,0.03) 36%, transparent 72%)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

const FLASH_OVERLAY_STYLE = {
  opacity: 0,
  background:
    'linear-gradient(90deg, rgba(4,6,10,0) 0%, rgba(120,168,214,0.03) 24%, rgba(255,255,255,0.14) 50%, rgba(120,168,214,0.03) 76%, rgba(4,6,10,0) 100%)',
  mixBlendMode: 'screen',
  willChange: 'opacity',
} satisfies CSSProperties;

const BRIDGE_OVERLAY_STYLE = {
  opacity: 0,
  background:
    'radial-gradient(circle at 50% 42%, rgba(122,142,230,0.12) 0%, rgba(58,78,138,0.1) 28%, rgba(10,14,24,0.28) 58%, rgba(4,6,10,0.42) 100%), linear-gradient(180deg, rgba(7,10,18,0.3), rgba(7,10,18,0.16) 34%, rgba(4,6,10,0.06) 68%, rgba(4,6,10,0))',
  willChange: 'opacity',
} satisfies CSSProperties;

const WORDMARK_GUIDE_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(190,230,255,0.06) 18%, rgba(255,255,255,0.16) 50%, rgba(190,230,255,0.06) 82%, transparent)',
} satisfies CSSProperties;

const WRITE_HEAD_STYLE = {
  background:
    'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 18%, rgba(214,239,255,0.98) 50%, rgba(255,255,255,0.92) 82%, rgba(255,255,255,0) 100%)',
  boxShadow: '0 0 24px rgba(190,232,255,0.34), 0 0 48px rgba(170,218,255,0.18)',
  filter: 'blur(0.2px)',
  willChange: 'transform, opacity',
} satisfies CSSProperties;

const PROGRESS_FILL_STYLE = {
  background: 'linear-gradient(90deg, rgba(170,218,255,0.08), rgba(255,255,255,0.96) 56%, rgba(170,218,255,0.22))',
  boxShadow: '0 0 16px rgba(186,232,255,0.14)',
} satisfies CSSProperties;

const PROGRESS_BEAM_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 18%, rgba(255,255,255,0.96) 50%, rgba(170,218,255,0.2) 82%, transparent)',
  filter: 'blur(5px)',
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

function setTextNode(listRef: MutableRefObject<HTMLSpanElement[]>, index: number, node: HTMLSpanElement | null) {
  if (node) listRef.current[index] = node;
}

export function LoadingScreen({onDone}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);
  const writeHeadRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const progressNumberRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
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
    const stageGlow = stageGlowRef.current;
    const flash = flashRef.current;
    const chars = charRefs.current.slice(0, BRAND_CHARS.length);

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
      !stageGlow ||
      !flash ||
      chars.length !== BRAND_CHARS.length
    ) {
      return;
    }

    const debug = readDebugOptions();
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const rawReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedMotion = (rawReducedMotion || debug.forceReducedMotion) && !debug.forceMotion;
    const progressState = {value: 0};
    const writingStart = prefersReducedMotion ? 0.08 : 0.18;
    const letterStagger = prefersReducedMotion ? 0.028 : isMobile ? 0.062 : 0.06;
    const letterDuration = prefersReducedMotion ? 0.1 : isMobile ? 0.17 : 0.16;
    const letterOffset = prefersReducedMotion ? 3 : 8;
    const letterBlur = prefersReducedMotion ? 1.5 : 4;
    const finalHold = prefersReducedMotion ? 0.08 : 0.16;
    const progressFinalDuration = prefersReducedMotion ? 0.2 : 0.24;
    const revealDuration = prefersReducedMotion ? 0.18 : 0.26;
    const cleanupDuration = prefersReducedMotion ? 0.16 : 0.22;
    const writingDuration = (chars.length - 1) * letterStagger + letterDuration;
    const writingEnd = writingStart + writingDuration;
    const holdStart = writingEnd + finalHold;
    const fallbackDoneAt = debug.freezeAt ?? holdStart + progressFinalDuration + revealDuration + cleanupDuration + 0.52;
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
      progressNumber.textContent = `${Math.round(progressState.value)}%`;
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
      const writeHeadTravel = Math.max(wordWidth + 20, 24);
      const stageGlowPeak = prefersReducedMotion ? 0.3 : 0.46;
      const flashPeak = prefersReducedMotion ? 0.06 : 0.1;
      const bridgePeak = prefersReducedMotion ? 0.12 : 0.22;

      gsap.set(panel, {
        opacity: 0,
        y: prefersReducedMotion ? 4 : 10,
        scale: 0.992,
        filter: `blur(${prefersReducedMotion ? 3 : 8}px)`,
      });
      gsap.set(status, {
        opacity: 0,
        y: prefersReducedMotion ? 2 : 8,
        letterSpacing: prefersReducedMotion ? '0.28em' : '0.48em',
      });
      gsap.set(progressNumber, {
        opacity: 0,
        y: prefersReducedMotion ? 2 : 8,
        filter: `blur(${prefersReducedMotion ? 2 : 6}px)`,
      });
      gsap.set(chars, {
        opacity: 0,
        y: letterOffset,
        filter: `blur(${letterBlur}px)`,
        color: 'rgba(255,255,255,0.78)',
        willChange: 'transform, opacity, filter, color',
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
      gsap.set(stageGlow, {
        opacity: 0,
        scale: 0.92,
        transformOrigin: '50% 50%',
      });
      gsap.set(backdrop, {
        opacity: 1,
      });
      gsap.set(bridge, {
        opacity: 0,
      });
      gsap.set(content, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      });
      gsap.set(flash, {opacity: 0});

      const tl = gsap.timeline({
        defaults: {ease: 'power2.out'},
        onComplete: finish,
      });

      tl.addLabel('intro', 0)
        .to(stageGlow, {
          opacity: prefersReducedMotion ? 0.14 : 0.22,
          scale: 1,
          duration: prefersReducedMotion ? 0.28 : 0.42,
          ease: 'sine.out',
        }, 'intro')
        .to(panel, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: prefersReducedMotion ? 0.2 : 0.28,
          ease: 'power3.out',
        }, 'intro+=0.04')
        .to(status, {
          opacity: 0.56,
          y: 0,
          letterSpacing: '0.34em',
          duration: prefersReducedMotion ? 0.18 : 0.24,
        }, 'intro+=0.1')
        .to(progressNumber, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: prefersReducedMotion ? 0.16 : 0.22,
        }, 'intro+=0.12')
        .to(track, {
          opacity: 1,
          scaleX: 1,
          duration: prefersReducedMotion ? 0.16 : 0.24,
        }, 'intro+=0.14')
        .addLabel('writing', writingStart)
        .to(writeHead, {
          opacity: prefersReducedMotion ? 0.54 : 0.82,
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
          filter: 'blur(0px)',
          color: '#ffffff',
          duration: letterDuration,
          stagger: letterStagger,
          ease: 'power3.out',
        }, 'writing')
        .to(progressState, {
          value: 68,
          duration: writingDuration,
          ease: 'none',
          onUpdate: renderProgress,
        }, 'writing')
        .to(fill, {
          scaleX: 0.68,
          duration: writingDuration,
          ease: 'none',
        }, 'writing')
        .to(beam, {
          opacity: prefersReducedMotion ? 0.2 : 0.52,
          scaleX: 1,
          duration: prefersReducedMotion ? 0.12 : 0.18,
        }, 'writing+=0.04')
        .to(beam, {
          xPercent: 132,
          duration: writingDuration + 0.04,
          ease: 'none',
        }, 'writing-=0.01')
        .to(progressState, {
          value: 86,
          duration: prefersReducedMotion ? 0.12 : 0.18,
          ease: 'power1.out',
          onUpdate: renderProgress,
        }, writingEnd)
        .to(fill, {
          scaleX: 0.86,
          duration: prefersReducedMotion ? 0.12 : 0.18,
          ease: 'power1.out',
        }, writingEnd)
        .to(writeHead, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.08 : 0.14,
        }, writingEnd)
        .addLabel('progress', writingEnd)
        .to(stageGlow, {
          opacity: prefersReducedMotion ? 0.24 : 0.38,
          scale: prefersReducedMotion ? 1.02 : 1.05,
          duration: prefersReducedMotion ? 0.12 : 0.2,
        }, 'progress+=0.02')
        .addLabel('hold', holdStart)
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
        .to(status, {
          opacity: 0,
          y: prefersReducedMotion ? -2 : -6,
          duration: revealDuration,
        }, 'hold+=0.02')
        .to(track, {
          opacity: prefersReducedMotion ? 0.42 : 0.56,
          duration: revealDuration,
        }, 'hold+=0.02')
        .to(stageGlow, {
          opacity: stageGlowPeak,
          scale: prefersReducedMotion ? 1.04 : 1.1,
          duration: revealDuration,
          ease: 'power2.out',
        }, 'hold+=0.03')
        .addLabel('reveal', holdStart + revealDuration * 0.56)
        .to(content, {
          opacity: 0,
          y: prefersReducedMotion ? -2 : -6,
          scale: prefersReducedMotion ? 1.006 : 1.015,
          filter: `blur(${prefersReducedMotion ? 2 : 6}px)`,
          duration: prefersReducedMotion ? 0.16 : 0.32,
          ease: 'power2.out',
        }, 'reveal')
        .to(stageGlow, {
          opacity: prefersReducedMotion ? 0.18 : 0.24,
          scale: prefersReducedMotion ? 1.06 : 1.12,
          duration: prefersReducedMotion ? 0.16 : 0.3,
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
        .addLabel('aperture', 'reveal+=0.08')
        .to(bridge, {
          opacity: bridgePeak,
          duration: prefersReducedMotion ? 0.08 : 0.14,
          ease: 'power2.out',
        }, 'aperture')
        .to(backdrop, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.16 : 0.28,
          ease: 'power2.out',
        }, 'aperture')
        .to(bridge, {
          opacity: 0,
          duration: prefersReducedMotion ? 0.12 : 0.18,
          ease: 'power1.inOut',
        }, 'aperture+=0.1')
        .addLabel('cleanup', 'aperture+=0.24')
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-5"
      style={{contain: 'layout paint style'}}
    >
      <div ref={backdropRef} className="pointer-events-none absolute inset-0 bg-[#050608]" aria-hidden="true">
        <div className="absolute inset-0" style={LOADING_BACKGROUND_STYLE} />

        <div className="absolute inset-0 opacity-30" style={LOADING_GRID_STYLE} />

        <div
          ref={stageGlowRef}
          className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] max-h-[88vw] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={STAGE_GLOW_STYLE}
        />
      </div>

      <div ref={flashRef} className="pointer-events-none absolute inset-0" aria-hidden="true" style={FLASH_OVERLAY_STYLE} />

      <div ref={bridgeRef} className="pointer-events-none absolute inset-0" aria-hidden="true" style={BRIDGE_OVERLAY_STYLE} />

      <div ref={contentRef} className="relative w-full max-w-[min(66rem,94vw)] text-center">
        <div ref={panelRef} className="relative w-full text-center opacity-0">
          <div className="mx-auto flex w-full max-w-[54rem] items-center justify-between gap-4 text-[0.58rem] font-medium uppercase tracking-[0.3em] text-white/42 sm:text-[0.7rem] sm:tracking-[0.34em]">
            <div ref={statusRef} className="min-w-0 truncate text-left">Inicializando portfólio</div>
            <div ref={progressNumberRef} className="shrink-0">0%</div>
          </div>

          <div className="relative mx-auto mt-7 w-fit max-w-full px-[clamp(0.3rem,1.8vw,1.2rem)] py-[clamp(0.5rem,2vw,1rem)] sm:mt-8">
            <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 opacity-40" aria-hidden="true" style={WORDMARK_GUIDE_STYLE} />

            <div
              ref={writeHeadRef}
              className="pointer-events-none absolute left-[4%] top-1/2 z-[4] h-[1.14em] w-[0.14em] -translate-y-1/2 rounded-full opacity-0 mix-blend-screen"
              aria-hidden="true"
              style={WRITE_HEAD_STYLE}
            />

            <div
              ref={wordRef}
              className="display-font relative z-[5] max-w-full select-none whitespace-nowrap text-[clamp(1.6rem,6.6vw,6.2rem)] font-black leading-none tracking-[-0.055em] text-white sm:text-[clamp(1.9rem,6.9vw,7rem)]"
              aria-label={BRAND_NAME}
            >
              {BRAND_CHARS.map((char, index) => (
                <span key={`${char}-${index}`} className="inline-block align-top leading-none" aria-hidden="true">
                  <span
                    ref={(node) => setTextNode(charRefs, index, node)}
                    className="inline-block leading-none"
                    style={{opacity: 0, color: '#ffffff'}}
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
            className="relative mx-auto mt-7 h-px w-full max-w-[54rem] overflow-hidden rounded-full bg-white/12 opacity-0 sm:mt-8"
          >
            <div ref={fillRef} className="absolute inset-y-0 left-0 w-full origin-left" style={PROGRESS_FILL_STYLE} />
            <div
              ref={beamRef}
              className="pointer-events-none absolute left-0 top-1/2 h-[0.42rem] w-[28%] -translate-y-1/2 rounded-full opacity-0 sm:w-[18%]"
              aria-hidden="true"
              style={PROGRESS_BEAM_STYLE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
