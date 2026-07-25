import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties, Dispatch, SetStateAction} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {Locale} from '../../i18n/useTranslation';
import type {HomeCopy} from '../../config/homeContent';

gsap.registerPlugin(ScrollTrigger);

const HERO_SLICE_SEGMENTS = [
  [0, 13],
  [13, 27],
  [27, 41],
  [41, 59],
  [59, 73],
  [73, 87],
  [87, 100],
] as const;


const HERO_PHRASE_MOBILE_LINES: Record<string, string[]> = {
  'Construo interfaces que sustentam produto, narrativa e performance.': [
    'Construo interfaces',
    'que sustentam',
    'produto, narrativa',
    'e performance.',
  ],
  'Transformo requisitos complexos em sistemas visuais claros e escaláveis.': [
    'Transformo requisitos',
    'complexos em sistemas',
    'visuais claros',
    'e escaláveis.',
  ],
  'Crio experiências digitais onde código, motion e usabilidade trabalham juntos.': [
    'Crio experiências',
    'digitais onde',
    'código, motion',
    'e usabilidade',
    'trabalham juntos.',
  ],
  'Desenho fluxos que aproximam automação, performance e presença visual.': [
    'Desenho fluxos',
    'que aproximam',
    'automação,',
    'performance',
    'e presença visual.',
  ],
  'Projeto camadas de interface para parecerem precisas antes mesmo do clique.': [
    'Projeto camadas',
    'de interface',
    'precisas antes',
    'mesmo do clique.',
  ],
  'Conecto front-end, lógica e direção visual em experiências com intenção real.': [
    'Conecto front-end,',
    'lógica e direção',
    'visual em',
    'experiências',
    'com intenção real.',
  ],
  'I build interfaces that align product thinking, narrative, and performance.': [
    'I build interfaces',
    'that align',
    'product thinking,',
    'narrative',
    'and performance.',
  ],
  'I turn complex requirements into visual systems that feel clear and scalable.': [
    'I turn complex',
    'requirements into',
    'visual systems',
    'that feel clear',
    'and scalable.',
  ],
  'I create digital experiences where code, motion, and usability move together.': [
    'I create digital',
    'experiences where',
    'code, motion,',
    'and usability',
    'move together.',
  ],
  'I design flows that connect automation, performance, and visual presence.': [
    'I design flows',
    'that connect',
    'automation,',
    'performance',
    'and visual presence.',
  ],
  'I shape interface layers to feel precise before the first click happens.': [
    'I shape interface',
    'layers to feel',
    'precise before',
    'the first click',
    'happens.',
  ],
  'I connect front-end logic and visual direction into experiences with intent.': [
    'I connect front-end',
    'logic and visual',
    'direction into',
    'experiences',
    'with intent.',
  ],
};

function getHeroPhraseMobileLines(phrase: string) {
  return HERO_PHRASE_MOBILE_LINES[phrase] ?? [phrase];
}

export function HeroIntro({
  copy,
  locale,
  setLocale,
  phraseIndex,
  heroProgress,
}: {
  copy: HomeCopy;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  phraseIndex: number;
  heroProgress: number;
}) {
  const phrase = copy.phrases[phraseIndex];
  const phraseMobileLines = getHeroPhraseMobileLines(phrase);
  const phraseLineNodes = phraseMobileLines.map((line) => (
    <span key={line} className="hero-statement-phrase-line">
      {line}
    </span>
  ));

  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLElement>(null);
  const langSwitchRef = useRef<HTMLDivElement>(null);
  const introCopyRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRealRef = useRef<HTMLSpanElement>(null);
  const titleSliceRefs = useRef<HTMLSpanElement[]>([]);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const supportRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    const overlay = overlayRef.current;
    const frame = frameRef.current;
    const topBar = topBarRef.current;
    const langSwitch = langSwitchRef.current;
    const introCopy = introCopyRef.current;
    const titleWrap = titleWrapRef.current;
    const titleReal = titleRealRef.current;
    const kicker = kickerRef.current;
    const support = supportRef.current;
    const footer = footerRef.current;
    const cue = cueRef.current;
    const slices = titleSliceRefs.current.slice(0, HERO_SLICE_SEGMENTS.length);

    if (
      !root ||
      !media ||
      !overlay ||
      !frame ||
      !topBar ||
      !langSwitch ||
      !introCopy ||
      !titleWrap ||
      !titleReal ||
      !kicker ||
      !support ||
      !footer ||
      !cue ||
      slices.length !== HERO_SLICE_SEGMENTS.length
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const setIdle = () => {
        root.classList.remove('is-handoff-active');
        root.classList.remove('is-hero-entering');
        gsap.set(root, {
          '--hero-handoff': 0,
          '--hero-exit-sweep': '-18%',
          '--hero-title-glow': 0,
        });
        gsap.set(media, {opacity: 1, scale: 1, filter: 'blur(0px) saturate(1) brightness(1)'});
        gsap.set(overlay, {opacity: 1, filter: 'blur(0px) brightness(1)'});
        gsap.set(frame, {autoAlpha: 1, scale: 1, filter: 'blur(0px)'});
        gsap.set(topBar, {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(langSwitch, {autoAlpha: 1, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set(introCopy, {autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)'});
        gsap.set(titleWrap, {opacity: 1});
        gsap.set(titleReal, {
          autoAlpha: 1,
          yPercent: 0,
          scale: 1,
          filter: 'blur(0px)',
          '--hero-title-mask': '140%',
        });
        gsap.set(slices, {autoAlpha: 0, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set([kicker, support], {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(footer, {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(cue, {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
      };

      setIdle();

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobileViewport = window.matchMedia('(max-width: 640px)').matches;
      const mobileViewportHeight = Math.max(window.innerHeight, 1);
      if (isMobileViewport) {
        root.style.setProperty('--hero-mobile-height', `${Math.round(mobileViewportHeight)}px`);
      } else {
        root.style.removeProperty('--hero-mobile-height');
      }
      const heroScrollTimeline = gsap.timeline({
        defaults: {ease: 'none'},
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${Math.round((isMobileViewport ? mobileViewportHeight : window.innerHeight) * (prefersReducedMotion ? 1.1 : 1.6))}`,
          scrub: prefersReducedMotion ? 0.12 : 0.6,
          pin: root,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      heroScrollTimeline
        .fromTo(
          media,
          {opacity: 1, scale: 1, yPercent: 0, filter: 'blur(0px) saturate(1) brightness(1)'},
          {
            scale: prefersReducedMotion ? 1.006 : 1.045,
            yPercent: prefersReducedMotion ? -0.4 : -3.8,
            filter: prefersReducedMotion
              ? 'blur(0px) saturate(0.99) brightness(0.99)'
              : 'blur(1.2px) saturate(0.92) brightness(0.86)',
            duration: prefersReducedMotion ? 0.72 : 0.76,
          },
          0,
        )
        .to(root, {
          '--hero-handoff': prefersReducedMotion ? 0.28 : 0.72,
          '--hero-exit-sweep': prefersReducedMotion ? '42%' : '118%',
          '--hero-title-glow': prefersReducedMotion ? 0.25 : 1,
          duration: prefersReducedMotion ? 0.12 : 0.2,
        }, prefersReducedMotion ? 0.68 : 0.68)
        .to(cue, {
          autoAlpha: 0,
          y: prefersReducedMotion ? 0 : 20,
          filter: `blur(${prefersReducedMotion ? 0 : 4}px)`,
          duration: prefersReducedMotion ? 0.08 : 0.16,
        }, prefersReducedMotion ? 0.7 : 0.72)
        .to(footer, {
          autoAlpha: 0,
          y: prefersReducedMotion ? 0 : 18,
          filter: `blur(${prefersReducedMotion ? 0 : 4.5}px)`,
          duration: prefersReducedMotion ? 0.08 : 0.18,
        }, prefersReducedMotion ? 0.72 : 0.74)
        .to([kicker, support], {
          autoAlpha: 0,
          y: prefersReducedMotion ? 0 : -18,
          scale: prefersReducedMotion ? 1 : 0.992,
          filter: `blur(${prefersReducedMotion ? 0 : 5}px)`,
          duration: prefersReducedMotion ? 0.08 : 0.2,
          stagger: prefersReducedMotion ? 0 : 0.032,
        }, prefersReducedMotion ? 0.73 : 0.75)
        .to(slices, {
          autoAlpha: prefersReducedMotion ? 0 : (index: number) => [0.1, 0.16, 0.24, 0.34, 0.24, 0.16, 0.1][index],
          x: (index: number) => prefersReducedMotion ? 0 : [-12, -8, -4, 0, 4, 8, 12][index],
          y: (index: number) => prefersReducedMotion ? 0 : (index - 3) * 1.4,
          filter: `blur(${prefersReducedMotion ? 0 : 1.1}px) brightness(${prefersReducedMotion ? 1 : 1.12})`,
          duration: prefersReducedMotion ? 0.04 : 0.13,
          stagger: prefersReducedMotion ? 0 : 0.01,
        }, prefersReducedMotion ? 0.74 : 0.76)
        .to(titleReal, {
          autoAlpha: prefersReducedMotion ? 0.72 : 0.58,
          yPercent: prefersReducedMotion ? 0 : -3,
          scale: prefersReducedMotion ? 1 : 0.996,
          filter: `blur(${prefersReducedMotion ? 0 : 1.6}px) brightness(${prefersReducedMotion ? 1 : 1.16})`,
          '--hero-title-mask': prefersReducedMotion ? '92%' : '58%',
          duration: prefersReducedMotion ? 0.08 : 0.16,
        }, prefersReducedMotion ? 0.75 : 0.78)
        .to(titleReal, {
          autoAlpha: 0,
          yPercent: prefersReducedMotion ? 0 : -9,
          scale: prefersReducedMotion ? 1 : 0.986,
          filter: `blur(${prefersReducedMotion ? 0 : 5}px) brightness(${prefersReducedMotion ? 1 : 0.9})`,
          '--hero-title-mask': prefersReducedMotion ? '140%' : '0%',
          duration: prefersReducedMotion ? 0.08 : 0.2,
        }, prefersReducedMotion ? 0.8 : 0.84)
        .to(slices, {
          autoAlpha: 0,
          x: (index: number) => prefersReducedMotion ? 0 : [-20, -14, -8, -3, 8, 14, 20][index],
          y: (index: number) => prefersReducedMotion ? 0 : (index - 3) * 2.2,
          filter: `blur(${prefersReducedMotion ? 0 : 5}px) brightness(${prefersReducedMotion ? 1 : 0.82})`,
          duration: prefersReducedMotion ? 0.05 : 0.17,
          stagger: prefersReducedMotion ? 0 : 0.008,
        }, prefersReducedMotion ? 0.78 : 0.82)
        .to(root, {
          '--hero-handoff': 0,
          '--hero-exit-sweep': prefersReducedMotion ? '42%' : '132%',
          '--hero-title-glow': 0,
          duration: prefersReducedMotion ? 0.06 : 0.12,
        }, prefersReducedMotion ? 0.84 : 0.9)
        .to(topBar, {
          autoAlpha: 0,
          y: prefersReducedMotion ? 0 : -14,
          filter: `blur(${prefersReducedMotion ? 0 : 5}px)`,
          duration: prefersReducedMotion ? 0.08 : 0.16,
        }, prefersReducedMotion ? 0.78 : 0.83)
        .to(
          media,
          {
            autoAlpha: 0,
            scale: prefersReducedMotion ? 1 : isMobileViewport ? 1.16 : 1.28,
            yPercent: 0,
            filter: prefersReducedMotion
              ? 'blur(0px) saturate(1) brightness(0.82)'
              : 'blur(1.6px) saturate(0.88) brightness(0.48)',
            duration: prefersReducedMotion ? 0.08 : 0.12,
          },
          prefersReducedMotion ? 0.88 : 0.88,
        )
        .to(
          overlay,
          {
            autoAlpha: 0,
            duration: prefersReducedMotion ? 0.06 : 0.1,
          },
          prefersReducedMotion ? 0.9 : 0.9,
        );

      let handoffTl: gsap.core.Timeline | null = null;
      let handoffResetCall: gsap.core.Tween | null = null;
      let handoffFrame = 0;

      const finishHandoff = () => {
        handoffResetCall?.kill();
        handoffResetCall = null;
        handoffTl = null;
        setIdle();
      };

      const startHandoff = (reducedMotion: boolean) => {
        handoffTl?.kill();
        handoffResetCall?.kill();

        const sliceOffsets = [-8, -5, -3, 0, 3, 5, 8];
        const sliceBlur = reducedMotion ? [0.9, 0.9, 0.8, 0.7, 0.8, 0.9, 0.9] : [2.8, 2.4, 2.1, 1.8, 2.1, 2.4, 2.8];

        root.classList.add('is-handoff-active', 'is-hero-entering');
        gsap.set(root, {'--hero-handoff': 1});
        gsap.set(media, {
          opacity: reducedMotion ? 0.92 : 0.84,
          scale: reducedMotion ? 1.006 : 1.014,
          filter: `blur(${reducedMotion ? 2 : 6}px) saturate(${reducedMotion ? 0.96 : 0.92}) brightness(${reducedMotion ? 0.98 : 0.92})`,
        });
        gsap.set(overlay, {
          opacity: reducedMotion ? 0.96 : 0.96,
          filter: `blur(${reducedMotion ? 0.4 : 1.5}px) brightness(${reducedMotion ? 1 : 0.95})`,
        });
        gsap.set(frame, {
          opacity: reducedMotion ? 0.92 : 0.84,
          scale: reducedMotion ? 0.999 : 0.995,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(topBar, {
          opacity: reducedMotion ? 0.56 : 0.38,
          y: reducedMotion ? -1 : -4,
          filter: `blur(${reducedMotion ? 1 : 2.5}px)`,
        });
        gsap.set(langSwitch, {
          opacity: reducedMotion ? 0.62 : 0.46,
          x: reducedMotion ? 1 : 4,
          filter: `blur(${reducedMotion ? 1 : 2.5}px)`,
        });
        gsap.set(introCopy, {
          opacity: reducedMotion ? 0.92 : 0.84,
          y: reducedMotion ? 1 : 5,
          scale: 1,
          filter: 'blur(0px)',
        });
        gsap.set(titleReal, {
          opacity: reducedMotion ? 0.9 : 0.82,
          y: reducedMotion ? 0.5 : 3,
          scale: 1,
          filter: `blur(${reducedMotion ? 0.9 : 2.2}px)`,
        });
        gsap.set(slices, {
          autoAlpha: 0,
          y: 0,
          x: (index: number) => sliceOffsets[index],
          filter: (index: number) => `blur(${sliceBlur[index]}px)`,
        });
        gsap.set([kicker, support], {
          opacity: reducedMotion ? 0.4 : 0.16,
          y: reducedMotion ? 3 : 10,
          filter: `blur(${reducedMotion ? 2 : 5}px)`,
        });
        gsap.set(footer, {
          opacity: reducedMotion ? 0.32 : 0.08,
          y: reducedMotion ? 4 : 14,
          filter: `blur(${reducedMotion ? 2 : 6}px)`,
        });
        gsap.set(cue, {
          opacity: 0,
          y: reducedMotion ? 4 : 14,
          filter: `blur(${reducedMotion ? 2 : 6}px)`,
        });

        handoffTl = gsap.timeline({
          defaults: {overwrite: 'auto'},
          onComplete: finishHandoff,
          onInterrupt: finishHandoff,
        })
          .to(root, {
            '--hero-handoff': 0.42,
            duration: reducedMotion ? 0.16 : 0.24,
            ease: 'sine.out',
          }, 0)
          .to(media, {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px) saturate(1) brightness(1)',
            duration: reducedMotion ? 0.22 : 0.36,
            ease: 'power3.out',
          }, 0)
          .to(overlay, {
            opacity: 0.86,
            filter: 'blur(0px) brightness(1)',
            duration: reducedMotion ? 0.2 : 0.34,
            ease: 'power2.out',
          }, 0.02)
          .to(frame, {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.22 : 0.34,
            ease: 'power3.out',
          }, 0.03)
          .to(slices, {
            autoAlpha: (index: number) => (reducedMotion ? 0.12 : index === 3 ? 0.32 : index === 2 || index === 4 ? 0.24 : 0.17),
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.14 : 0.24,
            ease: 'power3.out',
            stagger: 0.016,
          }, 0.12)
          .to(titleReal, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.28,
            ease: 'power3.out',
          }, 0.16)
          .to(slices, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.1 : 0.16,
            ease: 'sine.out',
            stagger: 0.008,
          }, reducedMotion ? 0.22 : 0.28)
          .to(topBar, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.24,
            ease: 'power2.out',
          }, reducedMotion ? 0.18 : 0.26)
          .to(langSwitch, {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.22,
            ease: 'power2.out',
          }, reducedMotion ? 0.22 : 0.32)
          .to([kicker, support], {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.28,
            ease: 'power2.out',
            stagger: reducedMotion ? 0.02 : 0.05,
          }, reducedMotion ? 0.24 : 0.34)
          .to(footer, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.24,
            ease: 'power2.out',
          }, reducedMotion ? 0.28 : 0.42)
          .to(cue, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.26,
            ease: 'power2.out',
          }, reducedMotion ? 0.3 : 0.46)
          .to(root, {
            '--hero-handoff': 0,
            duration: reducedMotion ? 0.14 : 0.22,
            ease: 'sine.out',
          }, reducedMotion ? 0.44 : 0.64);

        handoffResetCall = gsap.delayedCall(reducedMotion ? 0.74 : 0.96, finishHandoff);
      };

      const handleHandoff = (event: Event) => {
        const detail = (event as CustomEvent<{reducedMotion?: boolean}>).detail ?? {};
        window.cancelAnimationFrame(handoffFrame);
        handoffFrame = window.requestAnimationFrame(() => {
          handoffFrame = 0;
          startHandoff(!!detail.reducedMotion);
        });
      };

      window.addEventListener('mg:loading-handoff', handleHandoff as EventListener);

      return () => {
        window.removeEventListener('mg:loading-handoff', handleHandoff as EventListener);
        window.cancelAnimationFrame(handoffFrame);
        handoffTl?.kill();
        handoffResetCall?.kill();
        setIdle();
      };
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="hero-stage" style={{'--hero-progress': `${heroProgress}`} as CSSProperties}>
      <div ref={mediaRef} className="hero-media">
        <div ref={overlayRef} className="hero-overlay" />
      </div>

      <div ref={frameRef} className="hero-frame">
        <header ref={topBarRef} className="top-bar">
          <div className="top-actions">
            <div
              ref={langSwitchRef}
              className={`lang-switch ${locale === 'en' ? 'is-en' : 'is-pt'}`}
              aria-label={copy.language}
              data-locale={locale}
            >
              <span className="lang-switch-thumb" aria-hidden="true">
                <span className="lang-flag lang-flag-br">
                  <svg className="lang-flag-icon" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
                    <circle className="lang-flag-ring" cx="32" cy="32" r="29" />
                    <path className="lang-flag-main" d="M32 11 55 32 32 53 9 32Z" />
                    <circle className="lang-flag-main" cx="32" cy="32" r="13.5" />
                    <path className="lang-flag-fill" d="M19.5 30.2c8.8-2.6 20.6-.8 25.6 5.4" />
                    <circle className="lang-flag-dot" cx="21.5" cy="36.5" r="1.15" />
                    <circle className="lang-flag-dot" cx="28" cy="39.8" r="1" />
                    <circle className="lang-flag-dot" cx="33" cy="37.2" r="0.95" />
                    <circle className="lang-flag-dot" cx="37.7" cy="40.1" r="1" />
                    <circle className="lang-flag-dot" cx="42" cy="35.6" r="0.95" />
                    <circle className="lang-flag-dot" cx="31.8" cy="44.2" r="0.85" />
                  </svg>
                </span>
                <span className="lang-flag lang-flag-us">
                  <svg className="lang-flag-icon" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
                    <defs>
                      <clipPath id="lang-us-circle">
                        <circle cx="32" cy="32" r="29" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#lang-us-circle)">
                      <rect className="lang-flag-bg" x="3" y="3" width="58" height="58" />
                      <path className="lang-flag-stripe" d="M23 10h38v5H23zM23 20h38v5H23zM23 30h38v5H23zM3 40h58v5H3zM3 50h58v5H3z" />
                    </g>
                    <circle className="lang-flag-ring" cx="32" cy="32" r="29" />
                    <g className="lang-flag-starfield">
                      <circle cx="13" cy="12" r="1.35" />
                      <circle cx="21" cy="12" r="1.35" />
                      <circle cx="29" cy="12" r="1.35" />
                      <circle cx="17" cy="18" r="1.25" />
                      <circle cx="25" cy="18" r="1.25" />
                      <circle cx="13" cy="24" r="1.25" />
                      <circle cx="21" cy="24" r="1.25" />
                      <circle cx="29" cy="24" r="1.25" />
                      <circle cx="17" cy="30" r="1.15" />
                      <circle cx="25" cy="30" r="1.15" />
                      <circle cx="13" cy="36" r="1.1" />
                      <circle cx="21" cy="36" r="1.1" />
                      <circle cx="29" cy="36" r="1.1" />
                    </g>
                  </svg>
                </span>
              </span>
              <button
                className={locale === 'pt' ? 'is-active' : undefined}
                type="button"
                aria-pressed={locale === 'pt'}
                onClick={() => setLocale('pt')}
              >
                <span className="lang-switch-code">PT</span>
              </button>
              <button
                className={locale === 'en' ? 'is-active' : undefined}
                type="button"
                aria-pressed={locale === 'en'}
                onClick={() => setLocale('en')}
              >
                <span className="lang-switch-code">EN</span>
              </button>
            </div>
          </div>
        </header>

        <div className="hero-center">
          <div ref={introCopyRef} className="hero-intro-copy">
            <p ref={kickerRef} className="hero-kicker">{copy.heroSubtag}</p>
            <div className="hero-statement-wrap" aria-live="polite">
              <div ref={titleWrapRef} className="hero-statement-handshake">
                <span ref={titleRealRef} className="hero-statement-line hero-statement-real">
                  <span key={`${locale}-${phraseIndex}`} className="hero-statement-phrase">
                    {phraseLineNodes}
                  </span>
                </span>
                <span className="hero-statement-slices" aria-hidden="true">
                  {HERO_SLICE_SEGMENTS.map(([start, end], index) => (
                    <span
                      key={`${start}-${end}`}
                      ref={(node) => {
                        if (node) titleSliceRefs.current[index] = node;
                      }}
                      className={`hero-statement-line hero-statement-slice hero-statement-slice-${index + 1}`}
                      style={{clipPath: `inset(0 ${100 - end}% 0 ${start}%)`}}
                    >
                      {phraseLineNodes}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <p ref={supportRef} className="hero-support">{copy.heroSupport}</p>
          </div>
        </div>

        <footer ref={footerRef} className="hero-footer">
          <p ref={cueRef} className="scroll-cue" aria-label={copy.scrollCue}>
            <span className="scroll-cue-label">{copy.scrollCue}</span>
            <span className="scroll-cue-arrows" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        </footer>
      </div>
    </section>
  );
}
