import type { MetadataRoute } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { TOOLS_DATA } from '@/lib/tools-data';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';
const LOCALES = ['en', 'ar'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, articles, categories] = await Promise.all([
    listPublishedProducts(),
    listPublishedArticles(),
    listActiveCategories(),
  ]);

  const mainEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/en/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/en/guides`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
    },
    {
      url: `${BASE_URL}/en/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ar`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/ar/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ar/guides`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
    },
    {
      url: `${BASE_URL}/ar/tools`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const staticPages = ['about', 'contact', 'privacy-policy', 'terms'] as const;
  const localizedStaticEntries: MetadataRoute.Sitemap = LOCALES.flatMap(
    (locale) =>
      staticPages.map((page) => ({
        url: `${BASE_URL}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
  );

  const rootTransparencyPages = [
    'how-it-works',
    'affiliate-disclosure',
    'cookies',
  ] as const;
  const transparencyEntries: MetadataRoute.Sitemap = rootTransparencyPages.map(
    (page) => ({
      url: `${BASE_URL}/${page}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })
  );

  const enProductEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/en/products/${encodeURIComponent(product.slug)}`,
    lastModified: new Date(product.updatedAt || product.createdAt || now),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const arProductEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/ar/products/${encodeURIComponent(product.slug)}`,
    lastModified: new Date(product.updatedAt || product.createdAt || now),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const enArticleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/en/guides/${encodeURIComponent(article.slug)}`,
    lastModified: new Date(article.updatedAt || article.publishedAt || now),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const arArticleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/ar/guides/${encodeURIComponent(article.slug)}`,
    lastModified: new Date(article.updatedAt || article.publishedAt || now),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const categoryEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    categories.map((cat) => ({
      url: `${BASE_URL}/${locale}/categories/${encodeURIComponent(cat.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))
  );

  const toolEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    TOOLS_DATA.map((tool) => ({
      url: `${BASE_URL}/${locale}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }))
  );

  return [
    ...mainEntries,
    ...localizedStaticEntries,
    ...transparencyEntries,
    ...categoryEntries,
    ...enProductEntries,
    ...arProductEntries,
    ...enArticleEntries,
    ...arArticleEntries,
    ...toolEntries,
  ];
}
