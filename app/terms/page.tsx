'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

const CONTENT: Record<string, { title: string; updated: string; sections: { h: string; p: string | string[] }[] }> = {
  he: {
    title: 'תנאי שימוש', updated: 'עדכון אחרון: מאי 2026',
    sections: [
      { h: '1. כללי', p: 'ברוכים הבאים ל-StockSage. השימוש בשירות מהווה הסכמה לתנאים אלו. StockSage מספקת כלי AI לניתוח מניות וניירות ערך לצרכי מידע בלבד.' },
      { h: '2. אינו ייעוץ השקעות', p: 'התוכן שמספקת StockSage אינו ייעוץ השקעות, אינו המלצה לקנייה או מכירה של ניירות ערך, ואינו תחליף לייעוץ מקצועי מורשה לפי חוק הסדרת העיסוק בייעוץ השקעות, תשנ"ה-1995. כל החלטת השקעה היא באחריות המשתמש בלבד.' },
      { h: '3. השירות', p: 'StockSage מציעה ניתוח אוטומטי מבוסס AI של חברות ציבוריות. הנתונים מגיעים ממקורות ציבוריים ועשויים להיות חלקיים, מאוחרים, או שגויים.' },
      { h: '4. תשלום', p: 'ניתוח מהיר — חינמי. ניתוח מלא ($1.99) ועמוק ($3.99) בתשלום לדוח. מנוי Pro ($19/חודש) כולל 30 מלא + 10 עמוק חודשיים. ביטול מנוי ניתן בכל עת.' },
      { h: '5. שימוש מותר', p: ['אסור להשתמש בשירות להפצת מידע כוזב', 'אסור גרידת נתונים אוטומטית ללא אישור', 'אסור שיתוף גישה לחשבון עם משתמשים אחרים'] },
      { h: '6. קניין רוחני', p: 'הדוחות שנוצרים שייכים למשתמש. קוד המערכת ועיצוב המוצר הם קניין StockSage.' },
      { h: '7. הגבלת אחריות', p: 'StockSage לא תהיה אחראית לכל נזק הנובע משימוש בשירות, לרבות הפסדי השקעה.' },
      { h: '8. יצירת קשר', p: 'לשאלות: support@stocksage.io' },
    ],
  },
  en: {
    title: 'Terms of Service', updated: 'Last updated: May 2026',
    sections: [
      { h: '1. General', p: 'Welcome to StockSage. Using this service constitutes acceptance of these terms. StockSage provides AI tools for analyzing stocks for informational purposes only.' },
      { h: '2. Not Investment Advice', p: 'Content provided by StockSage does not constitute investment advice, a recommendation to buy or sell securities, or a substitute for advice from a licensed professional. All investment decisions are solely the responsibility of the user.' },
      { h: '3. The Service', p: 'StockSage provides automated AI-based analysis of public companies. Data comes from public sources and may be partial, delayed, or inaccurate.' },
      { h: '4. Payment', p: 'Quick analysis — free. Full ($1.99) and Deep ($3.99) analysis are paid per report. Pro subscription ($19/month) includes 30 full + 10 deep monthly. Cancel anytime.' },
      { h: '5. Permitted Use', p: ['Do not use the service to spread false information', 'Do not scrape data without permission', 'Do not share account access with others'] },
      { h: '6. Intellectual Property', p: 'Reports generated belong to the user. System code and product design are StockSage property.' },
      { h: '7. Limitation of Liability', p: 'StockSage is not liable for any damages arising from use of the service, including investment losses.' },
      { h: '8. Contact', p: 'Questions: support@stocksage.io' },
    ],
  },
  ru: {
    title: 'Условия использования', updated: 'Последнее обновление: май 2026',
    sections: [
      { h: '1. Общее', p: 'Добро пожаловать в StockSage. Использование сервиса означает согласие с настоящими условиями. StockSage предоставляет инструменты ИИ для анализа акций исключительно в информационных целях.' },
      { h: '2. Не является инвестиционным советом', p: 'Содержимое StockSage не является инвестиционным советом, рекомендацией к покупке или продаже ценных бумаг. Все инвестиционные решения — на ответственности пользователя.' },
      { h: '3. Сервис', p: 'StockSage предоставляет автоматический анализ публичных компаний на основе ИИ. Данные поступают из открытых источников и могут быть неточными или устаревшими.' },
      { h: '4. Оплата', p: 'Быстрый анализ — бесплатно. Полный ($1.99) и глубокий ($3.99) — платно за отчёт. Подписка Pro ($19/месяц) включает 30 полных + 10 глубоких в месяц.' },
      { h: '5. Допустимое использование', p: ['Запрещено распространение ложной информации', 'Запрещена автоматическая выгрузка данных без разрешения', 'Запрещена передача доступа к аккаунту'] },
      { h: '6. Контакты', p: 'Вопросы: support@stocksage.io' },
    ],
  },
  fr: {
    title: "Conditions d'utilisation", updated: 'Dernière mise à jour: mai 2026',
    sections: [
      { h: '1. Général', p: "Bienvenue sur StockSage. L'utilisation du service constitue une acceptation de ces conditions. StockSage fournit des outils IA pour analyser des actions à titre informatif uniquement." },
      { h: '2. Pas un conseil en investissement', p: "Le contenu de StockSage ne constitue pas un conseil en investissement ni une recommandation d'achat/vente de titres. Toutes les décisions d'investissement relèvent de la seule responsabilité de l'utilisateur." },
      { h: '3. Le service', p: "StockSage propose une analyse automatisée par IA d'entreprises publiques. Les données proviennent de sources publiques et peuvent être partielles ou inexactes." },
      { h: '4. Paiement', p: 'Analyse rapide — gratuite. Analyse complète (1,99 $) et approfondie (3,99 $) par rapport. Abonnement Pro (19 $/mois) inclut 30 complètes + 10 approfondies par mois.' },
      { h: '5. Contact', p: 'Questions: support@stocksage.io' },
    ],
  },
  ar: {
    title: 'شروط الاستخدام', updated: 'آخر تحديث: مايو 2026',
    sections: [
      { h: '1. عام', p: 'مرحباً بك في StockSage. استخدام الخدمة يعني قبولك لهذه الشروط. تقدم StockSage أدوات ذكاء اصطناعي لتحليل الأسهم لأغراض المعلومات فقط.' },
      { h: '2. ليست نصيحة استثمارية', p: 'لا يُشكّل محتوى StockSage نصيحة استثمارية أو توصية بشراء/بيع أوراق مالية. جميع قرارات الاستثمار على مسؤولية المستخدم وحده.' },
      { h: '3. الخدمة', p: 'تقدم StockSage تحليلاً آلياً بالذكاء الاصطناعي للشركات العامة. تأتي البيانات من مصادر عامة وقد تكون غير دقيقة أو قديمة.' },
      { h: '4. الدفع', p: 'التحليل السريع — مجاني. الكامل ($1.99) والعميق ($3.99) مدفوع لكل تقرير. اشتراك Pro ($19/شهر) يشمل 30 كاملاً + 10 عميقاً شهرياً.' },
      { h: '5. التواصل', p: 'أسئلة: support@stocksage.io' },
    ],
  },
};

export default function TermsPage() {
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
              {Array.isArray(s.p)
                ? <ul className="list-disc list-inside space-y-1 text-gray-400">{s.p.map((item, i) => <li key={i}>{item}</li>)}</ul>
                : <p>{s.p}</p>}
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/8 flex gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">{locale === 'en' ? 'Privacy' : locale === 'fr' ? 'Confidentialité' : locale === 'ru' ? 'Конфиденциальность' : locale === 'ar' ? 'الخصوصية' : 'מדיניות פרטיות'}</Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">{locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : locale === 'ru' ? 'Главная' : locale === 'ar' ? 'الرئيسية' : 'דף הבית'}</Link>
        </div>
      </div>
    </div>
  );
}
