import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות — StockSage',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]" dir="rtl">
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">הצהרת נגישות</h1>
        <p className="text-gray-500 text-sm mb-10">עדכון אחרון: מאי 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">מחויבות לנגישות</h2>
            <p>
              StockSage רואה חשיבות רבה במתן שירות שווה ונגיש לכלל המשתמשים, לרבות אנשים עם
              מוגבלות. אנו פועלים להנגשת האתר בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות
              (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי ת"י 5568 המבוסס על הנחיות
              <strong className="text-white"> WCAG 2.0 ברמת AA</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">מה הונגש באתר</h2>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400">
              <li>ניווט מלא באמצעות מקלדת עם חיווי פוקוס ברור</li>
              <li>תמיכה בקוראי מסך (תוויות ARIA על רכיבים אינטראקטיביים)</li>
              <li>תמיכה בכיווניות RTL לעברית וערבית</li>
              <li>ניגודיות צבעים תקנית בין טקסט לרקע</li>
              <li>כיבוד העדפת המשתמש להפחתת אנימציות (prefers-reduced-motion)</li>
              <li>טקסט הניתן להגדלה ללא אובדן תוכן או תפקוד</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">דרכי שימוש בקוראי מסך ומקלדת</h2>
            <p>
              ניתן לנווט באתר באמצעות מקש Tab למעבר בין רכיבים, Enter/רווח להפעלה, ומקשי
              החיצים בתפריטים. האתר נבדק מול קוראי מסך נפוצים.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">הסדרי נגישות מתמשכים</h2>
            <p>
              אנו ממשיכים לשפר את הנגישות באופן שוטף. אם נתקלת ברכיב שאינו נגיש, נשמח שתעדכן
              אותנו ונפעל לתקנו בהקדם.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">רכז הנגישות</h2>
            <p>
              לפניות בנושא נגישות ניתן ליצור קשר עם רכז הנגישות שלנו:
            </p>
            <ul className="list-none space-y-1 mt-3 text-gray-400">
              <li>📧 דוא"ל: <a href="mailto:accessibility@stocksage.io" className="text-indigo-400 hover:underline">accessibility@stocksage.io</a></li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              בפנייה נא לפרט את הדף, סוג התקלה והטכנולוגיה המסייעת שבה השתמשת, כדי שנוכל
              לטפל ביעילות.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">החרגות</h2>
            <p className="text-sm text-gray-500">
              חלקים מסוימים בתוכן הנוצר אוטומטית על ידי בינה מלאכותית עשויים להציג טבלאות
              ונתונים מורכבים. אנו פועלים להנגשתם המלאה. במידה ונתקלת בקושי, צור קשר ונספק
              את המידע בפורמט נגיש חלופי.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-300 transition-colors">תנאי שימוש</Link>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">מדיניות פרטיות</Link>
          <Link href="/" className="hover:text-gray-300 transition-colors">דף הבית</Link>
        </div>
      </div>
    </div>
  );
}
