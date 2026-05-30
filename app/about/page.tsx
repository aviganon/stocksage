import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'אודות StockSage',
  description: 'מי אנחנו, המשימה שלנו, ואיך עובדת מערכת המחקר.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="rtl">
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" dir="ltr" className="text-xl font-bold text-white">
            Stock<span className="text-gradient">Sage</span>
          </Link>
          <Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">עזרה ו-FAQ</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-12">

        {/* Hero */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">אודות StockSage</h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            כלי AI לאיסוף ועיבוד מידע פיננסי ציבורי — תוך דקות ולא שעות.
          </p>
        </div>

        {/* Mission */}
        <div className="glass rounded-2xl p-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">המשימה שלנו</h2>
          <p className="text-gray-300 leading-relaxed">
            אנחנו מאמינים שכלים איכותיים לעיבוד מידע פיננסי צריכים להיות נגישים לכל אחד —
            לא רק למוסדות גדולים. StockSage משתמשת בבינה מלאכותית מתקדמת (Claude AI) כדי
            לאסוף, לנתח ולסכם מידע פיננסי ציבורי בצורה מהירה ומסודרת.
          </p>
          <p className="text-gray-300 leading-relaxed">
            הפלטפורמה תומכת ב-8 בורסות ברחבי העולם, ב-5 שפות, ומספקת דוחות מעמיקים
            הכוללים פרופיל חברה, ניתוח פיננסי, ציר אירועים, ניתוח תחרותי, הערכת סיכונים וסינתזה מקיפה.
          </p>
        </div>

        {/* How it works */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">איך זה עובד</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { n: '01', title: 'חיפוש', desc: 'בחר מניה מ-8 בורסות עולמיות — TASE, NASDAQ, LSE, XETRA ועוד' },
              { n: '02', title: 'AI מנתח', desc: 'Claude AI אוסף נתונים ממקורות ציבוריים מרובים ומייצר ניתוח מעמיק' },
              { n: '03', title: 'דוח מוכן', desc: '6 שלבי ניתוח: פרופיל, פיננסים, אירועים, תחרות, סיכונים, סינתזה' },
            ].map(s => (
              <div key={s.n} className="glass-card rounded-2xl p-5">
                <span className="text-indigo-400 text-xs font-mono mb-2 block">{s.n}</span>
                <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology */}
        <div className="glass rounded-2xl p-8 space-y-3">
          <h2 className="text-2xl font-bold text-white">טכנולוגיה</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-400">
            {[
              ['🤖', 'Claude AI (Anthropic)', 'מודל שפה מתקדם לניתוח וסינתזה'],
              ['☁️', 'Google Cloud Run', 'תשתית ענן מאובטחת ומדרגית'],
              ['🔥', 'Firebase Auth + Firestore', 'אימות ואחסון נתונים'],
              ['📊', 'Yahoo Finance, FRED, TASE Maya', 'מקורות נתונים פיננסיים ציבוריים'],
              ['💳', 'Paddle', 'עיבוד תשלומים מאובטח'],
              ['🔒', 'Google Secret Manager', 'ניהול סודות ומפתחות'],
            ].map(([icon, name, desc]) => (
              <div key={String(name)} className="flex gap-3">
                <span className="text-lg shrink-0">{icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{String(name)}</p>
                  <p className="text-gray-500 text-xs">{String(desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-amber-300 font-semibold mb-2">⚠️ אינו ייעוץ השקעות</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            StockSage היא מערכת מידע אוטומטית בלבד. התוכן המוצג אינו מהווה ייעוץ השקעות,
            שיווק השקעות, או המלצה לרכישה/מכירה של ניירות ערך לפי חוק הסדרת העיסוק בייעוץ
            השקעות, תשנ"ה-1995. כל החלטת השקעה היא באחריות הבלעדית של המשתמש.
          </p>
        </div>

        {/* Contact */}
        <div className="glass rounded-2xl p-8 space-y-3">
          <h2 className="text-2xl font-bold text-white">יצירת קשר</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p>📧 תמיכה כללית: <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">support@stocksage.io</a></p>
            <p>🔒 פרטיות ונגישות: <a href="mailto:privacy@stocksage.io" className="text-indigo-400 hover:underline">privacy@stocksage.io</a></p>
            <p>♿ נגישות: <a href="mailto:accessibility@stocksage.io" className="text-indigo-400 hover:underline">accessibility@stocksage.io</a></p>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-4 border-t border-white/5">
          {[['/', 'דף הבית'], ['/terms', 'תנאי שימוש'], ['/privacy', 'פרטיות'],
            ['/refund', 'החזרים'], ['/accessibility', 'נגישות'], ['/help', 'עזרה']].map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-gray-400 transition-colors">{label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
