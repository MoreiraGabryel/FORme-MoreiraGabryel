import type {Dispatch, SetStateAction} from 'react';
import {LEGAL_CONTENT} from '../../config/legalContent';
import type {Locale} from '../../i18n/useTranslation';

type Props = {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  kind: 'privacy' | 'terms';
};

function withLocale(path: string, locale: Locale) {
  return locale === 'en' ? `${path}?lang=en` : path;
}

export function LegalPage({locale, setLocale, kind}: Props) {
  const content = LEGAL_CONTENT[locale];
  const document = kind === 'privacy' ? content.privacy : content.terms;

  return (
    <main className="legal-shell">
      <section className="legal-page">
        <header className="top-bar legal-top-bar">
          <div className="brand-lockup legal-brand-lockup">
            <a className="brand-mark" href={withLocale('/', locale)}>
              MoreiraGabryel
            </a>
            <span className="brand-caption">{document.eyebrow}</span>
          </div>

          <div className="top-actions legal-top-actions">
            <nav className="legal-links-nav" aria-label="Legal navigation">
              <a className={kind === 'privacy' ? 'is-active' : undefined} href={withLocale('/privacy-policy', locale)}>
                {content.privacyNav}
              </a>
              <a className={kind === 'terms' ? 'is-active' : undefined} href={withLocale('/terms-of-service', locale)}>
                {content.termsNav}
              </a>
            </nav>

            <div className="lang-switch" aria-label={content.language}>
              <button className={locale === 'pt' ? 'is-active' : undefined} type="button" onClick={() => setLocale('pt')}>
                PT
              </button>
              <button className={locale === 'en' ? 'is-active' : undefined} type="button" onClick={() => setLocale('en')}>
                EN
              </button>
            </div>
          </div>
        </header>

        <div className="legal-hero">
          <p className="editorial-kicker legal-kicker">{document.eyebrow}</p>
          <h1>{document.title}</h1>
          <p className="legal-meta">
            <span>{document.updatedLabel}</span>
            <strong>{document.updatedAt}</strong>
          </p>
        </div>

        <div className="legal-content-grid">
          <aside className="legal-sidebar">
            <a className="legal-home-link" href={withLocale('/', locale)}>
              {content.backToHome}
            </a>
          </aside>

          <div className="legal-sections">
            {document.sections.map((section) => (
              <section key={section.title} className="legal-section-card">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}