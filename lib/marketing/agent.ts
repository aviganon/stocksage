/**
 * StockSage Marketing Agent
 *
 * Runs daily to:
 * 1. Find the most-researched stocks from yesterday
 * 2. Generate multilingual social content with Claude
 * 3. Save posts to Firestore (ready to publish when accounts are set up)
 * 4. Post to connected channels (Telegram, LinkedIn, Facebook)
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const SUPPORTED_LANGUAGES = ['he', 'en', 'ru', 'fr', 'ar'] as const;
type Lang = (typeof SUPPORTED_LANGUAGES)[number];

interface TrendingStock {
  assetId: string;
  assetName: string;
  count: number;
}

interface GeneratedPost {
  lang: Lang;
  platform: 'telegram' | 'linkedin' | 'facebook' | 'twitter';
  content: string;
  hashtags: string[];
}

// ─── Step 1: Get trending stocks from yesterday ───────────────────────────────

export async function getTrendingStocks(limit = 5): Promise<TrendingStock[]> {
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
    const id   = d['assetId'] as string;
    const name = d['assetName'] as string;
    if (!id) continue;
    if (!counts[id]) counts[id] = { name, count: 0 };
    counts[id]!.count++;
  }

  return Object.entries(counts)
    .map(([assetId, { name, count }]) => ({ assetId, assetName: name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ─── Step 2: Generate content with Claude ────────────────────────────────────

const LANG_INSTRUCTIONS: Record<Lang, string> = {
  he: 'כתוב בעברית. טון מקצועי אך נגיש. קהל: משקיעים ישראלים.',
  en: 'Write in English. Professional yet accessible tone. Audience: international investors.',
  ru: 'Пиши на русском. Профессиональный, но доступный тон. Аудитория: русскоязычные инвесторы.',
  fr: 'Écris en français. Ton professionnel mais accessible. Audience: investisseurs francophones.',
  ar: 'اكتب بالعربية. أسلوب مهني لكن سهل. الجمهور: المستثمرون الناطقون بالعربية.',
};

export async function generatePosts(stock: TrendingStock): Promise<GeneratedPost[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const posts: GeneratedPost[] = [];

  for (const lang of SUPPORTED_LANGUAGES) {
    const prompt = `
${LANG_INSTRUCTIONS[lang]}

המניה המחקרת ביותר היום ב-StockSage: ${stock.assetName} (${stock.assetId})
כמות מחקרים: ${stock.count} חקירות

צור פוסט לרשת חברתית (2-3 משפטים קצרים):
- אזכר את שם המניה
- הוסף נקודה מעניינת כללית על חברה/ענף (ללא המלצת קנייה/מכירה)
- קריאה לפעולה: "נסה ניתוח AI חינמי ב-StockSage.io"
- 3-5 hashtags רלוונטיים

החזר JSON בלבד:
{
  "content": "תוכן הפוסט",
  "hashtags": ["#tag1", "#tag2"]
}
`;

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content.find(b => b.type === 'text')?.text ?? '';
      const json = JSON.parse(text.replace(/```json?\s*/gi, '').replace(/```/g, '').trim());

      // Create versions for each platform
      for (const platform of ['telegram', 'linkedin', 'facebook'] as const) {
        posts.push({
          lang,
          platform,
          content: json.content,
          hashtags: json.hashtags ?? [],
        });
      }
    } catch (e) {
      console.error(`[marketing] Failed to generate ${lang} content`, String(e));
    }
  }

  return posts;
}

// ─── Step 3: Save to Firestore ────────────────────────────────────────────────

export async function savePostsToFirestore(
  stock: TrendingStock,
  posts: GeneratedPost[],
): Promise<string> {
  const db  = getAdminDb();
  const ref = db.collection('marketing_posts').doc();

  await ref.set({
    id:        ref.id,
    stock:     stock,
    posts:     posts,
    status:    'ready',       // ready | published | skipped
    createdAt: FieldValue.serverTimestamp(),
    publishedAt: null,
    stats: { views: 0, clicks: 0 },
  });

  return ref.id;
}

// ─── Step 4: Post to channels (when connected) ───────────────────────────────

export async function publishToChannels(
  postId: string,
  posts: GeneratedPost[],
): Promise<{ channel: string; success: boolean; error?: string }[]> {
  const results: { channel: string; success: boolean; error?: string }[] = [];

  // Telegram
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChat  = process.env.TELEGRAM_CHANNEL_ID;
  if (telegramToken && telegramChat) {
    const hePost = posts.find(p => p.lang === 'he' && p.platform === 'telegram');
    if (hePost) {
      try {
        const text = `${hePost.content}\n\n${hePost.hashtags.join(' ')}`;
        const res  = await fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramChat, text, parse_mode: 'HTML' }),
          },
        );
        results.push({ channel: 'telegram', success: res.ok });
      } catch (e) {
        results.push({ channel: 'telegram', success: false, error: String(e) });
      }
    }
  } else {
    results.push({ channel: 'telegram', success: false, error: 'not configured' });
  }

  // LinkedIn & Facebook — placeholders until API keys are set up
  results.push({ channel: 'linkedin', success: false, error: 'not configured yet' });
  results.push({ channel: 'facebook', success: false, error: 'not configured yet' });

  // Update Firestore with results
  const db = getAdminDb();
  await db.collection('marketing_posts').doc(postId).update({
    status: results.some(r => r.success) ? 'published' : 'ready',
    publishResults: results,
    publishedAt: FieldValue.serverTimestamp(),
  });

  return results;
}

// ─── Main run function ────────────────────────────────────────────────────────

export async function runMarketingAgent(): Promise<{
  stocksFound: number;
  postsGenerated: number;
  publishResults: unknown[];
}> {
  console.log('[marketing-agent] Starting daily run...');

  const trending = await getTrendingStocks(3);
  if (trending.length === 0) {
    console.log('[marketing-agent] No trending stocks today, skipping.');
    return { stocksFound: 0, postsGenerated: 0, publishResults: [] };
  }

  // Pick the top stock
  const topStock = trending[0]!;
  console.log(`[marketing-agent] Top stock: ${topStock.assetName} (${topStock.count} reports)`);

  // Generate content in all 5 languages
  const posts   = await generatePosts(topStock);
  const postId  = await savePostsToFirestore(topStock, posts);

  // Publish to connected channels
  const results = await publishToChannels(postId, posts);

  console.log(`[marketing-agent] Done. ${posts.length} posts generated, results:`, results);
  return { stocksFound: trending.length, postsGenerated: posts.length, publishResults: results };
}
