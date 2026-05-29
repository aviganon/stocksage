'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useI18n } from '@/lib/i18n/context';
import { usePaddleCheckout } from '@/components/paddle/checkout-overlay';

interface ReportStep {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface Report {
  id: string;
  assetId: string;
  assetName: string;
  status: string;
  depth: string;
  language: string;
  startedAt: string;
  completedAt?: string;
  costUSD: number;
  steps?: ReportStep[];
}

const STEP_LABELS: Record<string, string> = {
  data_collection: 'איסוף נתונים',
  profile:         'פרופיל חברה',
  financials:      'ניתוח פיננסי',
  events:          'אירועים',
  competitive:     'תחרות',
  risks:           'סיכונים',
  synthesis:       'סינתזה',
};

const UPGRADE_NEXT: Record<string, { depth: 'standard' | 'deep'; label: string }> = {
  quick:    { depth: 'standard', label: 'שדרג למלא' },
  standard: { depth: 'deep',     label: 'שדרג לעמוק' },
};

function DoneReportRow({ report, onDelete, getIdToken }: {
  report: Report;
  onDelete: (id: string) => void;
  getIdToken: () => Promise<string | null>;
}) {
  const { t } = useI18n();
  const { openCheckout } = usePaddleCheckout();
  const STATUS_LABELS: Record<string, string> = {
    completed: t('status.completed'), partial: t('status.partial'),
    running: t('status.running'), pending: t('status.pending'), failed: t('status.failed'),
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [upgrading, setUpgrading]         = useState(false);

  async function handleConfirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    setDeleting(true);
    onDelete(report.id);
  }

  async function handleUpgrade(e: React.MouseEvent) {
    e.preventDefault();
    const next = UPGRADE_NEXT[report.depth];
    if (!next) return;
    setUpgrading(true);
    const token = await getIdToken();
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      body: JSON.stringify({ depth: next.depth, assetId: report.assetId }),
    });
    const data = await res.json();
    setUpgrading(false);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';
    const successUrl = `${appUrl}/dashboard?paid=1&assetId=${encodeURIComponent(report.assetId)}&depth=${next.depth}`;
    if (data.transactionId) {
      await openCheckout(data.transactionId, successUrl, locale);
    } else if (data.url) {
      window.location.href = data.url;
    }
  }

  const depthLabel  = report.depth === 'quick' ? 'מהיר' : report.depth === 'standard' ? 'מלא' : 'עמוק';
  const depthStyle  = report.depth === 'quick'
    ? 'bg-green-500/15 text-green-300 border-green-500/20'
    : report.depth === 'standard'
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/20'
    : 'bg-purple-500/15 text-purple-300 border-purple-500/20';

  const nextUpgrade = report.status === 'completed' ? UPGRADE_NEXT[report.depth] : null;

  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/8 hover:bg-white/8 rounded-xl px-5 py-4 transition-colors group">
      <Link href={`/report/${report.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
          {report.assetId.split(':')[1]?.slice(0, 2) ?? '??'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-medium">{report.assetName}</p>
            {/* Depth badge — prominent */}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border shrink-0 ${depthStyle}`}>
              {depthLabel}
            </span>
          </div>
          <p className="text-gray-500 text-xs truncate">
            {report.assetId} · {new Date(report.startedAt).toLocaleDateString('he-IL')}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 shrink-0 mr-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[report.status] ?? 'text-gray-400 bg-gray-400/10'}`}>
          {STATUS_LABELS[report.status] ?? report.status}
        </span>

        {/* Upgrade button — quick→standard or standard→deep */}
        {nextUpgrade && !confirmDelete && (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="text-xs bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
            title={nextUpgrade.label}
          >
            {upgrading ? '...' : `↑ ${nextUpgrade.label}`}
          </button>
        )}

        {confirmDelete ? (
          <>
            <span className="text-xs text-red-300">למחוק?</span>
            <button onClick={handleConfirmDelete} disabled={deleting}
              className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-2.5 py-1 rounded-lg transition-colors">
              {deleting ? '...' : 'כן'}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-2.5 py-1 rounded-lg transition-colors">
              לא
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="opacity-0 group-hover:opacity-100 text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
            title="מחק דוח">
            ✕
          </button>
        )}

        <Link href={`/report/${report.id}`} className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">→</Link>
      </div>
    </div>
  );
}

// Default market per locale
const LOCALE_DEFAULT_MARKET: Record<string, string> = {
  he: '🇮🇱 ת"א', en: '🇺🇸 US', ru: '🇺🇸 US',
  fr: '🇫🇷 France', ar: '🇮🇱 ת"א',
};

function PopularStocks({ onSelect, locale }: {
  onSelect: (s: SearchResult) => void;
  locale: string;
}) {
  const defaultMarket = LOCALE_DEFAULT_MARKET[locale] ?? '🇮🇱 ת"א';
  const [activeMarket, setActiveMarket] = useState(defaultMarket);

  // Update active market when locale changes
  useEffect(() => {
    setActiveMarket(LOCALE_DEFAULT_MARKET[locale] ?? '🇮🇱 ת"א');
  }, [locale]);

  const activeGroup = POPULAR_STOCKS.find(g => g.label === activeMarket) ?? POPULAR_STOCKS[0]!;

  return (
    <div className="mb-6">
      {/* Market tab pills */}
      <div className="flex gap-1 flex-wrap mb-3">
        {POPULAR_STOCKS.map((g) => (
          <button
            key={g.label}
            onClick={() => setActiveMarket(g.label)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              g.label === activeMarket
                ? 'bg-white/15 text-white'
                : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Stocks for active market */}
      <div className="flex flex-wrap gap-1.5">
        {activeGroup.stocks.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="text-xs bg-white/5 hover:bg-indigo-500/10 border border-white/8 hover:border-indigo-500/30 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <span className="font-semibold text-white">{s.symbol}</span>
            <span className="text-gray-600 mr-1"> · {s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function useElapsed(startedAt: string) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    function update() {
      const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      setElapsed(m > 0 ? `${m}:${String(s).padStart(2, '0')} דק׳` : `${s} שנ׳`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function ActiveResearchCard({ report, getIdToken, onStop }: {
  report: Report;
  getIdToken: () => Promise<string | null>;
  onStop: (id: string) => void;
}) {
  const router = useRouter();
  const elapsed = useElapsed(report.startedAt);
  const [confirming, setConfirming] = useState(false);
  const [stopping, setStopping]     = useState(false);

  const steps = (report.steps ?? []).filter((s) => s.stepId !== 'data_collection');
  const completed = steps.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const pct = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
  const depthLabel = report.depth === 'quick' ? 'מהיר' : report.depth === 'standard' ? 'מלא' : 'עמוק';

  const stepIcon = (status: string) => {
    if (status === 'completed') return <span className="text-green-400">✓</span>;
    if (status === 'running')   return <span className="text-blue-400 animate-pulse">⬤</span>;
    if (status === 'failed')    return <span className="text-red-400">✗</span>;
    return <span className="text-white/20">○</span>;
  };

  async function handleStop(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    setStopping(true);
    const token = await getIdToken();
    await fetch(`/api/research/${report.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    onStop(report.id);
  }

  return (
    <div className="bg-blue-500/8 border border-blue-500/25 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={() => router.push(`/report/${report.id}`)}
          className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300">
              {report.assetId.split(':')[1]?.slice(0, 2) ?? '??'}
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-white font-semibold">{report.assetName}</p>
            <p className="text-gray-500 text-xs">{report.assetId} · {depthLabel} · {elapsed}</p>
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {confirming ? (
            <>
              <span className="text-xs text-red-300">לעצור?</span>
              <button
                onClick={handleStop}
                disabled={stopping}
                className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {stopping ? '...' : 'כן'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                className="text-xs bg-white/8 hover:bg-white/15 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                ביטול
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStop}
                className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                ⏹ עצור
              </button>
              <button
                onClick={() => router.push(`/report/${report.id}`)}
                className="text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                פתח →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Step list */}
      {steps.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-4">
          {steps.map((s) => (
            <div key={s.stepId} className="flex items-center gap-2 text-xs">
              {stepIcon(s.status)}
              <span className={
                s.status === 'running'   ? 'text-blue-300 font-medium' :
                s.status === 'completed' ? 'text-gray-400' :
                s.status === 'failed'    ? 'text-red-400' : 'text-white/30'
              }>
                {STEP_LABELS[s.stepId] ?? s.stepId}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{completed}/{steps.length} שלבים</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function ReportProgress({ steps }: { steps: ReportStep[] }) {
  const analysis = steps.filter((s) => s.stepId !== 'data_collection');
  const completed = analysis.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const running   = analysis.find((s) => s.status === 'running');
  const pct       = analysis.length > 0 ? Math.round((completed / analysis.length) * 100) : 0;

  return (
    <div className="mt-3 pt-3 border-t border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">
          {running
            ? <span className="text-blue-400">⬤ {STEP_LABELS[running.stepId] ?? running.stepId}</span>
            : <span>{completed}/{analysis.length} שלבים</span>}
        </span>
        <span className="text-xs text-gray-600">{pct}%</span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface Usage {
  allowed: boolean;
  used: number;
  limit: number;
  plan: 'free' | 'pro';
}

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
}

type Depth = 'quick' | 'standard' | 'deep';

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400 bg-green-400/10',
  partial:   'text-yellow-400 bg-yellow-400/10',
  running:   'text-blue-400 bg-blue-400/10 animate-pulse',
  pending:   'text-gray-400 bg-gray-400/10',
  failed:    'text-red-400 bg-red-400/10',
};

const DEPTH_OPTIONS: { value: Depth; label: string; icon: string; desc: string; time: string; steps: string; price: string; badge?: string; recommended?: boolean }[] = [
  { value: 'quick',    label: 'מהיר',  icon: '⚡', desc: 'פרופיל, פיננסים וסינתזה', time: '~20 שנ׳', steps: '3 שלבים', price: 'חינמי',  badge: 'חינמי'  },
  { value: 'standard', label: 'מלא',   icon: '📊', desc: 'ניתוח מקיף של 6 שלבים',  time: '~60 שנ׳', steps: '6 שלבים', price: '$1.99',  badge: '$1.99', recommended: true },
  { value: 'deep',     label: 'עמוק',  icon: '🔬', desc: 'כל 6 שלבים + חיפוש רשת', time: '~2 דקות', steps: '6 + Web',  price: '$3.99',  badge: '$3.99'  },
];

const POPULAR_STOCKS: { label: string; stocks: SearchResult[] }[] = [
  {
    label: '🇮🇱 ת"א',
    stocks: [
      { id: 'TASE:TEVA',  symbol: 'TEVA',  name: 'טבע',         exchange: 'TASE' },
      { id: 'TASE:ICL',   symbol: 'ICL',   name: 'כימיקלים',    exchange: 'TASE' },
      { id: 'TASE:ESLT',  symbol: 'ESLT',  name: 'אלביט',       exchange: 'TASE' },
      { id: 'TASE:POLI',  symbol: 'POLI',  name: 'הפועלים',     exchange: 'TASE' },
      { id: 'TASE:LUMI',  symbol: 'LUMI',  name: 'לאומי',       exchange: 'TASE' },
      { id: 'TASE:NICE',  symbol: 'NICE',  name: 'NICE',        exchange: 'TASE' },
    ],
  },
  {
    label: '🇺🇸 US',
    stocks: [
      { id: 'NASDAQ:AAPL',  symbol: 'AAPL',  name: 'Apple',   exchange: 'NASDAQ' },
      { id: 'NASDAQ:MSFT',  symbol: 'MSFT',  name: 'Microsoft', exchange: 'NASDAQ' },
      { id: 'NASDAQ:NVDA',  symbol: 'NVDA',  name: 'Nvidia',  exchange: 'NASDAQ' },
      { id: 'NASDAQ:GOOGL', symbol: 'GOOGL', name: 'Google',  exchange: 'NASDAQ' },
      { id: 'NYSE:JPM',     symbol: 'JPM',   name: 'JPMorgan', exchange: 'NYSE' },
      { id: 'NYSE:TSLA',    symbol: 'TSLA',  name: 'Tesla',   exchange: 'NYSE' },
    ],
  },
  {
    label: '🇬🇧 UK',
    stocks: [
      { id: 'LSE:HSBA', symbol: 'HSBA', name: 'HSBC',       exchange: 'LSE' },
      { id: 'LSE:BP',   symbol: 'BP',   name: 'BP',         exchange: 'LSE' },
      { id: 'LSE:AZN',  symbol: 'AZN',  name: 'AstraZeneca', exchange: 'LSE' },
      { id: 'LSE:SHEL', symbol: 'SHEL', name: 'Shell',      exchange: 'LSE' },
      { id: 'LSE:RIO',  symbol: 'RIO',  name: 'Rio Tinto',  exchange: 'LSE' },
    ],
  },
  {
    label: '🇩🇪 Germany',
    stocks: [
      { id: 'XETRA:SAP',  symbol: 'SAP',  name: 'SAP',      exchange: 'XETRA' },
      { id: 'XETRA:SIE',  symbol: 'SIE',  name: 'Siemens',  exchange: 'XETRA' },
      { id: 'XETRA:BMW',  symbol: 'BMW',  name: 'BMW',      exchange: 'XETRA' },
      { id: 'XETRA:BAYN', symbol: 'BAYN', name: 'Bayer',    exchange: 'XETRA' },
      { id: 'XETRA:ADS',  symbol: 'ADS',  name: 'Adidas',   exchange: 'XETRA' },
    ],
  },
  {
    label: '🇫🇷 France',
    stocks: [
      { id: 'EPA:MC',  symbol: 'MC',  name: 'LVMH',     exchange: 'EPA' },
      { id: 'EPA:OR',  symbol: 'OR',  name: "L'Oréal",  exchange: 'EPA' },
      { id: 'EPA:SAN', symbol: 'SAN', name: 'Sanofi',   exchange: 'EPA' },
      { id: 'EPA:AIR', symbol: 'AIR', name: 'Airbus',   exchange: 'EPA' },
      { id: 'EPA:TTE', symbol: 'TTE', name: 'TotalEnergies', exchange: 'EPA' },
    ],
  },
  {
    label: '🇨🇦 Canada',
    stocks: [
      { id: 'TSX:RY',   symbol: 'RY',   name: 'Royal Bank', exchange: 'TSX' },
      { id: 'TSX:TD',   symbol: 'TD',   name: 'TD Bank',    exchange: 'TSX' },
      { id: 'TSX:SHOP', symbol: 'SHOP', name: 'Shopify',    exchange: 'TSX' },
      { id: 'TSX:CNR',  symbol: 'CNR',  name: 'CN Rail',    exchange: 'TSX' },
      { id: 'TSX:SU',   symbol: 'SU',   name: 'Suncor',     exchange: 'TSX' },
    ],
  },
  {
    label: '🇦🇺 Australia',
    stocks: [
      { id: 'ASX:BHP', symbol: 'BHP', name: 'BHP',    exchange: 'ASX' },
      { id: 'ASX:CBA', symbol: 'CBA', name: 'CommBank', exchange: 'ASX' },
      { id: 'ASX:CSL', symbol: 'CSL', name: 'CSL',    exchange: 'ASX' },
      { id: 'ASX:NAB', symbol: 'NAB', name: 'NAB',    exchange: 'ASX' },
    ],
  },
];

const EXCHANGE_COLORS: Record<string, string> = {
  TASE:   'bg-indigo-500/15 text-indigo-300',
  NASDAQ: 'bg-blue-500/15 text-blue-300',
  NYSE:   'bg-cyan-500/15 text-cyan-300',
  CRYPTO: 'bg-orange-500/15 text-orange-300',
};

function DashboardInner() {
  const { user, loading: authLoading, getIdToken, logout } = useAuth();
  const { t, locale, dir } = useI18n();
  const { openCheckout } = usePaddleCheckout();

  const STATUS_LABELS: Record<string, string> = {
    completed: t('status.completed'), partial: t('status.partial'),
    running: t('status.running'), pending: t('status.pending'),
    failed: t('status.failed'),
  };
  const router   = useRouter();
  const params   = useSearchParams();
  const upgradeAssetId = params.get('upgrade');

  const [reports, setReports]           = useState<Report[]>([]);
  const [usage, setUsage]               = useState<Usage | null>(null);
  const [firstName, setFirstName]       = useState<string>('');
  const [credits, setCredits]           = useState<{ standard: number; deep: number }>({ standard: 0, deep: 0 });
  const [isOwner, setIsOwner]           = useState(false);
  const [query, setQuery]               = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [selected, setSelected]         = useState<SearchResult | null>(null);
  const [depth, setDepth]               = useState<Depth>('standard');
  const [starting, setStarting]         = useState(false);
  const [loadingData, setLoadingData]   = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Auto-fill search if coming from "שדרג דוח" button
  useEffect(() => {
    if (!upgradeAssetId) return;
    const parts = upgradeAssetId.split(':');
    const sym   = parts[1] ?? parts[0] ?? '';
    const exch  = parts[0] ?? 'TASE';
    const pre: SearchResult = { id: upgradeAssetId, symbol: sym, name: sym, exchange: exch };
    setSelected(pre);
    setQuery(`${sym}`);
    setDepth('standard');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgradeAssetId]);

  const fetchData = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [reportsRes, userRes] = await Promise.all([
      fetch('/api/research', { headers }),
      fetch('/api/user', { headers }),
    ]);
    if (reportsRes.ok) setReports((await reportsRes.json()).reports ?? []);
    if (userRes.ok) {
      const userData = await userRes.json();
      setUsage(userData.usage);
      setFirstName(userData.profile?.firstName ?? '');
      setIsOwner(userData.isOwner ?? false);
      setCredits({
        standard: userData.profile?.credits?.standard ?? 0,
        deep:     userData.profile?.credits?.deep     ?? 0,
      });
    }
    setLoadingData(false);
  }, [getIdToken]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  // Refetch when user navigates back to this tab/page (handles Next.js router cache)
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && user) fetchData(); };
    const onFocus   = () => { if (user) fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, fetchData]);

  useEffect(() => {
    const hasRunning = reports.some((r) => r.status === 'running' || r.status === 'pending');
    if (!hasRunning) return;
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [reports, fetchData]);

  async function handleSearch(q: string) {
    setQuery(q);
    setSelected(null);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (res.ok) setSearchResults((await res.json()).results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function handleSelect(r: SearchResult) {
    setSelected(r);
    setQuery(`${r.symbol} — ${r.name}`);
    setSearchResults([]);
    setError('');
  }

  function handleClear() {
    setSelected(null);
    setQuery('');
    setSearchResults([]);
    setError('');
  }

  async function startReport() {
    if (!selected) return;
    setStarting(true);
    setError('');
    try {
      const token = await getIdToken();

      // Standard/Deep: owner is free; others need credit or payment
      if (!isOwner && (depth === 'standard' || depth === 'deep')) {
        const hasCredit = credits[depth] > 0;
        if (!hasCredit) {
          const res = await fetch('/api/billing/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
            body: JSON.stringify({ depth, assetId: selected.id }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error ?? 'שגיאה'); return; }

          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';
          const successUrl = `${appUrl}/dashboard?paid=1&assetId=${encodeURIComponent(selected.id)}&depth=${depth}`;

          if (data.transactionId) {
            setStarting(false);
            await openCheckout(data.transactionId, successUrl, locale);
            return;
          }
          if (data.url) { window.location.href = data.url; return; }
          return;
        }
      }

      // Start research
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ assetId: selected.id, depth, language: ['he','ar'].includes(locale) ? 'he' : 'en' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? 'שגיאה'); return; }
      router.push(`/report/${data.reportId}`);
    } finally {
      setStarting(false);
    }
  }

  // Handle return from Paddle payment (?paid=1&assetId=...&depth=...)
  useEffect(() => {
    const paidParam = params.get('paid');
    const paidAsset = params.get('assetId') ?? upgradeAssetId;
    const paidDepth = params.get('depth') as 'standard' | 'deep' | null;
    if (paidParam !== '1' || !paidAsset || !paidDepth || !user) return;

    // Clear the URL params
    window.history.replaceState({}, '', '/dashboard');

    // Start the paid research
    (async () => {
      setStarting(true);
      const token = await getIdToken();
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
          'x-paid-research': 'true',
        },
        body: JSON.stringify({ assetId: paidAsset, depth: paidDepth, language: 'he' }),
      });
      const data = await res.json();
      setStarting(false);
      if (res.ok) router.push(`/report/${data.reportId}`);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleUpgrade() {
    const token = await getIdToken();
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const isAtLimit    = usage?.plan === 'free' && (usage?.used ?? 0) >= (usage?.limit ?? 3);
  const activeReports = reports.filter((r) => r.status === 'running' || r.status === 'pending');
  const doneReports   = reports.filter((r) => r.status !== 'running' && r.status !== 'pending');

  async function handleDelete(reportId: string) {
    const token = await getIdToken();
    const res = await fetch(`/api/research/${reportId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (res.ok) setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  function handleStop(reportId: string) {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  if (authLoading || !user) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]" dir={dir}>
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Stock<span className="text-indigo-400">Sage</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Greeting */}
            <span className="text-white font-medium hidden sm:block">
              {firstName ? `ברוך הבא, ${firstName}` : 'ברוך הבא'}
              {usage?.plan === 'pro' && <span className="mr-1.5 text-xs text-indigo-300">Pro ✦</span>}
            </span>
            <LanguageSwitcher />
            <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{t('nav.settings')}</Link>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{t('nav.logout')}</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Pricing reminder — shown only to non-Pro users */}
        {usage?.plan !== 'pro' && (
          <div className="mb-6 rounded-xl px-5 py-3 bg-white/3 border border-white/8">
            <p className="text-xs text-gray-500">
              ⚡ מהיר = חינמי תמיד &nbsp;·&nbsp; 📊 מלא = $1.99/דוח &nbsp;·&nbsp; 🔬 עמוק = $3.99/דוח
            </p>
          </div>
        )}

        {/* Active research section */}
        {activeReports.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">{t('dashboard.activeResearch')}</h2>
            </div>
            <div className="space-y-3">
              {activeReports.map((r) => (
                <ActiveResearchCard key={r.id} report={r} getIdToken={getIdToken} onStop={handleStop} />
              ))}
            </div>
          </div>
        )}

        {/* Search section */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-6">{t('dashboard.newResearch')}</h1>

          {/* Search input */}
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 text-white rounded-2xl px-5 py-4 text-base outline-none transition-colors"
              disabled={starting || isAtLimit}
            />
            {searching && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            )}
            {selected && (
              <button
                onClick={handleClear}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors"
              >
                ×
              </button>
            )}

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-2 bg-[#14141f] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl"
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={() => handleSelect(r)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {r.symbol.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{r.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{r.symbol}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${EXCHANGE_COLORS[r.exchange] ?? 'bg-white/5 text-gray-400'}`}>
                      {r.exchange}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular stocks — one market at a time with tab switcher */}
          {!query && !selected && (
            <PopularStocks onSelect={handleSelect} locale={locale} />
          )}

          {/* Depth selector (shown after selecting an asset) */}
          {selected && (
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mt-2">
              {/* Selected asset header */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
                  {selected.symbol.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{selected.name}</p>
                  <p className="text-gray-500 text-xs">{selected.symbol} · {selected.exchange}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EXCHANGE_COLORS[selected.exchange] ?? 'bg-white/5 text-gray-400'}`}>
                  {selected.exchange}
                </span>
              </div>

              {/* Depth cards */}
              <p className="text-sm text-gray-400 mb-4">בחר עומק מחקר</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {DEPTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDepth(opt.value)}
                    className={`relative p-4 rounded-xl border text-right transition-all ${
                      depth === opt.value
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/8 bg-white/3 hover:border-white/20'
                    }`}
                  >
                    {opt.recommended && (
                      <span className="absolute -top-2.5 right-3 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">מומלץ</span>
                    )}
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <div className={`font-semibold text-sm mb-1 ${depth === opt.value ? 'text-indigo-300' : 'text-white'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{opt.steps}</div>
                    <div className="text-xs text-gray-600 mb-2">{opt.time}</div>
                    {/* Price or free credits badge */}
                    {(opt.value === 'standard' || opt.value === 'deep') && credits[opt.value] > 0 ? (
                      <div className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit bg-green-500/20 text-green-300">
                        {credits[opt.value]} חינמיות
                      </div>
                    ) : (
                      <div className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                        opt.value === 'quick'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {opt.price}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Description of selected depth */}
              <p className="text-xs text-gray-500 mb-5">
                {DEPTH_OPTIONS.find((o) => o.value === depth)?.desc}
              </p>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button
                onClick={startReport}
                disabled={starting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {starting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    מתחיל מחקר...
                  </>
                ) : (
                  <>{t('dashboard.startResearch')} ←</>
)}
              </button>
            </div>
          )}
        </div>

        {/* Completed reports list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t('dashboard.myReports')}</h2>
          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : doneReports.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-4">📊</p>
              <p>{activeReports.length > 0 ? t('dashboard.noReports') : t('dashboard.noReports')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {doneReports.map((r) => (
                <DoneReportRow key={r.id} report={r} onDelete={handleDelete} getIdToken={getIdToken} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardInner />
    </Suspense>
  );
}
