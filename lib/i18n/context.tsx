'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Locale, DEFAULT_LOCALE, LOCALE_META } from './locales';

// Static imports — no async loading, no flash of untranslated content
import he from '../../messages/he.json';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import fr from '../../messages/fr.json';
import ar from '../../messages/ar.json';

const MESSAGES: Record<Locale, Record<string, Record<string, string>>> = { he, en, ru, fr, ar };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem('stocksage_locale') as Locale | null;
    const initial: Locale = stored && ['he','en','ru','fr','ar'].includes(stored) ? stored : DEFAULT_LOCALE;
    applyLocale(initial);
  }, []);

  function applyLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('stocksage_locale', l);
    document.documentElement.dir  = LOCALE_META[l].dir;
    document.documentElement.lang = l;
  }

  function t(key: string): string {
    const [section, k] = key.split('.');
    if (!section || !k) return key;
    return MESSAGES[locale]?.[section]?.[k] ?? MESSAGES[DEFAULT_LOCALE]?.[section]?.[k] ?? key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale: applyLocale, t, dir: LOCALE_META[locale].dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
