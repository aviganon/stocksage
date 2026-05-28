/** Step 3 — Events Timeline prompt */

export const EVENTS_SYSTEM = `You extract material events from raw news and filing data, deduplicating coverage of the same event from multiple sources. You are conservative about importance — most events are routine; only genuinely market-moving items rate as "high". You produce a comprehensive, richly-detailed timeline ordered by date.

CRITICAL: Your ENTIRE response must be a single valid JSON object. No prose before the JSON. No explanation after. No markdown. Start with { and end with }.`;

export function buildEventsPrompt(params: {
  assetName: string;
  assetId: string;
  newsJson: string;
  filingsJson: string;
  corporateActionsJson: string;
  isTase?: boolean;
  hebrewName?: string;
  zodSchema: string;
  language?: 'he' | 'en';
}): string {
  const lang = params.language ?? 'en';
  const langNote = lang === 'he'
    ? `\n\nSHARPLY IMPORTANT — LANGUAGE: Write ALL text content in HEBREW (עברית). JSON field names stay in English. Every string value (titles, summaries, observations) must be in Hebrew. This is a Hebrew-language financial report.`
    : '';

  const taseNote = params.isTase
    ? `\nISRAELI MARKET CONTEXT:
- This is a TASE-listed company${params.hebrewName ? ` — Hebrew name: ${params.hebrewName}` : ''}.
- Filings are from TASE Maya (מאיה) disclosure system. Include the Hebrew filing title in the event title where available.
- Pay special attention to: TASE index additions/removals, Israeli regulatory actions (ISA, Bank of Israel), dual-listing events, major institutional holdings changes.
- Israeli news sources (TheMarker, Calcalist, Globes, Ynet כלכלה) are credible primary sources.`
    : '';

  return `Extract a comprehensive timeline of material events for ${params.assetName} (${params.assetId}).

DATA AVAILABLE:
- News items (last 90 days, multiple sources): ${params.newsJson}
- Filings from SEC EDGAR or TASE Maya (last 12 months): ${params.filingsJson}
- Corporate actions (splits, dividends): ${params.corporateActionsJson}
${taseNote}

OUTPUT a JSON object matching this schema:

${params.zodSchema}

RULES:
- Deduplicate: if 5 outlets cover the same earnings beat, that's ONE event with up to 3 source URLs (top 3 most reputable).
- Maximum 40 timeline events. Include all material events — do not drop important items just to stay short.
- \`importance\` levels:
  - high: Major regulatory action, M&A, leadership change at C-level, earnings miss/beat by >20%, major lawsuit, transformative partnership, equity offering
  - medium: Routine earnings, mid-tier partnerships, product launches, secondary leadership changes, index events
  - low: Routine news, minor regulatory items, background commentary, small analyst note
- \`sentiment\`: positive, negative, neutral, mixed. Be honest — do not soften negatives.
- \`category\`: use the most specific category — earnings, regulatory, leadership, product, partnership, legal, macro, filing, capital, other.
- \`upcomingEvents\`: scheduled events like next earnings date, expected FDA/regulatory decision, dividend ex-date. Only if actually scheduled — do not speculate.
- \`patternObservations\`: 3-5 observations about meaningful patterns visible in the timeline (e.g., "Consistent earnings beats over last 4 quarters", "Management has been selling shares ahead of guidance cuts").
- Sort timeline by date descending (most recent first).
- For each high-importance event: write a detailed \`summary\` (2-3 sentences) explaining what happened and why it matters.
${langNote}

FAILSAFE — read carefully:
- Every field is OPTIONAL. If a section has no data, return an empty array \`[]\` (not null, not omitted).
- \`timeline\`, \`upcomingEvents\`, \`patternObservations\` must be arrays. Use \`[]\` if nothing material exists.
- \`sourceUrls\` must be an array of URL strings, max 3 per event. Use \`[]\` if no sources.
- Date fields should be ISO format (YYYY-MM-DD) when possible, but a string in any format is acceptable.
- Return ONLY the JSON object — no markdown fences, no prose before or after.

Return only the JSON object.`;
}
