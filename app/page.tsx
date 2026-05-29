import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Stock<span className="text-indigo-400">Sage</span></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Beta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          מחקר AI לשוק ישראלי
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          מחקר מניות מעמיק<br />
          <span className="text-indigo-400">בדקות, לא שעות</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          StockSage מנתח מניות בורסה תל אביב ובינלאומיות באמצעות Claude AI —
          פרופיל חברה, ניתוח פיננסי, אירועים, תחרות, סיכונים וסינתזה מקיפה.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors">
            התחל חינם — 3 דוחות/חודש
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg transition-colors">
            כניסה לחשבון
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">ניתוח מלא ב-6 שלבים</h2>
        <p className="text-gray-400 text-center mb-16">כל דוח עובר תהליך אוטומטי של איסוף נתונים וניתוח AI</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'פרופיל חברה', desc: 'תיאור, מוצרים, מיילסטונים, הקשר ישראלי ורשימת דגלים' },
            { step: '02', title: 'ניתוח פיננסי', desc: 'הכנסות, שולי רווח, מכפילים, שווי ומסקנת בריאות פיננסית' },
            { step: '03', title: 'ציר זמן אירועים', desc: 'חדשות, הגשות רגולטוריות, אירועים קרובים וסנטימנט' },
            { step: '04', title: 'ניתוח תחרותי', desc: 'מיקום בשוק, מוצות, מתחרים, גלי רוח ומכשולים' },
            { step: '05', title: 'הערכת סיכונים', desc: 'סיכוני חברה, ענף ומאקרו עם דירוג חומרה' },
            { step: '06', title: 'סינתזה', desc: 'תקציר מנהלים, תרחישי bull/bear וציוני מפתח' },
          ].map((f) => (
            <div key={f.step} className="bg-white/5 border border-white/8 rounded-2xl p-6 hover:bg-white/8 transition-colors">
              <div className="text-indigo-400 text-sm font-mono mb-3">{f.step}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">תמחור שקוף</h2>
        <p className="text-gray-400 text-center mb-16">מחקר מהיר חינמי תמיד — משלמים רק על ניתוח מעמיק</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Quick - Free */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="text-2xl mb-3">⚡</div>
            <div className="text-green-300 text-sm font-medium mb-2">מהיר</div>
            <div className="text-4xl font-bold text-white mb-1">חינמי</div>
            <div className="text-gray-500 text-sm mb-6">תמיד, ללא הגבלה</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {['פרופיל חברה', 'ניתוח פיננסי', 'סינתזה וסיכום', 'היסטוריית דוחות'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-white/10 hover:border-green-500/50 text-gray-300 hover:text-white py-3 rounded-xl transition-colors text-sm font-medium">
              התחל חינם
            </Link>
          </div>

          {/* Standard */}
          <div className="bg-amber-500/8 border border-amber-500/30 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">פופולרי</div>
            <div className="text-2xl mb-3">📊</div>
            <div className="text-amber-300 text-sm font-medium mb-2">מלא</div>
            <div className="text-4xl font-bold text-white mb-1">$1.99</div>
            <div className="text-gray-500 text-sm mb-6">לדוח</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {['כל 6 שלבי הניתוח', 'אירועים ורגולציה', 'ניתוח תחרותי', 'הערכת סיכונים'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 py-3 rounded-xl transition-colors text-sm font-medium">
              הרשם ונסה
            </Link>
          </div>

          {/* Deep */}
          <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-8">
            <div className="text-2xl mb-3">🔬</div>
            <div className="text-purple-300 text-sm font-medium mb-2">עמוק</div>
            <div className="text-4xl font-bold text-white mb-1">$3.99</div>
            <div className="text-gray-500 text-sm mb-6">לדוח</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {['כל מה שב"מלא"', 'חיפוש אינטרנט חי', 'Claude Sonnet', 'ניתוח מעמיק ביותר'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 py-3 rounded-xl transition-colors text-sm font-medium">
              הרשם ונסה
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <span>© 2026 StockSage. All rights reserved.</span>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/terms" className="hover:text-gray-400 transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">מדיניות פרטיות</Link>
            <span>לצרכי מידע בלבד — אינו ייעוץ השקעות</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
