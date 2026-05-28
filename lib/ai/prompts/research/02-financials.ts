/** Step 2 — Financial Analysis prompt */

export const FINANCIALS_SYSTEM = `You are a quantitative financial analyst. Given financial data, you extract trends, compute key metrics, and apply professional judgment to verdicts. You never fabricate numbers; missing data is reported as null.

CRITICAL: Your ENTIRE response must be a single valid JSON object. No prose before the JSON. No explanation after. No markdown. Start your response with { and end with }.`;

export function buildFinancialsPrompt(params: {
  assetName: string;
  assetId: string;
  incomeJson: string;
  balanceJson: string;
  cashflowJson: string;
  ratiosJson: string;
  marketCap: string;
  sharesOutstanding: string;
  macroSnapshotJson: string;
  priceHistoryJson?: string;
  currentQuoteJson?: string;
  analystJson?: string;
  zodSchema: string;
  language?: 'he' | 'en';
}): string {
  const lang = params.language ?? 'en';
  const langNote = lang === 'he'
    ? `\n\nSHARPLY IMPORTANT — LANGUAGE: Write ALL text content in HEBREW (עברית). JSON field names stay in English. Every string value (verdicts, reasoning, flags) must be in Hebrew.`
    : '';
  const priceSection = params.priceHistoryJson && params.priceHistoryJson !== '[]'
    ? `- Recent price history (last 20 sessions): ${params.priceHistoryJson}`
    : '';
  const quoteSection = params.currentQuoteJson && params.currentQuoteJson !== 'null'
    ? `- Current market quote (price, PE, market cap, volume): ${params.currentQuoteJson}`
    : '';
  const analystSection = params.analystJson && params.analystJson !== 'null'
    ? `- Analyst estimates (target price, forward earnings, buy/hold/sell counts): ${params.analystJson}`
    : '';

  return `Analyze the financial position of ${params.assetName} (${params.assetId}).

DATA AVAILABLE:
- Income statement (last 4 fiscal years + last 4 quarters): ${params.incomeJson}
- Balance sheet (last 4 fiscal years): ${params.balanceJson}
- Cash flow (last 4 fiscal years): ${params.cashflowJson}
- Key ratios (may include pe, pb, ps, evEbitda, roe, roa, dividendYield): ${params.ratiosJson}
- Current market cap: ${params.marketCap}
- Shares outstanding: ${params.sharesOutstanding}
- Macro context: ${params.macroSnapshotJson}
${priceSection}
${quoteSection}
${analystSection}

OUTPUT a JSON object matching this schema:

${params.zodSchema}

VALUATION RATIOS — compute or extract ALL of the following into the \`ratios\` field:
- \`peRatio\`: trailing twelve months P/E. If from data, use it; else compute: (market cap) / (last 12m net income).
- \`forwardPE\`: forward P/E from analyst estimates if provided; otherwise null.
- \`pbRatio\`: price-to-book. Compute if not available: (market cap) / (total equity from balance sheet).
- \`psRatio\`: price-to-sales. Compute: (market cap) / (last 12m revenue).
- \`evToEbitda\`: enterprise value / EBITDA. Use data if available; approximate EV = market cap + total debt - cash.
- \`roe\`: return on equity (%). Compute: (net income / total equity) × 100.
- \`roa\`: return on assets (%). Compute: (net income / total assets) × 100.
- \`dividendYield\`: annual dividend / current price × 100. Null if no dividend.
- \`marketCapBillions\`: current market cap in billions (e.g. 2.4 for $2.4B). Convert from raw number.

RULES:
- For each \`revenue\` and \`netIncome\` entry, compute YoY growth where possible (mark \`null\` for first period).
- \`valuationVerdict\` must be EXACTLY one of: cheap, fair, expensive, speculative, not_applicable.
- \`valuationReasoning\` is 2-3 sentences. Tie the verdict to specific ratios AND the macro context (interest rates, sector). Reference the P/E and EV/EBITDA explicitly if available.
- \`healthVerdict\` must be EXACTLY one of: strong, adequate, strained, critical, not_applicable. No other values.
- \`healthReasoning\` reflects balance sheet strength, runway, and cash burn.
- \`redFlags\` and \`greenFlags\` are concrete observations tied to numbers, not platitudes.
- All currency values are in the company's reporting currency. Do not convert.
- Use the price history to note volatility or trend if relevant to the valuation verdict.
- If a required calculation can't be performed due to missing data, set the field to null.
- \`balanceSheet\` and \`cashFlow\` may be null if data is entirely unavailable — do not invent numbers.
${langNote}

FAILSAFE — read carefully:
- Every field in the schema is OPTIONAL. If you don't have reliable data for a field, OMIT the field entirely or set it to null. Do not invent data.
- Numeric fields must be plain numbers (no commas, no %, no currency symbols). If unknown → null.
- Enum-like verdicts (\`valuationVerdict\`, \`healthVerdict\`) — use one of the listed values when confident; otherwise omit the field or set to null. Do NOT return a long sentence in the verdict field.
- Arrays must be arrays (use \`[]\` for empty). Do not wrap arrays in another object.
- Return ONLY the JSON object — no markdown fences, no prose before or after.

Return only the JSON object.`;
}
