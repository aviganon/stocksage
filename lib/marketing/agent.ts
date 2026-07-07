/**
 * StockSage Marketing Agent
 *
 * Runs daily (via Cloud Scheduler → POST /api/marketing/run):
 *  1. Pick a stock — the most-researched one if there's traffic, otherwise
 *     rotate through the SEO universe (so it works from day one).
 *  2. Generate a short English channel post with Claude (neutral, no advice),
 *     linking to that stock's public /analysis page (drives SEO traffic).
 *  3. Publish to connected channels (Telegram now; LinkedIn/Facebook later).
 *  4. Record the post in Firestore.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SEO_UNIVERSE } from '@/lib/seo/universe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

interface PickedStock {
  assetId: string;
  name: string;
  symbol: string;
  exchange: string;
  reason: 'trending' | 'rotation';
  count?: number;
}

interface ChannelPost {
  insight: string;
  hashtags: string[];
  text: string;
  link: string;
}

// ─── Step 1: pick a stock ─────────────────────────────────────────────────────

async function getTopTrending(): Promise<{ assetId: string; name: string; count: number } | null> {
  try {
    const db = getAdminDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snap = await db.collection('reports')
      .where('startedAt', '>=', yesterday.toISOString())
      .where('startedAt', '<', today.toISOString())
      .where('status', '==', 'completed')
      .get();

    const counts: Record<string, { name: string; count: number }> = {};
    for (const doc of snap.docs) {
      const d = doc.data();
      const id = d['assetId'] as string;
      if (!id) continue;
      counts[id] ??= { name: (d['assetName'] as string) ?? id, count: 0 };
      counts[id]!.count++;
    }
    const top = Object.entries(counts).sort((a, b) => b[1].count - a[1].count)[0];
    return top ? { assetId: top[0], name: top[1].name, count: top[1].count } : null;
  } catch {
    return null;
  }
}

function pickFromUniverse(): PickedStock {
  // Deterministic daily rotation so a different stock features each day.
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const s = SEO_UNIVERSE[dayIndex % SEO_UNIVERSE.length]!;
  return { assetId: s.id, name: s.name, symbol: s.symbol, exchange: s.exchange, reason: 'rotation' };
}

export async function pickStock(): Promise<PickedStock> {
  const trending = await getTopTrending();
  if (trending) {
    const [exchange, symbol] = trending.assetId.split(':');
    return {
      assetId: trending.assetId,
      name: trending.name,
      symbol: symbol ?? trending.assetId,
      exchange: exchange ?? '',
      reason: 'trending',
      count: trending.count,
    };
  }
  return pickFromUniverse();
}

// ─── Step 2: generate the post ────────────────────────────────────────────────

export async function generateChannelPost(stock: PickedStock): Promise<ChannelPost> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const link = `${APP_URL}/analysis/${stock.exchange.toLowerCase()}/${stock.symbol.toLowerCase()}`;

  const prompt = `Write a short social post for a stock-research Telegram channel about ${stock.name} (${stock.symbol}, ${stock.exchange}).

Rules:
- 2 sentences max. Professional but engaging.
- Mention one genuinely interesting, factual angle about the company or its sector (NOT a buy/sell recommendation, NOT a price prediction).
- Neutral framing only. Never say "buy", "sell", "should invest".
- Do NOT include a link or hashtags (added separately).

Return ONLY JSON: {"insight": "the 2-sentence post", "hashtags": ["#Ticker", "#Sector", "#Investing"]}`;

  let insight = `${stock.name} (${stock.symbol}) — get a full AI research report in seconds.`;
  let hashtags = [`#${stock.symbol}`, '#Stocks', '#Investing'];
  try {
    const resp = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = resp.content.find((b) => b.type === 'text');
    if (text && text.type === 'text') {
      const json = JSON.parse(text.text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim());
      if (typeof json.insight === 'string') insight = json.insight;
      if (Array.isArray(json.hashtags)) hashtags = json.hashtags.slice(0, 5).map(String);
    }
  } catch (e) {
    console.error('[marketing] post generation failed', String(e));
  }

  const text = `📊 ${stock.name} (${stock.symbol})\n\n${insight}\n\n🔍 Full AI analysis → ${link}\n\n${hashtags.join(' ')}`;
  return { insight, hashtags, text, link };
}

// ─── Step 3: publish ──────────────────────────────────────────────────────────

export async function publishToChannels(post: ChannelPost): Promise<{ channel: string; success: boolean; error?: string }[]> {
  const results: { channel: string; success: boolean; error?: string }[] = [];

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChat = process.env.TELEGRAM_CHANNEL_ID;
  if (telegramToken && telegramChat) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChat, text: post.text, disable_web_page_preview: false }),
      });
      const body = await res.json().catch(() => ({}));
      const success = res.ok && body?.ok === true;
      // Avoid `error: undefined` — Firestore rejects undefined values on write.
      results.push(success
        ? { channel: 'telegram', success: true }
        : { channel: 'telegram', success: false, error: JSON.stringify(body).slice(0, 200) });
    } catch (e) {
      results.push({ channel: 'telegram', success: false, error: String(e) });
    }
  } else {
    results.push({ channel: 'telegram', success: false, error: 'not configured' });
  }

  return results;
}

// ─── Main run ─────────────────────────────────────────────────────────────────

export async function runMarketingAgent(): Promise<{
  stock: string;
  reason: string;
  posted: boolean;
  results: { channel: string; success: boolean; error?: string }[];
}> {
  const stock = await pickStock();
  console.log(`[marketing-agent] Featuring ${stock.name} (${stock.assetId}) — ${stock.reason}`);

  const post = await generateChannelPost(stock);
  const results = await publishToChannels(post);
  const posted = results.some((r) => r.success);

  // Record it (best-effort)
  try {
    const db = getAdminDb();
    await db.collection('marketing_posts').add({
      stock, post: { text: post.text, link: post.link, hashtags: post.hashtags },
      results, status: posted ? 'published' : 'failed',
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('[marketing-agent] firestore write failed', String(e));
  }

  console.log(`[marketing-agent] Done. posted=${posted}`, results);
  return { stock: stock.assetId, reason: stock.reason, posted, results };
}
