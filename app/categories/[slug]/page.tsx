import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/server/repositories/categories.repo';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { CategoryView } from '@/features/catalog/CategoryView';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://soufshop.store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const category = (await getCategoryBySlug(decodedSlug)) ?? (await getCategoryBySlug(slug));
  
  if (!category) {
    return { title: 'Category Not Found | SoufShop' };
  }

  const nameAr = category.name?.ar || category.name?.en || slug;
  const nameEn = category.name?.en || category.name?.ar || slug;
  const descAr = category.description?.ar || `تسوق أفضل منتجات ${nameAr} بأفضل الأسعار والعروض الموثوقة من SoufShop.`;
  const descEn = category.description?.en || `Discover top handpicked ${nameEn} products and compare verified offers on SoufShop.`;

  return {
    title: `${nameAr} — أفضل المنتجات المختارة | SoufShop`,
    description: descAr.slice(0, 155),
    alternates: {
      canonical: `${BASE_URL}/ar/categories/${category.slug || slug}`,
      languages: {
        ar: `${BASE_URL}/ar/categories/${category.slug || slug}`,
        en: `${BASE_URL}/en/categories/${category.slug || slug}`,
        'x-default': `${BASE_URL}/en/categories/${category.slug || slug}`,
      },
    },
    openGraph: {
      title: `${nameAr} | SoufShop`,
      description: descAr.slice(0, 155),
      url: `${BASE_URL}/ar/categories/${category.slug || slug}`,
      siteName: 'SoufShop',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${nameAr} | SoufShop`,
      description: descAr.slice(0, 155),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const [category, allProducts, allArticles] = await Promise.all([
    (await getCategoryBySlug(decodedSlug)) ?? (await getCategoryBySlug(slug)),
    listPublishedProducts(),
    listPublishedArticles(),
  ]);

  if (!category) {
    notFound();
  }

  const categoryProducts = allProducts.filter((p) => p.categorySlug === category.slug);
  const categoryArticles = allArticles.filter((a) => a.categorySlug === category.slug);

  const categoryName = category.name?.ar || category.name?.en || category.slug;
  const categoryUrl = `${BASE_URL}/ar/categories/${category.slug}`;

  // Structured Data (CollectionPage + ItemList + BreadcrumbList)
  const categorySchemaJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: categoryName,
        url: categoryUrl,
        description: category.description?.ar || `أفضل منتجات ${categoryName}`,
      },
      {
        '@type': 'ItemList',
        name: categoryName,
        numberOfItems: categoryProducts.length,
        itemListElement: categoryProducts.slice(0, 30).map((product, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/ar/products/${encodeURIComponent(product.slug)}`,
          name: product.title?.ar || product.title?.en || product.name?.ar || product.slug,
          ...(product.images?.[0]?.url ? { image: product.images[0].url } : {}),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'الرئيسية',
            item: BASE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: categoryUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchemaJsonLd) }}
      />
      <CategoryView
        category={category}
        products={categoryProducts}
        articles={categoryArticles}
      />
    </>
  );
}
