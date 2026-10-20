import {forwardRef, useEffect, useRef, useState} from 'react';
import type {Dispatch, SetStateAction} from 'react';
import type {Locale} from '../../i18n/useTranslation';

type LanguageSwitchProps = {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  label: string;
};

type FlagConfig = {
  locale: Locale;
  code: 'br' | 'us';
  src: string;
};

const localeFlags: FlagConfig[] = [
  {
    locale: 'pt',
    code: 'br',
    src: '/flags/br.svg',
  },
  {
    locale: 'en',
    code: 'us',
    src: '/flags/us.svg',
  },
];

export const LanguageSwitch = forwardRef<HTMLDivElement, LanguageSwitchProps>(function LanguageSwitch(
  {locale, setLocale, label},
  ref,
) {
  const [isSwitching, setIsSwitching] = useState(false);
  const [previousLocale, setPreviousLocale] = useState<Locale | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const switchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current !== null) window.clearTimeout(switchTimerRef.current);
    };
  }, []);

  const currentLanguage = locale === 'pt' ? 'Português do Brasil' : 'English / United States';
  const nextLanguage = locale === 'pt' ? 'English / United States' : 'Português do Brasil';
  const actionLabel = locale === 'pt'
    ? 'Alterar idioma para English / United States'
    : 'Change language to Português do Brasil';

  const flagStateClass = (flagLocale: Locale) => {
    if (isSwitching && previousLocale === flagLocale) return 'locale-flag--leaving';
    if (locale === flagLocale) return 'locale-flag--active';
    return 'locale-flag--entering';
  };

  const handleToggle = () => {
    if (switchTimerRef.current !== null) window.clearTimeout(switchTimerRef.current);

    setPreviousLocale(locale);
    setIsSwitching(true);
    setLocale((current) => (current === 'pt' ? 'en' : 'pt'));
    window.requestAnimationFrame(() => buttonRef.current?.focus({preventScroll: true}));

    switchTimerRef.current = window.setTimeout(() => {
      setIsSwitching(false);
      setPreviousLocale(null);
      switchTimerRef.current = null;
    }, 520);
  };

  return (
    <div
      ref={ref}
      className={`lang-switch ${locale === 'en' ? 'is-en' : 'is-pt'}${isSwitching ? ' is-switching' : ''}`}
      data-locale={locale}
      data-direction={isSwitching ? `to-${locale}` : 'idle'}
    >
      <button
        ref={buttonRef}
        className="lang-switch-button"
        type="button"
        aria-label={`${label}: ${currentLanguage}. ${actionLabel}.`}
        title={`${label}: ${currentLanguage} → ${nextLanguage}`}
        onClick={handleToggle}
      >
        <span className="lang-switch-flag-stage" aria-hidden="true">
          <span className="locale-flag-disc">
            {localeFlags.map((flag) => (
              <img
                key={flag.locale}
                className={`locale-flag locale-flag--${flag.code} ${flagStateClass(flag.locale)}`}
                src={flag.src}
                alt=""
                draggable={false}
              />
            ))}
          </span>
        </span>
        <span className="lang-switch-sr-only">{actionLabel}</span>
      </button>
    </div>
  );
});
