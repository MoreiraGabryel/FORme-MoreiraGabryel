import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import {gsap} from 'gsap';

type Props = {onDone: () => void};

type DebugOptions = {
  freezeAt: number | null;
  forceMotion: boolean;
  slowMo: number | null;
};

const BRAND_NAME = 'MoreiraGabryel';

const LOADING_BACKGROUND_STYLE = {
  background:
    'radial-gradient(circle at 50% 44%, rgba(170,218,255,0.08) 0%, rgba(170,218,255,0.03) 20%, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%), linear-gradient(90deg, rgba(255,255,255,0.012), transparent 24%, transparent 76%, rgba(255,255,255,0.012))',
} satisfies React.CSSProperties;

const LOADING_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
  backgroundSize: '118px 118px',
  maskImage: 'radial-gradient(circle at 50% 48%, black 26%, transparent 82%)',
} satisfies React.CSSProperties;

const STAGE_GLOW_STYLE = {
  opacity: 0,
  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(170,218,255,0.08) 16%, rgba(170,218,255,0.03) 36%, transparent 72%)',
  willChange: 'transform, opacity',
} satisfies React.CSSProperties;

const FLASH_OVERLAY_STYLE = {
  opacity: 0,
  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.58) 0%, rgba(196,230,255,0.14) 16%, transparent 56%)',
  willChange: 'opacity',
} satisfies React.CSSProperties;

const APERTURE_OVERLAY_STYLE = {
  opacity: 0,
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,252,0.98) 42%, rgba(255,255,255,1))',
  willChange: 'clip-path, opacity',
} satisfies React.CSSProperties;

const WORDMARK_GUIDE_STYLE = {
  background: 'linear-gradient(90deg, transparent, rgba(190,230,255,0.06) 18%, rgba(255,255,255,0.16) 50%, rgba(190,230,255,0.06) 82%, transparent)',
} satisfies React.CSSProperties;

const WRITE_HEAD_STYLE = {
  background: 'linear-gradient(180deg, rgba(255,255,255,1), rgba(192,232,255,0.94), rgba(192,232,255,0.06))',
  boxShadow: '0 0 18px rgba(184,228,255,0.26)',
  willChange: 'transform, opacity',
} satisfies React.CSSProperties;

const LETTER_FLARE_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(194,233,255,0.12) 20%, rgba(255,255,255,0.9) 50%, rgba(194,233,255,0.18) 78%, transparent)',
  filter: 'blur(1.8px)',
} satisfies React.CSSProperties;

const PROGRESS_FILL_STYLE = {
  background: 'linear-gradient(90deg, rgba(170,218,255,0.08), rgba(255,255,255,0.96) 56%, rgba(170,218,255,0.22))',
  boxShadow: '0 0 16px rgba(186,232,255,0.14)',
} satisfies React.CSSProperties;

const PROGRESS_BEAM_STYLE = {
  background:
    'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 16%, rgba(255,255,255,0.96) 50%, rgba(170,218,255,0.16) 84%, transparent)',
  filter: 'blur(5px)',
  willChange: 'transform, opacity',
} satisfies React.CSSProperties;

function readDebugOptions(): DebugOptions {
  if (typeof window === 'undefined') {
    return {freezeAt: null, forceMotion: false, slowMo: null};
  }

  const params = new URLSearchParams(window.location.search);
  const freezeRaw = params.get('loading-freeze');
  const slowMoRaw = params.get('loading-slow');
  const freezeAt = freezeRaw ? Number(freezeRaw) : null;
  const slowMo = slowMoRaw ? Number(slowMoRaw) : null;

  const resolvedSlowMo = typeof slowMo === 'number' && Number.isFinite(slowMo) && slowMo > 0 ? slowMo : null;

  return {
    freezeAt: Number.isFinite(freezeAt) ? freezeAt : null,
    forceMotion: params.get('loading-motion') === '1',
    slowMo: resolvedSlowMo,
  };
}

export function LoadingScreen({onDone}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const stageGlowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const doneTimeoutRef = useRef<number | null>(null);

  charRefs.current = [];
  flareRefs.current = [];

  useLayoutEffect(() => {
    const container = containerRef.current;
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
    const aperture = apertureRef.current;
    const chars = charRefs.current;
    const flares = flareRefs.current;

    if (
      !container ||
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
      !aperture ||
      chars.length === 0 ||
      flares.length === 0
    ) {
      return;
    }

    const debug = readDebugOptions();
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const rawReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedMotion = rawReducedMotion && !debug.forceMotion;
    const progressState = {value: 0};
    const wordWidth = word.getBoundingClientRect().width;
    const letterStagger = prefersReducedMotion ? 0.04 : isMobile ? 0.1 : 0.09;
    const letterDuration = prefersReducedMotion ? 0.14 : isMobile ? 0.2 : 0.18;
    const writeStart = prefersReducedMotion ? 0.06 : 0.18;
    const writingEnd = writeStart + (chars.length - 1) * letterStagger + letterDuration;
    const holdAt = writingEnd + (prefersReducedMotion ? 0.1 : 0.16);
    const fadeAt = holdAt + (prefersReducedMotion ? 0.16 : 0.26);
    const fallbackDoneAt = debug.freezeAt ?? fadeAt + 0.52;
    let isDone = false;

    const renderProgress = () => {
      progressNumber.textContent = `${Math.round(progressState.value)}%`;
    };

    const finish = () => {
      if (isDone || debug.freezeAt !== null) return;
      isDone = true;
      onDone();
    };

    renderProgress();
    gsap.set(container, {opacity: 1});
    doneTimeoutRef.current = window.setTimeout(finish, Math.ceil(fallbackDoneAt * 1000));

    const ctx = gsap.context(() => {
      gsap.set(panel, {
        opacity: 0,
        y: 10,
        filter: 'blur(8px)',
      });
      gsap.set(status, {
        opacity: 0,
        y: 8,
        letterSpacing: '0.48em',
      });
      gsap.set(progressNumber, {
        opacity: 0,
        y: 8,
        filter: 'blur(6px)',
      });
      gsap.set(chars, {
        opacity: 0,
        yPercent: 18,
        scale: 0.96,
        filter: 'blur(12px) brightness(0.78)',
        clipPath: 'inset(0 100% 0 0)',
        color: 'rgba(255,255,255,0.3)',
        textShadow: '0 0 0 rgba(185,229,255,0)',
        willChange: 'transform, opacity, filter, clip-path, color, text-shadow',
      });
      gsap.set(flares, {
        opacity: 0,
        scaleX: 0.2,
        scaleY: 0.5,
        xPercent: -14,
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity',
      });
      gsap.set(writeHead, {
        opacity: 0,
        x: -20,
        scaleY: 0.34,
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
        xPercent: -18,
        scaleX: 0.24,
        transformOrigin: '50% 50%',
      });
      gsap.set(stageGlow, {
        opacity: 0,
        scale: 0.9,
        transformOrigin: '50% 50%',
      });
      gsap.set(flash, {opacity: 0});
      gsap.set(aperture, {
        opacity: 0,
        clipPath: 'inset(49% 0 49% 0 round 999px)',
      });

      if (prefersReducedMotion) {
        const reducedTl = gsap.timeline({onComplete: finish});

        reducedTl
          .to(panel, {opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.18, ease: 'power2.out'}, 0)
          .to(status, {opacity: 0.6, y: 0, letterSpacing: '0.34em', duration: 0.18, ease: 'power2.out'}, 0.04)
          .to(progressNumber, {opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.16, ease: 'power2.out'}, 0.06)
          .to(track, {opacity: 1, scaleX: 1, duration: 0.18, ease: 'power2.out'}, 0.08)
          .to(chars, {
            opacity: 1,
            yPercent: 0,
            scale: 1,
            filter: 'blur(0px) brightness(1)',
            clipPath: 'inset(0 0 0 0)',
            color: '#ffffff',
            duration: 0.16,
            stagger: 0.035,
            ease: 'power2.out',
          }, 0.12)
          .to(progressState, {value: 100, duration: 0.84, ease: 'none', onUpdate: renderProgress}, 0.12)
          .to(fill, {scaleX: 1, duration: 0.84, ease: 'none'}, 0.12)
          .to(container, {opacity: 0, duration: 0.26, ease: 'power2.inOut'}, fadeAt);

        if (debug.slowMo) reducedTl.timeScale(debug.slowMo);
        if (debug.freezeAt !== null) reducedTl.pause(debug.freezeAt);
        return;
      }

      const tl = gsap.timeline({onComplete: finish});

      tl.to(stageGlow, {
        opacity: 0.22,
        scale: 1,
        duration: 0.84,
        ease: 'sine.out',
      }, 0);

      tl.to(panel, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.32,
        ease: 'power3.out',
      }, 0.08);

      tl.to(status, {
        opacity: 0.54,
        y: 0,
        letterSpacing: '0.34em',
        duration: 0.34,
        ease: 'power2.out',
      }, 0.16);

      tl.to(progressNumber, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.28,
        ease: 'power2.out',
      }, 0.2);

      tl.to(track, {
        opacity: 1,
        scaleX: 1,
        duration: 0.3,
        ease: 'power2.out',
      }, 0.24);

      tl.to(writeHead, {
        opacity: 1,
        scaleY: 1,
        duration: 0.18,
        ease: 'power2.out',
      }, writeStart - 0.06);

      tl.to(writeHead, {
        x: wordWidth + 20,
        duration: writingEnd - writeStart + 0.08,
        ease: 'none',
      }, writeStart);

      tl.to(progressState, {
        value: 68,
        duration: writingEnd - writeStart + 0.08,
        ease: 'none',
        onUpdate: renderProgress,
      }, writeStart);

      tl.to(fill, {
        scaleX: 0.68,
        duration: writingEnd - writeStart + 0.08,
        ease: 'none',
      }, writeStart);

      tl.to(beam, {
        opacity: 1,
        scaleX: 1,
        xPercent: 0,
        duration: 0.28,
        ease: 'power2.out',
      }, writeStart + 0.04);

      tl.to(beam, {
        xPercent: 94,
        duration: writingEnd - writeStart - 0.08,
        ease: 'none',
      }, writeStart + 0.16);

      tl.to(chars, {
        opacity: 1,
        yPercent: 0,
        scale: 1,
        filter: 'blur(0px) brightness(1)',
        clipPath: 'inset(0 0 0 0)',
        color: '#ffffff',
        duration: letterDuration,
        stagger: letterStagger,
        ease: 'power3.out',
      }, writeStart);

      tl.to(flares, {
        opacity: 1,
        scaleX: 1.08,
        scaleY: 1.06,
        xPercent: 0,
        duration: 0.22,
        stagger: letterStagger,
        ease: 'power2.out',
      }, writeStart + 0.02);

      tl.to(chars, {
        keyframes: [
          {
            textShadow: '0 0 12px rgba(186,232,255,0.22), 0 0 24px rgba(255,255,255,0.1)',
            filter: 'blur(0px) brightness(1.08)',
            duration: 0.08,
          },
          {
            textShadow: '0 0 20px rgba(186,232,255,0.18), 0 0 38px rgba(255,255,255,0.1)',
            filter: 'blur(0px) brightness(1.12)',
            duration: 0.12,
          },
          {
            textShadow: '0 0 8px rgba(186,232,255,0.06)',
            filter: 'blur(0px) brightness(1.02)',
            duration: 0.18,
          },
        ],
        stagger: letterStagger,
        ease: 'power2.out',
      }, writeStart + 0.04);

      tl.to(flares, {
        opacity: 0,
        scaleX: 1.44,
        scaleY: 1.14,
        xPercent: 18,
        duration: 0.34,
        stagger: letterStagger,
        ease: 'power2.out',
      }, writeStart + 0.18);

      tl.to(writeHead, {
        opacity: 0,
        duration: 0.16,
        ease: 'power2.out',
      }, writingEnd + 0.04);

      tl.to(progressState, {
        value: 86,
        duration: 0.2,
        ease: 'power1.out',
        onUpdate: renderProgress,
      }, writingEnd + 0.02);

      tl.to(fill, {
        scaleX: 0.86,
        duration: 0.2,
        ease: 'power1.out',
      }, writingEnd + 0.02);

      tl.to(stageGlow, {
        opacity: 0.4,
        scale: 1.05,
        duration: 0.24,
        ease: 'power2.out',
      }, writingEnd + 0.08);

      tl.to(progressState, {
        value: 100,
        duration: 0.44,
        ease: 'power1.inOut',
        onUpdate: renderProgress,
      }, holdAt - 0.14);

      tl.to(fill, {
        scaleX: 1,
        duration: 0.44,
        ease: 'power1.inOut',
      }, holdAt - 0.14);

      tl.to(beam, {
        xPercent: 118,
        opacity: 0.14,
        duration: 0.3,
        ease: 'power2.out',
      }, holdAt - 0.1);

      tl.to([panel, word], {
        keyframes: [
          {
            scale: 1.012,
            duration: 0.16,
          },
          {
            scale: 1.034,
            duration: 0.28,
          },
        ],
        ease: 'power2.out',
      }, holdAt - 0.06);

      tl.to(status, {
        opacity: 0.24,
        yPercent: -8,
        duration: 0.26,
        ease: 'power2.out',
      }, holdAt - 0.04);

      tl.to(track, {
        opacity: 0.68,
        scaleX: 1.01,
        duration: 0.28,
        ease: 'power2.out',
      }, holdAt - 0.04);

      tl.to(chars, {
        textShadow: '0 0 18px rgba(194,236,255,0.14), 0 0 42px rgba(255,255,255,0.08)',
        filter: 'blur(0px) brightness(1.08)',
        duration: 0.24,
        stagger: {each: 0.01, from: 'center'},
        ease: 'sine.inOut',
      }, holdAt - 0.02);

      tl.to(stageGlow, {
        opacity: 0.72,
        scale: 1.18,
        duration: 0.4,
        ease: 'power2.inOut',
      }, holdAt + 0.02);

      tl.to(flash, {
        opacity: 0.3,
        duration: 0.14,
        ease: 'power2.out',
      }, holdAt + 0.06);

      tl.to(flash, {
        opacity: 0,
        duration: 0.24,
        ease: 'power2.out',
      }, holdAt + 0.22);

      tl.to(aperture, {
        opacity: 1,
        clipPath: 'inset(-12% -3% -12% -3% round 0px)',
        duration: 0.36,
        ease: 'expo.inOut',
      }, holdAt + 0.16);

      tl.to(container, {
        opacity: 0,
        scale: 1.02,
        filter: 'blur(1.4px)',
        duration: 0.32,
        ease: 'power2.inOut',
      }, fadeAt);

      if (debug.slowMo) tl.timeScale(debug.slowMo);
      if (debug.freezeAt !== null) tl.pause(debug.freezeAt);
    }, container);

    return () => {
      ctx.revert();
      if (doneTimeoutRef.current) {
        window.clearTimeout(doneTimeoutRef.current);
      }
    };
  }, [onDone]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#050608] px-5"
      style={{contain: 'layout paint style'}}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(170,218,255,0.08) 0%, rgba(170,218,255,0.03) 20%, transparent 62%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%), linear-gradient(90deg, rgba(255,255,255,0.012), transparent 24%, transparent 76%, rgba(255,255,255,0.012))',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '118px 118px',
          maskImage: 'radial-gradient(circle at 50% 48%, black 26%, transparent 82%)',
        }}
      />

      <div
        ref={stageGlowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] max-h-[88vw] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden="true"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(170,218,255,0.08) 16%, rgba(170,218,255,0.03) 36%, transparent 72%)',
          willChange: 'transform, opacity',
        }}
      />

      <div
        ref={flashRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.58) 0%, rgba(196,230,255,0.14) 16%, transparent 56%)',
          willChange: 'opacity',
        }}
      />

      <div
        ref={apertureRef}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          opacity: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,252,0.98) 42%, rgba(255,255,255,1))',
          willChange: 'clip-path, opacity',
        }}
      />

      <div ref={panelRef} className="relative w-full max-w-[min(66rem,94vw)] text-center opacity-0">
        <div className="mx-auto flex w-full max-w-[54rem] items-center justify-between gap-4 text-[0.64rem] font-medium uppercase tracking-[0.34em] text-white/42 sm:text-[0.7rem]">
          <div ref={statusRef}>Inicializando portfólio</div>
          <div ref={progressNumberRef}>0%</div>
        </div>

        <div className="relative mx-auto mt-7 w-fit px-[clamp(0.45rem,2vw,1.4rem)] py-[clamp(0.6rem,2vw,1.1rem)] sm:mt-8">
          <div
            className="pointer-events-none absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 opacity-40"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(190,230,255,0.06) 18%, rgba(255,255,255,0.16) 50%, rgba(190,230,255,0.06) 82%, transparent)',
            }}
          />

          <div
            ref={writeHeadRef}
            className="pointer-events-none absolute left-[4%] top-1/2 z-[4] h-[1.08em] w-[0.14rem] -translate-y-1/2 rounded-full opacity-0"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,1), rgba(192,232,255,0.94), rgba(192,232,255,0.06))',
              boxShadow: '0 0 18px rgba(184,228,255,0.26)',
              willChange: 'transform, opacity',
            }}
          />

          <div
            ref={wordRef}
            className="display-font relative z-[5] select-none whitespace-nowrap text-[clamp(2rem,8.4vw,8.8rem)] font-black leading-none tracking-[-0.065em] text-white"
            aria-label={BRAND_NAME}
          >
            {[...BRAND_NAME].map((char, index) => (
              <span key={`${char}-${index}`} className="relative inline-block h-[1em] overflow-visible align-top leading-none">
                <span
                  ref={(node) => {
                    if (node) charRefs.current.push(node);
                  }}
                  className="relative z-[3] inline-block leading-none"
                  style={{opacity: 0, color: '#ffffff'}}
                >
                  {char}
                </span>

                <span
                  ref={(node) => {
                    if (node) flareRefs.current.push(node);
                  }}
                  className="pointer-events-none absolute left-1/2 top-[58%] z-[2] h-[0.32em] w-[0.82em] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
                  aria-hidden="true"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(194,233,255,0.12) 20%, rgba(255,255,255,0.9) 50%, rgba(194,233,255,0.18) 78%, transparent)',
                    filter: 'blur(1.8px)',
                  }}
                />
              </span>
            ))}
          </div>
        </div>

        <div ref={trackRef} className="relative mx-auto mt-7 h-px w-full max-w-[54rem] overflow-hidden rounded-full bg-white/12 opacity-0 sm:mt-8">
          <div
            ref={fillRef}
            className="absolute inset-y-0 left-0 w-full origin-left"
            style={{
              background: 'linear-gradient(90deg, rgba(170,218,255,0.08), rgba(255,255,255,0.96) 56%, rgba(170,218,255,0.22))',
              boxShadow: '0 0 16px rgba(186,232,255,0.14)',
            }}
          />
          <div
            ref={beamRef}
            className="pointer-events-none absolute left-0 top-1/2 h-[0.42rem] w-[18%] -translate-y-1/2 rounded-full opacity-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 16%, rgba(255,255,255,0.96) 50%, rgba(170,218,255,0.16) 84%, transparent)',
              filter: 'blur(5px)',
              willChange: 'transform, opacity',
            }}
          />
        </div>
      </div>
    </div>
  );
}
