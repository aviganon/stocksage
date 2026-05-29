'use client';

import { useI18n } from '@/lib/i18n/context';

const DISCLAIMER_TEXT: Record<string, { title: string; body: string }> = {
  he: {
    title: 'אינו ייעוץ השקעות',
    body: 'הדוח נוצר אוטומטית באמצעות בינה מלאכותית למטרות מידע וחינוך בלבד, ואינו מהווה ייעוץ השקעות, שיווק השקעות, או המלצה לקנייה/מכירה של ניירות ערך. אין לראות בתוכן תחליף לייעוץ אישי מבעל רישיון. כל החלטת השקעה היא באחריותך בלבד. נתונים עשויים להיות שגויים או לא מעודכנים.',
  },
  en: {
    title: 'Not Investment Advice',
    body: 'This report is generated automatically by AI for informational and educational purposes only. It does not constitute investment advice, investment marketing, or a recommendation to buy/sell securities, and is not a substitute for advice from a licensed professional. All investment decisions are your sole responsibility. Data may be inaccurate or outdated.',
  },
  ru: {
    title: 'Не является инвестиционной рекомендацией',
    body: 'Отчёт создан автоматически с помощью ИИ исключительно в информационных и образовательных целях. Он не является инвестиционной рекомендацией или советом по покупке/продаже ценных бумаг и не заменяет консультацию лицензированного специалиста. Все инвестиционные решения — под вашу ответственность.',
  },
  fr: {
    title: "Pas un conseil en investissement",
    body: "Ce rapport est généré automatiquement par IA à des fins d'information et d'éducation uniquement. Il ne constitue pas un conseil en investissement ni une recommandation d'achat/vente de titres, et ne remplace pas l'avis d'un professionnel agréé. Toute décision d'investissement relève de votre seule responsabilité.",
  },
  ar: {
    title: 'ليست نصيحة استثمارية',
    body: 'تم إنشاء هذا التقرير تلقائيًا بواسطة الذكاء الاصطناعي لأغراض إعلامية وتعليمية فقط. وهو لا يشكل نصيحة استثمارية أو توصية بشراء/بيع الأوراق المالية، وليس بديلاً عن استشارة مختص مرخص. جميع قرارات الاستثمار على مسؤوليتك وحدك.',
  },
};

export function InvestmentDisclaimer({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const d = DISCLAIMER_TEXT[locale] ?? DISCLAIMER_TEXT.en;

  if (compact) {
    return (
      <p className="text-xs text-gray-600 leading-relaxed">
        ⚠️ {d.body}
      </p>
    );
  }

  return (
    <div
      role="note"
      className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-4 py-3 flex gap-3"
    >
      <span className="text-amber-400 text-lg shrink-0" aria-hidden="true">⚠️</span>
      <div>
        <p className="text-amber-300 text-sm font-semibold mb-0.5">{d.title}</p>
        <p className="text-gray-400 text-xs leading-relaxed">{d.body}</p>
      </div>
    </div>
  );
}

/** Small "AI-generated" badge for transparency (EU AI Act) */
export function AiGeneratedBadge() {
  const { locale } = useI18n();
  const labels: Record<string, string> = {
    he: 'נוצר על ידי AI', en: 'AI-generated', ru: 'Создано ИИ',
    fr: 'Généré par IA', ar: 'مُنشأ بالذكاء الاصطناعي',
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
      <span aria-hidden="true">🤖</span> {labels[locale] ?? labels.en}
    </span>
  );
}
