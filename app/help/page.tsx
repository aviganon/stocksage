'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

type FAQ = { q: string; a: string }[];

const FAQS: Record<string, FAQ> = {
  he: [
    { q: 'מה זה StockSage?', a: 'מערכת AI לאיסוף ועיבוד מידע פיננסי ציבורי. מייצרת דוחות מחקר על מניות מ-8 בורסות — ניתוח פרופיל חברה, פיננסים, אירועים, תחרות, סיכונים וסינתזה — תוך דקות.' },
    { q: 'האם זה ייעוץ השקעות?', a: 'לא. StockSage אינה מספקת ייעוץ השקעות, שיווק השקעות, או המלצות לפי חוק תשנ"ה-1995. כל החלטת השקעה היא באחריות המשתמש הבלעדית.' },
    { q: 'מה ההבדל בין מהיר, מלא ועמוק?', a: '⚡ מהיר (חינמי): פרופיל + פיננסים + סינתזה (~30-60 שנ׳). 📊 מלא ($1.99): כל 6 שלבים (~2-3 דק׳). 🔬 עמוק ($3.99): 6 שלבים + Claude Sonnet + חיפוש רשת (~4-6 דק׳).' },
    { q: 'אילו בורסות נתמכות?', a: 'TASE (ת"א), NASDAQ, NYSE, LSE (UK), XETRA (גרמניה), Euronext Paris (צרפת), TSX (קנדה), ASX (אוסטרליה).' },
    { q: 'האם הנתונים בזמן אמת?', a: 'מחירים מתעדכנים בזמן אמת (60 שניות cache). נתונים פיננסיים עשויים להיות מעוכבים של ימים-שבועות.' },
    { q: 'איך מבטלים מנוי Pro?', a: 'שלח מייל ל-support@stocksage.io. הביטול ייכנס לתוקף בסוף תקופת החיוב.' },
    { q: 'איך יוצרים קשר?', a: 'support@stocksage.io — זמן תגובה: 1-2 ימי עסקים.' },
  ],
  en: [
    { q: 'What is StockSage?', a: 'An AI system for collecting and processing public financial information. Generates research reports on stocks from 8 exchanges — company profile, financials, events, competitive analysis, risks and synthesis — in minutes.' },
    { q: 'Is this investment advice?', a: 'No. StockSage does not provide investment advice or recommendations. All investment decisions are solely the user\'s responsibility.' },
    { q: 'What\'s the difference between Quick, Full, and Deep?', a: '⚡ Quick (free): Profile + Financials + Synthesis (~30-60s). 📊 Full ($1.99): All 6 steps (~2-3min). 🔬 Deep ($3.99): 6 steps + Claude Sonnet + web search (~4-6min).' },
    { q: 'Which exchanges are supported?', a: 'TASE (Tel Aviv), NASDAQ, NYSE, LSE (UK), XETRA (Germany), Euronext Paris (France), TSX (Canada), ASX (Australia).' },
    { q: 'Is the data real-time?', a: 'Prices update in real-time (60s cache). Financial statements may be delayed by days to weeks.' },
    { q: 'How do I cancel my Pro subscription?', a: 'Email support@stocksage.io. Cancellation takes effect at the end of the current billing period.' },
    { q: 'How do I contact support?', a: 'support@stocksage.io — Response time: 1-2 business days.' },
  ],
  ru: [
    { q: 'Что такое StockSage?', a: 'ИИ-система для сбора и обработки публичной финансовой информации. Создаёт аналитические отчёты по акциям с 8 бирж за несколько минут.' },
    { q: 'Это инвестиционный совет?', a: 'Нет. StockSage не предоставляет инвестиционных рекомендаций. Все решения — на ответственности пользователя.' },
    { q: 'Различия между быстрым, полным и глубоким анализом?', a: '⚡ Быстрый (бесплатно): Профиль + Финансы + Синтез (~30-60с). 📊 Полный ($1.99): 6 шагов (~2-3мин). 🔬 Глубокий ($3.99): 6 шагов + Claude Sonnet + веб-поиск (~4-6мин).' },
    { q: 'Какие биржи поддерживаются?', a: 'TASE, NASDAQ, NYSE, LSE, XETRA, Euronext Paris, TSX, ASX.' },
    { q: 'Как отменить подписку Pro?', a: 'Напишите на support@stocksage.io. Отмена вступает в силу в конце расчётного периода.' },
    { q: 'Как связаться с поддержкой?', a: 'support@stocksage.io — Время ответа: 1-2 рабочих дня.' },
  ],
  fr: [
    { q: "Qu'est-ce que StockSage?", a: "Un système IA pour collecter et traiter des informations financières publiques. Génère des rapports de recherche sur des actions de 8 bourses en quelques minutes." },
    { q: "Est-ce un conseil en investissement?", a: "Non. StockSage ne fournit pas de conseils en investissement. Toutes les décisions d'investissement relèvent de la seule responsabilité de l'utilisateur." },
    { q: "Différence entre rapide, complet et approfondi?", a: "⚡ Rapide (gratuit): Profil + Finances + Synthèse (~30-60s). 📊 Complet (1,99$): 6 étapes (~2-3min). 🔬 Approfondi (3,99$): 6 étapes + Claude Sonnet (~4-6min)." },
    { q: "Quelles bourses sont supportées?", a: "TASE, NASDAQ, NYSE, LSE, XETRA, Euronext Paris, TSX, ASX." },
    { q: "Comment annuler l'abonnement Pro?", a: "Email à support@stocksage.io. L'annulation prend effet à la fin de la période de facturation." },
    { q: "Comment contacter le support?", a: "support@stocksage.io — Délai de réponse: 1-2 jours ouvrables." },
  ],
  ar: [
    { q: 'ما هو StockSage؟', a: 'نظام ذكاء اصطناعي لجمع ومعالجة المعلومات المالية العامة. يُنشئ تقارير بحثية عن الأسهم من 8 بورصات في دقائق.' },
    { q: 'هل هذه نصيحة استثمارية؟', a: 'لا. StockSage لا تقدم نصائح استثمارية. جميع قرارات الاستثمار على مسؤولية المستخدم وحده.' },
    { q: 'الفرق بين السريع والكامل والعميق؟', a: '⚡ سريع (مجاني): ملف + مالية + توليف (~30-60ث). 📊 كامل ($1.99): 6 خطوات (~2-3د). 🔬 عميق ($3.99): 6 خطوات + Claude Sonnet (~4-6د).' },
    { q: 'ما البورصات المدعومة؟', a: 'TASE، NASDAQ، NYSE، LSE، XETRA، Euronext Paris، TSX، ASX.' },
    { q: 'كيف أتواصل مع الدعم؟', a: 'support@stocksage.io — وقت الرد: 1-2 أيام عمل.' },
  ],
};

const LABELS: Record<string, { title: string; sub: string; contact: string; btn: string }> = {
  he: { title: 'עזרה ושאלות נפוצות', sub: 'כל מה שצריך לדעת על StockSage', contact: 'לא מצאת תשובה? שלח מייל:', btn: 'ממשיך לתמיכה' },
  en: { title: 'Help & FAQ', sub: 'Everything you need to know about StockSage', contact: "Didn't find an answer? Email us:", btn: 'Contact Support' },
  ru: { title: 'Помощь и FAQ', sub: 'Всё, что нужно знать о StockSage', contact: 'Не нашли ответ? Напишите нам:', btn: 'Написать в поддержку' },
  fr: { title: 'Aide & FAQ', sub: 'Tout ce que vous devez savoir sur StockSage', contact: "Pas de réponse? Contactez-nous:", btn: 'Contacter le support' },
  ar: { title: 'المساعدة والأسئلة الشائعة', sub: 'كل ما تحتاج معرفته عن StockSage', contact: 'لم تجد إجابة؟ راسلنا:', btn: 'التواصل مع الدعم' },
};

export default function HelpPage() {
  const { locale, dir } = useI18n();
  const faqs = FAQS[locale] ?? FAQS.he;
  const lb   = LABELS[locale] ?? LABELS.he;
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">{locale === 'en' ? 'About' : locale === 'fr' ? 'À propos' : locale === 'ru' ? 'О нас' : locale === 'ar' ? 'عنا' : 'אודות'}</Link>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">{lb.title}</h1>
          <p className="text-gray-400">{lb.sub}</p>
        </div>
        <div className="space-y-3 mb-12">
          {faqs.map((item, i) => (
            <details key={i} className="glass rounded-2xl group">
              <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between text-white font-medium hover:text-indigo-300 transition-colors select-none">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform shrink-0 mr-3">▾</span>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            </details>
          ))}
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-3">{lb.contact}</p>
          <a href="mailto:support@stocksage.io" className="inline-flex btn-glow text-white text-sm font-medium px-6 py-2.5 rounded-xl">
            ✉️ support@stocksage.io
          </a>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-10 pt-6 border-t border-white/5">
          {[['/', locale === 'en' ? 'Home' : 'דף הבית'], ['/terms', locale === 'en' ? 'Terms' : 'תנאים'], ['/privacy', locale === 'en' ? 'Privacy' : 'פרטיות']].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-gray-400 transition-colors">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
