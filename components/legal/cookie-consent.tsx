'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

const TEXT: Record<string, { msg: string; accept: string; privacy: string }> = {
  he: { msg: 'אנו משתמשים בעוגיות חיוניות בלבד לצורך התחברות ותפעול האתר. איננו משתמשים בעוגיות פרסום או מעקב.', accept: 'הבנתי', privacy: 'מדיניות פרטיות' },
  en: { msg: 'We use only essential cookies for login and core functionality. We do not use advertising or tracking cookies.', accept: 'Got it', privacy: 'Privacy Policy' },
  ru: { msg: 'Мы используем только необходимые файлы cookie для входа и работы сайта. Рекламные и отслеживающие cookie не используются.', accept: 'Понятно', privacy: 'Политика конфиденциальности' },
  fr: { msg: "Nous utilisons uniquement des cookies essentiels pour la connexion et le fonctionnement du site. Aucun cookie publicitaire ou de suivi.", accept: "J'ai compris", privacy: 'Confidentialité' },
  ar: { msg: 'نستخدم ملفات تعريف الارتباط الضرورية فقط لتسجيل الدخول وتشغيل الموقع. لا نستخدم ملفات تتبع أو إعلانات.', accept: 'فهمت', privacy: 'سياسة الخصوصية' },
};

export function CookieConsent() {
  const { locale, dir } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('stocksage_cookie_ack')) setShow(true);
  }, []);

  if (!show) return null;
  const t = TEXT[locale] ?? TEXT.en;

  function accept() {
    localStorage.setItem('stocksage_cookie_ack', '1');
    setShow(false);
  }

  return (
    <div
      dir={dir}
      className="fixed bottom-0 inset-x-0 z-50 bg-[#14141f] border-t border-white/10 px-4 py-3 shadow-2xl"
      role="region"
      aria-label="Cookie notice"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        <p className="text-xs text-gray-400 flex-1 leading-relaxed">
          🍪 {t.msg}{' '}
          <Link href="/privacy" className="text-indigo-400 hover:underline">{t.privacy}</Link>
        </p>
        <button
          onClick={accept}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg transition-colors shrink-0"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
}
