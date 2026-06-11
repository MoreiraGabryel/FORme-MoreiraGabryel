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
  const flashRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const stageGlowRef = useRef<HTMLDivElement>(null);
  const doneTimeoutRef = useRef<number | null>(null);

  charRefs.current = [];

  useLayoutEffect(() => {
    const container = containerRef.current;
    const word = wordRef.current;
    const iGlyph = iGlyphRef.current;
    const bolt = boltRef.current;
    const boltGlow = boltGlowRef.current;
    const network = networkRef.current;
    const flash = flashRef.current;
    const aperture = apertureRef.current;
    const stageGlow = stageGlowRef.current;
    const chars = charRefs.current;

    if (!container || !word || !iGlyph || !bolt || !boltGlow || !network || !flash || !aperture || !stageGlow || chars.length === 0) {
      return;
    }

    const leftChars = chars.filter((_, index) => index < I_INDEX);
    const rightChars = chars.filter((_, index) => index > I_INDEX);
    const energyChars = chars.filter((_, index) => index !== I_INDEX);
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const rawReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const debug = readDebugOptions();
    const prefersReducedMotion = rawReducedMotion && !debug.forceMotion;
    const flashPeak = prefersReducedMotion ? 0.46 : isMobile ? 0.72 : 0.84;
    const finishAt = prefersReducedMotion ? 1.9 : isMobile ? 3.6 : 3.95;
    const finishDelayMs = Math.ceil((debug.freezeAt ?? finishAt + 0.9) * 1000);
    let isDone = false;

    const finish = () => {
      if (isDone || debug.freezeAt !== null) return;
      isDone = true;
      onDone();
    };

    gsap.set(container, {opacity: 1});
    doneTimeoutRef.current = window.setTimeout(finish, finishDelayMs);

    const ctx = gsap.context(() => {
      gsap.set(chars, {
        opacity: 1,
        yPercent: 0,
        color: '#FFFFFF',
        textShadow: '0 0 0 rgba(232,255,0,0)',
        filter: 'brightness(1)',
        willChange: 'transform, opacity, filter',
      });
      gsap.set(word, {
        yPercent: 0,
        scale: 1,
        filter: 'brightness(1)',
        willChange: 'transform, opacity, filter',
      });
      gsap.set(iGlyph, {
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        filter: 'brightness(1)',
        transformOrigin: '50% 82%',
      });
      gsap.set(bolt, {
        opacity: 0,
        scale: 0.64,
        rotate: -10,
        yPercent: 8,
        xPercent: -50,
        transformOrigin: '50% 50%',
        filter: 'drop-shadow(0 0 0 rgba(232,255,0,0))',
      });
      gsap.set(boltGlow, {opacity: 0, scale: 0.45, transformOrigin: '50% 50%'});
      gsap.set(network, {
        opacity: 0,
        scale: 0.86,
        clipPath: 'inset(0 50% 0 50% round 999px)',
        filter: 'drop-shadow(0 0 0 rgba(232,255,0,0))',
        transformOrigin: '50% 50%',
      });
      gsap.set(stageGlow, {opacity: 0, scale: 0.9, transformOrigin: '50% 50%'});
      gsap.set(flash, {opacity: 0});
      gsap.set(aperture, {
        opacity: 0,
        scale: 0.28,
        clipPath: 'circle(0% at 50% 50%)',
        transformOrigin: '50% 50%',
      });

      if (prefersReducedMotion) {
        const reducedTl = gsap.timeline({onComplete: finish});
        reducedTl
          .to(iGlyph, {opacity: 0, duration: 0.12, ease: 'power2.out'}, 0.35)
          .to(
            bolt,
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              yPercent: 0,
              duration: 0.16,
              ease: 'power2.out',
            },
            0.35,
          )
          .to(network, {opacity: 0.42, clipPath: 'inset(0 0% 0 0% round 999px)', duration: 0.2, ease: 'power2.out'}, 0.54)
          .to(word, {yPercent: -24, duration: 0.24, ease: 'power2.inOut'}, 0.9)
          .to([boltGlow, stageGlow], {opacity: 0.7, scale: 1.2, duration: 0.2, ease: 'power2.out'}, 1.06)
          .to(flash, {opacity: 0.42, duration: 0.12, ease: 'power2.out'}, 1.12)
          .to(aperture, {opacity: 1, clipPath: 'circle(130% at 50% 50%)', scale: 1, duration: 0.32, ease: 'power3.inOut'}, 1.22)
          .to(container, {opacity: 0, duration: 0.28, ease: 'power2.inOut'}, 1.52);

        if (debug.slowMo) reducedTl.timeScale(debug.slowMo);
        if (debug.freezeAt !== null) {
          reducedTl.pause(debug.freezeAt);
        }
        return;
      }

      const tl = gsap.timeline({onComplete: finish});

      tl.to(word, {
        scale: 1.012,
        duration: 0.22,
        ease: 'sine.inOut',
        repeat: 1,
        yoyo: true,
      }, 0.18);

      tl.to(iGlyph, {
        scaleY: 1.14,
        yPercent: -4,
        duration: 0.16,
        ease: 'power2.out',
      }, 0.58);

      tl.to(iGlyph, {
        opacity: 0,
        scaleY: 0.72,
        yPercent: -20,
        duration: 0.14,
        ease: 'power2.in',
      }, 0.82);

      tl.to(bolt, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        yPercent: 0,
        duration: 0.24,
        ease: 'back.out(2)',
      }, 0.83);

      tl.to(boltGlow, {
        opacity: 0.44,
        scale: 1,
        duration: 0.26,
        ease: 'power2.out',
      }, 0.86);

      tl.to(bolt, {
        keyframes: [
          {x: 1.2, y: -1.4, rotate: 1.6, duration: 0.03},
          {x: -1.8, y: 1.8, rotate: -2.2, duration: 0.03},
          {x: 1.5, y: -1.2, rotate: 1.2, duration: 0.03},
          {x: 0, y: 0, rotate: 0, duration: 0.03},
        ],
        repeat: 1,
        ease: 'none',
      }, 1.02);

      tl.to(network, {
        opacity: 0.78,
        scale: 1,
        clipPath: 'inset(0 0% 0 0% round 999px)',
        duration: 0.24,
        ease: 'power2.out',
      }, 1.02);

      tl.to(stageGlow, {
        opacity: 0.42,
        scale: 1.08,
        duration: 0.22,
        ease: 'power2.out',
      }, 1.06);

      tl.to(leftChars, {
        color: '#E8FF00',
        textShadow: '0 0 16px rgba(232,255,0,0.34), 0 0 28px rgba(232,255,0,0.18)',
        filter: 'brightness(1.12)',
        duration: 0.16,
        stagger: {
          each: 0.035,
          from: 'end',
        },
        ease: 'power2.out',
      }, 1.08);

      tl.to(rightChars, {
        color: '#E8FF00',
        textShadow: '0 0 16px rgba(232,255,0,0.34), 0 0 28px rgba(232,255,0,0.18)',
        filter: 'brightness(1.12)',
        duration: 0.16,
        stagger: 0.035,
        ease: 'power2.out',
      }, 1.08);

      tl.to(energyChars, {
        color: '#FFFFFF',
        textShadow: '0 0 0 rgba(232,255,0,0)',
        filter: 'brightness(1)',
        duration: 0.28,
        stagger: {
          each: 0.02,
          from: 'center',
        },
        ease: 'power2.inOut',
      }, 1.36);

      tl.to(network, {
        opacity: 0.28,
        duration: 0.3,
        ease: 'power2.out',
      }, 1.44);

      tl.to(word, {
        yPercent: -34,
        duration: 0.4,
        ease: 'power3.inOut',
      }, 1.76);

      tl.to(chars, {
        yPercent: -12,
        duration: 0.34,
        ease: 'power2.inOut',
        stagger: {
          each: 0.013,
          from: 'center',
        },
      }, 1.8);

      tl.to([boltGlow, stageGlow], {
        opacity: 0.9,
        scale: 1.65,
        duration: 0.28,
        ease: 'power3.out',
      }, 2.32);

      tl.to(bolt, {
        scale: 2.7,
        duration: 0.32,
        ease: 'power3.in',
        filter: 'drop-shadow(0 0 32px rgba(232,255,0,0.72))',
      }, 2.32);

      tl.to(flash, {
        opacity: flashPeak,
        duration: 0.12,
        ease: 'power3.out',
      }, 2.44);

      tl.to(aperture, {
        opacity: 1,
        scale: 1,
        clipPath: 'circle(138% at 50% 50%)',
        duration: 0.42,
        ease: 'expo.inOut',
      }, 2.46);

      tl.to(container, {
        opacity: 0,
        duration: 0.34,
        ease: 'power2.inOut',
      }, 2.82);

      if (debug.slowMo) {
        tl.timeScale(debug.slowMo);
      }

      if (debug.freezeAt !== null) {
        tl.pause(debug.freezeAt);
      }
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black px-4"
      style={{contain: 'layout paint style', opacity: 0}}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(232,255,0,0.09), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%)',
        }}
      />

      <div
        ref={stageGlowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42vmax] w-[42vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        aria-hidden="true"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle, rgba(232,255,0,0.18) 0%, rgba(232,255,0,0.12) 22%, rgba(232,255,0,0.05) 42%, transparent 70%)',
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
            'radial-gradient(circle at 50% 50%, rgba(244,255,161,0.96) 0%, rgba(232,255,0,0.5) 18%, rgba(232,255,0,0.12) 42%, transparent 72%)',
          willChange: 'opacity',
        }}
      />

      <div
        ref={apertureRef}
        className="pointer-events-none absolute inset-0 bg-white"
        aria-hidden="true"
        style={{opacity: 0, willChange: 'clip-path, opacity, transform'}}
      />

      <div className="relative w-full max-w-[min(92rem,96vw)] text-center">
        <div ref={wordRef} className="relative inline-flex items-center justify-center">
          <img
            ref={networkRef}
            src={NETWORK_SRC}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 w-[min(78vw,38rem)] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-0 mix-blend-screen"
            style={{willChange: 'transform, opacity, clip-path, filter'}}
            draggable={false}
          />

          <h1
            className="display-font relative z-[1] select-none whitespace-nowrap text-[clamp(1.9rem,8.9vw,10.8rem)] font-black leading-none tracking-[-0.04em] text-white"
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
                    style={{opacity: 1}}
                  >
                    {char}
                  </span>

                  {isLightningSlot && (
                    <span
                      ref={boltRef}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-[3] inline-flex h-[0.98em] w-[0.36em] -translate-y-[48%] items-center justify-center opacity-0"
                      aria-hidden="true"
                      style={{willChange: 'transform, opacity, filter'}}
                    >
                      <span
                        ref={boltGlowRef}
                        className="absolute left-1/2 top-1/2 h-[1.7em] w-[1.25em] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(244,255,161,0.86) 0%, rgba(232,255,0,0.34) 36%, rgba(232,255,0,0.14) 55%, transparent 76%)',
                          willChange: 'transform, opacity',
                        }}
                      />
                      <img
                        src={BOLT_SRC}
                        alt=""
                        aria-hidden="true"
                        className="relative h-full w-full select-none object-contain drop-shadow-[0_0_18px_rgba(232,255,0,0.42)]"
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
