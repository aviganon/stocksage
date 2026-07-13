/**
 * Blog article generator + cache. Mirrors the SEO analysis engine: one grounded
 * Claude call per topic, cached in Firestore (`blog_articles`), regenerated when
 * missing or stale. Pages read the cache; a cron warms/refreshes the set.
 */

import { z } from 'zod';
import { callClaude } from '@/lib/ai/client';
import { getAdminDb } from '@/lib/firebase/admin';
import type { BlogTopic } from './topics';

const COLLECTION = 'blog_articles';
const STALE_DAYS = 30;

export const BlogArticleSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  intro: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    paragraphs: z.array(z.string()),
  })),
  keyTakeaways: z.array(z.string()),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type BlogArticleContent = z.infer<typeof BlogArticleSchema>;

export interface BlogArticle extends BlogArticleContent {
  slug: string;
  title: string;
  category: string;
  generatedAt: string;
}

function isStale(generatedAt?: string): boolean {
  if (!generatedAt) return true;
  return Date.now() - new Date(generatedAt).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000;
}

const SYSTEM = `You are a financial writer producing a clear, genuinely useful SEO blog article for retail investors. You explain concepts plainly, stay neutral, and NEVER give buy/sell/hold recommendations or price predictions — you teach how to think, not what to do. Output a single valid JSON object, no markdown, no prose outside the JSON.`;

function buildPrompt(topic: BlogTopic): string {
  return `Write an SEO blog article.

TITLE: ${topic.title}
PRIMARY SEARCH INTENT / KEYWORD: ${topic.keyword}
CATEGORY: ${topic.category}

Return a JSON object with EXACTLY these fields:
- "metaTitle": SEO title under 60 chars (can differ slightly from the title above).
- "metaDescription": 140-160 chars, compelling, includes the core keyword.
- "intro": 2-3 sentence opening that hooks the reader and states what they'll learn.
- "sections": array of 4-6 objects { "heading": string, "paragraphs": [string, ...] }. Each section 1-3 paragraphs. Cover the topic thoroughly and practically. For comparison topics, dedicate sections to each side plus a "how to weigh them" section. For educational topics, define the concept, show how to use it, and give a concrete example. Use real, well-known facts; do not invent specific numbers you're unsure of.
- "keyTakeaways": array of 3-5 short bullet strings summarizing the practical takeaways.
- "faq": array of 3-5 {"q","a"} pairs answering related questions people Google. Answers 1-3 sentences.

Rules:
- Neutral and educational. NEVER say "buy", "sell", "should invest", "will go up/down", or give price targets.
- Frame everything as "considerations", "how to evaluate", "what to watch".
- Clear English for a global retail-investor audience.
- Return ONLY the JSON object.`;
}

export async function generateBlogArticle(topic: BlogTopic): Promise<BlogArticle | null> {
  let content: BlogArticleContent;
  try {
    const result = await callClaude({
      model: 'claude-haiku-4-5',
      systemPrompt: SYSTEM,
      prompt: buildPrompt(topic),
      schema: BlogArticleSchema,
      maxTokens: 3500,
      temperature: 0.5,
    });
    content = result.data;
  } catch (e) {
    console.error('[blog/article] generation failed', topic.slug, String(e));
    return null;
  }

  const article: BlogArticle = {
    ...content,
    slug: topic.slug,
    title: topic.title,
    category: topic.category,
    generatedAt: new Date().toISOString(),
  };

  try {
    await getAdminDb().collection(COLLECTION).doc(topic.slug).set(article);
  } catch (e) {
    console.error('[blog/article] cache write failed', topic.slug, String(e));
  }

  return article;
}

/** Read cached article; regenerate if missing or stale. */
export async function getBlogArticle(topic: BlogTopic): Promise<BlogArticle | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(topic.slug).get();
    if (snap.exists) {
      const data = snap.data() as BlogArticle;
      if (!isStale(data.generatedAt)) return data;
    }
  } catch (e) {
    console.error('[blog/article] cache read failed', topic.slug, String(e));
  }
  return generateBlogArticle(topic);
}

/** Read cache only — no generation. */
export async function peekBlogArticle(slug: string): Promise<BlogArticle | null> {
  try {
    const snap = await getAdminDb().collection(COLLECTION).doc(slug).get();
    if (snap.exists) return snap.data() as BlogArticle;
  } catch { /* ignore */ }
  return null;
}

export { isStale as isBlogArticleStale };
