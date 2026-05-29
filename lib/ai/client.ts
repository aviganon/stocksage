import Anthropic from '@anthropic-ai/sdk';
import { type ZodSchema } from 'zod';

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5':  { input: 0.80,  output: 4.00 },
  'claude-sonnet-4-6': { input: 3.00,  output: 15.00 },
  'claude-opus-4-7':   { input: 15.00, output: 75.00 },
  default:             { input: 3.00,  output: 15.00 },
};

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model] ?? MODEL_PRICING['default'];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

export type ClaudeModel = 'claude-haiku-4-5' | 'claude-sonnet-4-6' | 'claude-opus-4-7';

export interface CallClaudeOptions<T> {
  model: ClaudeModel;
  prompt: string;
  systemPrompt?: string;
  schema: ZodSchema<T>;
  maxTokens?: number;
  temperature?: number;
  webSearch?: boolean;
}

export interface CallClaudeResult<T> {
  data: T;
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '').trim();
  const objStart = cleaned.indexOf('{');
  const arrStart = cleaned.indexOf('[');
  if (objStart === -1 && arrStart === -1) return cleaned;

  let start: number;
  let openChar: string;
  let closeChar: string;
  if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
    start = objStart; openChar = '{'; closeChar = '}';
  } else {
    start = arrStart; openChar = '['; closeChar = ']';
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === openChar) depth++;
    else if (c === closeChar) { depth--; if (depth === 0) return cleaned.slice(start, i + 1); }
  }
  return cleaned.slice(start);
}

async function runWithToolLoop(
  client: Anthropic,
  requestParams: Anthropic.MessageCreateParamsNonStreaming,
  maxRounds = 5,
): Promise<{ response: Anthropic.Message; totalInput: number; totalOutput: number }> {
  let messages = [...(requestParams.messages as Anthropic.MessageParam[])];
  let totalInput = 0;
  let totalOutput = 0;

  for (let round = 0; round < maxRounds; round++) {
    const resp = await client.messages.create({ ...requestParams, messages });
    totalInput += resp.usage.input_tokens;
    totalOutput += resp.usage.output_tokens;
    const toolUseBlocks = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (toolUseBlocks.length === 0) return { response: resp, totalInput, totalOutput };
    messages = [...messages, { role: 'assistant', content: resp.content }];
    const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((b) => ({
      type: 'tool_result' as const,
      tool_use_id: b.id,
      content: 'No web search results available. Use your training knowledge and the data in the prompt.',
    }));
    messages = [...messages, { role: 'user', content: toolResults }];
  }

  const fallback = await client.messages.create({ ...requestParams, messages, tools: [] });
  totalInput += fallback.usage.input_tokens;
  totalOutput += fallback.usage.output_tokens;
  return { response: fallback, totalInput, totalOutput };
}

export async function callClaude<T>(options: CallClaudeOptions<T>): Promise<CallClaudeResult<T>> {
  const { model, prompt, systemPrompt, schema, maxTokens = 4096, temperature = 0.5, webSearch = false } = options;
  const start = Date.now();
  let lastError: unknown;
  let lastFailedPaths: string[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const client = getClient();
      const tools: Anthropic.Tool[] = webSearch
        ? [{ name: 'web_search', description: 'Search the web', input_schema: { type: 'object' as const, properties: { query: { type: 'string' } }, required: ['query'] } }]
        : [];

      const userContent = attempt > 0 && lastError
        ? `${prompt}\n\n---\nRETRY — previous JSON failed schema validation.\nFailed fields:\n${lastFailedPaths.length ? lastFailedPaths.map((p) => `  • ${p}`).join('\n') : `  • ${String(lastError).slice(0, 400)}`}\nReturn the COMPLETE valid JSON, fixing only the listed fields. Never wrap in markdown.`
        : prompt;

      const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model,
        max_tokens: maxTokens,
        temperature: attempt >= 1 ? 0.1 : temperature,
        messages: [{ role: 'user', content: userContent }],
        ...(systemPrompt ? { system: systemPrompt } : {}),
        ...(tools.length > 0 ? { tools, tool_choice: { type: 'auto' } } : {}),
      };

      let response: Anthropic.Message;
      let inputTokens: number;
      let outputTokens: number;

      const TIMEOUT_MS = 150_000; // 2.5 minutes — Sonnet with 10k tokens needs room
      if (webSearch) {
        const result = await runWithToolLoop(client, requestParams, 5);
        response = result.response;
        inputTokens = result.totalInput;
        outputTokens = result.totalOutput;
      } else {
        response = await client.messages.create(requestParams, { timeout: TIMEOUT_MS });
        inputTokens = response.usage.input_tokens;
        outputTokens = response.usage.output_tokens;
      }

      const costUSD = calcCost(model, inputTokens, outputTokens);
      const durationMs = Date.now() - start;
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') throw new Error('No text block in Claude response');

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJson(textBlock.text.trim()));
      } catch {
        throw new Error(`Claude returned invalid JSON: ${textBlock.text.slice(0, 200)}`);
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        lastFailedPaths = validated.error.issues.slice(0, 8).map((i) => `${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`);
        if (attempt < 2) { lastError = new Error(`Schema failed: ${lastFailedPaths.join('; ')}`); continue; }
        throw new Error(`Schema validation failed: ${lastFailedPaths.join('; ')}`);
      }

      return { data: validated.data, costUSD, inputTokens, outputTokens, durationMs };
    } catch (e) {
      lastError = e;
      const isTransient = String(e).includes('529') || String(e).includes('500') || String(e).includes('503') || String(e).includes('ECONNRESET');
      if (isTransient && attempt < 2) { await sleep(1000 * Math.pow(2, attempt)); continue; }
      break;
    }
  }
  throw lastError;
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }
