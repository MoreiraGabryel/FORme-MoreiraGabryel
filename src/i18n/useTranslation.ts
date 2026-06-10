import {useState, useCallback} from 'react';
import pt from './pt.json';
import en from './en.json';

export type Locale = 'pt' | 'en';
const messages = {pt, en};

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('pt');
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
