import Link from 'next/link';
import type { SeoAnalysis, SeoLang } from '@/lib/seo/analysis';
import type { getQuote } from '@/lib/data/orchestrator';

type Quote = Awaited<ReturnType<typeof getQuote>> | null;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

const L = {
  en: {
    dir: 'ltr' as const,
    navCta: 'Analyze any stock free →',
    crumbRoot: 'Stock Analysis',
    h1suffix: 'Stock Analysis',
    aiBadge: 'AI analysis',
    cta1Title: (s: string) => `Get a full AI research report on ${s}`,
    cta1Sub: '6-step deep analysis in ~90 seconds. Quick research is free — no signup.',
    cta1Btn: 'Analyze free →',
    businessH: (n: string) => `What does ${n} do?`,
    bullH: 'Bull case',
    bearH: 'Bear case',
    finH: (s: string) => `${s} valuation & financial health`,
    verdictH: 'The bottom line',
    faqH: 'Frequently asked questions',
    cta2Title: (s: string) => `Research ${s} with AI in seconds`,
    cta2Sub: 'Company profile, financials, events, competition, risks and synthesis — automated.',
    cta2Btn: 'Start free — no signup',
    disclaimer: 'For informational purposes only — not investment advice. Analysis is AI-generated from public data and may contain errors. Always do your own research.',
  },
  he: {
    dir: 'rtl' as const,
    navCta: 'נתח כל מניה בחינם →',
    crumbRoot: 'ניתוח מניות',
    h1suffix: 'ניתוח מניה',
    aiBadge: 'ניתוח AI',
    cta1Title: (s: string) => `קבל דוח מחקר AI מלא על ${s}`,
    cta1Sub: 'ניתוח מעמיק ב-6 שלבים ב-~90 שניות. מחקר מהיר חינם — ללא הרשמה.',
    cta1Btn: 'נתח בחינם →',
    businessH: (n: string) => `מה עושה ${n}?`,
    bullH: 'תרחיש שורי',
    bearH: 'תרחיש דובי',
    finH: (s: string) => `הערכת שווי ובריאות פיננסית — ${s}`,
    verdictH: 'השורה התחתונה',
    faqH: 'שאלות נפוצות',
    cta2Title: (s: string) => `חקור את ${s} עם AI בשניות`,
    cta2Sub: 'פרופיל חברה, פיננסים, אירועים, תחרות, סיכונים וסינתזה — אוטומטי.',
    cta2Btn: 'התחל בחינם — ללא הרשמה',
    disclaimer: 'לצרכי מידע בלבד — אינו ייעוץ השקעות. הניתוח נוצר על ידי AI מנתונים ציבוריים ועלול להכיל שגיאות. תמיד בצע מחקר עצמאי.',
  },
  fr: {
    dir: 'ltr' as const,
    navCta: 'Analysez une action gratuitement →',
    crumbRoot: "Analyse d'actions",
    h1suffix: "— analyse de l'action",
    aiBadge: 'Analyse IA',
    cta1Title: (s: string) => `Rapport de recherche IA complet sur ${s}`,
    cta1Sub: "Analyse approfondie en 6 étapes en ~90 secondes. L'analyse rapide est gratuite, sans inscription.",
    cta1Btn: 'Analyser gratuitement →',
    businessH: (n: string) => `Que fait ${n} ?`,
    bullH: 'Scénario haussier',
    bearH: 'Scénario baissier',
    finH: (s: string) => `Valorisation et santé financière — ${s}`,
    verdictH: 'En résumé',
    faqH: 'Questions fréquentes',
    cta2Title: (s: string) => `Analysez ${s} avec l'IA en quelques secondes`,
    cta2Sub: 'Profil, finances, événements, concurrence, risques et synthèse — automatisé.',
    cta2Btn: 'Commencer gratuitement — sans inscription',
    disclaimer: "À titre informatif uniquement — pas un conseil en investissement. Analyse générée par IA à partir de données publiques, pouvant contenir des erreurs. Faites toujours vos propres recherches.",
  },
  ar: {
    dir: 'rtl' as const,
    navCta: 'حلّل أي سهم مجاناً →',
    crumbRoot: 'تحليل الأسهم',
    h1suffix: '— تحليل سهم',
    aiBadge: 'تحليل بالذكاء الاصطناعي',
    cta1Title: (s: string) => `تقرير بحث كامل بالذكاء الاصطناعي عن ${s}`,
    cta1Sub: 'تحليل معمق من 6 خطوات في ~90 ثانية. التحليل السريع مجاني — بدون تسجيل.',
    cta1Btn: 'حلّل مجاناً →',
    businessH: (n: string) => `ماذا تفعل ${n}؟`,
    bullH: 'السيناريو الصاعد',
    bearH: 'السيناريو الهابط',
    finH: (s: string) => `التقييم والصحة المالية — ${s}`,
    verdictH: 'الخلاصة',
    faqH: 'الأسئلة الشائعة',
    cta2Title: (s: string) => `حلّل ${s} بالذكاء الاصطناعي في ثوانٍ`,
    cta2Sub: 'ملف الشركة، المالية، الأحداث، المنافسة، المخاطر والتوليف — تلقائياً.',
    cta2Btn: 'ابدأ مجاناً — بدون تسجيل',
    disclaimer: 'لأغراض المعلومات فقط — ليس نصيحة استثمارية. تحليل مُنشأ بالذكاء الاصطناعي من بيانات عامة وقد يحتوي أخطاء. قم دائماً بأبحاثك الخاصة.',
  },
};

export function AnalysisArticle({ analysis, quote, lang }: { analysis: SeoAnalysis; quote: Quote; lang: SeoLang }) {
  const t = L[lang];
  const up = (quote?.changePercent ?? 0) >= 0;
  const currency = String(quote?.currency ?? 'USD');
  const symbolChar = currency === 'ILS' ? '₪' : currency === 'GBp' ? 'p' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const priceStr = quote?.price != null
    ? `${symbolChar}${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : null;

  const langPrefix = lang === 'he' ? '/he' : '';
  const canonical = `${BASE_URL}${langPrefix}/analysis/${analysis.exchange.toLowerCase()}/${analysis.symbol.toLowerCase()}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: analysis.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.crumbRoot, item: `${BASE_URL}${langPrefix}/analysis` },
          { '@type': 'ListItem', position: 2, name: `${analysis.symbol} — ${analysis.name}`, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={t.dir}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">{t.navCta}</Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-10">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href={`${langPrefix}/analysis`} className="hover:text-gray-300">{t.crumbRoot}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{analysis.exchange}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{analysis.symbol}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {analysis.name} <span className="text-gray-500">({analysis.symbol})</span> {t.h1suffix}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{analysis.exchange}</span>
            {priceStr && (
              <span className="text-lg font-mono text-white" dir="ltr">
                {priceStr}
                {quote?.changePercent != null && (
                  <span className={`text-sm ml-2 ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '+' : ''}{quote.changePercent.toFixed(2)}%
                  </span>
                )}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">{t.aiBadge}</span>
          </div>
          <p className="text-gray-300 leading-relaxed mt-5 text-lg">{analysis.intro}</p>
        </header>

        <div className="glass-card rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">{t.cta1Title(analysis.symbol)}</p>
            <p className="text-gray-400 text-sm mt-0.5">{t.cta1Sub}</p>
          </div>
          <Link href="/try" className="shrink-0 btn-glow text-white font-semibold px-6 py-3 rounded-xl">{t.cta1Btn}</Link>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{t.businessH(analysis.name)}</h2>
          <p className="text-gray-300 leading-relaxed">{analysis.businessSummary}</p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-green-400 font-bold mb-3">{t.bullH}</h2>
            <ul className="space-y-2">
              {analysis.bullPoints.map((p, i) => (
                <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2"><span className="text-green-400 shrink-0">✓</span>{p}</li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="text-red-400 font-bold mb-3">{t.bearH}</h2>
            <ul className="space-y-2">
              {analysis.bearPoints.map((p, i) => (
                <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2"><span className="text-red-400 shrink-0">✗</span>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{t.finH(analysis.symbol)}</h2>
          <p className="text-gray-300 leading-relaxed">{analysis.financialSnapshot}</p>
        </section>

        <section className="mb-10 bg-gradient-to-br from-indigo-600/12 to-indigo-900/5 border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">{t.verdictH}</h2>
          <p className="text-gray-200 leading-relaxed">{analysis.verdict}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-5">{t.faqH}</h2>
          <div className="space-y-4">
            {analysis.faq.map((f, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">{f.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{t.cta2Title(analysis.symbol)}</h2>
          <p className="text-gray-400 mb-6">{t.cta2Sub}</p>
          <Link href="/try" className="inline-block btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">{t.cta2Btn}</Link>
        </div>

        <p className="text-xs text-gray-600 text-center border-t border-white/5 pt-6">{t.disclaimer}</p>
      </article>
    </div>
  );
}
