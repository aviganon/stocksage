import type { MetadataRoute } from 'next';
import { SEO_UNIVERSE } from '@/lib/seo/universe';
import { BLOG_TOPICS } from '@/lib/blog/topics';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE_URL}/analysis`,    lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/screener`,    lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/blog`,        lastModified: now, changeFrequency: 'weekly',   priority: 0.8 },
    { url: `${BASE_URL}/try`,         lastModified: now, changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE_URL}/about`,       lastModified: now, changeFrequency: 'monthly',  priority: 0.5 },
    { url: `${BASE_URL}/help`,        lastModified: now, changeFrequency: 'monthly',  priority: 0.4 },
    { url: `${BASE_URL}/terms`,       lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE_URL}/privacy`,     lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${BASE_URL}/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Analysis pages in English, French and Arabic (marketed). Hebrew pages
  // exist in code but are intentionally NOT marketed (Israeli regulation) —
  // kept out of the sitemap and set noindex.
  const langPath = (s: (typeof SEO_UNIVERSE)[number]) =>
    `/analysis/${s.exchange.toLowerCase()}/${s.symbol.toLowerCase()}`;
  const alt = (path: string) => ({
    languages: { en: `${BASE_URL}${path}`, fr: `${BASE_URL}/fr${path}`, ar: `${BASE_URL}/ar${path}` },
  });

  const analysisPages: MetadataRoute.Sitemap = SEO_UNIVERSE.map((s) => {
    const path = langPath(s);
    return { url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7, alternates: alt(path) };
  });
  const frenchPages: MetadataRoute.Sitemap = SEO_UNIVERSE.map((s) => {
    const path = langPath(s);
    return { url: `${BASE_URL}/fr${path}`, lastModified: now, changeFrequency: 'weekly', priority: 0.65, alternates: alt(path) };
  });
  const arabicPages: MetadataRoute.Sitemap = SEO_UNIVERSE.map((s) => {
    const path = langPath(s);
    return { url: `${BASE_URL}/ar${path}`, lastModified: now, changeFrequency: 'weekly', priority: 0.65, alternates: alt(path) };
  });

  const blogPages: MetadataRoute.Sitemap = BLOG_TOPICS.map((t) => ({
    url: `${BASE_URL}/blog/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...analysisPages, ...frenchPages, ...arabicPages, ...blogPages];
}
