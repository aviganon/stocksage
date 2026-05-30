import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות החזרים — StockSage',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen text-[#e8e8f0]">
      <nav className="glass-nav sticky top-0 z-30 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient mb-2">מדיניות החזרים</h1>
        <p className="text-gray-500 text-sm mb-10">עדכון אחרון: מאי 2026</p>

        <div className="glass rounded-3xl p-8 space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">מדיניות כללית</h2>
            <p>
              StockSage מציעה תמחור על בסיס תשלום לדוח (pay-per-report).
              מכיוון שהשירות הוא דיגיטלי ומסופק מיידית עם תחילת עיבוד הדוח,
              <strong className="text-white"> אין החזר כספי לאחר שהמחקר החל להתבצע.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">מקרים זכאים להחזר</h2>
            <p>נשקול החזר כספי במקרים הבאים:</p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-400">
              <li>חיוב כפול על אותו דוח</li>
              <li>תקלה טכנית שמנעה את השלמת הדוח לאחר חיוב</li>
              <li>חיוב שגוי שלא הוזמן על ידי המשתמש</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">תהליך בקשת החזר</h2>
            <p>
              לבקשת החזר, שלח מייל ל-{' '}
              <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">
                support@stocksage.io
              </a>{' '}
              עם:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-400">
              <li>כתובת האימייל של החשבון</li>
              <li>תאריך ומזהה העסקה</li>
              <li>תיאור הבעיה</li>
            </ul>
            <p className="mt-3">נגיב תוך 3 ימי עסקים.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">עיבוד ההחזר</h2>
            <p>
              החזרים מאושרים יעובדו דרך Paddle (מעבד התשלומים שלנו) תוך 5–10 ימי עסקים,
              בהתאם לאמצעי התשלום המקורי.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">יצירת קשר</h2>
            <p>
              לכל שאלה בנוגע לחיובים:{' '}
              <a href="mailto:support@stocksage.io" className="text-indigo-400 hover:underline">
                support@stocksage.io
              </a>
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
