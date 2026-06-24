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
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRealRef = useRef<HTMLSpanElement>(null);
  const titleSliceRefs = useRef<HTMLSpanElement[]>([]);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const supportRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const titleWrap = titleWrapRef.current;
    const titleReal = titleRealRef.current;
    const kicker = kickerRef.current;
    const support = supportRef.current;
    const card = cardRef.current;
    const cue = cueRef.current;
    const slices = titleSliceRefs.current.slice(0, HERO_SLICE_SEGMENTS.length);

    if (!root || !titleWrap || !titleReal || !kicker || !support || !card || !cue || slices.length !== HERO_SLICE_SEGMENTS.length) {
      return;
    }

    const ctx = gsap.context(() => {
      const setIdle = () => {
        gsap.set(titleWrap, {opacity: 1});
        gsap.set(titleReal, {opacity: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(slices, {autoAlpha: 0, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set([kicker, support, card, cue], {opacity: 1, y: 0, filter: 'blur(0px)'});
      };

      setIdle();

      let handoffTl: gsap.core.Timeline | null = null;

      const handleHandoff = (event: Event) => {
        const detail = (event as CustomEvent<{reducedMotion?: boolean}>).detail ?? {};
        const reducedMotion = !!detail.reducedMotion;
        handoffTl?.kill();

        const sliceOffsets = [-8, -5, -3, 0, 3, 5, 8];
        const sliceBlur = reducedMotion ? [1.2, 1.2, 1, 0.8, 1, 1.2, 1.2] : [4, 3.5, 3, 2.5, 3, 3.5, 4];

        gsap.set(titleReal, {
          opacity: reducedMotion ? 0.82 : 0.68,
          y: reducedMotion ? 1 : 4,
          filter: `blur(${reducedMotion ? 1.5 : 4}px)`,
        });
        gsap.set(slices, {
          autoAlpha: 0,
          y: 0,
          x: (index: number) => sliceOffsets[index],
          filter: (index: number) => `blur(${sliceBlur[index]}px)`,
        });
        gsap.set([kicker, support], {
          opacity: reducedMotion ? 0.4 : 0.18,
          y: reducedMotion ? 3 : 10,
          filter: `blur(${reducedMotion ? 2 : 5}px)`,
        });
        gsap.set([card, cue], {
          opacity: 0,
          y: reducedMotion ? 4 : 14,
          filter: `blur(${reducedMotion ? 2 : 6}px)`,
        });

        handoffTl = gsap.timeline({defaults: {overwrite: 'auto'}})
          .to(slices, {
            autoAlpha: (index: number) => (reducedMotion ? 0.2 : index === 3 ? 0.52 : index === 2 || index === 4 ? 0.4 : 0.3),
            x: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.3,
            ease: 'power3.out',
            stagger: 0.018,
          }, 0)
          .to(titleReal, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.2 : 0.38,
            ease: 'power3.out',
          }, 0.04)
          .to(slices, {
            autoAlpha: 0,
            duration: reducedMotion ? 0.12 : 0.22,
            ease: 'sine.out',
            stagger: 0.01,
          }, reducedMotion ? 0.12 : 0.2)
          .to([kicker, support], {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.3,
            ease: 'power2.out',
            stagger: reducedMotion ? 0.02 : 0.05,
          }, reducedMotion ? 0.12 : 0.24)
          .to([card, cue], {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.18 : 0.28,
            ease: 'power2.out',
            stagger: reducedMotion ? 0.02 : 0.05,
          }, reducedMotion ? 0.2 : 0.34)
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
      <div className="hero-media">
        <div className="hero-overlay" style={overlayStyle} />
      </div>

      <div className="hero-frame">
        <header className="top-bar">
          <div className="brand-lockup">
            <a className="brand-mark" href="#home">
              MoreiraGabryel
            </a>
            <span className="brand-caption">{copy.heroTag}</span>
          </div>

          <div className="top-actions">
            <div className="lang-switch" aria-label={copy.language}>
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
          <div className="hero-intro-copy" style={introStyle}>
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

        <footer className="hero-footer" style={footerStyle}>
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
