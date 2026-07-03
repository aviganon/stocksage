/**
 * SEO stock universe — the curated set of stocks we generate public
 * analysis landing pages for. These are the tickers people actually search
 * on Google ("AAPL stock analysis", "is NVDA overvalued", etc.), chosen for
 * international search volume rather than the Israeli-first product focus.
 *
 * Each entry becomes a page at /analysis/<exchange>/<symbol> and a sitemap URL.
 */

import type { AssetId } from '@/lib/data/types';

export interface SeoStock {
  id: AssetId;
  symbol: string;
  name: string;
  exchange: string;
  /** Coarse grouping used on the hub page for internal linking. */
  group: string;
}

export const SEO_UNIVERSE: SeoStock[] = [
  // ── US mega-cap tech (highest global search volume) ──
  { id: 'NASDAQ:AAPL',  symbol: 'AAPL',  name: 'Apple',            exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:MSFT',  symbol: 'MSFT',  name: 'Microsoft',        exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:NVDA',  symbol: 'NVDA',  name: 'Nvidia',           exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:GOOGL', symbol: 'GOOGL', name: 'Alphabet (Google)',exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:AMZN',  symbol: 'AMZN',  name: 'Amazon',           exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:META',  symbol: 'META',  name: 'Meta Platforms',   exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:TSLA',  symbol: 'TSLA',  name: 'Tesla',            exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:AVGO',  symbol: 'AVGO',  name: 'Broadcom',         exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:AMD',   symbol: 'AMD',   name: 'AMD',              exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:NFLX',  symbol: 'NFLX',  name: 'Netflix',          exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:INTC',  symbol: 'INTC',  name: 'Intel',            exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:PLTR',  symbol: 'PLTR',  name: 'Palantir',         exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:MU',    symbol: 'MU',    name: 'Micron',           exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:QCOM',  symbol: 'QCOM',  name: 'Qualcomm',         exchange: 'NASDAQ', group: 'US Tech' },
  { id: 'NASDAQ:CRM',   symbol: 'CRM',   name: 'Salesforce',       exchange: 'NYSE',   group: 'US Tech' },

  // ── US blue chips / finance / consumer ──
  { id: 'NYSE:JPM',   symbol: 'JPM',  name: 'JPMorgan Chase',    exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:V',     symbol: 'V',    name: 'Visa',              exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:JNJ',   symbol: 'JNJ',  name: 'Johnson & Johnson', exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:WMT',   symbol: 'WMT',  name: 'Walmart',           exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:PG',    symbol: 'PG',   name: 'Procter & Gamble',  exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:KO',    symbol: 'KO',   name: 'Coca-Cola',         exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:DIS',   symbol: 'DIS',  name: 'Disney',            exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:BAC',   symbol: 'BAC',  name: 'Bank of America',   exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:XOM',   symbol: 'XOM',  name: 'ExxonMobil',        exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:MA',    symbol: 'MA',   name: 'Mastercard',        exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:PFE',   symbol: 'PFE',  name: 'Pfizer',            exchange: 'NYSE',   group: 'US Blue Chips' },
  { id: 'NYSE:BABA',  symbol: 'BABA', name: 'Alibaba',           exchange: 'NYSE',   group: 'US Blue Chips' },

  // ── UK — LSE ──
  { id: 'LSE:SHEL', symbol: 'SHEL', name: 'Shell',          exchange: 'LSE', group: 'UK' },
  { id: 'LSE:HSBA', symbol: 'HSBA', name: 'HSBC Holdings',  exchange: 'LSE', group: 'UK' },
  { id: 'LSE:AZN',  symbol: 'AZN',  name: 'AstraZeneca',    exchange: 'LSE', group: 'UK' },
  { id: 'LSE:BP',   symbol: 'BP',   name: 'BP',             exchange: 'LSE', group: 'UK' },
  { id: 'LSE:ULVR', symbol: 'ULVR', name: 'Unilever',       exchange: 'LSE', group: 'UK' },
  { id: 'LSE:GSK',  symbol: 'GSK',  name: 'GSK',            exchange: 'LSE', group: 'UK' },
  { id: 'LSE:RIO',  symbol: 'RIO',  name: 'Rio Tinto',      exchange: 'LSE', group: 'UK' },
  { id: 'LSE:BARC', symbol: 'BARC', name: 'Barclays',       exchange: 'LSE', group: 'UK' },

  // ── Germany — XETRA ──
  { id: 'XETRA:SAP',  symbol: 'SAP',  name: 'SAP',              exchange: 'XETRA', group: 'Germany' },
  { id: 'XETRA:SIE',  symbol: 'SIE',  name: 'Siemens',          exchange: 'XETRA', group: 'Germany' },
  { id: 'XETRA:BMW',  symbol: 'BMW',  name: 'BMW',              exchange: 'XETRA', group: 'Germany' },
  { id: 'XETRA:VOW3', symbol: 'VOW3', name: 'Volkswagen',       exchange: 'XETRA', group: 'Germany' },
  { id: 'XETRA:ALV',  symbol: 'ALV',  name: 'Allianz',          exchange: 'XETRA', group: 'Germany' },
  { id: 'XETRA:DTE',  symbol: 'DTE',  name: 'Deutsche Telekom', exchange: 'XETRA', group: 'Germany' },

  // ── France — Euronext Paris ──
  { id: 'EPA:MC',  symbol: 'MC',  name: 'LVMH',          exchange: 'EPA', group: 'France' },
  { id: 'EPA:OR',  symbol: 'OR',  name: "L'Oréal",       exchange: 'EPA', group: 'France' },
  { id: 'EPA:AIR', symbol: 'AIR', name: 'Airbus',        exchange: 'EPA', group: 'France' },
  { id: 'EPA:SAN', symbol: 'SAN', name: 'Sanofi',        exchange: 'EPA', group: 'France' },
  { id: 'EPA:TTE', symbol: 'TTE', name: 'TotalEnergies', exchange: 'EPA', group: 'France' },

  // ── Canada / Australia ──
  { id: 'TSX:SHOP', symbol: 'SHOP', name: 'Shopify',              exchange: 'TSX', group: 'Canada & Australia' },
  { id: 'TSX:RY',   symbol: 'RY',   name: 'Royal Bank of Canada', exchange: 'TSX', group: 'Canada & Australia' },
  { id: 'ASX:BHP',  symbol: 'BHP',  name: 'BHP Group',            exchange: 'ASX', group: 'Canada & Australia' },
  { id: 'ASX:CBA',  symbol: 'CBA',  name: 'Commonwealth Bank',    exchange: 'ASX', group: 'Canada & Australia' },

  // ── Israel — TASE (differentiator: local coverage most global tools lack) ──
  { id: 'TASE:TEVA', symbol: 'TEVA', name: 'Teva Pharmaceutical', exchange: 'TASE', group: 'Israel (TASE)' },
  { id: 'TASE:NICE', symbol: 'NICE', name: 'NICE Systems',        exchange: 'TASE', group: 'Israel (TASE)' },
  { id: 'TASE:CHKP', symbol: 'CHKP', name: 'Check Point Software',exchange: 'TASE', group: 'Israel (TASE)' },
  { id: 'TASE:ESLT', symbol: 'ESLT', name: 'Elbit Systems',       exchange: 'TASE', group: 'Israel (TASE)' },
  { id: 'TASE:ICL',  symbol: 'ICL',  name: 'ICL Group',           exchange: 'TASE', group: 'Israel (TASE)' },
];

/** Case-insensitive lookup by exchange + symbol (for page params). */
export function findSeoStock(exchange: string, symbol: string): SeoStock | undefined {
  const ex = exchange.toUpperCase();
  const sy = symbol.toUpperCase();
  return SEO_UNIVERSE.find((s) => s.exchange.toUpperCase() === ex && s.symbol.toUpperCase() === sy);
}

/** Grouped for the hub page. Preserves first-seen group order. */
export function groupedUniverse(): Array<{ group: string; stocks: SeoStock[] }> {
  const order: string[] = [];
  const map = new Map<string, SeoStock[]>();
  for (const s of SEO_UNIVERSE) {
    if (!map.has(s.group)) { map.set(s.group, []); order.push(s.group); }
    map.get(s.group)!.push(s);
  }
  return order.map((group) => ({ group, stocks: map.get(group)! }));
}
