import {startTransition, useCallback, useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {LoadingScreen} from './components/sections/LoadingScreen';
import {HeroIntro} from './components/sections/HeroIntro';
import {TechnologyAndAboutStage} from './components/sections/TechnologyAndAboutStage';
import {FakeFooterStage} from './components/sections/FakeFooterStage';
import {FutureFooterStage} from './components/sections/FutureFooterStage';
import {LegalPage} from './components/legal/LegalPage';
import {HOME_COPY} from './config/homeContent';
import {useTranslation} from './i18n/useTranslation';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const {locale, setLocale} = useTranslation();
  const handleLoadingDone = useCallback(() => {
    setLoaded(true);
  }, []);
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/';
  const copy = HOME_COPY[locale];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [footerPhraseIndex, setFooterPhraseIndex] = useState(0);
  const [scrollState, setScrollState] = useState({
    heroProgress: 0,
    rawStageProgress: 0,
    rawFakeFooterProgress: 0,
    scrollDirectionBias: 0,
    isLargeViewport: false,
  });
  const {heroProgress, rawStageProgress, rawFakeFooterProgress, scrollDirectionBias, isLargeViewport} = scrollState;
  const journeySectionRef = useRef<HTMLDivElement | null>(null);
  const fakeFooterSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPhraseIndex(0);
    setFooterPhraseIndex(0);
  }, [locale]);

  useEffect(() => {
    const phraseCount = copy.footerPhrases.length;
    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setFooterPhraseIndex((current) => {
          if (phraseCount <= 1) return current;
          let next = current;
          while (next === current) next = Math.floor(Math.random() * phraseCount);
          return next;
        });
      });
    }, 3200);
    return () => window.clearInterval(intervalId);
  }, [copy.footerPhrases]);

  useEffect(() => {
    const preloadImages = [
      '/media/scene-0.webp',
      '/media/scene-1.webp',
    ];

    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const transitionSection = journeySectionRef.current;
    const fakeFooterSection = fakeFooterSectionRef.current;
    if (!transitionSection || !fakeFooterSection) return;

    let frame = 0;
    let lastScrollY = window.scrollY;
    let directionBias = 0;
    const mobileViewportQuery = window.matchMedia('(max-width: 640px)');
    let wasMobileViewport = mobileViewportQuery.matches;
    let mobileHeroViewportHeight = Math.max(window.innerHeight, 1);

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
      const isMobileViewport = mobileViewportQuery.matches;
      if (isMobileViewport && !wasMobileViewport) {
        mobileHeroViewportHeight = viewportHeight;
      }
      wasMobileViewport = isMobileViewport;
      const heroViewportHeight = isMobileViewport ? mobileHeroViewportHeight : viewportHeight;
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      const directionalImpulse = clamp(delta / Math.max(heroViewportHeight * 0.08, 48), -1, 1);
      directionBias = clamp(directionBias * 0.72 + directionalImpulse * 0.28, -1, 1);

      const rawHero = currentScrollY / (heroViewportHeight * 1.6);
      setScrollState({
        heroProgress: clamp(rawHero, 0, 1),
        rawStageProgress: resolveProgress(transitionSection, 0.22),
        rawFakeFooterProgress: resolveProgress(fakeFooterSection, -0.42),
        scrollDirectionBias: directionBias,
        isLargeViewport: window.innerWidth >= 1500 || window.innerHeight >= 920,
      });
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

  const stageReadProgress = clamp(rawStageProgress / 0.78, 0, 1);
  const stageHoldProgress = clamp((rawStageProgress - 0.78) / 0.14, 0, 1);
  const stageReleaseProgress = clamp((rawStageProgress - 0.92) / 0.08, 0, 1);
  const stageProgress = rawStageProgress < 0.78 ? stageReadProgress : 1;
  const heroHandoff = clamp((heroProgress - 0.68) / 0.24, 0, 1);
  const heroHandoffEase = 1 - Math.pow(1 - heroHandoff, 3);
  const stageEase = 1 - Math.pow(1 - stageProgress, 3);
  const stageHoldEase = stageHoldProgress * stageHoldProgress * (3 - 2 * stageHoldProgress);
  const stageSettleEase = stageReleaseProgress * stageReleaseProgress * (3 - 2 * stageReleaseProgress);

  const fakeFooterGate = rawStageProgress >= 0.92 ? 1 : 0;
  const fakeFooterProgress = fakeFooterGate === 0 ? 0 : clamp((rawFakeFooterProgress - 0.01) / 0.99, 0, 1);
  const fakeFooterEase = 1 - Math.pow(1 - fakeFooterProgress, 3);
  const fakeFooterTunnel = clamp((fakeFooterProgress - 0.01) / 0.62, 0, 1);
  const fakeFooterTunnelEase = fakeFooterTunnel * fakeFooterTunnel * (3 - 2 * fakeFooterTunnel);
  const fakeFooterSettle = clamp((fakeFooterProgress - 0.78) / 0.22, 0, 1);
  const fakeFooterVideoActivation = clamp((fakeFooterProgress - 0.02) / 0.24, 0, 1);
  const upwardScrollBias = clamp(-scrollDirectionBias, 0, 1);
  const fakeFooterReverseWindow =
    clamp((fakeFooterProgress - 0.05) / 0.24, 0, 1) * clamp((1 - fakeFooterProgress) / 0.88, 0, 1);
  const fakeFooterReverse = upwardScrollBias * fakeFooterReverseWindow;
  const fakeFooterReverseEase = fakeFooterReverse * fakeFooterReverse * (3 - 2 * fakeFooterReverse);


  if (pathname === '/privacy-policy') return <LegalPage kind="privacy" locale={locale} setLocale={setLocale} />;
  if (pathname === '/terms-of-service') return <LegalPage kind="terms" locale={locale} setLocale={setLocale} />;

  return (
    <>
      {!loaded && <LoadingScreen onDone={handleLoadingDone} />}
      <div className="persistent-brand-lockup brand-lockup" aria-label={`MoreiraGabryel - ${copy.heroTag}`}>
        <a className="brand-mark" href="#home">MoreiraGabryel</a>
        <span className="brand-caption">{copy.heroTag}</span>
      </div>
      <main id="home" className="site-shell">
        <HeroIntro
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          phraseIndex={phraseIndex}
          heroProgress={heroProgress}
        />

        <div ref={journeySectionRef} className="technology-and-about-flow">
          <TechnologyAndAboutStage
            locale={locale}
            rawStageProgress={rawStageProgress}
            stageStyle={{
              '--stage-progress': `${stageProgress}`,
              '--stage-ease': `${stageEase}`,
              '--hero-handoff': `${heroHandoffEase}`,
              '--stage-entry-y': `${(1 - heroHandoffEase) * 6}`,
              '--stage-hold': `${stageHoldEase}`,
              '--stage-settle': `${stageSettleEase}`,
              '--stage-perf-tier': isLargeViewport ? '1' : '0',
              '--stage-active': rawStageProgress > 0.02 && rawStageProgress < 0.985 ? '1' : '0',
              '--clip-reveal': `${heroHandoffEase}`,
            } as CSSProperties}
          />
        </div>

        <div ref={fakeFooterSectionRef} className="fake-footer-flow">
          <FakeFooterStage
            copy={copy}
            locale={locale}
            footerPhraseIndex={footerPhraseIndex}
            videoActivation={fakeFooterVideoActivation}
            transitionVideoEnabled={fakeFooterGate === 1}
            stageStyle={{
              '--fake-footer-progress': `${fakeFooterProgress}`,
              '--fake-footer-ease': `${fakeFooterEase}`,
              '--fake-footer-tunnel': `${fakeFooterTunnelEase}`,
              '--fake-footer-settle': `${fakeFooterSettle}`,
              '--fake-footer-reverse': `${fakeFooterReverseEase}`,
              '--footer-clip': `${fakeFooterEase}`,
              '--footer-entry-y': `${(1 - fakeFooterEase) * 5}`,
            } as CSSProperties}
            transitionVideoStyle={{
              opacity: fakeFooterGate * clamp((fakeFooterProgress - 0.02) / 0.28, 0, 1) * clamp((1 - fakeFooterProgress) / 0.52, 0, 1) * 0.72,
            }}
            shellStyle={{
              transform: `translate3d(0, ${(1 - fakeFooterEase) * 0.24 - fakeFooterTunnelEase * 0.44 + fakeFooterReverseEase * 1.4 + fakeFooterSettle * 0.04}vh, 0) scale(${1.038 + fakeFooterTunnelEase * 0.03 - fakeFooterSettle * 0.002 - fakeFooterReverseEase * 0.012})`,
              opacity: 0.82 + fakeFooterEase * 0.06 - fakeFooterReverseEase * 0.02,
            }}
            videoStyle={{
              opacity: 0.22 + fakeFooterVideoActivation * 0.48 + fakeFooterTunnelEase * 0.08 - fakeFooterSettle * 0.008 - fakeFooterReverseEase * 0.04,
              transform: `translate3d(0, ${(1 - fakeFooterTunnelEase) * 2.5 - fakeFooterTunnelEase * 2.7 - fakeFooterSettle * 0.14 + fakeFooterReverseEase * 3.4}vh, 0) scale(${isLargeViewport ? 1.12 - fakeFooterTunnelEase * 0.12 - fakeFooterReverseEase * 0.03 : 1.2 - fakeFooterTunnelEase * 0.19 - fakeFooterSettle * 0.004 - fakeFooterReverseEase * 0.05})`,
              filter: isLargeViewport
                ? `brightness(${0.8 + fakeFooterTunnelEase * 0.05 - fakeFooterReverseEase * 0.03}) contrast(${1.03 + fakeFooterTunnelEase * 0.02 - fakeFooterReverseEase * 0.02})`
                : `saturate(${1.02 + fakeFooterTunnelEase * 0.12 - fakeFooterSettle * 0.008 - fakeFooterReverseEase * 0.05}) brightness(${0.78 + fakeFooterTunnelEase * 0.1 - fakeFooterSettle * 0.002 - fakeFooterReverseEase * 0.05}) contrast(${1.1 + fakeFooterTunnelEase * 0.05 - fakeFooterReverseEase * 0.02}) blur(${(1 - fakeFooterTunnelEase) * 0.52 + fakeFooterSettle * 0.1 + fakeFooterReverseEase * 0.82}px)`,
            }}
          />
        </div>

        <FutureFooterStage />
      </main>
    </>
  );
}
