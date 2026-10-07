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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return {
    title: isAr
      ? 'AQURIVO — أفضل المنتجات المختارة بعناية'
      : "AQURIVO — Handpicked Products You'll Love",
    description: isAr
      ? 'نختار لك أفضل المنتجات من الإنترنت بعناية. تسوق بأمان وثقة مع AQURIVO.'
      : 'We handpick the best products from around the web. Shop smarter with AQURIVO.',
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        en: `${SITE_URL}/en`,
        ar: `${SITE_URL}/ar`,
        'x-default': `${SITE_URL}/en`,
      },
    },
    verification: {
      google: 'oS_3HRPs49irqAH5Ey9SwCB9vrNxeshh61SYJSfZP2E',
    },
    openGraph: {
      title: isAr
        ? 'AQURIVO — أفضل المنتجات المختارة'
        : 'AQURIVO — Handpicked Products',
      description: isAr
        ? 'نختار لك أفضل المنتجات من الإنترنت بعناية.'
        : 'We handpick the best products from around the web.',
      images: [
        {
          url: `${SITE_URL}/images/hero-bg.jpg`,
          width: 1200,
          height: 630,
          alt: 'AQURIVO',
        },
      ],
      url: `${SITE_URL}/${locale}`,
      siteName: 'AQURIVO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: isAr
        ? 'AQURIVO — أفضل المنتجات المختارة'
        : 'AQURIVO — Handpicked Products',
      description: isAr
        ? 'نختار لك أفضل المنتجات من الإنترنت بعناية.'
        : 'We handpick the best products from around the web.',
      images: [`${SITE_URL}/images/hero-bg.jpg`],
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
        name: 'AQURIVO',
        url: SITE_URL,
        description:
          locale === 'ar'
            ? 'نختار لك أفضل المنتجات من الإنترنت بعناية. تسوق بأمان وثقة مع AQURIVO.'
            : 'We handpick the best products from around the web. Shop smarter with AQURIVO.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/${locale}/products?q={search_term}`,
          'query-input': 'required name=search_term',
        },
      },
      {
        '@type': 'Organization',
        name: 'AQURIVO',
        url: SITE_URL,
        logo: `${SITE_URL}/images/hero-bg.jpg`,
        description:
          locale === 'ar'
            ? 'دليل تسوق ذكي وموثوق لأفضل المنتجات العالمية'
            : 'Curated e-commerce shopping guide & product recommendations',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@aqurivo.store',
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
