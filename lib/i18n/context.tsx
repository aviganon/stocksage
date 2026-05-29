'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Locale, DEFAULT_LOCALE, LOCALE_META } from './locales';

type Messages = Record<string, Record<string, string>>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextValue | null>(null);

const cache: Partial<Record<Locale, Messages>> = {};

async function loadMessages(locale: Locale): Promise<Messages> {
  if (cache[locale]) return cache[locale]!;
  try {
    const res = await fetch(`/api/i18n/${locale}`);
    const data = await res.json();
    cache[locale] = data;
    return data;
  } catch {
    return {};
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>({});

  // Load from localStorage on mount
  useEffect(() => {
    const stored = (typeof window !== 'undefined'
      ? localStorage.getItem('stocksage_locale')
      : null) as Locale | null;
    const initial: Locale = stored && ['he','en','ru','fr','ar'].includes(stored)
      ? (stored as Locale)
      : DEFAULT_LOCALE;
    setLocaleState(initial);
    loadMessages(initial).then(setMessages);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('stocksage_locale', l);
    loadMessages(l).then(setMessages);
    // Update document dir
    document.documentElement.dir = LOCALE_META[l].dir;
    document.documentElement.lang = l;
  }

  function t(key: string): string {
    const [section, k] = key.split('.');
    if (!section || !k) return key;
    return messages[section]?.[k] ?? key;
  }

  const dir = LOCALE_META[locale].dir;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}
