import type { MetadataRoute } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';
const LOCALES = ['en', 'ar'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, articles] = await Promise.all([
    listPublishedProducts(),
    listPublishedArticles(),
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

  return [
    ...mainEntries,
    ...localizedStaticEntries,
    ...enProductEntries,
    ...arProductEntries,
    ...enArticleEntries,
    ...arArticleEntries,
  ];
}
