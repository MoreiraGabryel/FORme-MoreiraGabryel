import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {HomeCopy} from '../../config/homeContent';
import {CONTACT_LINKS} from '../../config/contact';
import {FAKE_FOOTER_SCENE} from '../../config/scenes';
import {useAmbientVideo} from '../../hooks/useAmbientVideo';
import {useScrubbedVideo} from '../../hooks/useScrubbedVideo';
import type {Locale} from '../../i18n/useTranslation';

gsap.registerPlugin(ScrollTrigger);

// As duas peças do portal. A entrada é um plano único que atravessa a boca do
// portal; o túnel é o ambiente do outro lado. Foram geradas travando o quadro
// final da primeira como quadro inicial da segunda, por isso a passagem de uma
// para a outra é uma dissolução curta e não um corte.
const entryVideoSrc = '/media/portal-entrada.mp4';
const ambientVideoSrc = '/media/portal-tunel-loop.mp4';
// Primeiro quadro de cada clipe: evita o retângulo preto enquanto o vídeo decodifica.
const entryVideoPoster = '/media/portal-entrada-poster.webp';
const ambientVideoPoster = '/media/portal-tunel-loop-poster.webp';

type Props = {
  copy: HomeCopy;
  locale: Locale;
  footerPhraseIndex: number;
  stageStyle: CSSProperties;
  shellStyle: CSSProperties;
  /**
   * Enquadramento comum às duas camadas de vídeo. Precisa ser o mesmo objeto nas
   * duas: é o que garante que, na janela de troca, a dissolução aconteça entre
   * quadros que coincidem também na tela, e não só no arquivo.
   */
  portalLayerStyle: CSSProperties;
  /** Posição do plano de entrada, 0 a 1. Vira `currentTime` — o clipe não toca sozinho. */
  entryProgress: number;
  entryOpacity: number;
  ambientOpacity: number;
  /**
   * Solta o loop do túnel. Fica falso durante a dissolve: parado no primeiro
   * quadro ele é a imagem que casa com o último quadro da entrada, e a mistura
   * acontece entre dois quadros idênticos por mais devagar que o leitor role.
   * Se ele já estivesse rodando, um scroll parado no meio da troca deixaria as
   * duas camadas em pontos diferentes do movimento — imagem dupla.
   */
  ambientPlaying: boolean;
};

type FooterIconName = 'github' | 'instagram' | 'linkedin' | 'whatsapp' | 'email';

type FooterLink = {
  label: string;
  href: string;
  icon: FooterIconName;
};

function withLocale(path: string, locale: Locale) {
  return locale === 'en' ? `${path}?lang=en` : path;
}

function FooterIcon({name}: {name: FooterIconName}) {
  switch (name) {
    case 'github':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.86-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .08 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.05 1.03-2.77-.1-.26-.45-1.31.1-2.74 0 0 .84-.28 2.75 1.06A9.35 9.35 0 0 1 12 6.84a9.3 9.3 0 0 1 2.5.35c1.9-1.34 2.74-1.06 2.74-1.06.56 1.43.21 2.48.1 2.74.64.72 1.03 1.64 1.03 2.77 0 3.96-2.34 4.82-4.58 5.08.36.32.68.94.68 1.89 0 1.36-.01 2.46-.01 2.8 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'instagram':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.75 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 6.65A5.35 5.35 0 1 1 6.65 12 5.35 5.35 0 0 1 12 6.65Zm0 1.8A3.55 3.55 0 1 0 15.55 12 3.55 3.55 0 0 0 12 8.45Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'linkedin':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M5.34 8.54H2.45V21h2.89V8.54ZM3.9 3C2.92 3 2 3.83 2 4.92s.9 1.92 1.86 1.92h.02c1 0 1.9-.83 1.9-1.92C5.78 3.83 4.9 3 3.9 3ZM21 13.14c0-3.78-2-5.54-4.68-5.54-2.15 0-3.12 1.2-3.66 2.04v-1.1H9.77c.04.73 0 12.46 0 12.46h2.89v-6.96c0-.37.03-.73.14-1 .3-.73.97-1.5 2.1-1.5 1.47 0 2.06 1.14 2.06 2.8V21H21v-7.86Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M12 2.2A9.8 9.8 0 0 0 3.6 17.1L2 22l5-1.57A9.8 9.8 0 1 0 12 2.2Zm0 17.8c-1.54 0-3.05-.4-4.37-1.16l-.31-.18-2.97.94.97-2.9-.2-.3A8 8 0 1 1 12 20Zm4.39-5.98c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.8-.2-.47-.4-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.62 4.1 3.67.57.25 1.02.4 1.37.5.58.18 1.1.15 1.52.09.46-.07 1.43-.58 1.63-1.15.2-.57.2-1.06.14-1.15-.06-.08-.22-.14-.46-.26Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'email':
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M3 5.5h18A1.5 1.5 0 0 1 22.5 7v10A1.5 1.5 0 0 1 21 18.5H3A1.5 1.5 0 0 1 1.5 17V7A1.5 1.5 0 0 1 3 5.5Zm0 1.8a.3.3 0 0 0-.3.3v.19l9.1 6.18a.36.36 0 0 0 .4 0l9.1-6.18V7.6a.3.3 0 0 0-.3-.3H3Zm18 9.4a.3.3 0 0 0 .3-.3V9.98l-8.1 5.5a2.16 2.16 0 0 1-2.4 0l-8.1-5.5v6.42a.3.3 0 0 0 .3.3h18Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

export function FakeFooterStage({
  copy,
  locale,
  footerPhraseIndex,
  stageStyle,
  shellStyle,
  portalLayerStyle,
  entryProgress,
  entryOpacity,
  ambientOpacity,
  ambientPlaying,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const entryVideoRef = useRef<HTMLVideoElement | null>(null);
  const ambientVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    // O ScrollTrigger cuida apenas do pin. `--fake-footer-unlock` e
    // `--fake-footer-exit-blackout` são calculados no `App`, a partir do mesmo
    // progresso que move o vídeo, o brilho e a escala. Enquanto viviam num
    // timeline com `scrub`, corriam 0,65s atrás do resto da cena.
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * FAKE_FOOTER_SCENE.lengthInViewports)}`,
        pin: sticky,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Nada de decodificar vídeo enquanto a cena está longe. Uma vez que ela
  // encosta no viewport o observador se desliga: daí para frente quem decide o
  // que roda é o progresso do scroll.
  useEffect(() => {
    const mediaWell = ambientVideoRef.current?.parentElement;
    if (!mediaWell) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      {threshold: 0.1},
    );

    observer.observe(mediaWell);

    return () => observer.disconnect();
  }, []);

  useScrubbedVideo(entryVideoRef, entryProgress, {enabled: isNearViewport});
  useAmbientVideo(ambientVideoRef, {active: isNearViewport && ambientPlaying});

  const socialLinks: FooterLink[] = [
    {label: copy.socialInstagram, href: CONTACT_LINKS.instagram, icon: 'instagram'},
    {label: copy.socialLinkedIn, href: CONTACT_LINKS.linkedin, icon: 'linkedin'},
    {label: copy.socialWhatsApp, href: CONTACT_LINKS.whatsapp, icon: 'whatsapp'},
    {label: copy.socialEmail, href: CONTACT_LINKS.email, icon: 'email'},
    {label: copy.socialGithub, href: CONTACT_LINKS.github, icon: 'github'},
  ];

  const legalLinks = [
    {label: copy.privacyLabel, href: withLocale('/privacy-policy', locale)},
    {label: copy.termsLabel, href: withLocale('/terms-of-service', locale)},
  ];

  return (
    <section ref={sectionRef} className="fake-footer-stage" style={stageStyle}>
      <div ref={stickyRef} className="fake-footer-sticky">
        <div className="fake-footer-media" aria-hidden="true">
          <div className="fake-footer-media-well" style={shellStyle}>
            <video
              ref={ambientVideoRef}
              className="fake-footer-ambient-video"
              src={ambientVideoSrc}
              poster={ambientVideoPoster}
              loop
              muted
              playsInline
              preload="auto"
              style={{...portalLayerStyle, opacity: ambientOpacity}}
            />
            <video
              ref={entryVideoRef}
              className="fake-footer-entry-video"
              src={entryVideoSrc}
              poster={entryVideoPoster}
              muted
              playsInline
              preload="auto"
              style={{...portalLayerStyle, opacity: entryOpacity}}
            />
            <div className="fake-footer-tunnel-glow" />
            <div className="fake-footer-vignette" />
          </div>
        </div>

        <div className="fake-footer-surface">
          <div className="fake-footer-layout">
            <div className="fake-footer-left-column">
              <div className="fake-footer-cta-block fake-footer-cta-block-centered">
                <p className="editorial-kicker">{copy.stageThree}</p>
                <div className="fake-footer-statement-wrap" aria-live="polite">
                  <h2 key={`${locale}-${footerPhraseIndex}`} className="fake-footer-statement-line">
                    {copy.footerPhrases[footerPhraseIndex].split('').map((char, index) => (
                      <span
                        key={`${locale}-${footerPhraseIndex}-${index}`}
                        className="fake-footer-statement-char"
                        style={{'--char-index': `${index}`} as CSSProperties}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    ))}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          <div className="fake-footer-utility-row fake-footer-utility-row-reference">
            <div className="fake-footer-copyright-row fake-footer-copyright-row-inline">
              <span>{copy.footerCopyright}</span>
            </div>

            <div className="fake-footer-utility-center fake-footer-utility-center-icons">
              <div className="fake-footer-social-row fake-footer-social-row-centered">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    className="fake-footer-social-link"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    title={item.label}
                  >
                    <FooterIcon name={item.icon} />
                  </a>
                ))}
              </div>
            </div>

            <div className="fake-footer-bottom-row fake-footer-bottom-row-legal-only">
              <div className="fake-footer-right-meta">
                <div className="fake-footer-link-group fake-footer-link-group-inline">
                  <span className="fake-footer-group-label">{copy.footerLegalLabel}</span>
                  <div className="fake-footer-legal-row fake-footer-legal-row-right">
                    {legalLinks.map((item) => (
                      <a key={item.label} href={item.href} className="fake-footer-legal-link">
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="unlock-scroll-indicator" aria-hidden="true">
            <span className="unlock-arrow">↓</span>
          </div>
        </div>

        <div className="fake-footer-exit-blackout" aria-hidden="true" />
      </div>
    </section>
  );
}
