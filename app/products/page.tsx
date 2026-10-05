import React from 'react';
import type { Metadata } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { CatalogView } from '@/features/catalog/CatalogView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://soufshop.store'),
  title: 'دليل المنتجات المنتقاة | SoufShop',
  description:
    'نبحث عنك ونختار لك أفضل المنتجات بأفضل الأسعار. كل ما عليك هو النقر والشراء من المتجر الأصلي مباشرة.',
  robots: 'index, follow',
  openGraph: {
    title: 'دليل المنتجات المنتقاة | SoufShop',
    description:
      'نبحث عنك ونختار لك أفضل المنتجات بأفضل الأسعار. كل ما عليك هو النقر والشراء من المتجر الأصلي مباشرة.',
    url: 'https://soufshop.store/ar/products',
    siteName: 'SoufShop',
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
    name: 'منتجات SoufShop المنتقاة',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://soufshop.store/ar/products/${encodeURIComponent(
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
