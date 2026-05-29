export const LOCALES = ['he', 'en', 'ru', 'fr', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; flag: string; dir: 'rtl' | 'ltr' }> = {
  he: { label: 'עברית',   flag: '🇮🇱', dir: 'rtl' },
  en: { label: 'English', flag: '🇬🇧', dir: 'ltr' },
  ru: { label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  fr: { label: 'Français',flag: '🇫🇷', dir: 'ltr' },
  ar: { label: 'عربية',   flag: '🇸🇦', dir: 'rtl' },
};

export const DEFAULT_LOCALE: Locale = 'he';
