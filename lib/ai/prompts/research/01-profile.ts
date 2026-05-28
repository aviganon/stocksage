/** Step 1 — Company Profile prompt */

export const PROFILE_SYSTEM = `You are a financial research analyst preparing a factual company profile. Your output must be objective, verifiable, and free of marketing language. State facts; mark unknowns explicitly. Do not speculate. Do not give advice.

CRITICAL: Your ENTIRE response must be a single valid JSON object. No prose before the JSON. No explanation after. No markdown. Start your response with { and end with }.`;

export function buildProfilePrompt(params: {
  assetName: string;
  assetId: string;
  unifiedAssetJson: string;
  yahooDescriptionOrNull: string;
  hebrewName?: string;
  insiderTradesJson?: string;
  isTase?: boolean;
  zodSchema: string;
  language?: 'he' | 'en';
}): string {
  const lang = params.language ?? 'en';
  const langNote = lang === 'he'
    ? `\n\nSHARPLY IMPORTANT — LANGUAGE: Write ALL text content in HEBREW (עברית). JSON field names stay in English. Every string value (descriptions, summaries, milestones, product names, reasoning) must be in Hebrew. Proper nouns (company names, tickers, URLs) may stay in English.`
    : '';
  const hebrewNote = params.hebrewName
    ? `- Official Hebrew name: ${params.hebrewName}`
    : '';
  const insiderNote = params.insiderTradesJson && params.insiderTradesJson !== 'none'
    ? `- Recent insider transactions (SEC Form 4): ${params.insiderTradesJson}`
    : '';

  const israeliNote = params.isTase ? `
ISRAELI MARKET CONTEXT (fill \`israeliContext\` carefully for TASE companies):
- Determine if the company is dual-listed (traded on both TASE and a foreign exchange like NYSE/NASDAQ). If so, set \`dualListed: true\` and \`dualListedExchange\` to the foreign exchange name.
- Identify TASE index membership: TA-35, TA-90, TA-125, TA-SME150, or other.
- Provide a brief \`localMarketContext\`: Israeli economic exposure, government contracts, sector dominance in Israel, currency risk (NIS/USD/EUR split), or other Israel-specific factors relevant to the investment.
- Use web_search to look up current TASE index membership if needed.` : '';

  return `Produce a factual profile of ${params.assetName} (${params.assetId}).

DATA AVAILABLE:
- Asset metadata: ${params.unifiedAssetJson}
- Yahoo Finance description: ${params.yahooDescriptionOrNull}
${hebrewNote}
${insiderNote}

You may use web_search up to 3 times to verify or supplement facts. Prioritize: company website, SEC/TASE filings, reputable news outlets. Do NOT use Wikipedia or aggregator sites as primary sources.
${israeliNote}

OUTPUT a JSON object matching this exact schema. No extra fields. No missing required fields. No prose outside the JSON.

${params.zodSchema}

RULES:
- The \`oneLineSummary\` is a single sentence describing what the company does. 15-25 words.
- The \`fullDescription\` is 2-4 paragraphs of factual prose. No bullets. No headers.
- For TASE companies: fill \`hebrewName\` with the official Hebrew company name; also fill \`israeliContext\`.
- For non-TASE companies: set \`israeliContext\` to null.
- Numbers must be verifiable. If you can't verify a number, omit the field entirely.
- For \`flags\`: only assign flags that are clearly supported by the data. Empty array is acceptable.
- For \`keyMilestones\`: maximum 8, only material events (IPO, major acquisitions, key product launches, leadership changes).
- The \`revenueStreams\` percentages must sum to ~100% if any are provided.
- If insider trades are provided: note any significant cluster of buys or sells in \`flags\` (e.g., "insiders selling heavily", "insiders buying").

FIELD FORMAT REQUIREMENTS:
- \`employeeCount\`: plain integer (e.g. 5000), or null if unknown.
- \`revenueStreams[].percentage\`: plain number 0–100, no % sign (e.g. 32.5), or null.
- \`revenueStreams[].name\`: short string, or null.
- \`keyProducts\`: array of plain strings (e.g. ["iPhone", "Mac", "iCloud"]).
- \`keyMilestones[].year\`: 4-digit integer (e.g. 2015), or null.
${langNote}

FAILSAFE — read carefully:
- Every field in the schema is OPTIONAL. If you don't have reliable data for a field, OMIT the field entirely or set it to null. Do not invent data.
- Never return a string for a numeric field. Never return an object for a field expected as an array.
- Arrays must be arrays (use \`[]\` for empty). Do not wrap arrays in another object.
- Return ONLY the JSON object — no markdown fences, no prose before or after.

Return only the JSON object.`;
}
