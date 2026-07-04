import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSeoAnalysis } from '@/lib/seo/analysis';
import { getQuote } from '@/lib/data/orchestrator';
import { findSeoStock } from '@/lib/seo/universe';
import { AnalysisArticle } from '@/components/analysis/analysis-article';
import type { AssetId } from '@/lib/data/types';

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
  const analysis = await getSeoAnalysis(assetId, 'en').catch(() => null);
  const known = findSeoStock(exchange, symbol);
  const name = analysis?.name ?? known?.name ?? symbol.toUpperCase();

  const title = analysis?.metaTitle ?? `${symbol.toUpperCase()} Stock Analysis — ${name}`;
  const description =
    analysis?.metaDescription ??
    `AI-powered analysis of ${name} (${symbol.toUpperCase()}): business overview, bull and bear case, valuation and key questions for investors.`;
  const path = `/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: { title, description, url: `${BASE_URL}${path}`, siteName: 'StockSage', type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AnalysisPage({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);

  const [analysis, quote] = await Promise.all([
    getSeoAnalysis(assetId, 'en').catch(() => null),
    getQuote(assetId).catch(() => null),
  ]);

  if (!analysis) notFound();

  return <AnalysisArticle analysis={analysis} quote={quote} lang="en" />;
}
