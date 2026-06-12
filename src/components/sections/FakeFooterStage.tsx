import {useEffect, useRef} from 'react';
import type {CSSProperties} from 'react';
import type {HomeCopy} from '../../config/homeContent';
import {CONTACT, CONTACT_LINKS} from '../../config/contact';

const footerVideoSrc = new URL('../../../fundo_site2.mp4', import.meta.url).href;

type FooterLink = {
  label: string;
  href: string;
  disabled?: boolean;
  meta?: string;
};

const footerLinks: FooterLink[] = [
  {label: 'GitHub', href: CONTACT_LINKS.github},
  {label: 'Instagram', href: '#', disabled: true},
  {label: 'LinkedIn', href: CONTACT_LINKS.linkedin},
  {label: 'Gmail', href: CONTACT_LINKS.email, meta: CONTACT.email},
];

type Props = {
  copy: HomeCopy;
  stageProgress: number;
  stageStyle: CSSProperties;
  videoStyle: CSSProperties;
  shellStyle: CSSProperties;
};

export function FakeFooterStage({copy, stageProgress, stageStyle, videoStyle, shellStyle}: Props) {
  const leadVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = leadVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';

    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => undefined);
  }, []);

  return (
    <section className="fake-footer-stage" style={stageStyle}>
      <div className="fake-footer-sticky">
        <div className="fake-footer-media" aria-hidden="true">
          <div className="fake-footer-media-well" style={shellStyle}>
            <video
              ref={leadVideoRef}
              className="fake-footer-video"
              src={footerVideoSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              style={videoStyle}
            />
            <div className="fake-footer-tunnel-glow" />
            <div className="fake-footer-vignette" />
          </div>
        </div>

        <div className="fake-footer-surface">
          <div className="fake-footer-topline" />

          <div className="fake-footer-center-dot" aria-hidden="true" />

          <div className="fake-footer-contact-left">
            {footerLinks.slice(0, 2).map((item) => (
              <a
                key={item.label}
                className={`fake-footer-edge-link${item.disabled ? ' is-disabled' : ''}`}
                href={item.href}
                target={item.disabled ? undefined : '_blank'}
                rel={item.disabled ? undefined : 'noreferrer'}
                aria-disabled={item.disabled ? 'true' : undefined}
                onClick={item.disabled ? (event) => event.preventDefault() : undefined}
              >
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          <div className="fake-footer-contact-right">
            {footerLinks.slice(2).map((item) => (
              <a key={item.label} className="fake-footer-edge-link" href={item.href} target="_blank" rel="noreferrer">
                <span>{item.label}</span>
                <span className="fake-footer-edge-meta">{item.meta ?? ''}</span>
              </a>
            ))}
          </div>

          <div className="fake-footer-main-row">
            <div className="fake-footer-cta-block">
              <p className="editorial-kicker">{copy.stageThree}</p>
              <h2>{copy.stageThreeCta}</h2>
              <p className="fake-footer-cta-subtitle">{copy.stageThreeCtaAlt}</p>
            </div>

            <div className="fake-footer-rail">
              <div className="fake-footer-rail-item">
                <span>{copy.stageThreeRailPrimary}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <div className="fake-footer-rail-item">
                <span>{copy.stageThreeRailSecondary}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <div className="fake-footer-rail-item">
                <span>{copy.stageThreeRailTertiary}</span>
                <span aria-hidden="true">↗</span>
              </div>
            </div>
          </div>

          <div className="fake-footer-bottom-row">
            <div className="fake-footer-summary">
              <strong>{copy.stageThreeCardTitle}</strong>
              <p>{copy.stageThreeCardBody}</p>
            </div>

            <div className="fake-footer-progress">
              <div className="panel-heading">
                <span>{copy.stageThreeMeter}</span>
                <span>{String(Math.round(stageProgress * 100)).padStart(2, '0')}%</span>
              </div>
              <div className="progress-rail">
                <span className="progress-fill" style={{transform: `scaleX(${stageProgress})`}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
