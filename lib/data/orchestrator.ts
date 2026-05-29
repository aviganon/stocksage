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
    const [
      // USA
      treasury10y, fedFundsRate, cpi, unemployment,
      // Israel
      ilsToUsd, israeliKeyRate, israeliCpi,
      // UK
      gbpToUsd, boeRate, ukCpi,
      // Eurozone (France + Germany)
      eurToUsd, ecbRate,
      // Canada
      cadToUsd, bocRate,
      // Australia
      audToUsd, rbaRate,
    ] = await Promise.all([
      // USA
      fred.fetchLatest('DGS10').catch(() => null),
      fred.fetchLatest('DFF').catch(() => null),
      fred.fetchLatest('CPIAUCSL').catch(() => null),
      fred.fetchLatest('UNRATE').catch(() => null),
      // Israel
      fred.fetchLatest('DEXISUS').catch(() => null),
      fred.fetchLatest('IRSTCI01ILM156N').catch(() => null),
      fred.fetchLatest('CPALTT01ILM659N').catch(() => null),
      // UK
      fred.fetchLatest('DEXUSUK').catch(() => null),
      fred.fetchLatest('IUDSOIA').catch(() => null),      // BOE SONIA rate
      fred.fetchLatest('GBRCPIALLMINMEI').catch(() => null),
      // Eurozone
      fred.fetchLatest('DEXUSEU').catch(() => null),
      fred.fetchLatest('ECBDFR').catch(() => null),       // ECB deposit facility rate
      // Canada
      fred.fetchLatest('DEXCAUS').catch(() => null),
      fred.fetchLatest('IRSTCB01CAM156N').catch(() => null),
      // Australia
      fred.fetchLatest('DEXUSAL').catch(() => null),
      fred.fetchLatest('IRSTCB01AUM156N').catch(() => null),
    ]);
    return {
      // USA
      treasury10y: treasury10y?.value ?? null,
      fedFundsRate: fedFundsRate?.value ?? null,
      cpi: cpi?.value ?? null,
      unemployment: unemployment?.value ?? null,
      // Israel
      ilsToUsd: ilsToUsd?.value ?? null,
      israeliKeyRate: israeliKeyRate?.value ?? null,
      israeliCpi: israeliCpi?.value ?? null,
      // UK
      gbpToUsd: gbpToUsd?.value ?? null,
      boeRate: boeRate?.value ?? null,
      ukCpi: ukCpi?.value ?? null,
      // Eurozone
      eurToUsd: eurToUsd?.value ?? null,
      ecbRate: ecbRate?.value ?? null,
      // Canada
      cadToUsd: cadToUsd?.value ?? null,
      bocRate: bocRate?.value ?? null,
      // Australia
      audToUsd: audToUsd?.value ?? null,
      rbaRate: rbaRate?.value ?? null,
      asOf: new Date().toISOString(),
    };
  });
}

export async function searchAssets(query: string): Promise<Array<{ id: AssetId; symbol: string; name: string; exchange: string; type?: string }>> {
  if (!query || query.length < 1) return [];
  const localResults = searchLocalStocks(query);
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

// ─── International popular stocks (for fast local search) ────────────────────

const INTL_STOCKS: Array<{ id: AssetId; symbol: string; name: string; exchange: string }> = [
  // 🇬🇧 UK — LSE
  { id: 'LSE:SHEL'  as AssetId, symbol: 'SHEL',  name: 'Shell',                exchange: 'LSE' },
  { id: 'LSE:HSBA'  as AssetId, symbol: 'HSBA',  name: 'HSBC Holdings',        exchange: 'LSE' },
  { id: 'LSE:BP'    as AssetId, symbol: 'BP',     name: 'BP',                   exchange: 'LSE' },
  { id: 'LSE:AZN'   as AssetId, symbol: 'AZN',   name: 'AstraZeneca',          exchange: 'LSE' },
  { id: 'LSE:ULVR'  as AssetId, symbol: 'ULVR',  name: 'Unilever',             exchange: 'LSE' },
  { id: 'LSE:GSK'   as AssetId, symbol: 'GSK',   name: 'GSK',                  exchange: 'LSE' },
  { id: 'LSE:RIO'   as AssetId, symbol: 'RIO',   name: 'Rio Tinto',            exchange: 'LSE' },
  { id: 'LSE:BARC'  as AssetId, symbol: 'BARC',  name: 'Barclays',             exchange: 'LSE' },
  { id: 'LSE:LLOY'  as AssetId, symbol: 'LLOY',  name: 'Lloyds Banking Group', exchange: 'LSE' },
  { id: 'LSE:VOD'   as AssetId, symbol: 'VOD',   name: 'Vodafone',             exchange: 'LSE' },
  // 🇩🇪 Germany — XETRA
  { id: 'XETRA:SAP'  as AssetId, symbol: 'SAP',  name: 'SAP',                  exchange: 'XETRA' },
  { id: 'XETRA:SIE'  as AssetId, symbol: 'SIE',  name: 'Siemens',              exchange: 'XETRA' },
  { id: 'XETRA:BMW'  as AssetId, symbol: 'BMW',  name: 'BMW',                  exchange: 'XETRA' },
  { id: 'XETRA:BAYN' as AssetId, symbol: 'BAYN', name: 'Bayer',                exchange: 'XETRA' },
  { id: 'XETRA:DBK'  as AssetId, symbol: 'DBK',  name: 'Deutsche Bank',        exchange: 'XETRA' },
  { id: 'XETRA:DTE'  as AssetId, symbol: 'DTE',  name: 'Deutsche Telekom',     exchange: 'XETRA' },
  { id: 'XETRA:VOW3' as AssetId, symbol: 'VOW3', name: 'Volkswagen',           exchange: 'XETRA' },
  { id: 'XETRA:ADS'  as AssetId, symbol: 'ADS',  name: 'Adidas',               exchange: 'XETRA' },
  { id: 'XETRA:ALV'  as AssetId, symbol: 'ALV',  name: 'Allianz',              exchange: 'XETRA' },
  // 🇫🇷 France — Euronext Paris
  { id: 'EPA:MC'   as AssetId, symbol: 'MC',   name: 'LVMH',                   exchange: 'EPA' },
  { id: 'EPA:OR'   as AssetId, symbol: 'OR',   name: "L'Oréal",               exchange: 'EPA' },
  { id: 'EPA:SAN'  as AssetId, symbol: 'SAN',  name: 'Sanofi',                 exchange: 'EPA' },
  { id: 'EPA:AIR'  as AssetId, symbol: 'AIR',  name: 'Airbus',                 exchange: 'EPA' },
  { id: 'EPA:BNP'  as AssetId, symbol: 'BNP',  name: 'BNP Paribas',            exchange: 'EPA' },
  { id: 'EPA:TTE'  as AssetId, symbol: 'TTE',  name: 'TotalEnergies',          exchange: 'EPA' },
  { id: 'EPA:KER'  as AssetId, symbol: 'KER',  name: 'Kering',                 exchange: 'EPA' },
  { id: 'EPA:CAP'  as AssetId, symbol: 'CAP',  name: 'Capgemini',              exchange: 'EPA' },
  // 🇨🇦 Canada — TSX
  { id: 'TSX:RY'  as AssetId, symbol: 'RY',  name: 'Royal Bank of Canada',     exchange: 'TSX' },
  { id: 'TSX:TD'  as AssetId, symbol: 'TD',  name: 'TD Bank',                  exchange: 'TSX' },
  { id: 'TSX:BNS' as AssetId, symbol: 'BNS', name: 'Bank of Nova Scotia',      exchange: 'TSX' },
  { id: 'TSX:CNR' as AssetId, symbol: 'CNR', name: 'Canadian National Railway', exchange: 'TSX' },
  { id: 'TSX:SU'  as AssetId, symbol: 'SU',  name: 'Suncor Energy',            exchange: 'TSX' },
  { id: 'TSX:SHOP' as AssetId, symbol: 'SHOP', name: 'Shopify',                exchange: 'TSX' },
  { id: 'TSX:ENB' as AssetId, symbol: 'ENB', name: 'Enbridge',                 exchange: 'TSX' },
  // 🇦🇺 Australia — ASX
  { id: 'ASX:BHP' as AssetId, symbol: 'BHP', name: 'BHP Group',                exchange: 'ASX' },
  { id: 'ASX:CBA' as AssetId, symbol: 'CBA', name: 'Commonwealth Bank',        exchange: 'ASX' },
  { id: 'ASX:CSL' as AssetId, symbol: 'CSL', name: 'CSL Limited',              exchange: 'ASX' },
  { id: 'ASX:NAB' as AssetId, symbol: 'NAB', name: 'National Australia Bank',  exchange: 'ASX' },
  { id: 'ASX:WBC' as AssetId, symbol: 'WBC', name: 'Westpac Banking',          exchange: 'ASX' },
  { id: 'ASX:RIO' as AssetId, symbol: 'RIO', name: 'Rio Tinto (ASX)',          exchange: 'ASX' },
  { id: 'ASX:ANZ' as AssetId, symbol: 'ANZ', name: 'ANZ Banking Group',        exchange: 'ASX' },
];

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

function searchLocalStocks(q: string): Array<{ id: AssetId; symbol: string; name: string; exchange: string }> {
  const lower = q.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);

  const israeliMatches = ISRAELI_STOCKS
    .filter((s) => {
      if (s.symbol.toLowerCase() === lower) return true;
      if (s.symbol.toLowerCase().startsWith(lower)) return true;
      if (words.every((w) => s.nameHe.includes(w))) return true;
      if (words.every((w) => s.name.toLowerCase().includes(w))) return true;
      return false;
    })
    .map(({ id, symbol, name, exchange }) => ({ id, symbol, name, exchange }));

  const intlMatches = INTL_STOCKS
    .filter((s) => {
      if (s.symbol.toLowerCase() === lower) return true;
      if (s.symbol.toLowerCase().startsWith(lower)) return true;
      if (words.every((w) => s.name.toLowerCase().includes(w))) return true;
      return false;
    });

  return [...israeliMatches, ...intlMatches];
}

/** @deprecated Use searchLocalStocks */
function searchIsraeliStocks(q: string) { return searchLocalStocks(q); }
