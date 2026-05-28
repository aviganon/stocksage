/** Step 4 — Competitive Landscape prompt */

export const COMPETITIVE_SYSTEM = `You are an industry analyst placing a company in its competitive context. You name real competitors with verifiable evidence; you do not invent companies. Your moat assessments are grounded in observable evidence (patents, contracts, market share data), not speculation.

CRITICAL: Your ENTIRE response must be a single valid JSON object. No prose before the JSON. No explanation after. No markdown. Start with { and end with }.`;

export function buildCompetitivePrompt(params: {
  assetName: string;
  assetId: string;
  industry: string;
  sector: string;
  yahooPeers: string;
  analystJson?: string;
  oneLineSummary: string;
  revenueStreams?: string;
  zodSchema: string;
  language?: 'he' | 'en';
}): string {
  const lang = params.language ?? 'en';
  const langNote = lang === 'he'
    ? `\n\nSHARPLY IMPORTANT — LANGUAGE: Write ALL text content in HEBREW (עברית). JSON field names stay in English. Every string value (reasoning, moats, weaknesses, tailwinds, headwinds, differentiators) must be in Hebrew. Company names and tickers may stay in English.`
    : '';
  const revenueNote = params.revenueStreams
    ? `- Main revenue streams: ${params.revenueStreams}`
    : '';
  const analystNote = params.analystJson && params.analystJson !== 'null'
    ? `- Analyst consensus data: ${params.analystJson}`
    : '';

  return `Map the competitive landscape for ${params.assetName} (${params.assetId}).

KNOWN CONTEXT:
- Industry: ${params.industry}
- Sector: ${params.sector}
- Yahoo-listed peers: ${params.yahooPeers}
- Company description: ${params.oneLineSummary}
${revenueNote}
${analystNote}

You may use web_search up to 4 times to identify competitors and market data. Prioritize industry research firms and primary sources.

OUTPUT a JSON object matching this schema:

${params.zodSchema}

RULES:
- \`competitors\`: list up to 8 total. PRIORITIZE the top 3 direct competitors — for each top-3 competitor you MUST provide:
  - \`ticker\`: stock ticker symbol if publicly traded (e.g. "AAPL", "0700.HK"). Use null only if private/unlisted.
  - \`estimatedMarketSharePct\`: estimated market share as a percentage (e.g. 32.5). Use null if truly unknown.
  - \`keyDifferentiator\`: one specific sentence on what makes this competitor distinct — mention a product, metric, or capability.
- Mix of direct (same product/customer) and adjacent (related space).
- \`relativeSize\` is comparative: "much_larger" means 10x+, "larger" means 2-10x, etc.
- \`ourMoats\`: defensible advantages with quantified evidence where possible. NOT "good products" or "great team".
- \`ourWeaknesses\`: structural, not temporary.
- \`marketPosition\`: leader, challenger, niche, follower, or undefined.
- \`industrySize.sourceConfidence\`: high if multiple primary sources agree, medium if one reputable source, low if extrapolated.
- If analyst data is provided: factor analyst consensus (buy/hold/sell ratio, target price vs. current price) into \`marketPositionReasoning\`.
- If the asset is crypto, treat the "industry" as the relevant crypto sub-sector (Layer 1, DeFi, etc.).
- For TASE companies: consider Israeli market context — local competitors, Tel Aviv Exchange peers, regulatory environment.
${langNote}

FAILSAFE — read carefully:
- Every field is OPTIONAL. If you can't identify competitors at all, return \`competitors: []\`. Never invent companies.
- \`competitors\` is an ARRAY of objects, not a single object. Each item needs at minimum \`name\`.
- \`relativeSize\`, \`threat\`, \`type\` should be one of the listed values; if uncertain, omit the field (the system will default safely).
- Arrays of strings (\`ourMoats\`, \`ourWeaknesses\`, \`tailwinds\`, \`headwinds\`, \`sources\`) must be plain string arrays. Use \`[]\` for empty.
- Return ONLY the JSON object — no markdown fences, no prose before or after.

Return only the JSON object.`;
}
