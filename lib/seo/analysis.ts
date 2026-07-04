/**
 * SEO analysis generator + cache.
 *
 * Produces a compact, search-optimized analysis for a stock and caches it in
 * Firestore (`seo_analyses` collection). Pages read the cache; if it's missing
 * or stale they regenerate on-demand (one cheap Claude call, grounded in real
 * quote/financials data). A cron endpoint warms/refreshes the whole universe.
 *
 * This is intentionally NOT the heavy 6-step research pipeline — it's a single
 * grounded call tuned for a public landing page (meta tags + FAQ for rich
 * results). The full pipeline stays behind the product signup.
 */

import { z } from 'zod';
import { callClaude } from '@/lib/ai/client';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAssetData, getQuote, getFinancials } from '@/lib/data/orchestrator';
import { parseAssetId } from '@/lib/data/asset-id';
import type { AssetId } from '@/lib/data/types';

const COLLECTION = 'seo_analyses';
const STALE_DAYS = 7;

const FaqSchema = z.object({
  q: z.string(),
  a: z.string(),
});

export const SeoAnalysisSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  intro: z.string(),
  businessSummary: z.string(),
  bullPoints: z.array(z.string()),
  bearPoints: z.array(z.string()),
  financialSnapshot: z.string(),
  verdict: z.string(),
  faq: z.array(FaqSchema),
});

export type SeoAnalysisContent = z.infer<typeof SeoAnalysisSchema>;

export interface SeoAnalysis extends SeoAnalysisContent {
  assetId: string;
  symbol: string;
  name: string;
  exchange: string;
  generatedAt: string;
}

export type SeoLang = 'en' | 'he';

function docId(assetId: string, lang: SeoLang): string {
  return `${assetId.replace(':', '_')}${lang === 'he' ? '__he' : ''}`;
}

function isStale(generatedAt?: string): boolean {
  if (!generatedAt) return true;
  const age = Date.now() - new Date(generatedAt).getTime();
  return age > STALE_DAYS * 24 * 60 * 60 * 1000;
}

const SYSTEM = `You are a financial writer creating a public, SEO-optimized stock analysis page. You write clear, factual, genuinely useful analysis for retail investors searching Google. You NEVER give buy/sell recommendations — you frame considerations neutrally. Every claim must be supportable from the data provided or well-known public facts. Output a single valid JSON object, no markdown, no prose outside the JSON.`;

function buildPrompt(params: {
  name: string;
  symbol: string;
  exchange: string;
  description: string;
  industry: string;
  sector: string;
  priceLine: string;
  ratiosJson: string;
  lang: SeoLang;
}): string {
  const langNote = params.lang === 'he'
    ? `\n\nCRITICAL — LANGUAGE: Write ALL text VALUES in Hebrew (עברית), including metaTitle and metaDescription and every FAQ question and answer. Keep JSON field NAMES in English. metaTitle should include the ticker and the words "ניתוח מניית" (e.g. "ניתוח מניית ${params.symbol}: תרחיש שורי ודובי 2026"). Write for Hebrew-speaking Israeli retail investors.`
    : '';
  const titleExample = params.lang === 'he'
    ? `"ניתוח מניית ${params.symbol}" style, under 60 chars`
    : `under 60 chars, include the ticker and the word "Analysis" (e.g. "AAPL Stock Analysis 2026: Bull & Bear Case")`;

  return `Write an SEO stock-analysis page for ${params.name} (${params.symbol}, ${params.exchange}).

GROUNDING DATA:
- Business: ${params.description || 'n/a'}
- Industry / sector: ${params.industry} / ${params.sector}
- Market data: ${params.priceLine}
- Key ratios: ${params.ratiosJson}

Return a JSON object with EXACTLY these fields:
- "metaTitle": SEO page title, ${titleExample}.
- "metaDescription": meta description, 140-160 chars, compelling, includes the company name and ticker.
- "intro": 2-3 sentence opening paragraph answering "what is this company and why do people research it".
- "businessSummary": one paragraph (3-4 sentences) on the business model and how it makes money.
- "bullPoints": array of 3-5 specific, concrete points a long investor would find compelling. Each a full sentence.
- "bearPoints": array of 3-5 specific risks/concerns. Each a full sentence.
- "financialSnapshot": one paragraph interpreting the valuation and financial health using the ratios above. Reference actual numbers where available.
- "verdict": one balanced paragraph (3-4 sentences) framing the core tension. NOT a recommendation — use "considerations", "factors to weigh", "what to monitor".
- "faq": array of 4-6 {"q","a"} pairs answering the questions people actually Google (e.g. "Is ${params.symbol} a good stock to research?", "What does ${params.name} do?", "Is ${params.symbol} overvalued?"). Answers 1-3 sentences, neutral, no buy/sell advice.

Never use the words "buy", "sell", "should invest", "recommend" (or their Hebrew equivalents). Return ONLY the JSON object.${langNote}`;
}

/** Generate a fresh analysis (grounded in live data) and cache it. */
export async function generateSeoAnalysis(assetId: AssetId, lang: SeoLang = 'en'): Promise<SeoAnalysis | null> {
  let name = assetId, symbol = assetId, exchange = '';
  try {
    const parsed = parseAssetId(assetId);
    symbol = parsed.symbol;
    exchange = parsed.exchange;
  } catch {
    return null;
  }

  // Grounding data — all best-effort; the page is still valuable if some fail.
  const [assetR, quoteR, finR] = await Promise.allSettled([
    getAssetData(assetId),
    getQuote(assetId),
    getFinancials(assetId).catch(() => null),
  ]);

  const asset = assetR.status === 'fulfilled' ? assetR.value : null;
  const quote = quoteR.status === 'fulfilled' ? quoteR.value : null;
  const fin = finR.status === 'fulfilled' ? finR.value : null;
  if (asset?.name) name = asset.name;

  const priceLine = quote
    ? `price ${quote.price} ${quote.currency ?? ''}, ${quote.changePercent != null ? `${quote.changePercent.toFixed(2)}% 1-day` : 'n/a'}`
    : 'unavailable';

  const ratios = fin?.ratios ?? {};

  let content: SeoAnalysisContent;
  try {
    const result = await callClaude({
      model: 'claude-haiku-4-5',
      systemPrompt: SYSTEM,
      prompt: buildPrompt({
        name,
        symbol,
        exchange,
        description: asset?.description?.slice(0, 1200) ?? '',
        industry: asset?.industry ?? 'unknown',
        sector: asset?.sector ?? 'unknown',
        priceLine,
        ratiosJson: JSON.stringify(ratios),
        lang,
      }),
      schema: SeoAnalysisSchema,
      maxTokens: 3000,
      temperature: 0.4,
    });
    content = result.data;
  } catch (e) {
    console.error('[seo/analysis] generation failed', assetId, String(e));
    return null;
  }

  const analysis: SeoAnalysis = {
    ...content,
    assetId,
    symbol,
    name,
    exchange,
    generatedAt: new Date().toISOString(),
  };

  try {
    await getAdminDb().collection(COLLECTION).doc(docId(assetId, lang)).set(analysis);
  } catch (e) {
    console.error('[seo/analysis] cache write failed', assetId, String(e));
  }

  return analysis;
}

/** Read cached analysis; regenerate if missing or stale. */
export async function getSeoAnalysis(assetId: AssetId, lang: SeoLang = 'en'): Promise<SeoAnalysis | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(docId(assetId, lang)).get();
    if (snap.exists) {
      const data = snap.data() as SeoAnalysis;
      if (!isStale(data.generatedAt)) return data;
    }
  } catch (e) {
    console.error('[seo/analysis] cache read failed', assetId, String(e));
  }
  return generateSeoAnalysis(assetId, lang);
}

/** Read cache only — no generation. Returns null on miss. Used by cron to skip fresh ones. */
export async function peekSeoAnalysis(assetId: AssetId, lang: SeoLang = 'en'): Promise<SeoAnalysis | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(docId(assetId, lang)).get();
    if (snap.exists) return snap.data() as SeoAnalysis;
  } catch { /* ignore */ }
  return null;
}

export { isStale as isSeoAnalysisStale };
