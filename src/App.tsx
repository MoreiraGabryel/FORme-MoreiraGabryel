import {startTransition, useCallback, useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {LoadingScreen} from './components/sections/LoadingScreen';
import {HeroIntro} from './components/sections/HeroIntro';
import {TechnologyAndAboutStage} from './components/sections/TechnologyAndAboutStage';
import {FakeFooterStage} from './components/sections/FakeFooterStage';
import {LegalPage} from './components/legal/LegalPage';
import {HOME_COPY} from './config/homeContent';
import {
  FAKE_FOOTER_SCENE,
  TECHNOLOGY_SCENE,
  TECHNOLOGY_SCENE_REDUCED_MOTION,
} from './config/scenes';
import type {SceneGeometry} from './config/scenes';
import {useTranslation} from './i18n/useTranslation';
import {getStableViewportHeight} from './utils/stableViewport';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

// Beats do rodapé falso, em fração de `fakeFooterProgress`. Vinham de um timeline
// GSAP com `scrub`, que corria 0,65s atrás das CSS custom properties calculadas
// aqui. Agora saem do mesmo progresso que o resto da cena — os valores foram
// convertidos da escala do timeline para esta, então o disparo continua no mesmo
// ponto do scroll; só o atraso desapareceu.
const FAKE_FOOTER_UNLOCK_START = 0.485;
const FAKE_FOOTER_UNLOCK_END = 0.58;
const FAKE_FOOTER_BLACKOUT_START = 0.758;

// As duas peças do portal, em fração de `fakeFooterProgress`.
//
// A entrada é um plano único scrubbado: a posição do scroll escreve
// `currentTime`, então ela anda na descida e volta na subida. Ela ocupa os
// primeiros 63% da cena, e nesse trecho a rolagem inteira do rodapé gasta 1740px
// para 124 quadros — cerca de 14px de rolagem por quadro.
//
// A troca para o loop do túnel começa exatamente onde a entrada acaba, e não
// antes: durante a dissolve inteira a entrada segura o último quadro e o túnel
// mostra o primeiro. Esses dois quadros são o mesmo por construção — os clipes
// foram gerados travando um como o outro, e a diferença medida entre eles é RMSE
// 0,0201, metade de um passo comum entre quadros vizinhos dentro da entrada.
// Misturar quadros ainda em movimento com o início do túnel desperdiçaria isso.
//
// A janela é curta de propósito. Como os quadros coincidem, até um corte seco
// passaria despercebido; a dissolve existe só para cobrir o tempo do decoder.
const PORTAL_ENTRY_SPAN = 0.63;
const PORTAL_HANDOFF_START = 0.63;
const PORTAL_HANDOFF_END = 0.665;

function FinalBlackoutStage() {
  // TODO: animação autoral
  return <section className="final-blackout-stage" data-section="final-blackout" aria-hidden="true" />;
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
    const phraseCount = copy.phrases.length;
    if (phraseCount <= 1) return;

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        setPhraseIndex((current) => (current + 1) % phraseCount);
      });
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [copy.phrases]);

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
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // O progresso é ancorado em `rect.top` e no comprimento declarado em
    // `config/scenes` — nunca em `offsetHeight`. O `pin` do ScrollTrigger insere
    // um spacer que altera a altura da seção, então medir altura aqui seria ler
    // um layout que o outro sistema muta: a cena passaria a ter duas durações.
    const resolveProgress = (section: HTMLElement, scene: SceneGeometry) => {
      const viewportHeight = getStableViewportHeight();
      const introOffset = viewportHeight * scene.leadInViewports;
      const available = Math.max(viewportHeight * scene.lengthInViewports - introOffset, 1);
      const travelled = -section.getBoundingClientRect().top - introOffset;
      return clamp(travelled / available, 0, 1);
    };

    const updateProgress = () => {
      const viewportHeight = getStableViewportHeight();
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      const directionalImpulse = clamp(delta / Math.max(viewportHeight * 0.08, 48), -1, 1);
      directionBias = clamp(directionBias * 0.72 + directionalImpulse * 0.28, -1, 1);

      const rawHero = currentScrollY / (viewportHeight * 1.6);
      const technologyScene = reducedMotionQuery.matches
        ? TECHNOLOGY_SCENE_REDUCED_MOTION
        : TECHNOLOGY_SCENE;
      setScrollState({
        heroProgress: clamp(rawHero, 0, 1),
        rawStageProgress: resolveProgress(transitionSection, technologyScene),
        rawFakeFooterProgress: resolveProgress(fakeFooterSection, FAKE_FOOTER_SCENE),
        scrollDirectionBias: directionBias,
        isLargeViewport: window.innerWidth >= 1500 || viewportHeight >= 920,
      });
    };

    const requestUpdate = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', requestUpdate, {passive: true});
    window.addEventListener('resize', requestUpdate);
    reducedMotionQuery.addEventListener('change', requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      reducedMotionQuery.removeEventListener('change', requestUpdate);
    };
  }, []);

  const stageReadProgress = clamp(rawStageProgress / 0.78, 0, 1);
  const stageHoldProgress = clamp((rawStageProgress - 0.78) / 0.14, 0, 1);
  const stageReleaseProgress = clamp((rawStageProgress - 0.92) / 0.08, 0, 1);
  const stageProgress = rawStageProgress < 0.78 ? stageReadProgress : 1;
  const heroHandoff = clamp((heroProgress - 0.68) / 0.24, 0, 1);
  const heroHandoffEase = 1 - Math.pow(1 - heroHandoff, 3);
  const stageEase = 1 - Math.pow(1 - stageProgress, 3);
  const stageHoldEase = smoothstep(stageHoldProgress);
  const stageSettleEase = smoothstep(stageReleaseProgress);

  const fakeFooterGate = rawStageProgress >= 0.92 ? 1 : 0;
  const fakeFooterProgress = fakeFooterGate === 0 ? 0 : clamp((rawFakeFooterProgress - 0.01) / 0.99, 0, 1);
  const fakeFooterEase = 1 - Math.pow(1 - fakeFooterProgress, 3);
  const fakeFooterTunnel = clamp((fakeFooterProgress - 0.01) / 0.62, 0, 1);
  const fakeFooterTunnelEase = smoothstep(fakeFooterTunnel);
  const fakeFooterSettle = clamp((fakeFooterProgress - 0.78) / 0.22, 0, 1);
  const fakeFooterVideoActivation = clamp((fakeFooterProgress - 0.02) / 0.24, 0, 1);
  const upwardScrollBias = clamp(-scrollDirectionBias, 0, 1);
  const fakeFooterReverseWindow =
    clamp((fakeFooterProgress - 0.05) / 0.24, 0, 1) * clamp((1 - fakeFooterProgress) / 0.88, 0, 1);
  const fakeFooterReverse = upwardScrollBias * fakeFooterReverseWindow;
  const fakeFooterReverseEase = smoothstep(fakeFooterReverse);
  const fakeFooterUnlock = smoothstep(
    clamp(
      (fakeFooterProgress - FAKE_FOOTER_UNLOCK_START) / (FAKE_FOOTER_UNLOCK_END - FAKE_FOOTER_UNLOCK_START),
      0,
      1,
    ),
  );
  const fakeFooterExitBlackout = smoothstep(
    clamp((fakeFooterProgress - FAKE_FOOTER_BLACKOUT_START) / (1 - FAKE_FOOTER_BLACKOUT_START), 0, 1),
  );

  const portalEntryProgress = clamp(fakeFooterProgress / PORTAL_ENTRY_SPAN, 0, 1);
  const portalHandoff = smoothstep(
    clamp(
      (fakeFooterProgress - PORTAL_HANDOFF_START) / (PORTAL_HANDOFF_END - PORTAL_HANDOFF_START),
      0,
      1,
    ),
  );
  // Exposição do portal: quanto do vídeo aparece por cima do preto. É uma só
  // para as duas camadas, repartida pela dissolve — por isso a troca não muda o
  // brilho da cena, só qual clipe está entregando a imagem.
  const portalExposure =
    0.22 +
    fakeFooterVideoActivation * 0.48 +
    fakeFooterTunnelEase * 0.08 -
    fakeFooterSettle * 0.008 -
    fakeFooterReverseEase * 0.04;


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
            entryProgress={portalEntryProgress}
            entryOpacity={portalExposure * (1 - portalHandoff)}
            ambientOpacity={portalExposure * portalHandoff}
            ambientPlaying={portalHandoff >= 1}
            stageStyle={{
              '--fake-footer-progress': `${fakeFooterProgress}`,
              '--fake-footer-ease': `${fakeFooterEase}`,
              '--fake-footer-tunnel': `${fakeFooterTunnelEase}`,
              '--fake-footer-settle': `${fakeFooterSettle}`,
              '--fake-footer-reverse': `${fakeFooterReverseEase}`,
              '--fake-footer-unlock': `${fakeFooterUnlock}`,
              '--fake-footer-exit-blackout': `${fakeFooterExitBlackout}`,
              '--footer-clip': `${fakeFooterEase}`,
              '--footer-entry-y': `${(1 - fakeFooterEase) * 5}`,
            } as CSSProperties}
            shellStyle={{
              transform: `translate3d(0, ${(1 - fakeFooterEase) * 0.24 - fakeFooterTunnelEase * 0.44 + fakeFooterReverseEase * 1.4 + fakeFooterSettle * 0.04}vh, 0) scale(${1.038 + fakeFooterTunnelEase * 0.03 - fakeFooterSettle * 0.002 - fakeFooterReverseEase * 0.012})`,
              opacity: 0.82 + fakeFooterEase * 0.06 - fakeFooterReverseEase * 0.02,
            }}
            portalLayerStyle={{
              transform: `translate3d(0, ${(1 - fakeFooterTunnelEase) * 2.5 - fakeFooterTunnelEase * 2.7 - fakeFooterSettle * 0.14 + fakeFooterReverseEase * 3.4}vh, 0) scale(${isLargeViewport ? 1.12 - fakeFooterTunnelEase * 0.12 - fakeFooterReverseEase * 0.03 : 1.2 - fakeFooterTunnelEase * 0.19 - fakeFooterSettle * 0.004 - fakeFooterReverseEase * 0.05})`,
              filter: isLargeViewport
                ? `brightness(${0.8 + fakeFooterTunnelEase * 0.05 - fakeFooterReverseEase * 0.03}) contrast(${1.03 + fakeFooterTunnelEase * 0.02 - fakeFooterReverseEase * 0.02})`
                : `saturate(${1.02 + fakeFooterTunnelEase * 0.12 - fakeFooterSettle * 0.008 - fakeFooterReverseEase * 0.05}) brightness(${0.78 + fakeFooterTunnelEase * 0.1 - fakeFooterSettle * 0.002 - fakeFooterReverseEase * 0.05}) contrast(${1.1 + fakeFooterTunnelEase * 0.05 - fakeFooterReverseEase * 0.02}) blur(${(1 - fakeFooterTunnelEase) * 0.52 + fakeFooterSettle * 0.1 + fakeFooterReverseEase * 0.82}px)`,
            }}
          />
        </div>

        <FinalBlackoutStage />
      </main>
    </>
  );
}
