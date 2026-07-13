import type { Metadata } from 'next';
import Link from 'next/link';
import { groupedTopics } from '@/lib/blog/topics';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

export const metadata: Metadata = {
  title: 'Investing Blog — Stock Analysis Guides & Comparisons | StockSage',
  description: 'Clear, neutral guides for investors: how to analyze stocks, key ratios explained, and head-to-head comparisons of popular stocks.',
  alternates: { canonical: `${BASE_URL}/blog` },
};

export default function BlogIndexPage() {
  const groups = groupedTopics();

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="ltr">
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">Analyze any stock free →</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">StockSage Blog</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Clear, neutral guides for everyday investors — how to analyze a stock, what the key ratios mean,
            and how popular stocks stack up against each other.
          </p>
        </header>

        {groups.map(({ category, topics }) => (
          <section key={category} className="mb-10">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{category}</h2>
            <div className="space-y-3">
              {topics.map((t) => (
                <Link key={t.slug} href={`/blog/${t.slug}`}
                  className="block glass-card rounded-xl px-5 py-4 hover:border-indigo-500/40 transition-colors group">
                  <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">{t.title}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <div className="text-center glass-card rounded-2xl p-8 mt-12">
          <h2 className="text-2xl font-bold text-white mb-2">Put it into practice</h2>
          <p className="text-gray-400 mb-6">Run a full AI research report on any stock — free, no signup.</p>
          <Link href="/try" className="inline-block btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">Start free →</Link>
        </div>
      </div>
    </div>
  );
}
