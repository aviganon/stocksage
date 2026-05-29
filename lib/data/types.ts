/**
 * Core types for the data layer.
 *
 * The orchestrator (lib/data/orchestrator.ts) returns these shapes regardless
 * of which underlying source (Yahoo, CoinGecko, FRED, etc.) was used.
 */

export type AssetType = 'stock' | 'etf' | 'crypto' | 'bond';
export type Exchange =
  | 'NASDAQ' | 'NYSE' | 'AMEX'   // USA
  | 'TASE'                        // Israel
  | 'LSE'                         // UK — London Stock Exchange
  | 'XETRA'                       // Germany — Deutsche Börse / Xetra
  | 'EPA'                         // France — Euronext Paris
  | 'TSX'                         // Canada — Toronto Stock Exchange
  | 'ASX'                         // Australia — Australian Securities Exchange
  | 'CRYPTO' | 'GOV';
export type Currency = 'USD' | 'ILS' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
export type MarketState = 'pre' | 'open' | 'closed' | 'after';

/**
 * Canonical asset identifier in the form "EXCHANGE:SYMBOL"
 * Examples: "NASDAQ:AAPL", "TASE:EPIT", "CRYPTO:bitcoin", "GOV:US10Y"
 */
export type AssetId = string;

export interface UnifiedAsset {
  id: AssetId;
  type: AssetType;
  symbol: string;
  exchange: Exchange;
  name: string;
  hebrewName?: string;
  currency: Currency;
  sector?: string;
  industry?: string;
  country: string; // ISO 3166-1 alpha-2
  description?: string;
  website?: string;
  ipoDate?: string; // ISO date
  employees?: number;
  ceo?: string;
  founded?: number;
  metadata: Record<string, unknown>;
  source: string;
  fetchedAt: string; // ISO timestamp
}

export interface Quote {
  assetId: AssetId;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  currency: Currency;
  asOf: string; // ISO timestamp
  marketState: MarketState;
  source: string;
}

export interface OHLC {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
}

export type HistoryRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' | 'max';
export type HistoryInterval = '1m' | '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo';

export interface IncomeStatementPeriod {
  period: string; // "2024", "Q3-2024"
  date: string; // period end date
  totalRevenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  ebitda: number | null;
  basicEPS: number | null;
  dilutedEPS: number | null;
  currency: Currency;
}

export interface BalanceSheetPeriod {
  period: string;
  date: string;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  cash: number | null;
  shortTermDebt: number | null;
  longTermDebt: number | null;
  currency: Currency;
}

export interface CashflowPeriod {
  period: string;
  date: string;
  operatingCashflow: number | null;
  investingCashflow: number | null;
  financingCashflow: number | null;
  freeCashflow: number | null;
  capex: number | null;
  currency: Currency;
}

export interface KeyRatios {
  peRatio: number | null;
  forwardPE: number | null;
  psRatio: number | null;
  pbRatio: number | null;
  pegRatio: number | null;
  evToEbitda: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  roa: number | null;
  roe: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
}

export interface Financials {
  assetId: AssetId;
  income: IncomeStatementPeriod[];
  balance: BalanceSheetPeriod[];
  cashflow: CashflowPeriod[];
  ratios: KeyRatios;
  marketCap: number | null;
  enterpriseValue: number | null;
  sharesOutstanding: number | null;
  asOf: string;
  source: string;
}

export interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string; // publisher name
  publishedAt: string; // ISO
  language: 'en' | 'he';
  tags?: string[];
}

export interface AssetEvent {
  id: string;
  assetId: AssetId;
  type:
    | 'earnings'
    | 'dividend'
    | 'split'
    | 'filing'
    | 'news'
    | 'fda_approval'
    | 'partnership'
    | 'lawsuit'
    | 'acquisition'
    | 'leadership_change'
    | 'corporate_action';
  title: string;
  description: string;
  url?: string;
  importance: 'low' | 'medium' | 'high';
  occurredAt: string;
  detectedAt: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export class DataSourceError extends Error {
  constructor(
    public source: string,
    public code: string,
    message: string,
    public cause?: unknown,
  ) {
    super(`[${source}:${code}] ${message}`);
    this.name = 'DataSourceError';
  }
}

export class AssetNotFoundError extends Error {
  constructor(assetId: AssetId) {
    super(`Asset not found: ${assetId}`);
    this.name = 'AssetNotFoundError';
  }
}
