import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'עזרה ושאלות נפוצות — StockSage',
};

const FAQ = [
  {
    q: 'מה זה StockSage?',
    a: 'StockSage היא מערכת AI לאיסוף ועיבוד מידע פיננסי ציבורי. היא מייצרת דוחות מחקר על מניות מ-8 בורסות עולמיות — ניתוח פרופיל חברה, פיננסים, אירועים, תחרות, סיכונים וסינתזה — תוך דקות.',
  },
  {
    q: 'האם זה ייעוץ השקעות?',
    a: 'לא. StockSage היא מערכת מידע אוטומטית בלבד ואינה מספקת ייעוץ השקעות, שיווק השקעות, או המלצות לפי חוק הסדרת העיסוק בייעוץ השקעות, תשנ"ה-1995. כל החלטת השקעה היא באחריות המשתמש הבלעדית.',
  },
  {
    q: 'מה ההבדל בין מהיר, מלא ועמוק?',
    a: '⚡ מהיר (חינמי): פרופיל חברה + ניתוח פיננסי + סינתזה — ~30-60 שניות.\n📊 מלא ($1.99): כל 6 שלבי הניתוח — ~2-3 דקות.\n🔬 עמוק ($3.99): כל 6 שלבים + Claude Sonnet + חיפוש רשת — ~4-6 דקות.',
  },
  {
    q: 'אילו בורסות ומניות נתמכות?',
    a: 'TASE (ת"א), NASDAQ, NYSE, AMEX (ארה"ב), LSE (בריטניה), XETRA (גרמניה), Euronext Paris (צרפת), TSX (קנדה), ASX (אוסטרליה). ניתן לחפש לפי סמל, שם חברה, או שם בעברית.',
  },
  {
    q: 'כמה דוחות אפשר לבצע?',
    a: 'מהיר — חינמי וללא הגבלה לכולם.\nמלא/עמוק — $1.99/$3.99 לדוח.\nPro ($19/חודש) — 30 מלא + 10 עמוק מדי חודש.\nלאורחים (ללא חשבון) — 3 דוחות מהירים.',
  },
  {
    q: 'האם הנתונים בזמן אמת?',
    a: 'מחירי מניות מתעדכנים בזמן אמת (60 שניות cache). נתונים פיננסיים (רבעוניים/שנתיים) מגיעים מ-Yahoo Finance, FRED ו-TASE Maya ועשויים להיות מעוכבים של ימים-שבועות. StockSage מציינת את מקור ותאריך כל נתון.',
  },
  {
    q: 'איך מבטלים מנוי Pro?',
    a: 'שלח מייל ל-support@stocksage.io עם כותרת "ביטול מנוי". הביטול ייכנס לתוקף בסוף תקופת החיוב הנוכחית. לא מבצעים החזרים על תקופות שכבר שולמו.',
  },
  {
    q: 'האם המידע שלי מאובטח?',
    a: 'כן. כל הנתונים מאוחסנים ב-Google Cloud (אירופה) ומוצפנים. לא מוכרים נתוני משתמשים לצדדים שלישיים. לפרטים ראה מדיניות הפרטיות.',
  },
  {
    q: 'איך פועלת ההרשמה ללא חשבון?',
    a: 'כשנכנסים לאתר ללא חשבון מקבלים 3 דוחות מהירים חינמיים. הדוחות נשמרים ולאחר הרשמה הם ממשיכים להופיע בחשבון החדש.',
  },
  {
    q: 'איך יוצרים קשר?',
    a: 'support@stocksage.io לכל שאלה. זמן תגובה: 1-2 ימי עסקים.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="rtl">
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">
            Stock<span className="text-gradient">Sage</span>
          </Link>
          <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">אודות</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">עזרה ושאלות נפוצות</h1>
          <p className="text-gray-400">כל מה שצריך לדעת על StockSage</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: '🚀', label: 'התחל', href: '/dashboard' },
            { icon: '💳', label: 'תמחור', href: '/#pricing' },
            { icon: '📋', label: 'תנאים', href: '/terms' },
            { icon: '✉️', label: 'יצירת קשר', href: 'mailto:support@stocksage.io' },
          ].map((l) => (
            <Link key={l.label} href={l.href}
              className="glass-card rounded-xl p-4 text-center text-sm text-gray-300 hover:text-white">
              <div className="text-2xl mb-1">{l.icon}</div>
              {l.label}
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="glass rounded-2xl group">
              <summary className="px-6 py-4 cursor-pointer list-none flex items-center justify-between
                                  text-white font-medium hover:text-indigo-300 transition-colors select-none">
                {item.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform shrink-0 mr-3">▾</span>
              </summary>
              <div className="px-6 pb-5">
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 glass rounded-2xl p-8 text-center">
          <h2 className="text-white font-semibold text-lg mb-2">לא מצאת תשובה?</h2>
          <p className="text-gray-400 text-sm mb-4">צוות התמיכה שלנו זמין לכל שאלה</p>
          <a href="mailto:support@stocksage.io"
            className="inline-flex btn-glow text-white text-sm font-medium px-6 py-2.5 rounded-xl">
            ✉️ שלח מייל לתמיכה
          </a>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-10 pt-6 border-t border-white/5">
          {[['/', 'דף הבית'], ['/about', 'אודות'], ['/terms', 'תנאי שימוש'],
            ['/privacy', 'פרטיות'], ['/refund', 'החזרים'], ['/accessibility', 'נגישות']].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-gray-400 transition-colors">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
