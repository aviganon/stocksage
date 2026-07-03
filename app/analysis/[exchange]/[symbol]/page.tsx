import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeoAnalysis } from '@/lib/seo/analysis';
import { getQuote } from '@/lib/data/orchestrator';
import { findSeoStock } from '@/lib/seo/universe';
import type { AssetId } from '@/lib/data/types';

// ISR — regenerate the cached page at most once per day. The AI analysis is
// itself cached in Firestore (7-day staleness), so most renders are a fast read.
export const revalidate = 86400;
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

type Params = { exchange: string; symbol: string };

function toAssetId(exchange: string, symbol: string): AssetId {
  return `${exchange.toUpperCase()}:${symbol.toUpperCase()}` as AssetId;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);
  const analysis = await getSeoAnalysis(assetId).catch(() => null);
  const known = findSeoStock(exchange, symbol);
  const name = analysis?.name ?? known?.name ?? symbol.toUpperCase();

  const title = analysis?.metaTitle ?? `${symbol.toUpperCase()} Stock Analysis — ${name}`;
  const description =
    analysis?.metaDescription ??
    `AI-powered analysis of ${name} (${symbol.toUpperCase()}): business overview, bull and bear case, valuation and key questions for investors.`;
  const canonical = `${BASE_URL}/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'StockSage',
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AnalysisPage({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);

  const [analysis, quote] = await Promise.all([
    getSeoAnalysis(assetId).catch(() => null),
    getQuote(assetId).catch(() => null),
  ]);

  if (!analysis) notFound();

  const up = (quote?.changePercent ?? 0) >= 0;
  const currency = String(quote?.currency ?? 'USD');
  const symbolChar = currency === 'ILS' ? '₪' : currency === 'GBp' ? 'p' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const priceStr =
    quote?.price != null
      ? `${symbolChar}${quote.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : null;

  const canonical = `${BASE_URL}/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`;

  // Structured data — FAQ rich result + breadcrumb trail for Google.
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
          { '@type': 'ListItem', position: 1, name: 'Stock Analysis', item: `${BASE_URL}/analysis` },
          { '@type': 'ListItem', position: 2, name: `${analysis.symbol} — ${analysis.name}`, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="ltr">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">Analyze any stock free →</Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/analysis" className="hover:text-gray-300">Stock Analysis</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{analysis.exchange}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{analysis.symbol}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {analysis.name} <span className="text-gray-500">({analysis.symbol})</span> Stock Analysis
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">{analysis.exchange}</span>
            {priceStr && (
              <span className="text-lg font-mono text-white">
                {priceStr}
                {quote?.changePercent != null && (
                  <span className={`text-sm ml-2 ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '+' : ''}{quote.changePercent.toFixed(2)}%
                  </span>
                )}
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">AI analysis</span>
          </div>
          <p className="text-gray-300 leading-relaxed mt-5 text-lg">{analysis.intro}</p>
        </header>

        {/* Primary CTA (above the fold) */}
        <div className="glass-card rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Get a full AI research report on {analysis.symbol}</p>
            <p className="text-gray-400 text-sm mt-0.5">6-step deep analysis in ~90 seconds. Quick research is free — no signup.</p>
          </div>
          <Link href="/try" className="shrink-0 btn-glow text-white font-semibold px-6 py-3 rounded-xl">Analyze free →</Link>
        </div>

        {/* Business */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">What does {analysis.name} do?</h2>
          <p className="text-gray-300 leading-relaxed">{analysis.businessSummary}</p>
        </section>

        {/* Bull / Bear */}
        <section className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-green-400 font-bold mb-3">Bull case</h2>
            <ul className="space-y-2">
              {analysis.bullPoints.map((p, i) => (
                <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2"><span className="text-green-400 shrink-0">✓</span>{p}</li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="text-red-400 font-bold mb-3">Bear case</h2>
            <ul className="space-y-2">
              {analysis.bearPoints.map((p, i) => (
                <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2"><span className="text-red-400 shrink-0">✗</span>{p}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Financials */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{analysis.symbol} valuation & financial health</h2>
          <p className="text-gray-300 leading-relaxed">{analysis.financialSnapshot}</p>
        </section>

        {/* Verdict */}
        <section className="mb-10 bg-gradient-to-br from-indigo-600/12 to-indigo-900/5 border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">The bottom line</h2>
          <p className="text-gray-200 leading-relaxed">{analysis.verdict}</p>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-5">Frequently asked questions</h2>
          <div className="space-y-4">
            {analysis.faq.map((f, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">{f.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="text-center glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Research {analysis.symbol} with AI in seconds</h2>
          <p className="text-gray-400 mb-6">Company profile, financials, events, competition, risks and synthesis — automated.</p>
          <Link href="/try" className="inline-block btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">Start free — no signup</Link>
        </div>

        {/* Disclaimer (legal requirement — every analysis) */}
        <p className="text-xs text-gray-600 text-center border-t border-white/5 pt-6">
          For informational purposes only — not investment advice. Analysis is AI-generated from public data and may contain errors.
          Always do your own research{quote?.price != null ? '. Market data may be delayed' : ''}.
        </p>
      </article>
    </div>
  );
}
