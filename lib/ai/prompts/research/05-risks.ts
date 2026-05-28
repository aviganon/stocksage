/** Step 5 — Risk Assessment prompt */

export const RISKS_SYSTEM = `You are a risk analyst. You catalog risks across multiple levels (company-specific, industry, macro), assess severity and likelihood honestly, and avoid both fear-mongering and dismissiveness. You do not write generic risks ("market volatility may affect price") — every risk you list is specific and actionable.

CRITICAL: Your ENTIRE response must be a single valid JSON object. No prose before the JSON. No explanation after. No markdown. Start with { and end with }.`;

export function buildRisksPrompt(params: {
  assetName: string;
  assetId: string;
  profileJsonSummary: string;
  financialsJsonSummary: string;
  eventsJsonSummary: string;
  competitiveJsonSummary: string;
  avgDailyVolume?: number | null;
  zodSchema: string;
  language?: 'he' | 'en';
}): string {
  const lang = params.language ?? 'en';
  const langNote = lang === 'he'
    ? `\n\nSHARPLY IMPORTANT — LANGUAGE: Write ALL text content in HEBREW (עברית). JSON field names stay in English. Every string value (risk titles, descriptions, mitigants, reasoning) must be in Hebrew.`
    : '';
  const volumeNote = params.avgDailyVolume
    ? `- Current average daily trading volume: ${params.avgDailyVolume.toLocaleString()} (use for liquidity risk assessment)`
    : '';

  return `Assess the risk profile of ${params.assetName} (${params.assetId}).

CONTEXT (from previous pipeline steps):
- Profile: ${params.profileJsonSummary}
- Financials: ${params.financialsJsonSummary}
- Recent events: ${params.eventsJsonSummary}
- Competitive landscape: ${params.competitiveJsonSummary}
${volumeNote}

OUTPUT a JSON object matching this schema:

${params.zodSchema}

RULES:
- Each risk must be SPECIFIC. Bad: "Macro headwinds may pressure earnings". Good: "60% of revenue from EMEA exposes earnings to EUR/USD volatility at multi-year highs".
- \`severity\`: how bad if it materializes. \`likelihood\`: probability over 12 months.
- \`mitigants\`: real mitigations the company has in place, if any. Empty array if none.
- \`liquidityRisk.verdict\`: based on average daily volume relative to typical position size.
- \`concentrationRisk\`: only fill fields where a real concentration exists.
- Maximum risks: companySpecific 8, industryRisks 5, macroRisks 5.
- Build on the context from previous sections — reference specific data points (e.g., "Given the 30% revenue decline noted in financials...").
- Do NOT repeat risks already covered in financials redFlags verbatim.
${langNote}

FAILSAFE — read carefully:
- Every field is OPTIONAL. If a risk category truly has nothing to report, return \`[]\` for that array.
- \`companySpecific\`, \`industryRisks\`, \`macroRisks\` are ARRAYS of risk objects. Each risk needs \`title\` + \`description\`.
- \`severity\` and \`likelihood\` should be one of the listed values; if uncertain, omit and the system defaults safely.
- \`mitigants\` is an ARRAY of strings — use \`[]\` if no real mitigants exist.
- \`overallRiskRating\` should be one of: low | moderate | elevated | high | very_high.
- Return ONLY the JSON object — no markdown fences, no prose before or after.

Return only the JSON object.`;
}
