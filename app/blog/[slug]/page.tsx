import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findTopic } from '@/lib/blog/topics';
import { getBlogArticle } from '@/lib/blog/article';
import { findSeoStock } from '@/lib/seo/universe';
import { parseAssetId } from '@/lib/data/asset-id';

// On-demand ISR (weekly). Articles generate at runtime on first visit / via the
// warmer cron — not at build time (where secrets aren't available).
export const revalidate = 604800;
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stocksage.io';

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) return {};
  const article = await getBlogArticle(topic).catch(() => null);
  const title = article?.metaTitle ?? topic.title;
  const description = article?.metaDescription ?? `${topic.title} — a clear, neutral guide for investors from StockSage.`;
  const canonical = `${BASE_URL}/blog/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: 'StockSage', type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

function relatedLinks(assetIds: string[]) {
  return assetIds.map((id) => {
    try {
      const { exchange, symbol } = parseAssetId(id as `${string}:${string}`);
      const known = findSeoStock(exchange, symbol);
      return { href: `/analysis/${exchange.toLowerCase()}/${symbol.toLowerCase()}`, label: known?.name ?? symbol, symbol };
    } catch { return null; }
  }).filter((x): x is { href: string; label: string; symbol: string } => x !== null);
}

export default async function BlogArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();

  const article = await getBlogArticle(topic).catch(() => null);
  if (!article) notFound();

  const canonical = `${BASE_URL}/blog/${slug}`;
  const related = relatedLinks(topic.related);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.metaDescription,
        author: { '@type': 'Organization', name: 'StockSage' },
        publisher: { '@type': 'Organization', name: 'StockSage' },
        mainEntityOfPage: canonical,
      },
      {
        '@type': 'FAQPage',
        mainEntity: article.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Blog', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 2, name: article.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen text-[#e8e8f0]" dir="ltr">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="glass-nav sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">Stock<span className="text-gradient">Sage</span></Link>
          <Link href="/try" className="text-sm btn-glow text-white px-4 py-2 rounded-lg">Analyze any stock free →</Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/blog" className="hover:text-gray-300">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{article.category}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{article.title}</h1>
        <p className="text-lg text-gray-300 leading-relaxed mb-8">{article.intro}</p>

        {/* Key takeaways */}
        {article.keyTakeaways.length > 0 && (
          <div className="glass-card rounded-2xl p-5 mb-8">
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wide mb-3">Key takeaways</p>
            <ul className="space-y-2">
              {article.keyTakeaways.map((k, i) => (
                <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-indigo-400 shrink-0">→</span>{k}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-8">
          {article.sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-white mb-3">{s.heading}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} className="text-gray-300 leading-relaxed mb-3">{p}</p>
              ))}
            </section>
          ))}
        </div>

        {/* Related analyses — internal links + funnel */}
        {related.length > 0 && (
          <div className="mt-10 glass rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-3">Related AI analyses</p>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.symbol} href={r.href}
                  className="text-xs bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                  <span className="font-semibold text-white">{r.symbol}</span> · {r.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ */}
        {article.faq.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-white mb-5">Frequently asked questions</h2>
            <div className="space-y-4">
              {article.faq.map((f, i) => (
                <div key={i} className="glass rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">{f.q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="text-center glass-card rounded-2xl p-8 mt-10">
          <h2 className="text-2xl font-bold text-white mb-2">Research any stock with AI in seconds</h2>
          <p className="text-gray-400 mb-6">Company profile, financials, events, competition, risks and synthesis — automated.</p>
          <Link href="/try" className="inline-block btn-glow text-white font-semibold px-8 py-4 rounded-xl text-lg">Start free — no signup</Link>
        </div>

        <p className="text-xs text-gray-600 text-center border-t border-white/5 pt-6 mt-8">
          For informational and educational purposes only — not investment advice.
        </p>
      </article>
    </div>
  );
}
