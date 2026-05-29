import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תנאי שימוש — StockSage',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">תנאי שימוש</h1>
        <p className="text-gray-500 text-sm mb-10">עדכון אחרון: מאי 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. כללי</h2>
            <p>
              ברוכים הבאים ל-StockSage. השימוש בשירות מהווה הסכמה לתנאים אלו.
              StockSage מספקת כלי AI לניתוח מניות וניירות ערך לצרכי מידע בלבד.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. אינו ייעוץ השקעות</h2>
            <p>
              <strong className="text-white">התוכן שמספקת StockSage אינו ייעוץ השקעות, אינו המלצה לקנייה או מכירה
              של ניירות ערך, ואינו תחליף לייעוץ מקצועי מורשה.</strong> כל החלטת השקעה היא באחריות
              המשתמש בלבד. ביצועי העבר אינם ערובה לעתיד.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. השירות</h2>
            <p>
              StockSage מציעה ניתוח אוטומטי מבוסס AI של חברות ציבוריות. הנתונים מגיעים
              ממקורות ציבוריים ועשויים להיות חלקיים, מאוחרים, או שגויים. אנו אינו מתחייבים
              לדיוק, שלמות, או עדכניות המידע.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. חשבונות ותשלום</h2>
            <p>
              פלאן ה-Free מאפשר 3 דוחות לחודש ללא תשלום. פלאן ה-Pro ($19/חודש) מאפשר
              דוחות ללא הגבלה. ביטול מנוי ניתן בכל עת ויכנס לתוקף בסוף תקופת החיוב הנוכחית.
              אין החזרים כספיים על תקופות שכבר חויבו.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. שימוש מותר</h2>
            <p>אסור להשתמש בשירות לצורך:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
              <li>הפצת מידע כוזב או מניפולציה בשוק ההון</li>
              <li>גרידת נתונים אוטומטית (scraping) ללא אישור</li>
              <li>כל שימוש הנוגד את החוק הישראלי או בינלאומי</li>
              <li>שיתוף גישה לחשבון עם משתמשים אחרים</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. קניין רוחני</h2>
            <p>
              כל הדוחות שנוצרים עבור המשתמש שייכים לו. קוד המערכת, ממשק המשתמש, ועיצוב
              המוצר הם קניינה של StockSage ואין לשכפל או להפיץ אותם ללא אישור.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. הגבלת אחריות</h2>
            <p>
              StockSage לא תהיה אחראית לכל נזק ישיר, עקיף, מקרי, או תוצאתי הנובע משימוש
              בשירות, לרבות הפסדי השקעה. האחריות המקסימלית של StockSage לא תעלה על הסכום
              ששולם על ידי המשתמש בשלושת החודשים האחרונים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. שינויים בתנאים</h2>
            <p>
              StockSage רשאית לשנות תנאים אלו בכל עת. שינויים מהותיים יודיעו במייל.
              המשך השימוש לאחר השינוי מהווה הסכמה לתנאים המעודכנים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. יצירת קשר</h2>
            <p>
              לשאלות בנוגע לתנאים אלו:{' '}
              <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">
                support@stocksage.io
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">מדיניות פרטיות</Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">דף הבית</Link>
        </div>
      </div>
    </div>
  );
}
