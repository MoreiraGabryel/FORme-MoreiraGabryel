import {startTransition, useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {LoadingScreen} from './components/sections/LoadingScreen';
import {HeroIntro} from './components/sections/HeroIntro';
import {ScrollTransitionStage} from './components/sections/ScrollTransitionStage';
import {FakeFooterStage} from './components/sections/FakeFooterStage';
import {LegalPage} from './components/legal/LegalPage';
import {HOME_COPY} from './config/homeContent';
import {useTranslation} from './i18n/useTranslation';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const {locale, setLocale} = useTranslation();
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';
  const copy = HOME_COPY[locale];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [footerPhraseIndex, setFooterPhraseIndex] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [fakeFooterProgress, setFakeFooterProgress] = useState(0);
  const [scrollDirectionBias, setScrollDirectionBias] = useState(0);
  const transitionSectionRef = useRef<HTMLElement | null>(null);
  const fakeFooterSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPhraseIndex(0);
    setFooterPhraseIndex(0);
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
    const phraseCount = copy.footerPhrases.length;
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setFooterPhraseIndex((current) => {
          if (phraseCount <= 1) return current;

          let next = current;
          while (next === current) {
            next = Math.floor(Math.random() * phraseCount);
          }

          return next;
        });
      });
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, [copy.footerPhrases]);

  useEffect(() => {
    const transitionSection = transitionSectionRef.current;
    const fakeFooterSection = fakeFooterSectionRef.current;
    if (!transitionSection || !fakeFooterSection) return;

    let frame = 0;
    let lastScrollY = window.scrollY;
    let directionBias = 0;

    const resolveProgress = (section: HTMLElement, introRatio: number) => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const rect = section.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const introOffset = viewportHeight * introRatio;
      const available = Math.max(section.offsetHeight - window.innerHeight - introOffset, 1);
      const raw = (window.scrollY - (sectionTop + introOffset)) / available;
      return clamp(raw, 0, 1);
    };

    const updateProgress = () => {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      const directionalImpulse = clamp(delta / Math.max(viewportHeight * 0.08, 48), -1, 1);
      directionBias = clamp(directionBias * 0.72 + directionalImpulse * 0.28, -1, 1);

      const rawHero = currentScrollY / (viewportHeight * 0.92);
      setHeroProgress(clamp(rawHero, 0, 1));
      setStageProgress(resolveProgress(transitionSection, 0.22));
      setFakeFooterProgress(resolveProgress(fakeFooterSection, -0.1));
      setScrollDirectionBias(directionBias);
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

  const stageVideoReveal = clamp((stageProgress + 0.02) / 0.24, 0, 1);
  const stageImageFade = clamp(1 - stageVideoReveal * 0.9, 0.1, 1);
  const heroHandoff = clamp((heroProgress - 0.58) / 0.34, 0, 1);
  const heroHandoffEase = 1 - Math.pow(1 - heroHandoff, 3);
  const stageEase = 1 - Math.pow(1 - stageProgress, 3);
  const stageSettle = clamp((stageProgress - 0.72) / 0.28, 0, 1);
  const stageSettleEase = stageSettle * stageSettle * (3 - 2 * stageSettle);

  const fakeFooterEase = 1 - Math.pow(1 - fakeFooterProgress, 3);
  const fakeFooterTunnel = clamp((fakeFooterProgress - 0.02) / 0.6, 0, 1);
  const fakeFooterTunnelEase = fakeFooterTunnel * fakeFooterTunnel * (3 - 2 * fakeFooterTunnel);
  const fakeFooterSettle = clamp((fakeFooterProgress - 0.78) / 0.22, 0, 1);
  const upwardScrollBias = clamp(-scrollDirectionBias, 0, 1);
  const fakeFooterReverseWindow =
    clamp((fakeFooterProgress - 0.05) / 0.24, 0, 1) * clamp((1 - fakeFooterProgress) / 0.88, 0, 1);
  const fakeFooterReverse = upwardScrollBias * fakeFooterReverseWindow;
  const fakeFooterReverseEase = fakeFooterReverse * fakeFooterReverse * (3 - 2 * fakeFooterReverse);

  if (pathname === '/privacy-policy') {
    return <LegalPage kind="privacy" locale={locale} setLocale={setLocale} />;
  }

  if (pathname === '/terms-of-service') {
    return <LegalPage kind="terms" locale={locale} setLocale={setLocale} />;
  }

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
            opacity: 1 - heroProgress * 0.78 - heroHandoffEase * 0.18,
            transform: `translate3d(0, ${heroProgress * -12 - heroHandoffEase * 6}vh, 0) scale(${1 - heroProgress * 0.045 - heroHandoffEase * 0.045})`,
            filter: `blur(${heroProgress * 7 + heroHandoffEase * 5}px)`,
          }}
          footerStyle={{
            opacity: 1 - heroProgress * 0.72 - heroHandoffEase * 0.22,
            transform: `translate3d(0, ${heroProgress * -5 - heroHandoffEase * 4.5}vh, 0) scale(${1 - heroHandoffEase * 0.035})`,
          }}
        />

        <section ref={transitionSectionRef}>
          <ScrollTransitionStage
            copy={copy}
            stageProgress={stageProgress}
            stageStyle={{
              '--stage-progress': `${stageProgress}`,
              '--stage-ease': `${stageEase}`,
              '--hero-handoff': `${heroHandoffEase}`,
              '--stage-settle': `${stageSettleEase}`,
            } as CSSProperties}
            imageStyle={{
              opacity: Math.max(0.02, stageImageFade * (0.2 - stageSettleEase * 0.06)),
              transform: `translate3d(0, ${(1 - stageEase) * 4.5 + stageProgress * 0.35}vh, 0) scale(${1.085 - stageEase * 0.04})`,
              filter: `saturate(${0.76 + stageEase * 0.08}) brightness(${0.16 - stageSettleEase * 0.03}) contrast(${1.01 + stageEase * 0.02}) blur(${(1 - stageEase) * 1.8}px)`,
            }}
            backdropImageStyle={{
              opacity: 0.008 + stageImageFade * (0.02 - stageSettleEase * 0.006),
              transform: `translate3d(0, ${(1 - stageEase) * 2.5}vh, 0) scale(${1.11 - stageEase * 0.015})`,
              filter: `blur(${18 - stageEase * 3}px) saturate(${0.64 + stageEase * 0.05}) brightness(${0.055 + stageImageFade * 0.018}) contrast(1.01)`,
            }}
            videoStyle={{
              opacity: 0.56 + stageVideoReveal * 0.16 - stageSettleEase * 0.14,
              transform: `translate3d(0, ${(1 - stageEase) * 5.5 - stageProgress * 0.08}vh, 0) scale(${1.045 - stageEase * 0.022 - stageSettleEase * 0.012})`,
              filter: `saturate(${0.92 + stageEase * 0.08 - stageSettleEase * 0.05}) brightness(${0.44 + stageVideoReveal * 0.06 - stageSettleEase * 0.05}) contrast(${1.06 + stageEase * 0.03 - stageSettleEase * 0.03}) blur(${stageSettleEase * 0.9}px)`,
            }}
            backdropVideoStyle={{
              opacity: 0.12 + stageVideoReveal * 0.09 - stageSettleEase * 0.035,
              transform: `translate3d(0, ${(1 - stageEase) * 3.8}vh, 0) scale(${1.1 - stageEase * 0.018})`,
              filter: `blur(${11 - stageEase * 1.6 + stageSettleEase * 0.9}px) saturate(${0.88 + stageEase * 0.04 - stageSettleEase * 0.03}) brightness(${0.22 + stageVideoReveal * 0.05 - stageSettleEase * 0.03}) contrast(1.02)`,
            }}
            focusVideoStyle={{
              opacity: 0.64 + stageVideoReveal * 0.22 - stageSettleEase * 0.16,
              transform: `translate3d(0, ${(1 - stageEase) * 6.5 - stageProgress * 0.12}vh, 0) scale(${1.08 - stageEase * 0.038 - stageSettleEase * 0.018})`,
              filter: `saturate(${1.02 + stageEase * 0.1 - stageSettleEase * 0.08}) brightness(${0.76 + stageVideoReveal * 0.1 - stageSettleEase * 0.08}) contrast(${1.14 + stageEase * 0.04 - stageSettleEase * 0.05}) blur(${stageSettleEase * 1.1}px)`,
            }}
          />
        </section>

        <section ref={fakeFooterSectionRef}>
          <FakeFooterStage
            copy={copy}
            locale={locale}
            footerPhraseIndex={footerPhraseIndex}
            stageStyle={{
              '--fake-footer-progress': `${fakeFooterProgress}`,
              '--fake-footer-ease': `${fakeFooterEase}`,
              '--fake-footer-tunnel': `${fakeFooterTunnelEase}`,
              '--fake-footer-settle': `${fakeFooterSettle}`,
              '--fake-footer-reverse': `${fakeFooterReverseEase}`,
            } as CSSProperties}
            shellStyle={{
              transform: `translate3d(0, ${(1 - fakeFooterEase) * 1.2 - fakeFooterTunnelEase * 1.1 + fakeFooterReverseEase * 2.4 + fakeFooterSettle * 0.4}vh, 0) scale(${0.994 + fakeFooterTunnelEase * 0.046 - fakeFooterSettle * 0.004 - fakeFooterReverseEase * 0.016})`,
              opacity: 0.8 + fakeFooterEase * 0.16 - fakeFooterReverseEase * 0.03,
            }}
            videoStyle={{
              opacity: 0.88 + fakeFooterTunnelEase * 0.18 - fakeFooterSettle * 0.012 - fakeFooterReverseEase * 0.04,
              transform: `translate3d(0, ${(1 - fakeFooterTunnelEase) * 4.2 - fakeFooterTunnelEase * 3.8 - fakeFooterSettle * 0.24 + fakeFooterReverseEase * 4.2}vh, 0) scale(${1.15 - fakeFooterTunnelEase * 0.15 - fakeFooterSettle * 0.008 - fakeFooterReverseEase * 0.052})`,
              filter: `saturate(${1.14 + fakeFooterTunnelEase * 0.22 - fakeFooterSettle * 0.01 - fakeFooterReverseEase * 0.06}) brightness(${0.78 + fakeFooterTunnelEase * 0.18 - fakeFooterSettle * 0.004 - fakeFooterReverseEase * 0.05}) contrast(${1.22 + fakeFooterTunnelEase * 0.08 - fakeFooterReverseEase * 0.02}) blur(${(1 - fakeFooterTunnelEase) * 0.8 + fakeFooterSettle * 0.14 + fakeFooterReverseEase * 0.85}px)`,
            }}
          />
        </section>
      </main>
    </>
  );
}
