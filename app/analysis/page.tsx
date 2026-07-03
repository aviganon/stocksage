import type { Metadata } from 'next';
import Link from 'next/link';
import { groupedUniverse } from '@/lib/seo/universe';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

export const metadata: Metadata = {
  title: 'Stock Analysis — AI Research on Global Stocks | StockSage',
  description:
    'Free AI-powered analysis of popular US, UK, European and Israeli stocks. Bull and bear cases, valuation and key investor questions — updated automatically.',
  alternates: { canonical: `${BASE_URL}/analysis` },
};

export default function AnalysisHubPage() {
  const groups = groupedUniverse();

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="ltr">
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">Analyze any stock free →</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">AI Stock Analysis</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            In-depth, AI-generated analysis of the world&apos;s most-researched stocks — business overview,
            bull and bear case, valuation and the questions investors actually ask. Pick a stock, or{' '}
            <Link href="/try" className="text-indigo-300 hover:text-indigo-200">analyze any ticker free</Link>.
          </p>
        </header>

        {groups.map(({ group, stocks }) => (
          <section key={group} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{group}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stocks.map((s) => (
                <Link
                  key={s.id}
                  href={`/analysis/${s.exchange.toLowerCase()}/${s.symbol.toLowerCase()}`}
                  className="glass-card rounded-xl p-4 hover:border-indigo-500/40 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-sm">{s.symbol}</span>
                    <span className="text-[10px] text-gray-600">{s.exchange}</span>
                  </div>
                  <p className="text-gray-400 text-xs truncate group-hover:text-gray-300">{s.name}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center glass-card rounded-2xl p-8 mt-12">
          <h2 className="text-2xl font-bold text-white mb-2">Don&apos;t see your stock?</h2>
          <p className="text-gray-400 mb-6">Analyze any of 8 global exchanges — free, no signup required.</p>
          <Link href="/try" className="inline-block btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">Start free →</Link>
        </div>
      </div>
    </div>
  );
}
