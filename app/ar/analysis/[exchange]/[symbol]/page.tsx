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
  const analysis = await getSeoAnalysis(assetId, 'ar').catch(() => null);
  const known = findSeoStock(exchange, symbol);
  const name = analysis?.name ?? known?.name ?? symbol.toUpperCase();

  const title = analysis?.metaTitle ?? `تحليل سهم ${symbol.toUpperCase()} — ${name}`;
  const description =
    analysis?.metaDescription ??
    `تحليل بالذكاء الاصطناعي لـ ${name} (${symbol.toUpperCase()}): نظرة عامة، السيناريو الصاعد والهابط، التقييم وأسئلة رئيسية للمستثمر.`;
  const path = `/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/ar${path}`,
      languages: { en: `${BASE_URL}${path}`, fr: `${BASE_URL}/fr${path}`, ar: `${BASE_URL}/ar${path}` },
    },
    openGraph: { title, description, url: `${BASE_URL}/ar${path}`, siteName: 'StockSage', type: 'article', locale: 'ar_AR' },
  };
}

export default async function ArabicAnalysisPage({ params }: { params: Promise<Params> }) {
  const { exchange, symbol } = await params;
  const assetId = toAssetId(exchange, symbol);

  const [analysis, quote] = await Promise.all([
    getSeoAnalysis(assetId, 'ar').catch(() => null),
    getQuote(assetId).catch(() => null),
  ]);

  if (!analysis) notFound();

  return <AnalysisArticle analysis={analysis} quote={quote} lang="ar" />;
}
