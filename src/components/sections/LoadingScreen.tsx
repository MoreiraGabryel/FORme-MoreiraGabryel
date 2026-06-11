import {useLayoutEffect, useRef} from 'react';
import {gsap} from 'gsap';

type Props = {onDone: () => void};

type DebugOptions = {
  freezeAt: number | null;
  forceMotion: boolean;
  slowMo: number | null;
};

const BRAND_NAME = 'MoreiraGabryel';
const I_INDEX = BRAND_NAME.indexOf('i');
const BOLT_SRC = '/icons/lightning-bolt.svg';
const NETWORK_SRC = '/icons/lightning-network.svg';

function readDebugOptions(): DebugOptions {
  if (typeof window === 'undefined') {
    return {freezeAt: null, forceMotion: false, slowMo: null};
  }

  const params = new URLSearchParams(window.location.search);
  const freezeRaw = params.get('loading-freeze');
  const slowMoRaw = params.get('loading-slow');
  const freezeAt = freezeRaw ? Number(freezeRaw) : null;
  const slowMo = slowMoRaw ? Number(slowMoRaw) : null;

  return {
    freezeAt: Number.isFinite(freezeAt) ? freezeAt : null,
    forceMotion: params.get('loading-motion') === '1',
    slowMo: Number.isFinite(slowMo) && slowMo! > 0 ? slowMo : null,
  };
}

export function LoadingScreen({onDone}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);
  const iGlyphRef = useRef<HTMLSpanElement>(null);
  const boltRef = useRef<HTMLSpanElement>(null);
  const boltGlowRef = useRef<HTMLSpanElement>(null);
  const networkRef = useRef<HTMLImageElement>(null);
  const writeHeadRef = useRef<HTMLDivElement>(null);
  const energyBeamRef = useRef<HTMLDivElement>(null);
  const stageGlowRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const doneTimeoutRef = useRef<number | null>(null);

  charRefs.current = [];

  useLayoutEffect(() => {
    const container = containerRef.current;
    const word = wordRef.current;
    const iGlyph = iGlyphRef.current;
    const bolt = boltRef.current;
    const boltGlow = boltGlowRef.current;
    const network = networkRef.current;
    const writeHead = writeHeadRef.current;
    const energyBeam = energyBeamRef.current;
    const stageGlow = stageGlowRef.current;
    const flash = flashRef.current;
    const aperture = apertureRef.current;
    const chars = charRefs.current;

    if (!container || !word || !iGlyph || !bolt || !boltGlow || !network || !writeHead || !energyBeam || !stageGlow || !flash || !aperture || chars.length === 0) {
      return;
    }

    const leftChars = chars.filter((_, index) => index < I_INDEX);
    const rightChars = chars.filter((_, index) => index > I_INDEX);
    const energyChars = chars.filter((_, index) => index !== I_INDEX);
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const rawReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const debug = readDebugOptions();
    const prefersReducedMotion = rawReducedMotion && !debug.forceMotion;
    const wordWidth = word.getBoundingClientRect().width;
    const letterStagger = prefersReducedMotion ? 0.08 : isMobile ? 0.11 : 0.125;
    const letterDuration = prefersReducedMotion ? 0.18 : isMobile ? 0.28 : 0.31;
    const writeStart = 0.34;
    const writingEnd = writeStart + (chars.length - 1) * letterStagger + letterDuration;
    const boltAt = writingEnd + 0.2;
    const energyAt = boltAt + 0.32;
    const liftAt = energyAt + 0.56;
    const payoffAt = liftAt + 0.52;
    const fadeAt = payoffAt + 0.4;
    const fallbackDoneAt = debug.freezeAt ?? fadeAt + 0.8;
    let isDone = false;

    const finish = () => {
      if (isDone || debug.freezeAt !== null) return;
      isDone = true;
      onDone();
    };

    gsap.set(container, {opacity: 1});
    doneTimeoutRef.current = window.setTimeout(finish, Math.ceil(fallbackDoneAt * 1000));

    const ctx = gsap.context(() => {
      gsap.set(chars, {
        opacity: 0,
        yPercent: 22,
        filter: 'blur(14px) brightness(1.2)',
        clipPath: 'inset(0 0 100% 0)',
        textShadow: '0 0 0 rgba(241,255,115,0)',
        color: 'rgba(255,255,255,0.92)',
        willChange: 'transform, opacity, filter, clip-path, text-shadow',
      });
      gsap.set(word, {
        yPercent: 0,
        scale: 1,
        filter: 'brightness(1)',
        willChange: 'transform, filter, opacity',
      });
      gsap.set(iGlyph, {
        opacity: 0,
        yPercent: 22,
        filter: 'blur(14px) brightness(1.2)',
        clipPath: 'inset(0 0 100% 0)',
        transformOrigin: '50% 82%',
      });
      gsap.set(bolt, {
        opacity: 0,
        scale: 0.45,
        rotate: -14,
        yPercent: 12,
        xPercent: -50,
        transformOrigin: '50% 50%',
        filter: 'drop-shadow(0 0 0 rgba(241,255,115,0))',
      });
      gsap.set(boltGlow, {opacity: 0, scale: 0.34, transformOrigin: '50% 50%'});
      gsap.set(network, {
        opacity: 0,
        scale: 0.9,
        clipPath: 'inset(0 50% 0 50% round 999px)',
        filter: 'blur(6px) brightness(1.2)',
        transformOrigin: '50% 50%',
      });
      gsap.set(writeHead, {
        opacity: 0,
        x: -22,
        scaleY: 0.4,
        transformOrigin: '50% 50%',
      });
      gsap.set(energyBeam, {
        opacity: 0,
        scaleX: 0,
        transformOrigin: '50% 50%',
        filter: 'blur(10px)',
      });
      gsap.set(stageGlow, {opacity: 0, scale: 0.88, transformOrigin: '50% 50%'});
      gsap.set(flash, {opacity: 0});
      gsap.set(aperture, {
        opacity: 0,
        scale: 0.3,
        clipPath: 'circle(0% at 50% 50%)',
        transformOrigin: '50% 50%',
      });

      if (prefersReducedMotion) {
        const reducedTl = gsap.timeline({onComplete: finish});
        reducedTl
          .to(chars, {
            opacity: 1,
            yPercent: 0,
            filter: 'blur(0px) brightness(1)',
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.2,
            stagger: 0.05,
            ease: 'power2.out',
          }, 0.18)
          .to(iGlyph, {opacity: 0, duration: 0.12, ease: 'power2.out'}, 1.02)
          .to(bolt, {opacity: 1, scale: 1, rotate: 0, yPercent: 0, duration: 0.16, ease: 'power2.out'}, 1.02)
          .to(network, {opacity: 0.56, clipPath: 'inset(0 0% 0 0% round 999px)', filter: 'blur(0px) brightness(1)', duration: 0.22, ease: 'power2.out'}, 1.18)
          .to(word, {yPercent: -18, duration: 0.28, ease: 'power2.inOut'}, 1.64)
          .to([boltGlow, stageGlow], {opacity: 0.78, scale: 1.26, duration: 0.24, ease: 'power2.out'}, 1.82)
          .to(flash, {opacity: 0.52, duration: 0.12, ease: 'power2.out'}, 1.94)
          .to(aperture, {opacity: 1, scale: 1, clipPath: 'circle(140% at 50% 50%)', duration: 0.34, ease: 'power3.inOut'}, 2.06)
          .to(container, {opacity: 0, duration: 0.28, ease: 'power2.inOut'}, 2.34);

        if (debug.slowMo) reducedTl.timeScale(debug.slowMo);
        if (debug.freezeAt !== null) reducedTl.pause(debug.freezeAt);
        return;
      }

      const tl = gsap.timeline({onComplete: finish});

      tl.to(stageGlow, {
        opacity: 0.26,
        scale: 1,
        duration: 0.7,
        ease: 'sine.out',
      }, 0);

      tl.to(writeHead, {
        opacity: 1,
        scaleY: 1,
        duration: 0.16,
        ease: 'power2.out',
      }, writeStart - 0.04);

      tl.to(writeHead, {
        x: wordWidth + 26,
        duration: writingEnd - writeStart + 0.08,
        ease: 'none',
      }, writeStart);

      tl.to(chars, {
        opacity: 1,
        yPercent: 0,
        filter: 'blur(0px) brightness(1)',
        clipPath: 'inset(0 0 0% 0)',
        duration: letterDuration,
        stagger: letterStagger,
        ease: 'power3.out',
      }, writeStart);

      tl.to(chars, {
        textShadow: '0 0 18px rgba(241,255,115,0.12)',
        duration: 0.14,
        stagger: letterStagger,
        ease: 'power2.out',
      }, writeStart + 0.05);

      tl.to(writeHead, {
        opacity: 0,
        duration: 0.16,
        ease: 'power2.out',
      }, writingEnd + 0.04);

      tl.to(iGlyph, {
        opacity: 0,
        yPercent: -18,
        scaleY: 0.26,
        filter: 'blur(10px) brightness(1.5)',
        duration: 0.18,
        ease: 'power2.in',
      }, boltAt);

      tl.to(bolt, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        yPercent: 0,
        duration: 0.26,
        ease: 'back.out(1.9)',
        filter: 'drop-shadow(0 0 18px rgba(241,255,115,0.35))',
      }, boltAt + 0.02);

      tl.to(boltGlow, {
        opacity: 0.58,
        scale: 1,
        duration: 0.28,
        ease: 'power2.out',
      }, boltAt + 0.04);

      tl.to(bolt, {
        keyframes: [
          {x: 1.3, y: -1.8, rotate: 2.2, duration: 0.034},
          {x: -1.9, y: 1.5, rotate: -2.8, duration: 0.034},
          {x: 1.5, y: -0.8, rotate: 1.6, duration: 0.034},
          {x: 0, y: 0, rotate: 0, duration: 0.034},
        ],
        repeat: 1,
        ease: 'none',
      }, energyAt - 0.08);

      tl.to(network, {
        opacity: 0.78,
        scale: 1,
        clipPath: 'inset(0 0% 0 0% round 999px)',
        filter: 'blur(0px) brightness(1)',
        duration: 0.22,
        ease: 'power2.out',
      }, energyAt);

      tl.to(energyBeam, {
        opacity: 0.82,
        scaleX: 1,
        duration: 0.14,
        ease: 'power3.out',
      }, energyAt + 0.03);

      tl.to(energyBeam, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, energyAt + 0.22);

      tl.to(leftChars, {
        color: '#F6FFB2',
        textShadow: '0 0 16px rgba(241,255,115,0.34), 0 0 42px rgba(241,255,115,0.22)',
        duration: 0.15,
        stagger: {
          each: 0.034,
          from: 'end',
        },
        ease: 'power2.out',
      }, energyAt + 0.03);

      tl.to(rightChars, {
        color: '#F6FFB2',
        textShadow: '0 0 16px rgba(241,255,115,0.34), 0 0 42px rgba(241,255,115,0.22)',
        duration: 0.15,
        stagger: 0.034,
        ease: 'power2.out',
      }, energyAt + 0.03);

      tl.to(energyChars, {
        color: '#FFFFFF',
        textShadow: '0 0 0 rgba(241,255,115,0)',
        duration: 0.32,
        stagger: {
          each: 0.018,
          from: 'center',
        },
        ease: 'power2.inOut',
      }, energyAt + 0.34);

      tl.to(network, {
        opacity: 0.24,
        scale: 1.02,
        duration: 0.24,
        ease: 'power2.out',
      }, energyAt + 0.4);

      tl.to(word, {
        yPercent: -34,
        scale: 0.965,
        duration: 0.42,
        ease: 'power3.inOut',
      }, liftAt);

      tl.to(chars, {
        yPercent: -8,
        duration: 0.32,
        stagger: {
          each: 0.012,
          from: 'center',
        },
        ease: 'power2.out',
      }, liftAt + 0.02);

      tl.to(stageGlow, {
        opacity: 0.82,
        scale: 1.48,
        duration: 0.3,
        ease: 'power3.out',
      }, payoffAt);

      tl.to(boltGlow, {
        opacity: 1,
        scale: 2.1,
        duration: 0.3,
        ease: 'power3.out',
      }, payoffAt);

      tl.to(bolt, {
        scale: 3.8,
        duration: 0.32,
        ease: 'expo.in',
        filter: 'drop-shadow(0 0 30px rgba(241,255,115,0.78))',
      }, payoffAt + 0.02);

      tl.to(flash, {
        opacity: isMobile ? 0.72 : 0.84,
        duration: 0.13,
        ease: 'power3.out',
      }, payoffAt + 0.14);

      tl.to(aperture, {
        opacity: 1,
        scale: 1,
        clipPath: 'circle(145% at 50% 50%)',
        duration: 0.44,
        ease: 'expo.inOut',
      }, payoffAt + 0.16);

      tl.to(container, {
        opacity: 0,
        duration: 0.3,
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#050505] px-4"
      style={{contain: 'layout paint style', opacity: 0}}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(241,255,115,0.08), transparent 26%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 50%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%)',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage: 'radial-gradient(circle at 50% 48%, black 32%, transparent 88%)',
        }}
      />

      <div
        ref={stageGlowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[44vmax] w-[44vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden="true"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, rgba(241,255,115,0.16) 0%, rgba(241,255,115,0.08) 24%, rgba(241,255,115,0.03) 44%, transparent 72%)',
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
            'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.96) 0%, rgba(241,255,115,0.55) 16%, rgba(241,255,115,0.16) 40%, transparent 70%)',
          willChange: 'opacity',
        }}
      />

      <div
        ref={apertureRef}
        className="pointer-events-none absolute inset-0 bg-white"
        aria-hidden="true"
        style={{opacity: 0, willChange: 'clip-path, opacity, transform'}}
      />

      <div className="relative w-full max-w-[min(96rem,96vw)] text-center">
        <div ref={wordRef} className="relative inline-flex items-center justify-center px-[clamp(0.6rem,2vw,1.2rem)] py-[clamp(0.5rem,1.8vw,1rem)]">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-60"
            aria-hidden="true"
            style={{background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 16%, rgba(255,255,255,0.08) 84%, transparent)'}}
          />

          <img
            ref={networkRef}
            src={NETWORK_SRC}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 w-[min(88vw,46rem)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-0 mix-blend-screen"
            style={{willChange: 'transform, opacity, clip-path, filter'}}
            draggable={false}
          />

          <div
            ref={energyBeamRef}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[0.14rem] w-[min(82vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
            aria-hidden="true"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(241,255,115,0.64) 18%, rgba(255,255,255,0.94) 50%, rgba(241,255,115,0.64) 82%, transparent)',
              boxShadow: '0 0 14px rgba(241,255,115,0.32)',
              willChange: 'transform, opacity',
            }}
          />

          <div
            ref={writeHeadRef}
            className="pointer-events-none absolute left-0 top-1/2 z-[4] h-[1.1em] w-[0.18rem] -translate-y-1/2 rounded-full opacity-0"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(241,255,115,0.8), rgba(241,255,115,0.1))',
              boxShadow: '0 0 18px rgba(241,255,115,0.6)',
              willChange: 'transform, opacity',
            }}
          />

          <h1
            className="display-font relative z-[2] select-none whitespace-nowrap text-[clamp(2rem,9.2vw,10.4rem)] font-black leading-none tracking-[-0.065em] text-white"
            aria-label="MoreiraGabryel"
          >
            {[...BRAND_NAME].map((char, index) => {
              const isLightningSlot = index === I_INDEX;

              return (
                <span
                  key={`${char}-${index}`}
                  className="relative inline-block h-[1em] overflow-visible align-top leading-none"
                >
                  <span
                    ref={(node) => {
                      if (node) {
                        charRefs.current.push(node);
                        if (isLightningSlot) iGlyphRef.current = node;
                      }
                    }}
                    className="relative z-[2] inline-block leading-none"
                    style={{opacity: 0}}
                  >
                    {char}
                  </span>

                  {isLightningSlot && (
                    <span
                      ref={boltRef}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-[3] inline-flex h-[1.08em] w-[0.46em] -translate-y-[50%] items-center justify-center opacity-0"
                      aria-hidden="true"
                      style={{willChange: 'transform, opacity, filter'}}
                    >
                      <span
                        ref={boltGlowRef}
                        className="absolute left-1/2 top-1/2 h-[1.9em] w-[1.45em] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(241,255,115,0.48) 28%, rgba(241,255,115,0.16) 54%, transparent 78%)',
                          willChange: 'transform, opacity',
                        }}
                      />
                      <img
                        src={BOLT_SRC}
                        alt=""
                        aria-hidden="true"
                        className="relative h-full w-full select-none object-contain"
                        draggable={false}
                      />
                    </span>
                  )}
                </span>
              );
            })}
          </h1>
        </div>
      </div>
    </div>
  );
}
