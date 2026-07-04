import { ImageResponse } from 'next/og';
import { getQuote } from '@/lib/data/orchestrator';
import { findSeoStock } from '@/lib/seo/universe';
import type { AssetId } from '@/lib/data/types';

export const alt = 'StockSage AI stock analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = { exchange: string; symbol: string };

export default async function Image({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const sym = symbol.toUpperCase();
  const ex = exchange.toUpperCase();

  const known = findSeoStock(exchange, symbol);
  const quote = await getQuote(`${ex}:${sym}` as AssetId).catch(() => null);

  const name = known?.name ?? sym;
  const up = (quote?.changePercent ?? 0) >= 0;
  const cur = quote?.currency === 'ILS' ? '₪' : quote?.currency === 'EUR' ? '€' : quote?.currency === 'GBP' ? '£' : '$';
  const priceStr = quote?.price != null ? `${cur}${quote.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : null;
  const changeStr = quote?.changePercent != null ? `${up ? '+' : ''}${quote.changePercent.toFixed(2)}%` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: '64px 72px',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #141021 60%, #1a1030 100%)',
          color: '#e8e8f0', fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700 }}>
            <span style={{ color: '#ffffff' }}>Stock</span>
            <span style={{ color: '#818cf8' }}>Sage</span>
          </div>
          <div style={{
            display: 'flex', fontSize: 24, color: '#a5b4fc',
            background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.3)',
            padding: '8px 20px', borderRadius: 999,
          }}>
            AI Stock Analysis
          </div>
        </div>

        {/* Center */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#8b8b9e', marginBottom: 12 }}>{ex}</div>
          <div style={{ display: 'flex', fontSize: 130, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{sym}</div>
          <div style={{ display: 'flex', fontSize: 44, color: '#c4c4d4', marginTop: 16 }}>{name}</div>
          {priceStr && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 28 }}>
              <span style={{ fontSize: 52, fontWeight: 700, color: '#ffffff' }}>{priceStr}</span>
              {changeStr && (
                <span style={{ fontSize: 36, fontWeight: 600, color: up ? '#4ade80' : '#f87171', marginLeft: 24 }}>{changeStr}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 26, color: '#8b8b9e' }}>
          <span style={{ display: 'flex' }}>Bull &amp; bear case · valuation · risks · FAQ</span>
          <span style={{ display: 'flex', color: '#a5b4fc' }}>stocksage.io</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
