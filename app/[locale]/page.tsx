import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { listApprovedTestimonialsServer } from '@/server/repositories/testimonials.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { HomeClient } from '@/components/sections/HomeClient';
import type { Locale } from '@/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return {
    title: isAr
      ? 'SoufShop — أفضل المنتجات المختارة بعناية'
      : "SoufShop — Handpicked Products You'll Love",
    description: isAr
      ? 'نختار لك أفضل المنتجات من الإنترنت بعناية. تسوق بأمان وثقة مع SoufShop.'
      : 'We handpick the best products from around the web. Shop smarter with SoufShop.',
    alternates: {
      canonical: `https://soufshop.store/${locale}`,
      languages: {
        en: 'https://soufshop.store/en',
        ar: 'https://soufshop.store/ar',
        'x-default': 'https://soufshop.store/en',
      },
    },
    openGraph: {
      title: isAr
        ? 'SoufShop — أفضل المنتجات المختارة'
        : 'SoufShop — Handpicked Products',
      description: isAr
        ? 'نختار لك أفضل المنتجات من الإنترنت بعناية.'
        : 'We handpick the best products from around the web.',
      images: [
        {
          url: 'https://soufshop.store/images/hero-bg.jpg',
          width: 1200,
          height: 630,
          alt: 'SoufShop',
        },
      ],
      url: `https://soufshop.store/${locale}`,
      siteName: 'SoufShop',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: isAr
        ? 'SoufShop — أفضل المنتجات المختارة'
        : 'SoufShop — Handpicked Products',
      description: isAr
        ? 'نختار لك أفضل المنتجات من الإنترنت بعناية.'
        : 'We handpick the best products from around the web.',
      images: ['https://soufshop.store/images/hero-bg.jpg'],
    },
  };
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const [products, categories, sources, testimonials, articles] = await Promise.all([
    listPublishedProducts(),
    listActiveCategories(),
    listActiveSources(),
    listApprovedTestimonialsServer(),
    listPublishedArticles(),
  ]);

  const structuredDataJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'SoufShop',
        url: 'https://soufshop.store',
        description:
          locale === 'ar'
            ? 'نختار لك أفضل المنتجات من الإنترنت بعناية. تسوق بأمان وثقة مع SoufShop.'
            : 'We handpick the best products from around the web. Shop smarter with SoufShop.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `https://soufshop.store/${locale}/products?q={search_term}`,
          'query-input': 'required name=search_term',
        },
      },
      {
        '@type': 'Organization',
        name: 'SoufShop',
        url: 'https://soufshop.store',
        logo: 'https://soufshop.store/images/hero-bg.jpg',
        description:
          locale === 'ar'
            ? 'دليل تسوق ذكي وموثوق لأفضل المنتجات العالمية'
            : 'Curated e-commerce shopping guide & product recommendations',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@soufshop.store',
          availableLanguage: ['Arabic', 'English'],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataJsonLd) }}
      />
      <HomeClient
        products={products}
        categories={categories}
        sources={sources}
        testimonials={testimonials}
        articles={articles}
        pageLocale={locale as Locale}
      />
    </>
  );
}
