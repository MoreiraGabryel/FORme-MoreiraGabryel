import {useLayoutEffect, useRef} from 'react';
import type {CSSProperties, Dispatch, SetStateAction} from 'react';
import {gsap} from 'gsap';
import type {Locale} from '../../i18n/useTranslation';
import type {HomeCopy} from '../../config/homeContent';

const HERO_SLICE_SEGMENTS = [
  [0, 13],
  [13, 27],
  [27, 41],
  [41, 59],
  [59, 73],
  [73, 87],
  [87, 100],
] as const;

export function HeroIntro({
  copy,
  locale,
  setLocale,
  phraseIndex,
  heroProgress,
  overlayStyle,
  introStyle,
  footerStyle,
}: {
  copy: HomeCopy;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  phraseIndex: number;
  heroProgress: number;
  overlayStyle: CSSProperties;
  introStyle: CSSProperties;
  footerStyle: CSSProperties;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLElement>(null);
  const brandMarkRef = useRef<HTMLAnchorElement>(null);
  const brandCaptionRef = useRef<HTMLSpanElement>(null);
  const langSwitchRef = useRef<HTMLDivElement>(null);
  const introCopyRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRealRef = useRef<HTMLSpanElement>(null);
  const titleSliceRefs = useRef<HTMLSpanElement[]>([]);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const supportRef = useRef<HTMLParagraphElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    const overlay = overlayRef.current;
    const frame = frameRef.current;
    const topBar = topBarRef.current;
    const brandMark = brandMarkRef.current;
    const brandCaption = brandCaptionRef.current;
    const langSwitch = langSwitchRef.current;
    const introCopy = introCopyRef.current;
    const titleWrap = titleWrapRef.current;
    const titleReal = titleRealRef.current;
    const kicker = kickerRef.current;
    const support = supportRef.current;
    const footer = footerRef.current;
    const card = cardRef.current;
    const cue = cueRef.current;
    const slices = titleSliceRefs.current.slice(0, HERO_SLICE_SEGMENTS.length);

    if (
      !root ||
      !media ||
      !overlay ||
      !frame ||
      !topBar ||
      !brandMark ||
      !brandCaption ||
      !langSwitch ||
      !introCopy ||
      !titleWrap ||
      !titleReal ||
      !kicker ||
      !support ||
      !footer ||
      !card ||
      !cue ||
      slices.length !== HERO_SLICE_SEGMENTS.length
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const setIdle = () => {
        gsap.set(root, {'--hero-handoff': 0});
        gsap.set(media, {opacity: 1, scale: 1, filter: 'blur(0px) saturate(1) brightness(1)'});
        gsap.set(overlay, {opacity: 1, filter: 'blur(0px) brightness(1)'});
        gsap.set(frame, {opacity: 1, scale: 1, filter: 'blur(0px)'});
        gsap.set(topBar, {opacity: 1, y: 0, filter: 'blur(0px)'});
        gsap.set([brandMark, brandCaption, langSwitch], {opacity: 1, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set(introCopy, {opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'});
        gsap.set(titleWrap, {opacity: 1});
        gsap.set(titleReal, {opacity: 1, y: 0, scale: 1, filter: 'blur(0px)'});
        gsap.set(slices, {autoAlpha: 0, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set([kicker, support], {opacity: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(footer, {opacity: 1, y: 0, filter: 'blur(0px)'});
        gsap.set([card, cue], {opacity: 1, y: 0, filter: 'blur(0px)'});
      };

      setIdle();

      let handoffTl: gsap.core.Timeline | null = null;

      const handleHandoff = (event: Event) => {
        const detail = (event as CustomEvent<{reducedMotion?: boolean}>).detail ?? {};
        const reducedMotion = !!detail.reducedMotion;
        handoffTl?.kill();

        const sliceOffsets = [-8, -5, -3, 0, 3, 5, 8];
        const sliceBlur = reducedMotion ? [1.2, 1.2, 1, 0.8, 1, 1.2, 1.2] : [4, 3.5, 3, 2.5, 3, 3.5, 4];

        gsap.set(root, {'--hero-handoff': 1});
        gsap.set(media, {
          opacity: reducedMotion ? 0.9 : 0.78,
          scale: reducedMotion ? 1.008 : 1.022,
          filter: `blur(${reducedMotion ? 2.5 : 8}px) saturate(${reducedMotion ? 0.94 : 0.88}) brightness(${reducedMotion ? 0.96 : 0.88})`,
        });
        gsap.set(overlay, {
          opacity: reducedMotion ? 0.94 : 1,
          filter: `blur(${reducedMotion ? 0.5 : 2}px) brightness(${reducedMotion ? 1 : 0.92})`,
        });
        gsap.set(frame, {
          opacity: reducedMotion ? 0.9 : 0.76,
          scale: reducedMotion ? 0.998 : 0.992,
          filter: `blur(${reducedMotion ? 2 : 6}px)`,
        });
        gsap.set(topBar, {
          opacity: reducedMotion ? 0.32 : 0.14,
          y: reducedMotion ? -2 : -8,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(brandMark, {
          opacity: reducedMotion ? 0.5 : 0.24,
          x: reducedMotion ? -2 : -8,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(brandCaption, {
          opacity: reducedMotion ? 0.38 : 0.14,
          x: reducedMotion ? -1 : -6,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(langSwitch, {
          opacity: reducedMotion ? 0.42 : 0.18,
          x: reducedMotion ? 2 : 8,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(introCopy, {
          opacity: reducedMotion ? 0.86 : 0.72,
          y: reducedMotion ? 3 : 10,
          scale: reducedMotion ? 0.998 : 0.994,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(titleReal, {
          opacity: reducedMotion ? 0.84 : 0.72,
          y: reducedMotion ? 1 : 4,
          scale: reducedMotion ? 0.999 : 0.996,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
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
        gsap.set([card, cue], {
          opacity: 0,
          y: reducedMotion ? 4 : 14,
          filter: `blur(${reducedMotion ? 2 : 6}px)`,
        });

        handoffTl = gsap.timeline({defaults: {overwrite: 'auto'}})
          .to(root, {
            '--hero-handoff': 0.56,
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
            autoAlpha: (index: number) => (reducedMotion ? 0.18 : index === 3 ? 0.48 : index === 2 || index === 4 ? 0.36 : 0.26),
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.15 : 0.28,
            ease: 'power3.out',
            stagger: 0.018,
          }, 0.06)
          .to(titleReal, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.34,
            ease: 'power3.out',
          }, 0.08)
          .to(slices, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.12 : 0.2,
            ease: 'sine.out',
            stagger: 0.01,
          }, reducedMotion ? 0.14 : 0.2)
          .to(topBar, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.24,
            ease: 'power2.out',
          }, reducedMotion ? 0.18 : 0.26)
          .to(brandMark, {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.22,
            ease: 'power2.out',
          }, reducedMotion ? 0.18 : 0.26)
          .to(brandCaption, {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.22,
            ease: 'power2.out',
          }, reducedMotion ? 0.2 : 0.29)
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
          .to([card, cue], {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.26,
            ease: 'power2.out',
            stagger: reducedMotion ? 0.02 : 0.05,
          }, reducedMotion ? 0.3 : 0.46)
          .to(root, {
            '--hero-handoff': 0,
            duration: reducedMotion ? 0.14 : 0.22,
            ease: 'sine.out',
          }, reducedMotion ? 0.34 : 0.52)
          .add(() => setIdle());
      };

      window.addEventListener('mg:loading-handoff', handleHandoff as EventListener);

      return () => {
        window.removeEventListener('mg:loading-handoff', handleHandoff as EventListener);
        handoffTl?.kill();
        setIdle();
      };
    }, root);

    return () => ctx.revert();
  }, [locale, phraseIndex]);

  return (
    <section ref={rootRef} className="hero-stage" style={{'--hero-progress': `${heroProgress}`} as CSSProperties}>
      <div ref={mediaRef} className="hero-media">
        <div ref={overlayRef} className="hero-overlay" style={overlayStyle} />
      </div>

      <div ref={frameRef} className="hero-frame">
        <header ref={topBarRef} className="top-bar">
          <div className="brand-lockup">
            <a ref={brandMarkRef} className="brand-mark" href="#home">
              MoreiraGabryel
            </a>
            <span ref={brandCaptionRef} className="brand-caption">{copy.heroTag}</span>
          </div>

          <div className="top-actions">
            <div ref={langSwitchRef} className="lang-switch" aria-label={copy.language}>
              <button className={locale === 'pt' ? 'is-active' : undefined} type="button" onClick={() => setLocale('pt')}>
                PT
              </button>
              <button className={locale === 'en' ? 'is-active' : undefined} type="button" onClick={() => setLocale('en')}>
                EN
              </button>
            </div>
          </div>
        </header>

        <div className="hero-center">
          <div ref={introCopyRef} className="hero-intro-copy" style={introStyle}>
            <p ref={kickerRef} className="hero-kicker">{copy.heroSubtag}</p>
            <div className="hero-statement-wrap" aria-live="polite">
              <div ref={titleWrapRef} key={`${locale}-${phraseIndex}`} className="hero-statement-handshake">
                <span ref={titleRealRef} className="hero-statement-line hero-statement-real">
                  {copy.phrases[phraseIndex]}
                </span>
                <span className="hero-statement-slices" aria-hidden="true">
                  {HERO_SLICE_SEGMENTS.map(([start, end], index) => (
                    <span
                      key={`${locale}-${phraseIndex}-${start}-${end}`}
                      ref={(node) => {
                        if (node) titleSliceRefs.current[index] = node;
                      }}
                      className={`hero-statement-line hero-statement-slice hero-statement-slice-${index + 1}`}
                      style={{clipPath: `inset(0 ${100 - end}% 0 ${start}%)`}}
                    >
                      {copy.phrases[phraseIndex]}
                    </span>
                  ))}
                </span>
              </div>
            </div>
            <p ref={supportRef} className="hero-support">{copy.heroSupport}</p>
          </div>
        </div>

        <footer ref={footerRef} className="hero-footer" style={footerStyle}>
          <div ref={cardRef} className="hero-progress-card" aria-hidden="true">
            <div className="panel-heading">
              <span>Stage 01 / Image field</span>
              <span>{String(Math.round(heroProgress * 100)).padStart(2, '0')}%</span>
            </div>
            <div className="progress-rail hero-progress-rail">
              <span className="progress-fill" style={{transform: `scaleX(${heroProgress})`}} />
            </div>
          </div>
          <p ref={cueRef} className="scroll-cue">{copy.scrollCue}</p>
        </footer>
      </div>
    </section>
  );
}
