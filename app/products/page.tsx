import React from 'react';
import type { Metadata } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { CatalogView } from '@/features/catalog/CatalogView';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'دليل المنتجات المنتقاة | AQURIVO',
  description:
    'نبحث عنك ونختار لك أفضل المنتجات بأفضل الأسعار. كل ما عليك هو النقر والشراء من المتجر الأصلي مباشرة.',
  robots: 'index, follow',
  alternates: {
    canonical: `${SITE_URL}/ar/products`,
    languages: {
      ar: `${SITE_URL}/ar/products`,
      en: `${SITE_URL}/en/products`,
      'x-default': `${SITE_URL}/en/products`,
    },
  },
  openGraph: {
    title: 'دليل المنتجات المنتقاة | AQURIVO',
    description:
      'نبحث عنك ونختار لك أفضل المنتجات بأفضل الأسعار. كل ما عليك هو النقر والشراء من المتجر الأصلي مباشرة.',
    url: `${SITE_URL}/ar/products`,
    siteName: 'AQURIVO',
    type: 'website',
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; source?: string; q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [products, categories, sources] = await Promise.all([
    listPublishedProducts(),
    listActiveCategories(),
    listActiveSources(),
  ]);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'منتجات AQURIVO المنتقاة',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/ar/products/${encodeURIComponent(
        product.slug
      )}`,
      name: product.title?.ar || product.title?.en,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <CatalogView
        initialProducts={products}
        categories={categories}
        sources={sources}
        initialCategorySlug={resolvedSearchParams.category || 'all'}
        initialSourceSlug={resolvedSearchParams.source || 'all'}
        initialSearchQuery={resolvedSearchParams.q || ''}
      />
    </>
  );
}
