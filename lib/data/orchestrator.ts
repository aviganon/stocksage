import type { AssetId, UnifiedAsset, Quote, OHLC, Financials, NewsItem, HistoryRange } from './types';
import { parseAssetId, toYahooSymbol } from './asset-id';
import { getCache } from './cache';
import * as yahoo from './sources/yahoo';
import * as googleNews from './sources/google-news';
import * as fred from './sources/fred';

const CACHE_TTL = {
  asset: '7d',
  quote: '60s',
  history: '6h',
  financials: '30d',
  news: '30m',
  macro: '24h',
} as const;

export async function getAssetData(assetId: AssetId): Promise<UnifiedAsset> {
  const { exchange, symbol } = parseAssetId(assetId);
  return getCache().getOrSet(`asset:${assetId}`, CACHE_TTL.asset, () =>
    yahoo.fetchAssetData(toYahooSymbol(exchange, symbol), { exchange }),
  );
}

export async function getQuote(assetId: AssetId): Promise<Quote> {
  const { exchange, symbol } = parseAssetId(assetId);
  return getCache().getOrSet(`quote:${assetId}`, CACHE_TTL.quote, () =>
    yahoo.fetchQuote(toYahooSymbol(exchange, symbol)),
  );
}

export async function getHistorical(assetId: AssetId, range: HistoryRange): Promise<OHLC[]> {
  const { exchange, symbol } = parseAssetId(assetId);
  return getCache().getOrSet(`history:${assetId}:${range}`, CACHE_TTL.history, () =>
    yahoo.fetchHistorical(toYahooSymbol(exchange, symbol), range),
  );
}

export async function getFinancials(assetId: AssetId): Promise<Financials> {
  const { exchange, symbol } = parseAssetId(assetId);
  if (exchange === 'CRYPTO' || exchange === 'GOV') throw new Error(`Financials not applicable for ${exchange}`);
  return getCache().getOrSet(`financials:${assetId}`, CACHE_TTL.financials, () =>
    yahoo.fetchFinancials(toYahooSymbol(exchange, symbol)),
  );
}

export async function getNews(
  assetId: AssetId,
  options?: { language?: 'en' | 'he'; limit?: number },
): Promise<NewsItem[]> {
  const language = options?.language ?? 'en';
  const limit = options?.limit ?? 10;
  return getCache().getOrSet(`news:${assetId}:${language}:${limit}`, CACHE_TTL.news, async () => {
    const asset = await getAssetData(assetId);
    const query = language === 'he' && (asset as UnifiedAsset & { hebrewName?: string }).hebrewName
      ? (asset as UnifiedAsset & { hebrewName?: string }).hebrewName!
      : `"${asset.name}" OR "${asset.symbol}"`;
    return googleNews.fetchNewsForAsset(query, { language, limit });
  });
}

export async function getMacroSnapshot() {
  return getCache().getOrSet('macro:snapshot', CACHE_TTL.macro, async () => {
    const [treasury10y, fedFundsRate, cpi, unemployment, ilsToUsd, israeliKeyRate, israeliCpi] = await Promise.all([
      fred.fetchLatest('DGS10').catch(() => null),
      fred.fetchLatest('DFF').catch(() => null),
      fred.fetchLatest('CPIAUCSL').catch(() => null),
      fred.fetchLatest('UNRATE').catch(() => null),
      fred.fetchLatest('DEXISUS').catch(() => null),
      fred.fetchLatest('IRSTCI01ILM156N').catch(() => null),
      fred.fetchLatest('CPALTT01ILM659N').catch(() => null),
    ]);
    return {
      treasury10y: treasury10y?.value ?? null,
      fedFundsRate: fedFundsRate?.value ?? null,
      cpi: cpi?.value ?? null,
      unemployment: unemployment?.value ?? null,
      ilsToUsd: ilsToUsd?.value ?? null,
      israeliKeyRate: israeliKeyRate?.value ?? null,
      israeliCpi: israeliCpi?.value ?? null,
      asOf: new Date().toISOString(),
    };
  });
}

export async function searchAssets(query: string): Promise<Array<{ id: AssetId; symbol: string; name: string; exchange: string; type?: string }>> {
  if (!query || query.length < 1) return [];
  const localResults = searchIsraeliStocks(query);
  let yahooResults: Array<{ id: AssetId; symbol: string; name: string; exchange: string }> = [];
  try {
    const results = await yahoo.fetchSearch(query);
    yahooResults = results.map((r) => {
      const cleanSymbol = r.exchange === 'TASE' && r.symbol.endsWith('.TA') ? r.symbol.slice(0, -3) : r.symbol;
      return { id: `${r.exchange}:${cleanSymbol}` as AssetId, symbol: cleanSymbol, name: r.name, exchange: r.exchange };
    });
  } catch { /* fallback to local */ }

  const seen = new Set<string>();
  const merged: typeof yahooResults = [];
  for (const r of [...localResults, ...yahooResults]) {
    if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
  }
  return merged.slice(0, 20);
}

const ISRAELI_STOCKS: Array<{ id: AssetId; symbol: string; name: string; nameHe: string; exchange: string }> = [
  { id: 'TASE:TEVA' as AssetId,  symbol: 'TEVA',  name: 'Teva Pharmaceutical',    nameHe: 'טבע תעשיות פרמצבטיות',   exchange: 'TASE' },
  { id: 'TASE:CHKP' as AssetId,  symbol: 'CHKP',  name: 'Check Point Software',   nameHe: 'צ\'ק פוינט',             exchange: 'TASE' },
  { id: 'TASE:ICL'  as AssetId,  symbol: 'ICL',   name: 'ICL Group',              nameHe: 'כימיקלים לישראל',         exchange: 'TASE' },
  { id: 'TASE:ESLT' as AssetId,  symbol: 'ESLT',  name: 'Elbit Systems',          nameHe: 'אלביט מערכות',           exchange: 'TASE' },
  { id: 'TASE:NICE' as AssetId,  symbol: 'NICE',  name: 'NICE Systems',           nameHe: 'נייס מערכות',            exchange: 'TASE' },
  { id: 'TASE:POLI' as AssetId,  symbol: 'POLI',  name: 'Bank HaPoalim',          nameHe: 'בנק הפועלים',            exchange: 'TASE' },
  { id: 'TASE:LUMI' as AssetId,  symbol: 'LUMI',  name: 'Bank Leumi',             nameHe: 'בנק לאומי',              exchange: 'TASE' },
  { id: 'TASE:MZTF' as AssetId,  symbol: 'MZTF',  name: 'Mizrahi Tefahot Bank',   nameHe: 'מזרחי-טפחות',           exchange: 'TASE' },
  { id: 'TASE:DSCT' as AssetId,  symbol: 'DSCT',  name: 'Israel Discount Bank',   nameHe: 'בנק דיסקונט',           exchange: 'TASE' },
  { id: 'TASE:BEZQ' as AssetId,  symbol: 'BEZQ',  name: 'Bezeq',                  nameHe: 'בזק',                    exchange: 'TASE' },
  { id: 'TASE:CELU' as AssetId,  symbol: 'CELU',  name: 'Cellcom',                nameHe: 'סלקום',                  exchange: 'TASE' },
  { id: 'TASE:PTNR' as AssetId,  symbol: 'PTNR',  name: 'Partner Communications', nameHe: 'פרטנר',                  exchange: 'TASE' },
  { id: 'TASE:ENLT' as AssetId,  symbol: 'ENLT',  name: 'Enlight Energy',         nameHe: 'אנלייט אנרגיה',          exchange: 'TASE' },
  { id: 'TASE:AZRG' as AssetId,  symbol: 'AZRG',  name: 'Azrieli Group',          nameHe: 'קבוצת עזריאלי',          exchange: 'TASE' },
  { id: 'TASE:MGDL' as AssetId,  symbol: 'MGDL',  name: 'Migdal Insurance',       nameHe: 'מגדל ביטוח',             exchange: 'TASE' },
  { id: 'TASE:FIBI' as AssetId,  symbol: 'FIBI',  name: 'First International Bank',nameHe: 'בנק הבינלאומי',         exchange: 'TASE' },
  { id: 'TASE:AMOT' as AssetId,  symbol: 'AMOT',  name: 'Amot Investments',       nameHe: 'עמות השקעות',            exchange: 'TASE' },
  { id: 'TASE:SPEN' as AssetId,  symbol: 'SPEN',  name: 'Shapir Engineering',     nameHe: 'שפיר הנדסה',             exchange: 'TASE' },
  { id: 'TASE:FORTY' as AssetId, symbol: 'FORTY', name: 'Formula Systems',        nameHe: 'פורמולה מערכות',         exchange: 'TASE' },
];

function searchIsraeliStocks(q: string): Array<{ id: AssetId; symbol: string; name: string; exchange: string }> {
  const lower = q.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);
  return ISRAELI_STOCKS
    .filter((s) => {
      if (s.symbol.toLowerCase() === lower) return true;
      if (s.symbol.toLowerCase().startsWith(lower)) return true;
      if (words.every((w) => s.nameHe.includes(w))) return true;
      if (words.every((w) => s.name.toLowerCase().includes(w))) return true;
      return false;
    })
    .map(({ id, symbol, name, exchange }) => ({ id, symbol, name, exchange }));
}
