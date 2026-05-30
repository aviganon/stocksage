'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

const CONTENT: Record<string, { title: string; updated: string; commitment: string; features: string[]; contact: string; email: string }> = {
  he: { title: 'הצהרת נגישות', updated: 'עדכון אחרון: מאי 2026', commitment: 'StockSage פועלת להנגשת האתר בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי ת"י 5568 המבוסס על WCAG 2.0 ברמת AA.', features: ['ניווט מלא באמצעות מקלדת עם חיווי פוקוס ברור', 'תמיכה בקוראי מסך (תוויות ARIA)', 'תמיכה בכיווניות RTL לעברית וערבית', 'ניגודיות צבעים תקנית', 'כיבוד prefers-reduced-motion', 'טקסט הניתן להגדלה'], contact: 'רכז הנגישות', email: 'accessibility@stocksage.io' },
  en: { title: 'Accessibility Statement', updated: 'Last updated: May 2026', commitment: 'StockSage is committed to making this website accessible to all users, including people with disabilities, in accordance with WCAG 2.0 AA guidelines.', features: ['Full keyboard navigation with visible focus indicators', 'Screen reader support (ARIA labels)', 'RTL support for Hebrew and Arabic', 'Standards-compliant color contrast', 'Respects prefers-reduced-motion', 'Scalable text'], contact: 'Accessibility Coordinator', email: 'accessibility@stocksage.io' },
  ru: { title: 'Заявление о доступности', updated: 'Последнее обновление: май 2026', commitment: 'StockSage стремится сделать сайт доступным для всех пользователей, включая людей с ограниченными возможностями, в соответствии с WCAG 2.0 AA.', features: ['Полная навигация с клавиатуры', 'Поддержка скринридеров (ARIA)', 'Поддержка RTL', 'Соответствующий контраст цветов', 'Уважение prefers-reduced-motion', 'Масштабируемый текст'], contact: 'Координатор доступности', email: 'accessibility@stocksage.io' },
  fr: { title: "Déclaration d'accessibilité", updated: 'Dernière mise à jour: mai 2026', commitment: "StockSage s'engage à rendre ce site accessible à tous les utilisateurs, y compris les personnes handicapées, conformément aux WCAG 2.0 AA.", features: ['Navigation complète au clavier', 'Support lecteur d\'écran (ARIA)', 'Support RTL', 'Contraste des couleurs conforme', 'Respect de prefers-reduced-motion', 'Texte redimensionnable'], contact: "Coordinateur d'accessibilité", email: 'accessibility@stocksage.io' },
  ar: { title: 'بيان إمكانية الوصول', updated: 'آخر تحديث: مايو 2026', commitment: 'تلتزم StockSage بجعل هذا الموقع متاحاً لجميع المستخدمين، بما في ذلك الأشخاص ذوي الإعاقة، وفقاً لمعايير WCAG 2.0 AA.', features: ['التنقل الكامل بلوحة المفاتيح', 'دعم قارئات الشاشة (ARIA)', 'دعم RTL للعربية والعبرية', 'تباين ألوان مطابق للمعايير', 'احترام prefers-reduced-motion', 'نص قابل للتكبير'], contact: 'منسق إمكانية الوصول', email: 'accessibility@stocksage.io' },
};

export default function AccessibilityPage() {
  const { locale, dir } = useI18n();
  const c = CONTENT[locale] ?? CONTENT.he;
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">{c.title}</h1>
        <p className="text-gray-500 text-sm mb-10">{c.updated}</p>
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>{c.commitment}</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{locale === 'en' ? 'Implemented Features' : locale === 'fr' ? 'Fonctionnalités implémentées' : locale === 'ru' ? 'Реализованные функции' : locale === 'ar' ? 'الميزات المطبّقة' : 'מה הונגש'}</h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              {c.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">{c.contact}</h2>
            <p className="text-gray-400">📧 <a href={`mailto:${c.email}`} className="text-indigo-400 hover:underline">{c.email}</a></p>
          </section>
        </div>
        <div className="mt-10 pt-6 border-t border-white/8 flex gap-4 text-xs text-gray-600">
          <Link href="/" className="hover:text-gray-400 transition-colors">{locale === 'en' ? 'Home' : 'דף הבית'}</Link>
        </div>
      </div>
    </div>
  );
}
