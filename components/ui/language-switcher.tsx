'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { LOCALES, LOCALE_META, type Locale } from '@/lib/i18n/locales';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LOCALE_META[locale];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
        title="Change language"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline text-xs">{current.label}</span>
        <span className="text-xs text-gray-600">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 bg-[#14141f] border border-white/10 rounded-xl overflow-hidden z-40 shadow-2xl min-w-[140px]">
            {LOCALES.map((l: Locale) => {
              const meta = LOCALE_META[l];
              return (
                <button
                  key={l}
                  onClick={() => { setLocale(l); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-right ${
                    l === locale
                      ? 'bg-indigo-500/15 text-white'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                  dir={meta.dir}
                >
                  <span>{meta.flag}</span>
                  <span>{meta.label}</span>
                  {l === locale && <span className="mr-auto text-indigo-400 text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
