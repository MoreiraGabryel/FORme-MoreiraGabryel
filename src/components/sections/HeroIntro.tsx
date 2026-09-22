import {useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties, Dispatch, SetStateAction} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {Locale} from '../../i18n/useTranslation';
import type {HomeCopy} from '../../config/homeContent';
import {HERO_SCENE, HERO_SCENE_REDUCED_MOTION} from '../../config/scenes';
import {getLoadingHeroZoomMotion} from '../../utils/loadingHeroZoomMotion';
import {getHeroStatementMotion, splitHeroStatementLine} from '../../utils/heroStatementMotion';
import {getStableViewportHeight} from '../../utils/stableViewport';
import {LanguageSwitch} from '../common/LanguageSwitch';

gsap.registerPlugin(ScrollTrigger);

const HERO_PHRASE_MOBILE_LINES: Record<string, string[]> = {
  'Construo interfaces que sustentam produto, narrativa e performance.': [
    'Construo interfaces',
    'que sustentam',
    'produto, narrativa',
    'e performance.',
  ],
  'Transformo requisitos complexos em sistemas visuais claros e escaláveis.': [
    'Transformo',
    'requisitos',
    'complexos em',
    'sistemas visuais',
    'claros e escaláveis.',
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
    'para parecerem',
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
    'narrative,',
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
    'performance,',
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
  const requestedPhrase = copy.phrases[phraseIndex];
  const [displayedPhrase, setDisplayedPhrase] = useState(requestedPhrase);
  const displayedPhraseMobileLines = getHeroPhraseMobileLines(displayedPhrase);

  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const topBarRef = useRef<HTMLElement>(null);
  const langSwitchRef = useRef<HTMLDivElement>(null);
  const introCopyRef = useRef<HTMLDivElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleRealRef = useRef<HTMLSpanElement>(null);
  const characterRefs = useRef<HTMLSpanElement[]>([]);
  const shouldAnimatePhraseEntryRef = useRef(false);
  const footerRef = useRef<HTMLElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

  const phraseLineWords = displayedPhraseMobileLines.map(splitHeroStatementLine);
  const getCharacterIndex = (lineIndex: number, wordIndex: number, characterIndex: number) =>
    phraseLineWords.slice(0, lineIndex).flat(2).length +
    phraseLineWords[lineIndex].slice(0, wordIndex).flat().length +
    characterIndex;
  const statementCharacterCount = phraseLineWords.flat(2).length;
  const phraseLineNodes = phraseLineWords.map((words, lineIndex) => {

    return (
      <span key={`${words.flat().join('')}-${lineIndex}`} className="hero-statement-phrase-line">
        {words.map((characters, wordIndex) => (
          <span key={`${characters.join('')}-${wordIndex}`} className="hero-statement-word">
            {characters.map((character, characterIndex) => {
              const currentCharacterIndex = getCharacterIndex(lineIndex, wordIndex, characterIndex);

              return (
                <span
                  key={`${character}-${currentCharacterIndex}`}
                  ref={(node) => {
                    if (node) characterRefs.current[currentCharacterIndex] = node;
                  }}
                  className="hero-statement-character"
                  aria-hidden="true"
                >
                  {character}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    );
  });

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
    const footer = footerRef.current;
    const cue = cueRef.current;
    const chars = characterRefs.current.slice(0, statementCharacterCount);

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
      !footer ||
      !cue ||
      chars.length !== statementCharacterCount
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobileViewport = window.matchMedia('(max-width: 640px)').matches;
      const statementMotion = getHeroStatementMotion(prefersReducedMotion);
      const setIdle = () => {

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
        });
        gsap.set(chars, {autoAlpha: 1, x: 0, y: 0, filter: 'blur(0px)'});
        gsap.set(footer, {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
        gsap.set(cue, {autoAlpha: 1, y: 0, filter: 'blur(0px)'});
      };

      setIdle();
      const heroScrollTimeline = gsap.timeline({
        defaults: {ease: 'none'},
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () =>
            `+=${Math.round(
              getStableViewportHeight() *
                (prefersReducedMotion ? HERO_SCENE_REDUCED_MOTION : HERO_SCENE).lengthInViewports,
            )}`,
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
        .to(chars, {
          autoAlpha: 0,
          y: statementMotion.exit.y,
          filter: `blur(${statementMotion.exit.blur}px)`,
          duration: statementMotion.exit.duration,
          ease: 'power2.in',
          force3D: true,
          stagger: {amount: prefersReducedMotion ? 0 : 0.18, from: statementMotion.exit.from},
        }, prefersReducedMotion ? 0.74 : 0.76)
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

        const zoomMotion = getLoadingHeroZoomMotion({isMobile: isMobileViewport, prefersReducedMotion: reducedMotion});
        const handoffStatementMotion = getHeroStatementMotion(reducedMotion);


        gsap.set(media, {
          opacity: reducedMotion ? 0.92 : 0.84,
          scale: zoomMotion.heroStartScale,
          filter: `blur(${zoomMotion.heroStartBlur}px)`,
          transformOrigin: '50% 50%',
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
          opacity: reducedMotion ? 0.9 : 0.78,
          y: reducedMotion ? 0.5 : 6,
          scale: reducedMotion ? 1 : 0.986,
          filter: `blur(${reducedMotion ? 0.9 : 3.4}px)`,
        });
        gsap.set(chars, {
          autoAlpha: 0,
          y: handoffStatementMotion.entry.y,
          filter: `blur(${handoffStatementMotion.entry.blur}px)`,
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
          .to(media, {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px) saturate(1) brightness(1)',
            duration: zoomMotion.heroSettleDuration,
            ease: 'power2.inOut',
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
          .to(chars, {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: handoffStatementMotion.entry.duration,
            ease: 'power3.out',
            force3D: true,
            stagger: {each: statementMotion.entry.stagger, from: statementMotion.entry.from},
          }, 0.12)
          .to(titleReal, {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: reducedMotion ? 0.16 : 0.34,
            ease: 'power4.out',
          }, 0.16)
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
          }, reducedMotion ? 0.3 : 0.46);

        const handoffDuration =
          0.12 + handoffStatementMotion.entry.duration + Math.max(chars.length - 1, 0) * handoffStatementMotion.entry.stagger;
        handoffResetCall = gsap.delayedCall(Math.max(reducedMotion ? 0.74 : 0.96, handoffDuration + 0.12), finishHandoff);
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
  }, [displayedPhrase, statementCharacterCount]);

  useLayoutEffect(() => {
    if (requestedPhrase === displayedPhrase) return;

    const chars = characterRefs.current.slice(0, statementCharacterCount);
    if (chars.length !== statementCharacterCount) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statementMotion = getHeroStatementMotion(prefersReducedMotion);
    const transition = gsap.timeline({
      onComplete: () => {
        shouldAnimatePhraseEntryRef.current = true;
        setDisplayedPhrase(requestedPhrase);
      },
    });

    transition
      .to(chars, {
        autoAlpha: 0,
        y: statementMotion.exit.y,
        filter: `blur(${statementMotion.exit.blur}px)`,
        duration: statementMotion.exit.duration,
        ease: 'power2.in',
        force3D: true,
        stagger: {each: statementMotion.exit.stagger, from: statementMotion.exit.from},
      })
      .add(() => undefined, `+=${statementMotion.phraseGap}`);

    return () => {
      transition.kill();
    };
  }, [displayedPhrase, requestedPhrase, statementCharacterCount]);

  useLayoutEffect(() => {
    if (!shouldAnimatePhraseEntryRef.current) return;

    const chars = characterRefs.current.slice(0, statementCharacterCount);
    if (chars.length !== statementCharacterCount) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statementMotion = getHeroStatementMotion(prefersReducedMotion);
    shouldAnimatePhraseEntryRef.current = false;

    gsap.set(chars, {
      autoAlpha: 0,
      y: statementMotion.entry.y,
      filter: `blur(${statementMotion.entry.blur}px)`,
    });

    const transition = gsap.to(chars, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: statementMotion.entry.duration,
      ease: 'power3.out',
      force3D: true,
      stagger: {each: statementMotion.entry.stagger, from: statementMotion.entry.from},
    });

    return () => {
      transition.kill();
    };
  }, [displayedPhrase, statementCharacterCount]);

  return (
    <section ref={rootRef} className="hero-stage" style={{'--hero-progress': `${heroProgress}`} as CSSProperties}>
      <div ref={mediaRef} className="hero-media">
        <div ref={overlayRef} className="hero-overlay" />
      </div>

      <div ref={frameRef} className="hero-frame">
        <header ref={topBarRef} className="top-bar">
          <div className="top-actions">
            <LanguageSwitch ref={langSwitchRef} locale={locale} setLocale={setLocale} label={copy.language} />
          </div>
        </header>

        <div className="hero-center">
          <div ref={introCopyRef} className="hero-intro-copy">
            <div className="hero-statement-wrap" aria-live="polite">
              <div ref={titleWrapRef} className="hero-statement-handshake">
                <span ref={titleRealRef} className="hero-statement-line hero-statement-real" aria-label={displayedPhrase}>
                  <span key={`${locale}-${displayedPhrase}`} className="hero-statement-phrase" aria-hidden="true">
                    {phraseLineNodes}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <footer ref={footerRef} className="hero-footer">
          <p ref={cueRef} className="scroll-cue" aria-label={copy.scrollCue}>
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
