import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { CatalogView } from '@/features/catalog/CatalogView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    return {
      metadataBase: new URL('https://soufshop.store'),
      title: '404 — Page Not Found | SoufShop',
      robots: 'noindex, nofollow',
    };
  }

  const isEn = locale === 'en';
  const canonicalUrl = `https://soufshop.store/${isEn ? 'en' : 'ar'}/products`;

  return {
    metadataBase: new URL('https://soufshop.store'),
    title: isEn
      ? 'Curated Products Directory | SoufShop'
      : 'دليل المنتجات المنتقاة | SoufShop',
    description: isEn
      ? 'Top curated products across global stores in one place — compare prices and verified offers.'
      : 'أفضل المنتجات من أكبر المتاجر العالمية في مكان واحد — قارن الأسعار والعروض الموثوقة.',
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: 'https://soufshop.store/ar/products',
        en: 'https://soufshop.store/en/products',
      },
    },
    openGraph: {
      title: isEn
        ? 'Curated Products Directory | SoufShop'
        : 'دليل المنتجات المنتقاة | SoufShop',
      description: isEn
        ? 'Top curated products across global stores in one place'
        : 'أفضل المنتجات من أكبر المتاجر العالمية في مكان واحد',
      url: canonicalUrl,
      siteName: 'SoufShop',
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
    name: isEn ? 'SoufShop Curated Products' : 'منتجات SoufShop المنتقاة',
    numberOfItems: products.length,
    itemListElement: products.slice(0, 50).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://soufshop.store/${isEn ? 'en' : 'ar'}/products/${encodeURIComponent(
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
