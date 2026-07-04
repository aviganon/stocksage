'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface Row {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  currency: string;
}

// Mirrors lib/data/screener.ts SCREENS — kept inline so the client bundle
// doesn't pull in the server-only yahoo-finance2 module.
const TABS: { id: string; key: string }[] = [
  { id: 'most_actives',              key: 'mostActive' },
  { id: 'day_gainers',              key: 'gainers' },
  { id: 'day_losers',               key: 'losers' },
  { id: 'undervalued_large_caps',   key: 'undervaluedLarge' },
  { id: 'undervalued_growth_stocks', key: 'undervaluedGrowth' },
  { id: 'growth_technology_stocks', key: 'growthTech' },
  { id: 'aggressive_small_caps',    key: 'smallCaps' },
  { id: 'most_shorted_stocks',      key: 'mostShorted' },
];

function fmtCap(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n}`;
}

export default function ScreenerPage() {
  const { t, dir } = useI18n();
  const [active, setActive] = useState(TABS[0]!.id);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/screener?id=${active}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRows(d.rows ?? []); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [active]);

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir={dir}>
      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">{t('landing.ctaTry')}</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{t('screener.title')}</h1>
          <p className="text-gray-400">{t('screener.sub')}</p>
          <p className="text-xs text-gray-600 mt-2">{t('screener.note')}</p>
        </header>

        {/* Strategy tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                active === tab.id ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {t(`screener.${tab.key}`)}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-500 py-16">{t('screener.empty')}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const up = (r.changePercent ?? 0) >= 0;
              return (
                <Link
                  key={r.id}
                  href={`/analysis/${r.exchange.toLowerCase()}/${r.symbol.toLowerCase()}`}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="w-10 shrink-0 text-center">
                    <span className="text-white font-bold text-sm">{r.symbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">{r.name}</p>
                    <p className="text-gray-600 text-xs">{r.exchange} · {fmtCap(r.marketCap)}</p>
                  </div>
                  {r.price != null && (
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-mono">${r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      {r.changePercent != null && (
                        <p className={`text-xs ${up ? 'text-green-400' : 'text-red-400'}`}>{up ? '+' : ''}{r.changePercent.toFixed(2)}%</p>
                      )}
                    </div>
                  )}
                  <span className="text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0">{t('screener.research')}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
