import {forwardRef, useId} from 'react';
import type {Dispatch, SetStateAction} from 'react';
import type {Locale} from '../../i18n/useTranslation';

type LanguageSwitchProps = {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  label: string;
};

export const LanguageSwitch = forwardRef<HTMLDivElement, LanguageSwitchProps>(function LanguageSwitch(
  {locale, setLocale, label},
  ref,
) {
  const rawClipId = useId();
  const clipId = `${rawClipId.replace(/:/g, '')}-lang-us-circle`;

  return (
    <div
      ref={ref}
      className={`lang-switch ${locale === 'en' ? 'is-en' : 'is-pt'}`}
      aria-label={label}
      data-locale={locale}
    >
      <span className="lang-switch-thumb" aria-hidden="true">
        <span className="lang-flag lang-flag-br">
          <svg className="lang-flag-icon" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
            <circle className="lang-flag-ring" cx="32" cy="32" r="29" />
            <path className="lang-flag-main" d="M32 11 55 32 32 53 9 32Z" />
            <circle className="lang-flag-main" cx="32" cy="32" r="13.5" />
            <path className="lang-flag-fill" d="M19.5 30.2c8.8-2.6 20.6-.8 25.6 5.4" />
            <circle className="lang-flag-dot" cx="21.5" cy="36.5" r="1.15" />
            <circle className="lang-flag-dot" cx="28" cy="39.8" r="1" />
            <circle className="lang-flag-dot" cx="33" cy="37.2" r="0.95" />
            <circle className="lang-flag-dot" cx="37.7" cy="40.1" r="1" />
            <circle className="lang-flag-dot" cx="42" cy="35.6" r="0.95" />
            <circle className="lang-flag-dot" cx="31.8" cy="44.2" r="0.85" />
          </svg>
        </span>
        <span className="lang-flag lang-flag-us">
          <svg className="lang-flag-icon" viewBox="0 0 64 64" focusable="false" aria-hidden="true">
            <defs>
              <clipPath id={clipId}>
                <circle cx="32" cy="32" r="29" />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <rect className="lang-flag-bg" x="3" y="3" width="58" height="58" />
              <path className="lang-flag-stripe" d="M23 10h38v5H23zM23 20h38v5H23zM23 30h38v5H23zM3 40h58v5H3zM3 50h58v5H3z" />
            </g>
            <circle className="lang-flag-ring" cx="32" cy="32" r="29" />
            <g className="lang-flag-starfield">
              <circle cx="13" cy="12" r="1.35" />
              <circle cx="21" cy="12" r="1.35" />
              <circle cx="29" cy="12" r="1.35" />
              <circle cx="17" cy="18" r="1.25" />
              <circle cx="25" cy="18" r="1.25" />
              <circle cx="13" cy="24" r="1.25" />
              <circle cx="21" cy="24" r="1.25" />
              <circle cx="29" cy="24" r="1.25" />
              <circle cx="17" cy="30" r="1.15" />
              <circle cx="25" cy="30" r="1.15" />
              <circle cx="13" cy="36" r="1.1" />
              <circle cx="21" cy="36" r="1.1" />
              <circle cx="29" cy="36" r="1.1" />
            </g>
          </svg>
        </span>
      </span>
      <button
        className={locale === 'pt' ? 'is-active' : undefined}
        type="button"
        aria-pressed={locale === 'pt'}
        onClick={() => setLocale('pt')}
      >
        <span className="lang-switch-code">PT</span>
      </button>
      <button
        className={locale === 'en' ? 'is-active' : undefined}
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
      >
        <span className="lang-switch-code">EN</span>
      </button>
    </div>
  );
});
