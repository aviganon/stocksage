/**
 * Zod schemas for the 6 research pipeline sections.
 * Each schema validates the JSON output from the corresponding Claude prompt.
 *
 * BULLETPROOF MODE — every field is optional/nullable; arrays gracefully truncate
 * (never throw on overshoot); union+preprocess wrappers normalize loose shapes
 * (string vs array vs object) into the UI-expected structure.
 *
 * Design rules:
 *   1. NO hard `.max()` on arrays at validation level. Use `cappedArray(item, n)`
 *      which truncates instead of failing. Claude often returns 1–2 extra items.
 *   2. Every top-level object uses `.passthrough()` so unknown extra fields are
 *      preserved and never trigger a failure.
 *   3. Loose-shape fields (`bullCase`, `bearCase`, `balanceSheet`, `cashFlow`) are
 *      normalized via `z.preprocess` so the UI always receives the expected
 *      structure (or null).
 *   4. Enum fields use `z.union([z.enum(...), z.string()]).transform(...)` so any
 *      string is mapped to a known value (no validation failure on synonyms).
 */

import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────────────────────────────

const NullableStr = z.string().nullable().optional();
const NullableNum = z.number().nullable().optional();

// Accept string or number, always nullable+optional
const FlexNum = z.union([z.number(), z.string()]).nullable().optional();

/**
 * Permissive array: never fails on overshoot. Silently truncates to `max` items
 * (if specified). Null and undefined collapse to []. Items that fail validation
 * are filtered out instead of failing the whole array.
 */
function cappedArray<T extends z.ZodTypeAny>(item: T, max?: number) {
  return z
    .any()
    .nullable()
    .optional()
    .transform((v): Array<z.infer<T>> => {
      if (v == null) return [];
      if (!Array.isArray(v)) return [];
      const out: Array<z.infer<T>> = [];
      for (const raw of v) {
        const parsed = item.safeParse(raw);
        if (parsed.success) out.push(parsed.data);
        if (max != null && out.length >= max) break;
      }
      return out;
    });
}

// ─── Step 1: Profile ──────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  oneLineSummary: z.string().optional().nullable().default(''),
  fullDescription: z.string().optional().nullable().default(''),
  hebrewName: z.string().optional().nullable(),
  foundedYear: FlexNum,
  headquarters: z.string().optional().nullable(),
  employeeCount: FlexNum,
  listingInfo: z.object({
    exchange: z.string().optional().nullable().default(''),
    ticker: z.string().optional().nullable().default(''),
    ipoDate: z.string().optional().nullable(),
    marketCap: FlexNum,
  }).passthrough().optional().nullable(),
  keyProducts: cappedArray(z.unknown(), 20),
  revenueStreams: cappedArray(
    z.object({
      name: z.string().optional().nullable(),
      percentage: FlexNum,
      description: z.string().optional().nullable(),
    }).passthrough(),
    12,
  ),
  keyMilestones: cappedArray(
    z.object({
      year: FlexNum,
      event: z.string().optional().nullable().default(''),
    }).passthrough(),
    15,
  ),
  flags: cappedArray(z.string(), 15),
  sources: cappedArray(z.string(), 10),
  israeliContext: z.object({
    taseIndexMembership: NullableStr,
    dualListed: z.boolean().optional().nullable(),
    dualListedExchange: NullableStr,
    localMarketContext: NullableStr,
  }).passthrough().optional().nullable(),
}).passthrough();

export type Profile = z.infer<typeof ProfileSchema>;

// ─── Step 2: Financials ───────────────────────────────────────────────────────

const FinancialPeriodSchema = z.object({
  period: z.string().optional().nullable().default(''),
  revenue: NullableNum,
  revenueGrowthYoY: NullableNum,
  grossProfit: NullableNum,
  grossMargin: NullableNum,
  operatingIncome: NullableNum,
  netIncome: NullableNum,
  netMargin: NullableNum,
  eps: NullableNum,
  ebitda: NullableNum,
}).passthrough();

export const FinancialsSchema = z.object({
  periods: cappedArray(FinancialPeriodSchema, 12),
  // balanceSheet / cashFlow shapes vary wildly. Accept anything, keep as-is for UI.
  balanceSheet: z.unknown().optional().nullable(),
  cashFlow: z.unknown().optional().nullable(),
  ratios: z.object({
    peRatio: NullableNum,
    forwardPE: NullableNum,
    pbRatio: NullableNum,
    psRatio: NullableNum,
    evToEbitda: NullableNum,
    roe: NullableNum,
    roa: NullableNum,
    dividendYield: NullableNum,
    marketCapBillions: NullableNum,
  }).passthrough().optional().nullable(),
  valuationVerdict: z.unknown().optional().nullable()
    .transform((v): string | null => (typeof v === 'string' ? v : v == null ? null : String(v))),
  valuationReasoning: z.string().optional().nullable(),
  healthVerdict: z.unknown().optional().nullable()
    .transform((v): string | null => (typeof v === 'string' ? v : v == null ? null : String(v))),
  healthReasoning: z.string().optional().nullable(),
  redFlags: cappedArray(z.string(), 12),
  greenFlags: cappedArray(z.string(), 12),
  currency: z.string().optional().nullable().default('USD'),
}).passthrough();

export type FinancialsAnalysis = z.infer<typeof FinancialsSchema>;

// ─── Step 3: Events Timeline ──────────────────────────────────────────────────

const ImportanceEnum = z.unknown().optional().nullable()
  .transform((v): 'high' | 'medium' | 'low' => {
    if (v === 'high' || v === 'medium' || v === 'low') return v;
    if (typeof v === 'string') {
      const lc = v.toLowerCase();
      if (lc.includes('high') || lc.includes('critical') || lc.includes('major')) return 'high';
      if (lc.includes('low') || lc.includes('minor')) return 'low';
    }
    return 'medium';
  });

const SentimentEnum = z.unknown().optional().nullable()
  .transform((v): 'positive' | 'negative' | 'neutral' | 'mixed' => {
    if (v === 'positive' || v === 'negative' || v === 'neutral' || v === 'mixed') return v;
    if (typeof v === 'string') {
      const lc = v.toLowerCase();
      if (lc.includes('pos') || lc.includes('bull') || lc.includes('good')) return 'positive';
      if (lc.includes('neg') || lc.includes('bear') || lc.includes('bad')) return 'negative';
      if (lc.includes('mix')) return 'mixed';
    }
    return 'neutral';
  });

const validCategories = ['earnings', 'regulatory', 'leadership', 'product', 'partnership', 'legal', 'macro', 'filing', 'capital', 'other'] as const;
const CategoryEnum = z.unknown().optional().nullable()
  .transform((v): typeof validCategories[number] => {
    if (typeof v === 'string' && validCategories.includes(v as typeof validCategories[number])) {
      return v as typeof validCategories[number];
    }
    return 'other';
  });

const TimelineEventSchema = z.object({
  date: z.string().optional().nullable().default(''),
  title: z.string().optional().nullable().default(''),
  summary: z.string().optional().nullable().default(''),
  importance: ImportanceEnum,
  sentiment: SentimentEnum,
  category: CategoryEnum,
  sourceUrls: cappedArray(z.string(), 5),
}).passthrough();

const UpcomingEventSchema = z.object({
  date: z.string().optional().nullable().default(''),
  event: z.string().optional().nullable().default(''),
  importance: ImportanceEnum,
}).passthrough();

export const EventsSchema = z.object({
  timeline: cappedArray(TimelineEventSchema, 40),
  upcomingEvents: cappedArray(UpcomingEventSchema, 15),
  patternObservations: cappedArray(z.string(), 8),
  overallSentiment: z.unknown().optional().nullable()
    .transform((v): 'positive' | 'negative' | 'neutral' | 'mixed' => {
      if (v === 'positive' || v === 'negative' || v === 'neutral' || v === 'mixed') return v;
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('pos')) return 'positive';
        if (lc.includes('neg')) return 'negative';
        if (lc.includes('mix')) return 'mixed';
      }
      return 'neutral';
    }),
  coveragePeriodDays: NullableNum,
}).passthrough();

export type EventsTimeline = z.infer<typeof EventsSchema>;

// ─── Step 4: Competitive Landscape ───────────────────────────────────────────

const validRelativeSizes = ['much_larger', 'larger', 'similar', 'smaller', 'much_smaller', 'unknown'] as const;

const CompetitorSchema = z.object({
  name: z.string().optional().nullable().default(''),
  ticker: z.string().optional().nullable(),
  exchange: z.string().optional().nullable(),
  type: z.unknown().optional().nullable()
    .transform((v): 'direct' | 'adjacent' => (v === 'direct' || v === 'adjacent') ? v : 'direct'),
  relativeSize: z.unknown().optional().nullable()
    .transform((v): typeof validRelativeSizes[number] => {
      if (typeof v === 'string' && validRelativeSizes.includes(v as typeof validRelativeSizes[number])) {
        return v as typeof validRelativeSizes[number];
      }
      return 'unknown';
    }),
  keyDifferentiator: z.string().optional().nullable().default(''),
  threat: z.unknown().optional().nullable()
    .transform((v): 'high' | 'medium' | 'low' => {
      if (v === 'high' || v === 'medium' || v === 'low') return v;
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('high')) return 'high';
        if (lc.includes('low')) return 'low';
      }
      return 'medium';
    }),
  estimatedMarketSharePct: NullableNum,
}).passthrough();

const validMarketPositions = ['leader', 'challenger', 'niche', 'follower', 'undefined'] as const;

export const CompetitiveSchema = z.object({
  marketPosition: z.unknown().optional().nullable()
    .transform((v): typeof validMarketPositions[number] => {
      if (typeof v === 'string' && validMarketPositions.includes(v as typeof validMarketPositions[number])) {
        return v as typeof validMarketPositions[number];
      }
      return 'undefined';
    }),
  marketPositionReasoning: z.string().optional().nullable(),
  competitors: cappedArray(CompetitorSchema, 12),
  ourMoats: cappedArray(z.string(), 10),
  ourWeaknesses: cappedArray(z.string(), 10),
  industrySize: z.object({
    estimatedBillions: NullableNum,
    growthRatePct: NullableNum,
    source: z.string().optional().nullable(),
    sourceConfidence: z.unknown().optional().nullable()
      .transform((v): 'high' | 'medium' | 'low' | undefined => {
        if (v === 'high' || v === 'medium' || v === 'low') return v;
        return undefined;
      }),
  }).passthrough().optional().nullable(),
  tailwinds: cappedArray(z.string(), 10),
  headwinds: cappedArray(z.string(), 10),
  sources: cappedArray(z.string(), 10),
}).passthrough();

export type CompetitiveLandscape = z.infer<typeof CompetitiveSchema>;

// ─── Step 5: Risk Assessment ──────────────────────────────────────────────────

const validSeverities = ['critical', 'high', 'medium', 'low'] as const;
const validLikelihoods = ['high', 'medium', 'low'] as const;

const RiskItemSchema = z.object({
  title: z.string().optional().nullable().default(''),
  description: z.string().optional().nullable().default(''),
  severity: z.unknown().optional().nullable()
    .transform((v): typeof validSeverities[number] => {
      if (typeof v === 'string' && validSeverities.includes(v as typeof validSeverities[number])) {
        return v as typeof validSeverities[number];
      }
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('critical') || lc.includes('very high')) return 'critical';
        if (lc.includes('high')) return 'high';
        if (lc.includes('low')) return 'low';
      }
      return 'medium';
    }),
  likelihood: z.unknown().optional().nullable()
    .transform((v): typeof validLikelihoods[number] => {
      if (typeof v === 'string' && validLikelihoods.includes(v as typeof validLikelihoods[number])) {
        return v as typeof validLikelihoods[number];
      }
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('high')) return 'high';
        if (lc.includes('low')) return 'low';
      }
      return 'medium';
    }),
  mitigants: cappedArray(z.string(), 5),
}).passthrough();

const validRiskRatings = ['low', 'moderate', 'elevated', 'high', 'very_high'] as const;
const validLiquidityVerdicts = ['low', 'moderate', 'high', 'very_high'] as const;

export const RisksSchema = z.object({
  companySpecific: cappedArray(RiskItemSchema, 12),
  industryRisks: cappedArray(RiskItemSchema, 8),
  macroRisks: cappedArray(RiskItemSchema, 8),
  liquidityRisk: z.object({
    verdict: z.unknown().optional().nullable()
      .transform((v): typeof validLiquidityVerdicts[number] => {
        if (typeof v === 'string' && validLiquidityVerdicts.includes(v as typeof validLiquidityVerdicts[number])) {
          return v as typeof validLiquidityVerdicts[number];
        }
        return 'moderate';
      }),
    reasoning: z.string().optional().nullable().default(''),
    avgDailyVolume: NullableNum,
  }).passthrough().optional().nullable(),
  concentrationRisk: z.object({
    customerConcentration: NullableStr,
    geographicConcentration: NullableStr,
    productConcentration: NullableStr,
    supplierConcentration: NullableStr,
  }).passthrough().optional().nullable(),
  overallRiskRating: z.unknown().optional().nullable()
    .transform((v): typeof validRiskRatings[number] => {
      if (typeof v === 'string' && validRiskRatings.includes(v as typeof validRiskRatings[number])) {
        return v as typeof validRiskRatings[number];
      }
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('very') && lc.includes('high')) return 'very_high';
        if (lc.includes('elevat')) return 'elevated';
        if (lc.includes('high')) return 'high';
        if (lc.includes('low')) return 'low';
      }
      return 'moderate';
    }),
  riskSummary: z.string().optional().nullable().default(''),
}).passthrough();

export type RiskAssessment = z.infer<typeof RisksSchema>;

// ─── Step 6: Synthesis ────────────────────────────────────────────────────────

/**
 * Normalizes Claude's varied output shapes for bullCase/bearCase into a stable
 * `{ points: string[]; keyAssumption?: string }` shape that the UI expects.
 *
 * Accepted inputs:
 *   - `{ points: [...], keyAssumption: '...' }`             → as-is (preferred)
 *   - `["point a", "point b"]`                              → wrapped as { points }
 *   - `"a single paragraph"`                                → wrapped as { points: [paragraph] }
 *   - `{ thesis: '...', drivers: [...] }`                   → mapped to { points: drivers }
 *   - `{ summary: '...', risks: [...] }`                    → mapped to { points: risks }
 *   - any other object — kept as-is so UI's defensive renderer can introspect.
 */
const CaseSchema = z.unknown().optional().nullable().transform((v) => {
  if (v == null) return null;
  if (typeof v === 'string') return { points: [v] };
  if (Array.isArray(v)) {
    const pts = v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean);
    return { points: pts };
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    let points: string[] = [];
    if (Array.isArray(obj['points'])) {
      points = (obj['points'] as unknown[]).map((p) => (typeof p === 'string' ? p : JSON.stringify(p)));
    } else if (Array.isArray(obj['drivers'])) {
      points = (obj['drivers'] as unknown[]).map((p) => (typeof p === 'string' ? p : JSON.stringify(p)));
    } else if (Array.isArray(obj['risks'])) {
      points = (obj['risks'] as unknown[]).map((p) => (typeof p === 'string' ? p : JSON.stringify(p)));
    } else if (Array.isArray(obj['bullets'])) {
      points = (obj['bullets'] as unknown[]).map((p) => (typeof p === 'string' ? p : JSON.stringify(p)));
    } else if (typeof obj['summary'] === 'string') {
      points = [obj['summary'] as string];
    } else if (typeof obj['thesis'] === 'string') {
      points = [obj['thesis'] as string];
    }
    const keyAssumption =
      typeof obj['keyAssumption'] === 'string' ? (obj['keyAssumption'] as string) :
      typeof obj['assumption'] === 'string' ? (obj['assumption'] as string) :
      null;
    return { points, keyAssumption };
  }
  return null;
});

const ScenarioSchema = z.object({
  label: z.unknown().optional().nullable()
    .transform((v): 'bull' | 'base' | 'bear' => {
      if (v === 'bull' || v === 'base' || v === 'bear') return v;
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('bull')) return 'bull';
        if (lc.includes('bear')) return 'bear';
      }
      return 'base';
    }),
  probability: z.unknown().optional().nullable()
    .transform((v): number => {
      const n = typeof v === 'string' ? parseFloat(v.replace('%', '')) / (v.includes('%') ? 100 : 1) : typeof v === 'number' ? v : 0;
      if (Number.isNaN(n)) return 0;
      return Math.min(1, Math.max(0, n));
    }),
  description: z.string().optional().nullable().default(''),
  keyAssumption: z.string().optional().nullable(),
}).passthrough();

const validComplexities = ['simple', 'moderate', 'complex', 'very_complex'] as const;
const validConfidences = ['high', 'medium', 'low'] as const;

export const SynthesisSchema = z.object({
  executiveSummary: z.string().optional().nullable().default(''),
  whatTheNumbersSay: z.string().optional().nullable().default(''),
  whatTheNarrativeSays: z.string().optional().nullable().default(''),
  bullCase: CaseSchema,
  bearCase: CaseSchema,
  ifIWereAnInvestor: z.object({
    questionsToAnswer: cappedArray(z.string(), 10),
    factsToWatchFor: cappedArray(z.string(), 10),
    redFlagsToReject: z.any().optional().nullable().transform((v): string[] => {
      if (v == null) return [];
      if (typeof v === 'string') return [v];
      if (!Array.isArray(v)) return [];
      return (v as unknown[]).slice(0, 10).map((x) => {
        if (typeof x === 'string') return x;
        if (x && typeof x === 'object') {
          const o = x as Record<string, unknown>;
          if (typeof o['flag'] === 'string') return o['flag'] as string;
          if (typeof o['text'] === 'string') return o['text'] as string;
          if (typeof o['description'] === 'string') return o['description'] as string;
          return JSON.stringify(o);
        }
        return String(x);
      });
    }),
    recommendedHorizon: z.unknown().optional().nullable()
      .transform((v): 'short' | 'medium' | 'long' | null => {
        if (v === 'short' || v === 'medium' || v === 'long') return v;
        if (typeof v === 'string') {
          const lc = v.toLowerCase();
          if (lc.includes('short') || lc.includes('< 1') || lc.includes('< year')) return 'short';
          if (lc.includes('long') || lc.includes('> 3')) return 'long';
          if (lc.includes('med') || lc.includes('1-3') || lc.includes('1–3')) return 'medium';
        }
        return null;
      }),
    entryStrategy: NullableStr,
  }).passthrough().optional().nullable(),
  scenarioAnalysis: cappedArray(ScenarioSchema, 6),
  finalNote: z.string().optional().nullable().default(''),
  overallComplexity: z.unknown().optional().nullable()
    .transform((v): typeof validComplexities[number] | null => {
      if (v == null) return null;
      if (typeof v === 'string' && validComplexities.includes(v as typeof validComplexities[number])) {
        return v as typeof validComplexities[number];
      }
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('very') || lc.includes('highly')) return 'very_complex';
        if (lc.includes('complex')) return 'complex';
        if (lc.includes('simple')) return 'simple';
        return 'moderate';
      }
      return null;
    }),
  analystConfidence: z.unknown().optional().nullable()
    .transform((v): typeof validConfidences[number] | null => {
      if (v == null) return null;
      if (typeof v === 'string' && validConfidences.includes(v as typeof validConfidences[number])) {
        return v as typeof validConfidences[number];
      }
      if (typeof v === 'string') {
        const lc = v.toLowerCase();
        if (lc.includes('high')) return 'high';
        if (lc.includes('low')) return 'low';
        return 'medium';
      }
      return null;
    }),
  riskScore: z.unknown().optional().nullable()
    .transform((v): number | null => {
      const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : null;
      if (n == null || Number.isNaN(n)) return null;
      return Math.min(10, Math.max(1, n));
    }),
  riskScoreJustification: NullableStr,
  analystConsensus: z.object({
    recommendation: NullableStr,
    buyCount: NullableNum,
    holdCount: NullableNum,
    sellCount: NullableNum,
    averageTargetPrice: NullableNum,
    currentPrice: NullableNum,
    upsidePct: NullableNum,
  }).passthrough().optional().nullable(),
  macroContext: z.object({
    points: cappedArray(z.string(), 8),
    sectorOutlook: NullableStr,
    interestRateImpact: NullableStr,
    regulatoryEnvironment: NullableStr,
  }).passthrough().optional().nullable(),
  dataAsOf: NullableStr,
}).passthrough();

export type Synthesis = z.infer<typeof SynthesisSchema>;

// ─── Full report type ─────────────────────────────────────────────────────────

export interface ResearchReportData {
  profile?: Profile | null;
  financials?: FinancialsAnalysis | null;
  events?: EventsTimeline | null;
  competitive?: CompetitiveLandscape | null;
  risks?: RiskAssessment | null;
  synthesis?: Synthesis | null;
}
