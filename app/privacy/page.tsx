'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

const CONTENT: Record<string, { title: string; updated: string; sections: { h: string; body: string | string[] }[] }> = {
  he: { title: 'מדיניות פרטיות', updated: 'עדכון אחרון: מאי 2026', sections: [
    { h: '1. מידע שאנו אוספים', body: ['כתובת אימייל בעת ההרשמה', 'נתוני שימוש: מניות שנחקרו, דוחות, תאריכים', 'נתוני תשלום: מעובדים על ידי Paddle — אנו לא מאחסנים פרטי כרטיס', 'לוגים טכניים: כתובת IP, שגיאות — לצרכי תפעול בלבד'] },
    { h: '2. כיצד אנו משתמשים במידע', body: ['מתן השירות — יצירת דוחות מחקר', 'ניהול חשבון ומנוי', 'שיפור המוצר בהתבסס על דפוסי שימוש אנונימיים'] },
    { h: '3. שמירת מידע', body: 'המידע מאוחסן ב-Google Cloud (אירופה — europe-west1) ו-Firebase.' },
    { h: '4. שיתוף עם צדדים שלישיים', body: ['Anthropic (Claude AI) — עיבוד שאילתות', 'Firebase / Google Cloud — אחסון', 'Paddle — עיבוד תשלומים'] },
    { h: '5. זכויותיך', body: ['גישה למידע, תיקון, מחיקה דרך הגדרות החשבון', 'פנייה לפרטיות: privacy@stocksage.io'] },
    { h: '6. עוגיות', body: 'אנו משתמשים בעוגיות הכרחיות בלבד לאימות. אין עוגיות פרסום.' },
  ]},
  en: { title: 'Privacy Policy', updated: 'Last updated: May 2026', sections: [
    { h: '1. Information We Collect', body: ['Email address at registration', 'Usage data: researched stocks, reports, dates', 'Payment data: processed by Paddle — we do not store card details', 'Technical logs: IP address, errors — for operational purposes only'] },
    { h: '2. How We Use Information', body: ['Providing the service — creating research reports', 'Account and subscription management', 'Product improvement based on anonymous usage patterns'] },
    { h: '3. Data Storage', body: 'Data is stored on Google Cloud (Europe — europe-west1) and Firebase.' },
    { h: '4. Third-Party Sharing', body: ['Anthropic (Claude AI) — query processing', 'Firebase / Google Cloud — storage', 'Paddle — payment processing'] },
    { h: '5. Your Rights', body: ['Access, correction, deletion via account settings', 'Privacy inquiries: privacy@stocksage.io'] },
    { h: '6. Cookies', body: 'We use only essential cookies for authentication. No advertising cookies.' },
  ]},
  ru: { title: 'Политика конфиденциальности', updated: 'Последнее обновление: май 2026', sections: [
    { h: '1. Собираемые данные', body: ['Email при регистрации', 'Данные использования: исследованные акции, отчёты', 'Платёжные данные: обрабатываются Paddle', 'Технические логи: IP, ошибки'] },
    { h: '2. Использование данных', body: ['Предоставление сервиса', 'Управление аккаунтом', 'Улучшение продукта'] },
    { h: '3. Хранение', body: 'Данные хранятся на Google Cloud (Европа) и Firebase.' },
    { h: '4. Третьи стороны', body: ['Anthropic (Claude AI)', 'Firebase / Google Cloud', 'Paddle'] },
    { h: '5. Ваши права', body: 'Доступ и удаление через настройки аккаунта. Запросы: privacy@stocksage.io' },
    { h: '6. Cookies', body: 'Только необходимые cookies для авторизации. Рекламных cookies нет.' },
  ]},
  fr: { title: 'Politique de confidentialité', updated: 'Dernière mise à jour: mai 2026', sections: [
    { h: '1. Données collectées', body: ["Email à l'inscription", "Données d'utilisation: actions analysées, rapports", 'Données de paiement: traitées par Paddle', 'Logs techniques: IP, erreurs'] },
    { h: '2. Utilisation des données', body: ['Fourniture du service', 'Gestion du compte', 'Amélioration du produit'] },
    { h: '3. Stockage', body: 'Données stockées sur Google Cloud (Europe) et Firebase.' },
    { h: '4. Tiers', body: ['Anthropic (Claude AI)', 'Firebase / Google Cloud', 'Paddle'] },
    { h: '5. Vos droits', body: 'Accès et suppression via les paramètres du compte. Contact: privacy@stocksage.io' },
    { h: '6. Cookies', body: "Uniquement des cookies essentiels pour l'authentification." },
  ]},
  ar: { title: 'سياسة الخصوصية', updated: 'آخر تحديث: مايو 2026', sections: [
    { h: '1. البيانات التي نجمعها', body: ['البريد الإلكتروني عند التسجيل', 'بيانات الاستخدام: الأسهم المحللة، التقارير', 'بيانات الدفع: تعالجها Paddle', 'السجلات التقنية: IP، الأخطاء'] },
    { h: '2. استخدام البيانات', body: ['تقديم الخدمة', 'إدارة الحساب', 'تحسين المنتج'] },
    { h: '3. التخزين', body: 'يتم تخزين البيانات على Google Cloud (أوروبا) وFirebase.' },
    { h: '4. الأطراف الثالثة', body: ['Anthropic (Claude AI)', 'Firebase / Google Cloud', 'Paddle'] },
    { h: '5. حقوقك', body: 'الوصول والحذف من خلال إعدادات الحساب. التواصل: privacy@stocksage.io' },
    { h: '6. ملفات تعريف الارتباط', body: 'نستخدم فقط ملفات تعريف الارتباط الضرورية للمصادقة.' },
  ]},
};

export default function PrivacyPage() {
  const { locale, dir } = useI18n();
  const c = CONTENT[locale] ?? CONTENT.he;
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">{c.title}</h1>
        <p className="text-gray-500 text-sm mb-10">{c.updated}</p>
        <div className="space-y-8 text-gray-300 leading-relaxed">
          {c.sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-white mb-3">{s.h}</h2>
              {Array.isArray(s.body)
                ? <ul className="list-disc list-inside space-y-1 text-gray-400">{s.body.map((b, i) => <li key={i}>{b}</li>)}</ul>
                : <p>{s.body}</p>}
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/8 flex gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300 transition-colors">{locale === 'en' ? 'Terms' : locale === 'fr' ? 'CGU' : locale === 'ru' ? 'Условия' : locale === 'ar' ? 'الشروط' : 'תנאי שימוש'}</Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">{locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : locale === 'ru' ? 'Главная' : locale === 'ar' ? 'الرئيسية' : 'דף הבית'}</Link>
        </div>
      </div>
    </div>
  );
}
