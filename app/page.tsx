'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

const FEATURES_HE = [
  { step: '01', title: 'פרופיל חברה',    desc: 'תיאור, מוצרים, מיילסטונים, הקשר ישראלי ורשימת דגלים' },
  { step: '02', title: 'ניתוח פיננסי',   desc: 'הכנסות, שולי רווח, מכפילים, שווי ומסקנת בריאות פיננסית' },
  { step: '03', title: 'ציר זמן אירועים',desc: 'חדשות, הגשות רגולטוריות, אירועים קרובים וסנטימנט' },
  { step: '04', title: 'ניתוח תחרותי',   desc: 'מיקום בשוק, מוצות, מתחרים, גלי רוח ומכשולים' },
  { step: '05', title: 'הערכת סיכונים',  desc: 'סיכוני חברה, ענף ומאקרו עם דירוג חומרה' },
  { step: '06', title: 'סינתזה',         desc: 'תקציר מנהלים, תרחישי bull/bear וציוני מפתח' },
];

const FEATURES_EN = [
  { step: '01', title: 'Company Profile',     desc: 'Description, products, milestones, Israeli context and flag list' },
  { step: '02', title: 'Financial Analysis',  desc: 'Revenue, margins, multiples, valuation and financial health verdict' },
  { step: '03', title: 'Events Timeline',     desc: 'News, regulatory filings, upcoming events and sentiment' },
  { step: '04', title: 'Competitive Analysis',desc: 'Market position, moats, competitors, tailwinds and headwinds' },
  { step: '05', title: 'Risk Assessment',     desc: 'Company, industry and macro risks with severity rating' },
  { step: '06', title: 'Synthesis',           desc: 'Executive summary, bull/bear scenarios and key scores' },
];

const FEATURES_RU = [
  { step: '01', title: 'Профиль компании',     desc: 'Описание, продукты, вехи, израильский контекст' },
  { step: '02', title: 'Финансовый анализ',    desc: 'Выручка, маржа, мультипликаторы, оценка стоимости' },
  { step: '03', title: 'Хронология событий',   desc: 'Новости, регуляторные документы, предстоящие события' },
  { step: '04', title: 'Конкурентный анализ',  desc: 'Позиция на рынке, конкуренты, возможности' },
  { step: '05', title: 'Оценка рисков',        desc: 'Риски компании, отрасли и макроэкономики' },
  { step: '06', title: 'Синтез',               desc: 'Резюме, сценарии роста/падения' },
];

const FEATURES_FR = [
  { step: '01', title: "Profil d'entreprise",  desc: 'Description, produits, jalons, contexte israélien' },
  { step: '02', title: 'Analyse financière',   desc: 'Revenus, marges, multiples, évaluation' },
  { step: '03', title: "Chronologie d'événements", desc: 'Actualités, dépôts réglementaires, événements à venir' },
  { step: '04', title: 'Analyse concurrentielle', desc: 'Position sur le marché, concurrents, opportunités' },
  { step: '05', title: 'Évaluation des risques', desc: 'Risques de la société, du secteur et macroéconomiques' },
  { step: '06', title: 'Synthèse',             desc: 'Résumé, scénarios haussier/baissier' },
];

const FEATURES_AR = [
  { step: '01', title: 'ملف الشركة',     desc: 'الوصف، المنتجات، المعالم، السياق الإسرائيلي' },
  { step: '02', title: 'التحليل المالي', desc: 'الإيرادات، الهوامش، مضاعفات التقييم' },
  { step: '03', title: 'الجدول الزمني للأحداث', desc: 'الأخبار، الملفات التنظيمية، الأحداث القادمة' },
  { step: '04', title: 'التحليل التنافسي', desc: 'الموقع في السوق، المنافسون، الفرص' },
  { step: '05', title: 'تقييم المخاطر', desc: 'مخاطر الشركة والقطاع والاقتصاد الكلي' },
  { step: '06', title: 'التوليف',       desc: 'الملخص التنفيذي، سيناريوهات الصعود/الهبوط' },
];

const FEATURES_MAP: Record<string, typeof FEATURES_HE> = {
  he: FEATURES_HE, en: FEATURES_EN, ru: FEATURES_RU, fr: FEATURES_FR, ar: FEATURES_AR,
};

export default function LandingPage() {
  const { t, locale, dir } = useI18n();
  const features = FEATURES_MAP[locale] ?? FEATURES_HE;

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Beta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/screener" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 hidden sm:block">
              {t('nav.screener')}
            </Link>
            <LanguageSwitcher />
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              {t('nav.signin')}
            </Link>
            <Link href="/signup" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {t('landing.badge')}
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          {t('landing.headline')}<br />
          <span className="text-indigo-400">{t('landing.headlineSub')}</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('landing.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/try" className="inline-flex items-center justify-center gap-2 btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">
            {t('landing.ctaTry')}
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg transition-colors">
            {t('landing.ctaLogin')}
          </Link>
        </div>
        <p className="text-xs text-gray-600 mt-4">{t('landing.tryNote')}</p>
      </section>

      {/* Sample analyses — social proof via the public SEO pages */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{t('landing.sampleTitle')}</h2>
          <p className="text-gray-400 text-sm">{t('landing.sampleSub')}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
          {[
            { ex: 'nasdaq', sym: 'AAPL', name: 'Apple' },
            { ex: 'nasdaq', sym: 'NVDA', name: 'Nvidia' },
            { ex: 'nasdaq', sym: 'TSLA', name: 'Tesla' },
            { ex: 'nasdaq', sym: 'MSFT', name: 'Microsoft' },
            { ex: 'lse',    sym: 'SHEL', name: 'Shell' },
            { ex: 'tase',   sym: 'TEVA', name: 'Teva' },
          ].map((s) => (
            <Link key={s.sym} href={`/analysis/${s.ex}/${s.sym.toLowerCase()}`}
              className="glass-card rounded-xl p-3 text-center hover:border-indigo-500/40 transition-colors group">
              <div className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors">{s.sym}</div>
              <div className="text-gray-500 text-xs truncate">{s.name}</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-5">
          <Link href="/analysis" className="text-sm text-indigo-300 hover:text-indigo-200 transition-colors">{t('landing.sampleView')}</Link>
        </div>
      </section>

      {/* Visual report preview — show, don't tell */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-3xl font-bold text-white text-center mb-3">{t('landing.previewTitle')}</h2>
        <p className="text-gray-400 text-center mb-8">{t('landing.previewSub')}</p>

        <div className="glass-card rounded-3xl p-6 sm:p-8" dir="ltr">
          {/* Report header */}
          <div className="flex items-start justify-between pb-4 border-b border-white/8">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">AAPL</span>
                <span className="text-gray-400">Apple Inc.</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">NASDAQ · <span className="text-white font-mono">$195.20</span> <span className="text-green-400">+1.2%</span></div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">AI analysis</span>
          </div>

          {/* Verdict badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/12 text-yellow-300 border border-yellow-500/20">Valuation: Fair</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/12 text-orange-300 border border-orange-500/20">Risk: Moderate</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/12 text-green-300 border border-green-500/20">Sentiment: Positive</span>
          </div>

          {/* Executive summary */}
          <div className="mt-5">
            <p className="text-xs text-indigo-300 font-medium mb-1.5">{t('rv.execSummary')}</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Apple generates durable cash flow from a premium hardware ecosystem, with Services now roughly a quarter of revenue at high margins. The core tension: slowing iPhone unit growth versus an expanding, sticky Services base.
            </p>
          </div>

          {/* Bull / Bear */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
              <p className="text-xs text-green-400 font-semibold mb-2">{t('rv.bullScenario')}</p>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex gap-2"><span className="text-green-400">✓</span> Services compounding ~15% at 70%+ margins</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> 2.2B active devices create a durable moat</li>
                <li className="flex gap-2"><span className="text-green-400">✓</span> Large buybacks steadily shrink the share count</li>
              </ul>
            </div>
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <p className="text-xs text-red-400 font-semibold mb-2">{t('rv.bearScenario')}</p>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li className="flex gap-2"><span className="text-red-400">✗</span> iPhone growth has stalled in key markets</li>
                <li className="flex gap-2"><span className="text-red-400">✗</span> Regulatory pressure on App Store fees</li>
                <li className="flex gap-2"><span className="text-red-400">✗</span> Premium valuation leaves little room for error</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/try" className="inline-flex items-center justify-center gap-2 btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">
            {t('landing.ctaTry')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">{t('landing.featuresTitle')}</h2>
        <p className="text-gray-400 text-center mb-16">{t('landing.featuresSub')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.step} className="glass-card rounded-2xl p-6">
              <div className="text-indigo-400 text-sm font-mono mb-3">{f.step}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">{t('landing.pricingTitle')}</h2>
        <p className="text-gray-400 text-center mb-16">{t('landing.pricingSub')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Quick - Free */}
          <div className="glass rounded-2xl p-8">
            <div className="text-2xl mb-3">⚡</div>
            <div className="text-green-300 text-sm font-medium mb-2">{t('depth.quick')}</div>
            <div className="text-4xl font-bold text-white mb-1">{t('pricing.free')}</div>
            <div className="text-gray-500 text-sm mb-6">{t('pricing.forever')}</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {[t('steps.profile'), t('steps.financials'), t('steps.synthesis')].map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="text-green-400">✓</span> {f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center border border-white/10 hover:border-green-500/50 text-gray-300 hover:text-white py-3 rounded-xl transition-colors text-sm font-medium">
              {t('pricing.getStarted')}
            </Link>
          </div>
          {/* Standard */}
          <div className="bg-amber-500/8 border border-amber-500/30 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">{t('depth.recommended')}</div>
            <div className="text-2xl mb-3">📊</div>
            <div className="text-amber-300 text-sm font-medium mb-2">{t('depth.standard')}</div>
            <div className="text-4xl font-bold text-white mb-1">$1.99</div>
            <div className="text-gray-500 text-sm mb-6">{t('pricing.perReport')}</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {[t('steps.profile'), t('steps.financials'), t('steps.events'), t('steps.competitive'), t('steps.risks'), t('steps.synthesis')].map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="text-amber-400">✓</span> {f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 py-3 rounded-xl transition-colors text-sm font-medium">
              {t('pricing.tryIt')}
            </Link>
          </div>
          {/* Deep */}
          <div className="bg-purple-500/8 border border-purple-500/20 rounded-2xl p-8">
            <div className="text-2xl mb-3">🔬</div>
            <div className="text-purple-300 text-sm font-medium mb-2">{t('depth.deep')}</div>
            <div className="text-4xl font-bold text-white mb-1">$3.99</div>
            <div className="text-gray-500 text-sm mb-6">{t('pricing.perReport')}</div>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-300">
              {[t('depth.deepDesc'), 'Claude Sonnet AI'].map((f) => (
                <li key={f} className="flex items-center gap-2"><span className="text-purple-400">✓</span> {f}</li>
              ))}
            </ul>
            <Link href="/signup" className="block text-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 py-3 rounded-xl transition-colors text-sm font-medium">
              {t('pricing.tryIt')}
            </Link>
          </div>
        </div>
      </section>

      {/* Per-report vs subscription — the core differentiator */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-3">{t('compare.title')}</h2>
        <p className="text-gray-400 text-center mb-10">{t('compare.sub')}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Them */}
          <div className="rounded-2xl p-8 border border-white/8 bg-white/3 opacity-80">
            <div className="text-gray-500 text-sm font-medium mb-2">{t('compare.themLabel')}</div>
            <div className="text-3xl font-bold text-gray-300 mb-1">{t('compare.themPrice')}</div>
            <p className="text-gray-500 text-sm mt-3 flex items-start gap-2"><span className="text-red-400/70 shrink-0">✕</span>{t('compare.themNote')}</p>
          </div>
          {/* Us */}
          <div className="rounded-2xl p-8 border border-indigo-500/40 bg-indigo-500/8 shadow-lg shadow-indigo-500/10">
            <div className="text-indigo-300 text-sm font-medium mb-2">{t('compare.usLabel')}</div>
            <div className="text-3xl font-bold text-white mb-1">{t('compare.usPrice')}</div>
            <p className="text-gray-300 text-sm mt-3 flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span>{t('compare.usNote')}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>© 2026 StockSage.</span>
            <a href="https://t.me/StockSageAI" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">📣 Telegram</a>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/about" className="hover:text-gray-400 transition-colors">{locale === 'he' || locale === 'ar' ? 'אודות' : 'About'}</Link>
            <Link href="/help" className="hover:text-gray-400 transition-colors">{locale === 'he' || locale === 'ar' ? 'עזרה' : 'Help'}</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">{locale === 'he' || locale === 'ar' ? 'תנאי שימוש' : 'Terms'}</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">{locale === 'he' || locale === 'ar' ? 'מדיניות פרטיות' : 'Privacy'}</Link>
            <Link href="/accessibility" className="hover:text-gray-400 transition-colors">{locale === 'he' || locale === 'ar' ? 'נגישות' : 'Accessibility'}</Link>
            <span>{t('landing.disclaimer')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
