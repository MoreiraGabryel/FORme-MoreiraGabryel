import {useState, useCallback, useEffect} from 'react';
import pt from './pt.json';
import en from './en.json';

export type Locale = 'pt' | 'en';
const messages = {pt, en};
const STORAGE_KEY = 'portfolio-locale';

function resolveInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt';

  const params = new URLSearchParams(window.location.search);
  const queryLocale = params.get('lang');
  if (queryLocale === 'pt' || queryLocale === 'en') return queryLocale;

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return storedLocale === 'en' ? 'en' : 'pt';
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>(resolveInitialLocale);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
  }, [locale]);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let val: unknown = messages[locale];

      for (const k of keys) {
        val = typeof val === 'object' && val !== null ? (val as Record<string, unknown>)[k] : undefined;
      }

      return typeof val === 'string' ? val : key;
    },
    [locale],
  );

  return {t, locale, setLocale};
}
