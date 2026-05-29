/**
 * Research pipeline orchestrator — 6-step AI analysis.
 * Adapted from genesis-node for stocksage.
 *
 *   1. Profile  2. Financials  3. Events  4. Competitive  5. Risks  6. Synthesis
 *
 * quick:    steps 1+2+6 sequential  (~$0.03)
 * standard: steps 1-5 parallel, then 6  (~$0.12)
 */

import { randomUUID } from 'crypto';
import type { AssetId, Exchange } from '@/lib/data/types';
import { getAssetData, getQuote, getFinancials, getNews, getHistorical, getMacroSnapshot } from '@/lib/data/orchestrator';
import * as taseMaya from '@/lib/data/sources/tase-maya';
import * as secEdgar from '@/lib/data/sources/sec-edgar';
import * as yahoo from '@/lib/data/sources/yahoo';
import * as israeliNews from '@/lib/data/sources/israeli-news';
import { toYahooSymbol } from '@/lib/data/asset-id';
import { callClaude, type ClaudeModel } from './client';
import {
  ProfileSchema, FinancialsSchema, EventsSchema, CompetitiveSchema, RisksSchema, SynthesisSchema,
  type Profile, type ResearchReportData,
} from './schemas/research';
import { buildProfilePrompt, PROFILE_SYSTEM } from './prompts/research/01-profile';
import { buildFinancialsPrompt, FINANCIALS_SYSTEM } from './prompts/research/02-financials';
import { buildEventsPrompt, EVENTS_SYSTEM } from './prompts/research/03-events';
import { buildCompetitivePrompt, COMPETITIVE_SYSTEM } from './prompts/research/04-competitive';
import { buildRisksPrompt, RISKS_SYSTEM } from './prompts/research/05-risks';
import { buildSynthesisPrompt, SYNTHESIS_SYSTEM } from './prompts/research/06-synthesis';
import { ResearchReportsRepository, type ReportDepth, type ReportStep } from '@/lib/storage/research-reports';

// ─── Model selection ──────────────────────────────────────────────────────────

// Model strategy:
// quick    → Haiku everywhere (fast)
// standard → Sonnet for events + risks (quality on news-heavy steps), Haiku elsewhere
// deep     → Sonnet for events, risks, synthesis (maximum quality)
function modelForStep(depth: ReportDepth, stepId: string): ClaudeModel {
  if (stepId === 'events' || stepId === 'risks') {
    return depth === 'quick' ? 'claude-haiku-4-5' : 'claude-sonnet-4-6';
  }
  if (stepId === 'synthesis' && depth === 'deep') return 'claude-sonnet-4-6';
  return 'claude-haiku-4-5';
}

const STEPS_BY_DEPTH: Record<ReportDepth, string[]> = {
  quick:    ['data_collection', 'profile', 'financials', 'synthesis'],
  standard: ['data_collection', 'profile', 'financials', 'events', 'competitive', 'risks', 'synthesis'],
  deep:     ['data_collection', 'profile', 'financials', 'events', 'competitive', 'risks', 'synthesis'],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PipelineOptions {
  uid: string;
  depth: ReportDepth;
  language?: 'he' | 'en';
  onStepUpdate?: (step: string, status: string, data?: unknown) => Promise<void>;
  reportId?: string;
}

interface PipelineContext {
  assetId: AssetId;
  assetName: string;
  asset: Awaited<ReturnType<typeof getAssetData>>;
  financials: Awaited<ReturnType<typeof getFinancials>> | null;
  news: Awaited<ReturnType<typeof getNews>>;
  historical: Awaited<ReturnType<typeof getHistorical>>;
  macro: Awaited<ReturnType<typeof getMacroSnapshot>>;
  filings: unknown[];
  quote: Awaited<ReturnType<typeof getQuote>> | null;
  language: 'he' | 'en';
  hebrewName?: string;
  analystData: Awaited<ReturnType<typeof yahoo.fetchAnalystData>> | null;
  insiderTrades: unknown[];
}

// ─── Schema hint ──────────────────────────────────────────────────────────────

function schemaHint(schema: unknown): string {
  try {
    const s = schema as { shape?: Record<string, unknown> };
    if (!s?.shape) return '(return valid JSON matching the required fields)';
    const parts: string[] = [];
    for (const [field, def] of Object.entries(s.shape)) {
      const typeDef = (def as { _def?: Record<string, unknown> })?._def;
      const typeName = String(typeDef?.['typeName'] ?? '');
      const values = typeDef?.['values'];
      if ((typeName === 'ZodEnum' || typeName.includes('Enum')) && Array.isArray(values)) {
        parts.push(`${field}: one of ${values.map((v) => `"${v}"`).join(' | ')}`);
      } else {
        parts.push(field);
      }
    }
    return `Return a JSON object with these required fields:\n${parts.map((p) => `  - ${p}`).join('\n')}`;
  } catch { return '(return valid JSON matching the required fields)'; }
}

// ─── Data collection ──────────────────────────────────────────────────────────

async function collectData(assetId: AssetId, depth: ReportDepth, language: 'he' | 'en' = 'en'): Promise<PipelineContext> {
  const [asset, quote] = await Promise.all([
    getAssetData(assetId),
    getQuote(assetId).catch(() => null),
  ]);

  const assetName = asset.name;
  const isStock = asset.type === 'stock' || asset.type === 'etf';
  const isTase = asset.exchange === 'TASE';

  let hebrewName: string | undefined;
  if (isTase) {
    try {
      const company = await taseMaya.getTaseCompanyByTicker(asset.symbol);
      if (company && typeof company === 'object' && 'hebrewName' in company) {
        hebrewName = (company as { hebrewName?: string }).hebrewName;
      }
    } catch { /* best-effort */ }
  }

  const [financials, news, newsHe, historical, macro, filings, analystResult, insiderResult, isrNewsResult] = await Promise.allSettled([
    isStock ? getFinancials(assetId) : Promise.reject(new Error('not a stock')),
    getNews(assetId, { language: 'en', limit: 20 }),
    isTase && language === 'he' ? getNews(assetId, { language: 'he', limit: 15 }) : Promise.resolve([]),
    getHistorical(assetId, depth === 'quick' ? '3mo' : '1y'),
    getMacroSnapshot(),
    isTase
      ? taseMaya.fetchRecentFilings(asset.symbol)
      : secEdgar.fetchRecentFilings(asset.symbol).catch(() => []),
    isStock && asset.exchange !== 'CRYPTO'
      ? yahoo.fetchAnalystData(toYahooSymbol(asset.exchange as Exchange, asset.symbol)).catch(() => null)
      : Promise.resolve(null),
    isStock && asset.exchange !== 'TASE' && asset.exchange !== 'CRYPTO'
      ? secEdgar.fetchInsiderTrades(asset.symbol).catch(() => [])
      : Promise.resolve([]),
    isTase
      ? israeliNews.fetchIsraeliNews([asset.symbol, asset.name, ...(hebrewName ? [hebrewName] : [])]).catch(() => [])
      : Promise.resolve([]),
  ]);

  const newsEn = news.status === 'fulfilled' ? news.value : [];
  const newsHeArr = newsHe.status === 'fulfilled' ? newsHe.value : [];
  const newsIsraeli = isrNewsResult.status === 'fulfilled' ? isrNewsResult.value : [];
  const mergedNews = [...newsEn, ...newsHeArr, ...newsIsraeli].filter((item, idx, arr) =>
    arr.findIndex((a) => a.title === item.title) === idx,
  );

  return {
    assetId, assetName, asset,
    financials: financials.status === 'fulfilled' ? financials.value : null,
    news: mergedNews,
    historical: historical.status === 'fulfilled' ? historical.value : [],
    macro: macro.status === 'fulfilled' ? macro.value : { treasury10y: null, fedFundsRate: null, cpi: null, unemployment: null, ilsToUsd: null, israeliKeyRate: null, israeliCpi: null, gbpToUsd: null, boeRate: null, ukCpi: null, eurToUsd: null, ecbRate: null, cadToUsd: null, bocRate: null, audToUsd: null, rbaRate: null, asOf: new Date().toISOString() },
    filings: filings.status === 'fulfilled' ? (filings.value as unknown[]) : [],
    quote,
    language,
    hebrewName,
    analystData: analystResult.status === 'fulfilled' ? analystResult.value : null,
    insiderTrades: insiderResult.status === 'fulfilled' ? (insiderResult.value as unknown[]) : [],
  };
}

// ─── Individual step runners ──────────────────────────────────────────────────

async function runProfile(ctx: PipelineContext, model: ClaudeModel) {
  return callClaude({
    model,
    systemPrompt: PROFILE_SYSTEM,
    prompt: buildProfilePrompt({
      assetName: ctx.hebrewName ? `${ctx.assetName} (${ctx.hebrewName})` : ctx.assetName,
      assetId: ctx.assetId,
      unifiedAssetJson: JSON.stringify({ name: ctx.asset.name, symbol: ctx.asset.symbol, exchange: ctx.asset.exchange, type: ctx.asset.type, description: ctx.asset.description, industry: ctx.asset.industry, sector: ctx.asset.sector, metadata: ctx.asset.metadata }, null, 2),
      yahooDescriptionOrNull: ctx.asset.description ?? 'null',
      hebrewName: ctx.hebrewName,
      isTase: ctx.asset.exchange === 'TASE',
      insiderTradesJson: ctx.insiderTrades.length > 0 ? JSON.stringify(ctx.insiderTrades.slice(0, 10), null, 2) : 'none',
      zodSchema: schemaHint(ProfileSchema),
      language: ctx.language,
    }),
    schema: ProfileSchema,
    maxTokens: 4000,
  });
}

async function runFinancials(ctx: PipelineContext, model: ClaudeModel) {
  const fin = ctx.financials;
  const priceHistory = ctx.historical.slice(-20).map((h) => ({ date: h.date, close: h.close }));
  return callClaude({
    model,
    systemPrompt: FINANCIALS_SYSTEM,
    prompt: buildFinancialsPrompt({
      assetName: ctx.assetName,
      assetId: ctx.assetId,
      incomeJson: JSON.stringify(fin?.income?.slice(0, 8) ?? [], null, 2),
      balanceJson: JSON.stringify(fin?.balance?.slice(0, 4) ?? [], null, 2),
      cashflowJson: JSON.stringify(fin?.cashflow?.slice(0, 4) ?? [], null, 2),
      ratiosJson: JSON.stringify(fin?.ratios ?? {}, null, 2),
      marketCap: String(fin?.marketCap ?? ctx.asset.metadata?.marketCap ?? 'unknown'),
      sharesOutstanding: String(fin?.sharesOutstanding ?? ctx.asset.metadata?.sharesOutstanding ?? 'unknown'),
      macroSnapshotJson: JSON.stringify(ctx.macro, null, 2),
      priceHistoryJson: JSON.stringify(priceHistory, null, 2),
      currentQuoteJson: ctx.quote ? JSON.stringify({ price: ctx.quote.price, change1d: ctx.quote.changePercent, volume: ctx.quote.volume, high: ctx.quote.high, low: ctx.quote.low, currency: ctx.quote.currency, marketState: ctx.quote.marketState }) : 'null',
      analystJson: ctx.analystData ? JSON.stringify(ctx.analystData, null, 2) : undefined,
      zodSchema: schemaHint(FinancialsSchema),
      language: ctx.language,
    }),
    schema: FinancialsSchema,
    maxTokens: 4000,
  });
}

async function runEvents(ctx: PipelineContext, model: ClaudeModel) {
  return callClaude({
    model,
    systemPrompt: EVENTS_SYSTEM,
    prompt: buildEventsPrompt({
      assetName: ctx.hebrewName ? `${ctx.assetName} (${ctx.hebrewName})` : ctx.assetName,
      assetId: ctx.assetId,
      newsJson: JSON.stringify(ctx.news.slice(0, 30), null, 2),
      filingsJson: JSON.stringify(ctx.filings.slice(0, 15), null, 2),
      corporateActionsJson: '[]',
      isTase: ctx.asset.exchange === 'TASE',
      hebrewName: ctx.hebrewName,
      zodSchema: schemaHint(EventsSchema),
      language: ctx.language,
    }),
    schema: EventsSchema,
    maxTokens: 10000,
  });
}

async function runCompetitive(ctx: PipelineContext, profile: Profile | null, model: ClaudeModel) {
  return callClaude({
    model,
    systemPrompt: COMPETITIVE_SYSTEM,
    prompt: buildCompetitivePrompt({
      assetName: ctx.assetName,
      assetId: ctx.assetId,
      industry: ctx.asset.industry ?? profile?.keyProducts?.join(', ') ?? 'unknown',
      sector: ctx.asset.sector ?? 'unknown',
      yahooPeers: '[]',
      analystJson: ctx.analystData ? JSON.stringify(ctx.analystData, null, 2) : 'null',
      oneLineSummary: profile?.oneLineSummary ?? ctx.asset.description?.slice(0, 200) ?? ctx.assetName,
      revenueStreams: profile?.revenueStreams?.map((r) => r.name).join(', ') ?? '',
      zodSchema: schemaHint(CompetitiveSchema),
      language: ctx.language,
    }),
    schema: CompetitiveSchema,
    maxTokens: 3500,
    webSearch: true,
  });
}

async function runRisks(ctx: PipelineContext, sectionData: Partial<ResearchReportData>, model: ClaudeModel) {
  return callClaude({
    model,
    systemPrompt: RISKS_SYSTEM,
    prompt: buildRisksPrompt({
      assetName: ctx.assetName,
      assetId: ctx.assetId,
      profileJsonSummary: JSON.stringify(sectionData.profile ?? null),
      financialsJsonSummary: JSON.stringify(sectionData.financials ?? null),
      eventsJsonSummary: JSON.stringify(sectionData.events ?? null),
      competitiveJsonSummary: JSON.stringify(sectionData.competitive ?? null),
      avgDailyVolume: ctx.quote?.volume ?? null,
      zodSchema: schemaHint(RisksSchema),
      language: ctx.language,
    }),
    schema: RisksSchema,
    maxTokens: 10000,
  });
}

function compactForSynthesis(data: Partial<ResearchReportData>) {
  const p = data.profile;
  const f = data.financials;
  const e = data.events;
  const c = data.competitive;
  const r = data.risks;
  return {
    profileSummary: p ? JSON.stringify({
      oneLineSummary: p.oneLineSummary,
      revenueStreams: p.revenueStreams?.map((s) => s.name),
      keyProducts: p.keyProducts?.slice(0, 5),
    }) : 'failed',

    financialsSummary: f ? JSON.stringify({
      valuationVerdict: f.valuationVerdict,
      valuationReasoning: (f as Record<string, unknown>)['valuationReasoning'],
      healthVerdict: f.healthVerdict,
      healthReasoning: (f as Record<string, unknown>)['healthReasoning'],
      redFlags: f.redFlags?.slice(0, 5),
      greenFlags: f.greenFlags?.slice(0, 5),
      ratios: f.ratios,
    }) : 'failed',

    eventsSummary: e ? JSON.stringify({
      overallSentiment: e.overallSentiment,
      patternObservations: (e as Record<string, unknown>)['patternObservations'],
      upcomingEvents: (e as Record<string, unknown>)['upcomingEvents'],
      timeline: e.timeline?.filter((t) => t.importance === 'high').slice(0, 10).map((t) => ({
        date: t.date, title: t.title, sentiment: t.sentiment, description: t.description,
      })),
    }) : 'failed',

    competitiveSummary: c ? JSON.stringify({
      marketPosition: c.marketPosition,
      marketPositionReasoning: (c as Record<string, unknown>)['marketPositionReasoning'],
      ourMoats: c.ourMoats?.slice(0, 4),
      ourWeaknesses: (c as Record<string, unknown>)['ourWeaknesses'],
      tailwinds: c.tailwinds?.slice(0, 3),
      headwinds: c.headwinds?.slice(0, 3),
    }) : 'failed',

    risksSummary: r ? JSON.stringify({
      overallRiskRating: r.overallRiskRating,
      riskSummary: r.riskSummary,
      companySpecific: r.companySpecific?.slice(0, 5).map((x) => ({ title: x.title, severity: x.severity, description: x.description })),
      industryRisks: (r as Record<string, unknown>)['industryRisks'],
      macroRisks: (r as Record<string, unknown>)['macroRisks'],
    }) : 'failed',
  };
}

async function runSynthesis(ctx: PipelineContext, sectionData: Partial<ResearchReportData>, model: ClaudeModel) {
  const { profileSummary, financialsSummary, eventsSummary, competitiveSummary, risksSummary } = compactForSynthesis(sectionData);
  return callClaude({
    model,
    systemPrompt: SYNTHESIS_SYSTEM,
    prompt: buildSynthesisPrompt({
      assetName: ctx.assetName,
      assetId: ctx.assetId,
      profileJson: profileSummary,
      financialsJson: financialsSummary,
      eventsJson: eventsSummary,
      competitiveJson: competitiveSummary,
      risksJson: risksSummary,
      analystJson: ctx.analystData ? JSON.stringify(ctx.analystData, null, 2) : undefined,
      macroJson: ctx.macro ? JSON.stringify(ctx.macro, null, 2) : undefined,
      currentPrice: ctx.quote?.price ?? null,
      dataAsOf: new Date().toISOString().slice(0, 10),
      zodSchema: schemaHint(SynthesisSchema),
      language: ctx.language,
    }),
    schema: SynthesisSchema,
    maxTokens: 8000,
  });
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function runResearchPipeline(
  assetId: AssetId,
  options: PipelineOptions,
): Promise<{ reportId: string }> {
  const reportId = options.reportId ?? randomUUID();
  const repo = new ResearchReportsRepository();
  const steps = STEPS_BY_DEPTH[options.depth];
  const startTime = Date.now();

  const notify = async (step: string, status: string, data?: unknown) => {
    if (options.onStepUpdate) {
      try { await options.onStepUpdate(step, status, data); } catch { /* ignore */ }
    }
  };

  // 1. Resolve asset
  let asset: Awaited<ReturnType<typeof getAssetData>>;
  try {
    asset = await getAssetData(assetId);
  } catch (e) {
    throw new Error(`Cannot start research: asset not found for ${assetId}`);
  }

  // 2. Update/create report doc
  const updatePayload = {
    assetId, assetName: asset.name, status: 'running' as const,
    depth: options.depth, language: options.language ?? 'he',
    startedAt: new Date().toISOString(), costUSD: 0,
    steps: steps.map((s): ReportStep => ({ stepId: s, status: 'pending' })),
    data: {}, errors: [],
  };

  await repo.update(reportId, updatePayload).catch(() =>
    repo.create({ id: reportId, uid: options.uid, ...updatePayload }),
  );

  await notify('init', 'created', { reportId });

  // 3. Collect data
  await repo.updateStep(reportId, 'data_collection', { status: 'running', startedAt: new Date().toISOString() });
  await notify('data_collection', 'running');

  let ctx: PipelineContext;
  try {
    ctx = await collectData(assetId, options.depth, options.language ?? 'he');
    await repo.updateStep(reportId, 'data_collection', { status: 'completed', completedAt: new Date().toISOString() });
    await notify('data_collection', 'completed');
  } catch (e) {
    await repo.updateStep(reportId, 'data_collection', { status: 'failed', error: String(e) });
    await repo.update(reportId, { status: 'failed', errors: [String(e)] });
    await notify('data_collection', 'failed');
    throw e;
  }

  // 4. Run AI steps
  const sectionData: Partial<ResearchReportData> = {};
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const errors: string[] = [];

  async function runStep<T>(stepId: string, fn: () => Promise<{ data: T; costUSD: number; inputTokens: number; outputTokens: number }>): Promise<T | null> {
    if (!steps.includes(stepId)) return null;
    await repo.updateStep(reportId, stepId, { status: 'running', startedAt: new Date().toISOString() });
    await notify(stepId, 'running');
    try {
      const result = await fn();
      totalCost += result.costUSD;
      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;
      await repo.updateStep(reportId, stepId, { status: 'completed', completedAt: new Date().toISOString(), costUSD: result.costUSD });
      await repo.addCost(reportId, result.costUSD);
      await notify(stepId, 'completed', result.data);
      return result.data;
    } catch (e) {
      const msg = String(e);
      errors.push(`${stepId}: ${msg}`);
      await repo.updateStep(reportId, stepId, { status: 'failed', completedAt: new Date().toISOString(), error: msg });
      await notify(stepId, 'failed', { error: msg });
      console.error(`[research] Step failed: ${stepId}`, msg);
      return null;
    }
  }

  if (options.depth === 'quick') {
    sectionData.profile = await runStep('profile', () => runProfile(ctx, modelForStep(options.depth, 'profile')));
    sectionData.financials = await runStep('financials', () => runFinancials(ctx, modelForStep(options.depth, 'financials')));
    sectionData.synthesis = await runStep('synthesis', () => runSynthesis(ctx, sectionData, modelForStep(options.depth, 'synthesis')));
  } else {
    const [profileR, financialsR, eventsR] = await Promise.allSettled([
      runStep('profile', () => runProfile(ctx, modelForStep(options.depth, 'profile'))),
      runStep('financials', () => runFinancials(ctx, modelForStep(options.depth, 'financials'))),
      runStep('events', () => runEvents(ctx, modelForStep(options.depth, 'events'))),
    ]);
    sectionData.profile = profileR.status === 'fulfilled' ? profileR.value : null;
    sectionData.financials = financialsR.status === 'fulfilled' ? financialsR.value : null;
    sectionData.events = eventsR.status === 'fulfilled' ? eventsR.value : null;

    const [competitiveR, risksR] = await Promise.allSettled([
      runStep('competitive', () => runCompetitive(ctx, sectionData.profile ?? null, modelForStep(options.depth, 'competitive'))),
      runStep('risks', () => runRisks(ctx, sectionData, modelForStep(options.depth, 'risks'))),
    ]);
    sectionData.competitive = competitiveR.status === 'fulfilled' ? competitiveR.value : null;
    sectionData.risks = risksR.status === 'fulfilled' ? risksR.value : null;

    sectionData.synthesis = await runStep('synthesis', () => runSynthesis(ctx, sectionData, modelForStep(options.depth, 'synthesis')));
  }

  // 5. Finalize
  const allSucceeded = !errors.length;
  const anySucceeded = sectionData.synthesis != null;
  const finalStatus = allSucceeded ? 'completed' : anySucceeded ? 'partial' : 'failed';

  const priceHistory = ctx.historical.slice(-52).map((h) => ({ time: String(h.date).slice(0, 10), close: h.close }));

  await repo.update(reportId, {
    status: finalStatus,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    costUSD: totalCost,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    data: sectionData as ResearchReportData,
    errors,
    priceHistory,
    analystData: ctx.analystData ?? undefined,
  });

  await notify('done', finalStatus, { reportId, costUSD: totalCost });
  return { reportId };
}
