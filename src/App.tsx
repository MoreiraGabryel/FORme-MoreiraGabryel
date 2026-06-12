import {startTransition, useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {LoadingScreen} from './components/sections/LoadingScreen';
import {HeroIntro} from './components/sections/HeroIntro';
import {ScrollTransitionStage} from './components/sections/ScrollTransitionStage';
import {HOME_COPY} from './config/homeContent';
import {useTranslation} from './i18n/useTranslation';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const {locale, setLocale} = useTranslation();
  const copy = HOME_COPY[locale];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const transitionSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPhraseIndex(0);
  }, [locale]);

  useEffect(() => {
    const phraseCount = copy.phrases.length;
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setPhraseIndex((current) => {
          if (phraseCount <= 1) return current;

          let next = current;
          while (next === current) {
            next = Math.floor(Math.random() * phraseCount);
          }

          return next;
        });
      });
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, [copy.phrases]);

  useEffect(() => {
    const section = transitionSectionRef.current;
    if (!section) return;

    let frame = 0;

    const updateProgress = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const rawHero = window.scrollY / (viewportHeight * 0.92);
      setHeroProgress(clamp(rawHero, 0, 1));

      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const introOffset = viewportHeight * 0.22;
      const available = Math.max(section.offsetHeight - window.innerHeight - introOffset, 1);
      const raw = (window.scrollY - (sectionTop + introOffset)) / available;
      setStageProgress(clamp(raw, 0, 1));
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  const stageVideoReveal = clamp((stageProgress - 0.04) / 0.38, 0, 1);
  const stageImageFade = clamp(1 - stageVideoReveal * 0.9, 0.1, 1);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <main className="site-shell">
        <HeroIntro
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          phraseIndex={phraseIndex}
          heroProgress={heroProgress}
          imageStyle={{
            opacity: 0.34 - heroProgress * 0.16,
            transform: `translate3d(0, ${heroProgress * 7}vh, 0) scale(${1.02 + heroProgress * 0.12})`,
            filter: `saturate(${0.84 + heroProgress * 0.22}) brightness(${0.48 - heroProgress * 0.08}) contrast(${1.06 + heroProgress * 0.08})`,
          }}
          overlayStyle={{
            opacity: 1 - heroProgress * 0.18,
          }}
          introStyle={{
            opacity: 1 - heroProgress * 0.92,
            transform: `translate3d(0, ${heroProgress * -10}vh, 0) scale(${1 - heroProgress * 0.05})`,
            filter: `blur(${heroProgress * 7}px)`,
          }}
          footerStyle={{
            opacity: 1 - heroProgress * 0.94,
            transform: `translate3d(0, ${heroProgress * -4}vh, 0)`,
          }}
        />

        <section ref={transitionSectionRef}>
          <ScrollTransitionStage
            copy={copy}
            stageProgress={stageProgress}
            stageStyle={{'--stage-progress': `${stageProgress}`} as CSSProperties}
            mediaShellStyle={{
              inset: `${14 - stageProgress * 8}vh ${8 - stageProgress * 3.2}vw ${10 - stageProgress * 5}vh ${8 - stageProgress * 3.2}vw`,
              borderRadius: `${2.25 - stageProgress * 1.7}rem`,
              transform: `translate3d(0, ${(1 - stageProgress) * 4.5}vh, 0) scale(${0.94 + stageProgress * 0.06})`,
              boxShadow: `0 ${24 - stageProgress * 8}px ${70 - stageProgress * 10}px rgba(0, 0, 0, ${0.3 - stageProgress * 0.06})`,
            }}
            imageStyle={{
              opacity: stageImageFade,
              transform: `translate3d(0, ${stageProgress * 2.2}vh, 0) scale(${1.08 + stageProgress * 0.1})`,
              filter: `saturate(${0.88 + stageProgress * 0.1}) brightness(${0.38 - stageProgress * 0.02}) contrast(${1.04 + stageProgress * 0.05})`,
            }}
            videoStyle={{
              opacity: stageVideoReveal * 0.58,
              transform: `translate3d(0, ${stageProgress * -0.7}vh, 0) scale(${1.08 + stageProgress * 0.06})`,
              filter: `saturate(${0.86 + stageProgress * 0.1}) brightness(${0.34 + stageVideoReveal * 0.1}) contrast(${1.08 + stageProgress * 0.04})`,
            }}
          />
        </section>
      </main>
    </>
  );
}
