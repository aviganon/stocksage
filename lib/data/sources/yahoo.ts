/**
 * Yahoo Finance source adapter.
 *
 * Uses the `yahoo-finance2` npm package to fetch stock/ETF data.
 * TASE symbols: caller passes symbol with .TA suffix (e.g. "EPIT.TA").
 * TASE price correction: Yahoo returns prices in agorot (1/100 ILS) — divide by 100.
 *
 * Rate limiting: simple semaphore — max 5 concurrent, 100ms delay, exponential backoff on 429.
 */

import YahooFinance from 'yahoo-finance2';
import type {
  UnifiedAsset,
  Quote,
  OHLC,
  Financials,
  HistoryRange,
  HistoryInterval,
  IncomeStatementPeriod,
  BalanceSheetPeriod,
  CashflowPeriod,
  Currency,
  AssetType,
  Exchange,
} from '../types';
import { DataSourceError } from '../types';

const yahooFinance = new YahooFinance();

// ─── Rate limiter ────────────────────────────────────────────────────────────

const MAX_CONCURRENT = 5;
const INTER_REQUEST_MS = 100;
let _inflight = 0;
const _queue: Array<() => void> = [];

async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (_inflight >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => _queue.push(resolve));
  }
  _inflight++;
  await sleep(INTER_REQUEST_MS);
  try {
    return await withRetry(fn);
  } finally {
    _inflight--;
    if (_queue.length > 0) _queue.shift()!();
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const is429 = String(e).includes('429') || String(e).includes('Too Many Requests');
      if (!is429 || i === attempts - 1) break;
      await sleep(1000 * Math.pow(2, i));
    }
  }
  throw lastErr;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TASE_SUFFIX = '.TA';

function isTase(symbol: string): boolean {
  return symbol.endsWith(TASE_SUFFIX);
}

function n(v: unknown): number | null {
  const num = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(num) ? num : null;
}

function dateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v.slice(0, 10);
  return '';
}

function mapExchange(exch: string | undefined, isTaseSymbol: boolean): Exchange {
  if (isTaseSymbol) return 'TASE';
  const e = (exch ?? '').toUpperCase();
  if (e.includes('NAS')) return 'NASDAQ';
  if (e.includes('NYS')) return 'NYSE';
  if (e.includes('AME') || e === 'PCX') return 'AMEX';
  return 'NASDAQ';
}

function mapType(quoteType: string | undefined): AssetType {
  const t = (quoteType ?? '').toUpperCase();
  if (t === 'ETF' || t === 'MUTUALFUND') return 'etf';
  if (t === 'EQUITY') return 'stock';
  return 'stock';
}

function mapCurrency(currency: string | undefined, isTaseSymbol: boolean): Currency {
  if (isTaseSymbol || currency === 'ILS') return 'ILS';
  if (currency === 'EUR') return 'EUR';
  if (currency === 'GBP') return 'GBP';
  return 'USD';
}

const RANGE_TO_DAYS: Record<HistoryRange, number> = {
  '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180,
  '1y': 365, '5y': 1825, 'max': 36500,
};

// ─── Public functions ─────────────────────────────────────────────────────────

export async function fetchAssetData(
  symbol: string,
  options?: { exchange?: string },
): Promise<UnifiedAsset> {
  const tase = isTase(symbol) || options?.exchange === 'TASE';
  try {
    return await withRateLimit(async () => {
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ['assetProfile', 'summaryDetail', 'defaultKeyStatistics', 'price'],
      });

      const profile = summary.assetProfile;
      const detail = summary.summaryDetail;
      const price = summary.price;
      const stats = summary.defaultKeyStatistics;

      const currency = price?.currency ?? detail?.currency;
      const exchStr = mapExchange(price?.exchangeName ?? price?.exchange, tase);

      return {
        id: `${exchStr}:${symbol.replace(TASE_SUFFIX, '')}`,
        type: mapType(price?.quoteType),
        symbol: symbol.replace(TASE_SUFFIX, ''),
        exchange: exchStr,
        name: price?.longName ?? price?.shortName ?? symbol,
        currency: mapCurrency(currency, tase),
        country: profile?.country ?? (tase ? 'IL' : 'US'),
        sector: profile?.sector ?? undefined,
        industry: profile?.industry ?? undefined,
        description: profile?.longBusinessSummary ?? undefined,
        website: profile?.website ?? undefined,
        employees: n(profile?.fullTimeEmployees) ?? undefined,
        metadata: {
          marketCap: n(price?.marketCap ?? detail?.marketCap),
          sharesOutstanding: n(stats?.sharesOutstanding),
          beta: n(stats?.beta ?? detail?.beta),
        },
        source: 'yahoo',
        fetchedAt: new Date().toISOString(),
      } satisfies UnifiedAsset;
    });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('yahoo', 'fetch_failed', `fetchAssetData failed for ${symbol}: ${String(e)}`, e);
  }
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  const tase = isTase(symbol);
  try {
    return await withRateLimit(async () => {
      const q = await yahooFinance.quote(symbol);
      const currency = q.currency;
      const priceFactor = tase && currency === 'ILS' ? 0.01 : 1;
      const exchStr = mapExchange(q.fullExchangeName ?? q.exchange, tase);
      const sym = symbol.replace(TASE_SUFFIX, '');

      // regularMarketTime is a Date in v3
      const marketTimeMs = q.regularMarketTime instanceof Date
        ? q.regularMarketTime.getTime()
        : (n(q.regularMarketTime) ?? 0) * 1000;

      return {
        assetId: `${exchStr}:${sym}`,
        price: (n(q.regularMarketPrice) ?? 0) * priceFactor,
        change: (n(q.regularMarketChange) ?? 0) * priceFactor,
        changePercent: n(q.regularMarketChangePercent) ?? 0,
        volume: n(q.regularMarketVolume) ?? 0,
        high: (n(q.regularMarketDayHigh) ?? 0) * priceFactor,
        low: (n(q.regularMarketDayLow) ?? 0) * priceFactor,
        open: (n(q.regularMarketOpen) ?? 0) * priceFactor,
        previousClose: (n(q.regularMarketPreviousClose) ?? 0) * priceFactor,
        currency: mapCurrency(currency, tase),
        asOf: new Date(marketTimeMs).toISOString(),
        marketState: (q.marketState?.toLowerCase() ?? 'closed') as Quote['marketState'],
        source: 'yahoo',
      } satisfies Quote;
    });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('yahoo', 'fetch_failed', `fetchQuote failed for ${symbol}: ${String(e)}`, e);
  }
}

export async function fetchHistorical(
  symbol: string,
  range: HistoryRange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _interval: HistoryInterval = '1d',
): Promise<OHLC[]> {
  const tase = isTase(symbol);
  const days = RANGE_TO_DAYS[range];
  const period2 = new Date();
  const period1 = new Date(Date.now() - days * 86_400_000);

  try {
    return await withRateLimit(async () => {
      const rows = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval: '1d',
      });

      return rows
        .filter((r) => r.close != null)
        .map((r) => {
          const priceFactor = tase ? 0.01 : 1;
          return {
            date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
            open: (n(r.open) ?? 0) * priceFactor,
            high: (n(r.high) ?? 0) * priceFactor,
            low: (n(r.low) ?? 0) * priceFactor,
            close: (n(r.close) ?? 0) * priceFactor,
            adjClose: r.adjClose != null ? (n(r.adjClose) ?? 0) * priceFactor : undefined,
            volume: n(r.volume) ?? 0,
          } satisfies OHLC;
        });
    });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('yahoo', 'fetch_failed', `fetchHistorical failed for ${symbol}: ${String(e)}`, e);
  }
}

export async function fetchFinancials(symbol: string): Promise<Financials> {
  const tase = isTase(symbol);
  try {
    return await withRateLimit(async () => {
      // Get ratios/metadata from quoteSummary
      const [summary, tsRows] = await Promise.all([
        yahooFinance.quoteSummary(symbol, {
          modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'price'],
        }),
        // fundamentalsTimeSeries provides real financial statement data (post-Nov 2024)
        yahooFinance.fundamentalsTimeSeries(symbol, {
          period1: new Date(Date.now() - 5 * 365 * 86_400_000),
          type: 'annual',
          module: 'all',
        }).catch(() => [] as Awaited<ReturnType<typeof yahooFinance.fundamentalsTimeSeries>>),
      ]);

      const currency = (summary.price?.currency ?? 'USD');
      const priceFactor = tase && currency === 'ILS' ? 0.01 : 1;
      const cur = mapCurrency(currency, tase);
      const exchStr = mapExchange(summary.price?.exchangeName, tase);
      const sym = symbol.replace(TASE_SUFFIX, '');

      // Map fundamentalsTimeSeries rows into our period types
      // Each row has a `date` (year-end) and may have fields from all three modules
      const income: IncomeStatementPeriod[] = (tsRows as Array<Record<string, unknown>>)
        .filter((r) => r['totalRevenue'] != null || r['netIncome'] != null)
        .map((r): IncomeStatementPeriod => ({
          period: dateStr(r['date']).slice(0, 4),
          date: dateStr(r['date']),
          totalRevenue: n(r['totalRevenue']) !== null ? n(r['totalRevenue'])! * priceFactor : null,
          costOfRevenue: n(r['costOfRevenue']) !== null ? n(r['costOfRevenue'])! * priceFactor : null,
          grossProfit: n(r['grossProfit']) !== null ? n(r['grossProfit'])! * priceFactor : null,
          operatingIncome: n(r['operatingIncome']) !== null ? n(r['operatingIncome'])! * priceFactor : null,
          netIncome: n(r['netIncome']) !== null ? n(r['netIncome'])! * priceFactor : null,
          ebitda: n(r['EBITDA']) !== null ? n(r['EBITDA'])! * priceFactor : null,
          basicEPS: n(r['basicEPS']) !== null ? n(r['basicEPS'])! * priceFactor : null,
          dilutedEPS: n(r['dilutedEPS']) !== null ? n(r['dilutedEPS'])! * priceFactor : null,
          currency: cur,
        }));

      const balance: BalanceSheetPeriod[] = (tsRows as Array<Record<string, unknown>>)
        .filter((r) => r['totalAssets'] != null)
        .map((r): BalanceSheetPeriod => ({
          period: dateStr(r['date']).slice(0, 4),
          date: dateStr(r['date']),
          totalAssets: n(r['totalAssets']) !== null ? n(r['totalAssets'])! * priceFactor : null,
          totalLiabilities: n(r['totalLiabilitiesNetMinorityInterest']) !== null ? n(r['totalLiabilitiesNetMinorityInterest'])! * priceFactor : null,
          totalEquity: n(r['stockholdersEquity']) !== null ? n(r['stockholdersEquity'])! * priceFactor : null,
          cash: n(r['cashAndCashEquivalents']) !== null ? n(r['cashAndCashEquivalents'])! * priceFactor : null,
          shortTermDebt: n(r['currentDebt']) !== null ? n(r['currentDebt'])! * priceFactor : null,
          longTermDebt: n(r['longTermDebt']) !== null ? n(r['longTermDebt'])! * priceFactor : null,
          currency: cur,
        }));

      const cashflow: CashflowPeriod[] = (tsRows as Array<Record<string, unknown>>)
        .filter((r) => r['operatingCashFlow'] != null || r['freeCashFlow'] != null)
        .map((r): CashflowPeriod => ({
          period: dateStr(r['date']).slice(0, 4),
          date: dateStr(r['date']),
          operatingCashflow: n(r['operatingCashFlow']) !== null ? n(r['operatingCashFlow'])! * priceFactor : null,
          investingCashflow: n(r['investingCashFlow']) !== null ? n(r['investingCashFlow'])! * priceFactor : null,
          financingCashflow: n(r['financingCashFlow']) !== null ? n(r['financingCashFlow'])! * priceFactor : null,
          freeCashflow: n(r['freeCashFlow']) !== null ? n(r['freeCashFlow'])! * priceFactor : null,
          capex: n(r['capitalExpenditure']) !== null ? n(r['capitalExpenditure'])! * priceFactor : null,
          currency: cur,
        }));

      const fd = summary.financialData;
      const ks = summary.defaultKeyStatistics;
      const sd = summary.summaryDetail;

      return {
        assetId: `${exchStr}:${sym}`,
        income,
        balance,
        cashflow,
        ratios: {
          peRatio: n(sd?.trailingPE ?? ks?.trailingPE),
          forwardPE: n(sd?.forwardPE ?? ks?.forwardEps),
          psRatio: n(ks?.priceToSalesTrailing12Months),
          pbRatio: n(ks?.priceToBook),
          pegRatio: n(ks?.pegRatio),
          evToEbitda: n(ks?.enterpriseToEbitda),
          debtToEquity: n(fd?.debtToEquity),
          currentRatio: n(fd?.currentRatio),
          quickRatio: n(fd?.quickRatio),
          roa: n(fd?.returnOnAssets),
          roe: n(fd?.returnOnEquity),
          grossMargin: n(fd?.grossMargins),
          operatingMargin: n(fd?.operatingMargins),
          netMargin: n(fd?.profitMargins),
          dividendYield: n(sd?.dividendYield ?? sd?.trailingAnnualDividendYield),
          payoutRatio: n(sd?.payoutRatio),
        },
        marketCap: n(summary.price?.marketCap ?? sd?.marketCap),
        enterpriseValue: n(ks?.enterpriseValue),
        sharesOutstanding: n(ks?.sharesOutstanding),
        asOf: new Date().toISOString(),
        source: 'yahoo',
      } satisfies Financials;
    });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('yahoo', 'fetch_failed', `fetchFinancials failed for ${symbol}: ${String(e)}`, e);
  }
}

export interface AnalystData {
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  nextEarningsDate: string | null;
}

export async function fetchAnalystData(symbol: string): Promise<AnalystData> {
  try {
    return await withRateLimit(async () => {
      const summary = await yahooFinance.quoteSummary(symbol, {
        modules: ['financialData', 'recommendationTrend', 'calendarEvents'],
      });
      const fd = summary.financialData;
      const trend = summary.recommendationTrend?.trend?.[0];
      const cal = summary.calendarEvents;

      const earnings = cal?.earnings;
      let nextEarningsDate: string | null = null;
      if (earnings) {
        const dates = (earnings as Record<string, unknown>)['earningsDate'];
        if (Array.isArray(dates) && dates.length > 0) {
          const d = dates[0] instanceof Date ? dates[0] : new Date(String(dates[0]));
          if (!isNaN(d.getTime()) && d > new Date()) {
            nextEarningsDate = d.toISOString().slice(0, 10);
          }
        }
      }

      return {
        targetMeanPrice: n(fd?.targetMeanPrice) ?? null,
        targetHighPrice: n(fd?.targetHighPrice) ?? null,
        targetLowPrice: n(fd?.targetLowPrice) ?? null,
        recommendationKey: typeof fd?.recommendationKey === 'string' ? fd.recommendationKey : null,
        numberOfAnalystOpinions: n(fd?.numberOfAnalystOpinions) ?? null,
        strongBuy: n(trend?.strongBuy) ?? 0,
        buy: n(trend?.buy) ?? 0,
        hold: n(trend?.hold) ?? 0,
        sell: n(trend?.sell) ?? 0,
        strongSell: n(trend?.strongSell) ?? 0,
        nextEarningsDate,
      };
    });
  } catch {
    return {
      targetMeanPrice: null, targetHighPrice: null, targetLowPrice: null,
      recommendationKey: null, numberOfAnalystOpinions: null,
      strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0,
      nextEarningsDate: null,
    };
  }
}

export async function fetchSearch(
  query: string,
): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  try {
    return await withRateLimit(async () => {
      const results = await yahooFinance.search(query, { newsCount: 0, quotesCount: 10 });
      return (results.quotes ?? [])
        .filter((q): q is typeof q & { symbol: string } =>
          !!q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'CRYPTOCURRENCY')
        )
        .map((q) => {
          const r = q as Record<string, unknown>;
          return {
            symbol: q.symbol,
            name: String(r['longname'] ?? r['shortname'] ?? q.symbol),
            exchange: mapExchange(String(r['exchange'] ?? ''), q.symbol.endsWith('.TA')),
          };
        });
    });
  } catch (e) {
    if (e instanceof DataSourceError) throw e;
    throw new DataSourceError('yahoo', 'fetch_failed', `fetchSearch failed for "${query}": ${String(e)}`, e);
  }
}
