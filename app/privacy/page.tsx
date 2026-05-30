import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות — StockSage',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-[#e8e8f0]">
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-gradient">Sage</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">מדיניות פרטיות</h1>
        <p className="text-gray-500 text-sm mb-10">עדכון אחרון: מאי 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. מידע שאנו אוספים</h2>
            <p>אנו אוספים את המידע הבא:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
              <li><strong className="text-gray-300">פרטי חשבון:</strong> כתובת אימייל בעת ההרשמה</li>
              <li><strong className="text-gray-300">נתוני שימוש:</strong> מניות שנחקרו, דוחות שנוצרו, תאריכים</li>
              <li><strong className="text-gray-300">נתוני תשלום:</strong> מעובדים על ידי Paddle — אנו לא מאחסנים פרטי כרטיס אשראי</li>
              <li><strong className="text-gray-300">לוגים טכניים:</strong> כתובת IP, סוג דפדפן, שגיאות — לצרכי תפעול בלבד</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. כיצד אנו משתמשים במידע</h2>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
              <li>מתן השירות — יצירת דוחות מחקר</li>
              <li>ניהול חשבון ומנוי</li>
              <li>שיפור המוצר בהתבסס על דפוסי שימוש אנונימיים</li>
              <li>תקשורת שירותית (עדכונים חשובים, שינויי תנאים)</li>
            </ul>
            <p className="mt-3">אנו <strong className="text-white">לא מוכרים</strong> מידע לצדדים שלישיים ולא משתמשים בו לפרסום ממוקד.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. שמירת מידע</h2>
            <p>
              המידע שלך מאוחסן ב-Google Cloud (אירופה — europe-west1) ו-Firebase.
              דוחות נשמרים לצמיתות עד למחיקת החשבון. לוגים טכניים נשמרים 90 יום.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. שיתוף עם צדדים שלישיים</h2>
            <p>אנו משתמשים בספקים הבאים:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
              <li><strong className="text-gray-300">Anthropic (Claude AI)</strong> — עיבוד שאילתות מחקר. שאילתות אינן נשמרות לאימון מודלים.</li>
              <li><strong className="text-gray-300">Firebase / Google Cloud</strong> — אחסון נתונים ואימות</li>
              <li><strong className="text-gray-300">Paddle</strong> — עיבוד תשלומים</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. זכויותיך</h2>
            <p>בהתאם ל-GDPR וחוק הגנת הפרטיות הישראלי, יש לך זכות ל:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
              <li>גישה למידע שמוחזק עליך</li>
              <li>תיקון מידע שגוי</li>
              <li>מחיקת חשבון וכל הנתונים (דרך הגדרות החשבון)</li>
              <li>ייצוא הדוחות שלך</li>
            </ul>
            <p className="mt-3">
              לבקשות פרטיות:{' '}
              <a href="mailto:privacy@stocksage.io" className="text-indigo-400 hover:underline">
                privacy@stocksage.io
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. עוגיות (Cookies)</h2>
            <p>
              אנו משתמשים בעוגיות הכרחיות לאימות בלבד (Firebase Auth session).
              אין שימוש בעוגיות פרסום או מעקב של צד שלישי.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. אבטחת מידע</h2>
            <p>
              כל תעבורת הנתונים מוצפנת (HTTPS/TLS). גישה לנתונים בצד השרת מוגנת
              על ידי Google Cloud IAM ו-Firebase Security Rules. אנו מבצעים עדכוני אבטחה שוטפים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. ילדים</h2>
            <p>
              השירות אינו מיועד לבני פחות מ-18. אנו לא אוספים ביודעין מידע ממשתמשים מתחת לגיל זה.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300 transition-colors">תנאי שימוש</Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">דף הבית</Link>
        </div>
      </div>
    </div>
  );
}
