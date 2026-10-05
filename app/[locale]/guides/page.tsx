import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { GuidesView } from './GuidesView';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://soufshop.store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    return {
      title: 'Not Found | SoufShop',
    };
  }

  const isAr = locale === 'ar';
  const title = isAr
    ? 'أدلة الشراء والمراجعات الشاملة | SoufShop'
    : 'Editorial Buying Guides & In-Depth Reviews | SoufShop';

  const description = isAr
    ? 'مقارنات دقيقة ودلائل شراء عملية تساعدك على اختيار أفضل المنتجات بأفضل الأسعار الموثوقة.'
    : 'Comprehensive buying guides, specs comparisons, and candid product recommendations from the SoufShop editorial team.';

  const canonicalUrl = `${BASE_URL}/${locale}/guides`;

  return {
    title,
    description: description.slice(0, 155),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${BASE_URL}/ar/guides`,
        en: `${BASE_URL}/en/guides`,
        'x-default': `${BASE_URL}/en/guides`,
      },
    },
    openGraph: {
      title,
      description: description.slice(0, 155),
      url: canonicalUrl,
      siteName: 'SoufShop',
      type: 'website',
      images: [
        {
          url: `${BASE_URL}/images/hero-bg.jpg`,
          width: 1200,
          height: 630,
          alt: 'SoufShop Buying Guides',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 155),
      images: [`${BASE_URL}/images/hero-bg.jpg`],
    },
  };
}

export default async function LocalizedGuidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const [articles, categories] = await Promise.all([
    listPublishedArticles(),
    listActiveCategories(),
  ]);

  const isAr = locale === 'ar';

  const collectionSchemaJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: isAr ? 'أدلة الشراء والمراجعات' : 'Buying Guides & Reviews',
        url: `${BASE_URL}/${locale}/guides`,
        description: isAr
          ? 'مقارنات دقيقة ودلائل شراء عملية لاختيار أفضل المنتجات.'
          : 'Curated buying guides and product comparisons.',
      },
      {
        '@type': 'ItemList',
        name: isAr ? 'أدلة SoufShop' : 'SoufShop Buying Guides',
        numberOfItems: articles.length,
        itemListElement: articles.slice(0, 30).map((article, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${BASE_URL}/${locale}/guides/${encodeURIComponent(article.slug)}`,
          name: isAr ? article.title.ar : article.title.en,
          description: (isAr ? article.excerpt.ar : article.excerpt.en).slice(0, 155),
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: `${BASE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'أدلة الشراء' : 'Buying Guides',
            item: `${BASE_URL}/${locale}/guides`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchemaJsonLd) }}
      />
      <GuidesView articles={articles} categories={categories} />
    </>
  );
}
