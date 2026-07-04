/**
 * Stock screener / market discovery — wraps Yahoo Finance's predefined screens
 * ("day_gainers", "undervalued_large_caps", etc.) into a normalized, cached
 * result set. Powers the public /screener discovery page.
 *
 * Note: Yahoo's predefined screens are US-market. Results normalize the Yahoo
 * exchange code into our canonical Exchange so each row links to a research /
 * analysis page.
 */

import YahooFinance from 'yahoo-finance2';
import { getCache } from './cache';
import type { AssetId } from './types';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export const SCREENS = [
  { id: 'most_actives',              key: 'mostActive' },
  { id: 'day_gainers',              key: 'gainers' },
  { id: 'day_losers',               key: 'losers' },
  { id: 'undervalued_large_caps',   key: 'undervaluedLarge' },
  { id: 'undervalued_growth_stocks', key: 'undervaluedGrowth' },
  { id: 'growth_technology_stocks', key: 'growthTech' },
  { id: 'aggressive_small_caps',    key: 'smallCaps' },
  { id: 'most_shorted_stocks',      key: 'mostShorted' },
] as const;

export type ScreenId = (typeof SCREENS)[number]['id'];

export const SCREEN_IDS = SCREENS.map((s) => s.id) as ScreenId[];

export interface ScreenerRow {
  id: AssetId;
  symbol: string;
  name: string;
  exchange: string;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  currency: string;
}

// Yahoo exchange code → our canonical exchange. US codes dominate the
// predefined screens; unknowns default to NASDAQ (US symbols resolve the same
// on Yahoo regardless of NASDAQ/NYSE labelling since neither uses a suffix).
function mapExchange(code?: string): string {
  switch (code) {
    case 'NMS': case 'NGM': case 'NCM': case 'NAS': return 'NASDAQ';
    case 'NYQ': case 'PCX': case 'PNK': return 'NYSE';
    case 'ASE': return 'AMEX';
    case 'LSE': return 'LSE';
    case 'GER': case 'FRA': return 'XETRA';
    case 'PAR': return 'EPA';
    case 'TOR': return 'TSX';
    case 'ASX': return 'ASX';
    case 'TLV': return 'TASE';
    default: return 'NASDAQ';
  }
}

export async function fetchScreener(scrId: ScreenId, count = 25): Promise<ScreenerRow[]> {
  return getCache().getOrSet(`screener:${scrId}:${count}`, '10m', async () => {
    const result = await yahooFinance.screener({ scrIds: scrId, count }, undefined, { validateResult: false }) as { quotes?: unknown[] };
    const quotes = (result?.quotes ?? []) as Array<Record<string, unknown>>;
    return quotes
      .map((q): ScreenerRow => {
        const exchange = mapExchange(q['exchange'] as string | undefined);
        const symbol = String(q['symbol'] ?? '');
        return {
          id: `${exchange}:${symbol}` as AssetId,
          symbol,
          name: String(q['shortName'] ?? q['longName'] ?? symbol),
          exchange,
          price: typeof q['regularMarketPrice'] === 'number' ? (q['regularMarketPrice'] as number) : null,
          changePercent: typeof q['regularMarketChangePercent'] === 'number' ? (q['regularMarketChangePercent'] as number) : null,
          marketCap: typeof q['marketCap'] === 'number' ? (q['marketCap'] as number) : null,
          currency: String(q['currency'] ?? 'USD'),
        };
      })
      .filter((r) => r.symbol);
  });
}
