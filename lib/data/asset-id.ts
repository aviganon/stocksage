import { AssetId, Exchange } from './types';

const VALID_EXCHANGES: Exchange[] = ['NASDAQ', 'NYSE', 'TASE', 'AMEX', 'CRYPTO', 'GOV'];

export interface ParsedAssetId {
  exchange: Exchange;
  symbol: string;
}

/**
 * Parse a canonical asset id like "TASE:EPIT" into its parts.
 * Throws if format is invalid or exchange is unknown.
 */
export function parseAssetId(assetId: AssetId): ParsedAssetId {
  if (!assetId || typeof assetId !== 'string') {
    throw new Error(`Invalid asset id: ${assetId}`);
  }
  const parts = assetId.split(':');
  if (parts.length !== 2) {
    throw new Error(
      `Invalid asset id format: "${assetId}". Expected "EXCHANGE:SYMBOL".`,
    );
  }
  const [exchangePart, symbol] = parts;
  if (!exchangePart || !symbol) {
    throw new Error(`Invalid asset id parts: "${assetId}".`);
  }
  const exchange = exchangePart.toUpperCase() as Exchange;
  if (!VALID_EXCHANGES.includes(exchange)) {
    throw new Error(
      `Unknown exchange: "${exchangePart}". Valid: ${VALID_EXCHANGES.join(', ')}.`,
    );
  }
  return { exchange, symbol };
}

/**
 * Build a canonical asset id from parts.
 */
export function buildAssetId(exchange: Exchange, symbol: string): AssetId {
  return `${exchange}:${symbol}`;
}

/**
 * Best-effort guess of asset type from exchange.
 */
export function inferAssetType(
  exchange: Exchange,
): 'stock' | 'etf' | 'crypto' | 'bond' {
  if (exchange === 'CRYPTO') return 'crypto';
  if (exchange === 'GOV') return 'bond';
  // NOTE: distinguishing stock vs etf requires source data
  return 'stock';
}

/**
 * Convert internal symbol form to Yahoo's format.
 * TASE stocks need .TA suffix.
 */
export function toYahooSymbol(exchange: Exchange, symbol: string): string {
  if (exchange === 'TASE') return `${symbol}.TA`;
  return symbol;
}

/**
 * Convert Yahoo's symbol form back to ours.
 */
export function fromYahooSymbol(yahooSymbol: string): {
  exchange: Exchange;
  symbol: string;
} {
  if (yahooSymbol.endsWith('.TA')) {
    return { exchange: 'TASE', symbol: yahooSymbol.slice(0, -3) };
  }
  // Default to NASDAQ; the source layer can refine based on exchangeName field
  return { exchange: 'NASDAQ', symbol: yahooSymbol };
}
