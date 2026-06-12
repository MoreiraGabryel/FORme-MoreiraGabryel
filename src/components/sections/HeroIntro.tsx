import type {CSSProperties, Dispatch, SetStateAction} from 'react';
import type {Locale} from '../../i18n/useTranslation';
import type {HomeCopy} from '../../config/homeContent';

export function HeroIntro({
  copy,
  locale,
  setLocale,
  phraseIndex,
  heroProgress,
  imageStyle,
  overlayStyle,
  introStyle,
  footerStyle,
}: {
  copy: HomeCopy;
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  phraseIndex: number;
  heroProgress: number;
  imageStyle: CSSProperties;
  overlayStyle: CSSProperties;
  introStyle: CSSProperties;
  footerStyle: CSSProperties;
}) {
  return (
    <section className="hero-stage" style={{'--hero-progress': `${heroProgress}`} as CSSProperties}>
      <div className="hero-media">
        <img className="hero-image" src="/media/hero-space.jpg" alt="" style={imageStyle} />
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
            <p className="hero-kicker">{copy.heroSubtag}</p>
            <div className="hero-statement-wrap" aria-live="polite">
              <span key={`${locale}-${phraseIndex}`} className="hero-statement-line">
                {copy.phrases[phraseIndex]}
              </span>
            </div>
            <p className="hero-support">{copy.heroSupport}</p>
          </div>
        </div>

        <footer className="hero-footer" style={footerStyle}>
          <div className="hero-progress-card" aria-hidden="true">
            <div className="panel-heading">
              <span>Stage 01 / Image field</span>
              <span>{String(Math.round(heroProgress * 100)).padStart(2, '0')}%</span>
            </div>
            <div className="progress-rail hero-progress-rail">
              <span className="progress-fill" style={{transform: `scaleX(${heroProgress})`}} />
            </div>
          </div>
          <p className="scroll-cue">{copy.scrollCue}</p>
        </footer>
      </div>
    </section>
  );
}
