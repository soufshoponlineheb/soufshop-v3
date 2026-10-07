import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { CatalogView } from '@/features/catalog/CatalogView';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    return {
      metadataBase: new URL(SITE_URL),
      title: '404 — Page Not Found | AQURIVO',
      robots: 'noindex, nofollow',
    };
  }

  const isEn = locale === 'en';
  const canonicalUrl = `${SITE_URL}/${isEn ? 'en' : 'ar'}/products`;

  return {
    metadataBase: new URL(SITE_URL),
    title: isEn
      ? 'Curated Products Directory | AQURIVO'
      : 'دليل المنتجات المنتقاة | AQURIVO',
    description: isEn
      ? 'Top curated products across global stores in one place — compare prices and verified offers.'
      : 'أفضل المنتجات من أكبر المتاجر العالمية في مكان واحد — قارن الأسعار والعروض الموثوقة.',
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/products`,
        en: `${SITE_URL}/en/products`,
        'x-default': `${SITE_URL}/en/products`,
      },
    },
    openGraph: {
      title: isEn
        ? 'Curated Products Directory | AQURIVO'
        : 'دليل المنتجات المنتقاة | AQURIVO',
      description: isEn
        ? 'Top curated products across global stores in one place'
        : 'أفضل المنتجات من أكبر المتاجر العالمية في مكان واحد',
      url: canonicalUrl,
      siteName: 'AQURIVO',
      type: 'website',
    },
  };
}

export default async function LocalizedProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; source?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const [resolvedSearch, products, categories, sources] = await Promise.all([
    searchParams,
    listPublishedProducts(),
    listActiveCategories(),
    listActiveSources(),
  ]);

  const isEn = locale === 'en';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isEn ? 'AQURIVO Curated Products' : 'منتجات AQURIVO المنتقاة',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/${isEn ? 'en' : 'ar'}/products/${encodeURIComponent(
        product.slug
      )}`,
      name: isEn
        ? product.title?.en || product.title?.ar
        : product.title?.ar || product.title?.en,
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
        initialCategorySlug={resolvedSearch.category || 'all'}
        initialSourceSlug={resolvedSearch.source || 'all'}
        initialSearchQuery={resolvedSearch.q || ''}
      />
    </>
  );
}
