import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeoAnalysis } from '@/lib/seo/analysis';
import { getQuote } from '@/lib/data/orchestrator';
import { findSeoStock } from '@/lib/seo/universe';
import { AnalysisArticle } from '@/components/analysis/analysis-article';
import type { AssetId } from '@/lib/data/types';

// Hebrew analysis pages — the uncontested niche (no competitor offers Hebrew
// TASE coverage). Same ISR strategy; a separate Hebrew analysis is cached.
export const revalidate = 86400;
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

type Params = { exchange: string; symbol: string };

function toAssetId(exchange: string, symbol: string): AssetId {
  return `${exchange.toUpperCase()}:${symbol.toUpperCase()}` as AssetId;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);
  const analysis = await getSeoAnalysis(assetId, 'he').catch(() => null);
  const known = findSeoStock(exchange, symbol);
  const name = analysis?.name ?? known?.name ?? symbol.toUpperCase();

  const title = analysis?.metaTitle ?? `ניתוח מניית ${symbol.toUpperCase()} — ${name}`;
  const description =
    analysis?.metaDescription ??
    `ניתוח AI של ${name} (${symbol.toUpperCase()}): סקירת עסק, תרחיש שורי ודובי, הערכת שווי ושאלות מפתח למשקיע.`;
  const path = `/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/he${path}`,
      languages: { en: `${BASE_URL}${path}`, he: `${BASE_URL}/he${path}` },
    },
    openGraph: { title, description, url: `${BASE_URL}/he${path}`, siteName: 'StockSage', type: 'article', locale: 'he_IL' },
  };
}

export default async function HebrewAnalysisPage({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);

  const [analysis, quote] = await Promise.all([
    getSeoAnalysis(assetId, 'he').catch(() => null),
    getQuote(assetId).catch(() => null),
  ]);

  if (!analysis) notFound();

  return <AnalysisArticle analysis={analysis} quote={quote} lang="he" />;
}
