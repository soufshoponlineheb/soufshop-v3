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

  const title = isAr
    ? 'AQURIVO — أفضل المنتجات المختارة، أدلة الشراء و11 أداة تسوق ذكية'
    : 'AQURIVO — Handpicked Products, Buying Guides & 11 Free Smart Tools';
  const description = isAr
    ? 'نختار لك أفضل المنتجات من المتاجر العالمية بعناية فائقة مع مراجعات المواصفات وأدلة الشراء و11 حاسبة تسوق ومال ذكية مجانية.'
    : 'Discover top handpicked products across global stores with verified reviews, side-by-side buying guides, and 11 free smart shopping & finance calculators.';
  const keywords = isAr
    ? [
        'AQURIVO',
        'أفضل المنتجات المختارة',
        'دليل الشراء والمراجعات',
        'مقارنة المنتجات',
        'أدوات تسوق ذكية',
        'حاسبة هل يستحق الشراء',
        'حاسبة الفائدة المخفية للتقسيط',
        'تسوق ذكي',
      ]
    : [
        'AQURIVO',
        'handpicked products',
        'buying guides and reviews',
        'product comparison',
        'smart shopping calculators',
        'cost per use calculator',
        'hidden interest calculator',
        'verified store deals',
      ];

  return {
    title,
    description,
    keywords,
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
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
        { url: '/icon', sizes: '192x192', type: 'image/png' },
      ],
      shortcut: ['/favicon.ico'],
      apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      title,
      description,
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
      locale: isAr ? 'ar_SA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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

  const isAr = locale === 'ar';

  const structuredDataJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/${locale}#website`,
        name: 'AQURIVO',
        url: `${SITE_URL}/${locale}`,
        inLanguage: isAr ? 'ar' : 'en',
        description: isAr
          ? 'نختار لك أفضل المنتجات من المتاجر العالمية بعناية فائقة مع مراجعات المواصفات وأدلة الشراء و11 حاسبة تسوق ومال ذكية مجانية.'
          : 'Discover top handpicked products across global stores with verified reviews, side-by-side buying guides, and 11 free smart shopping & finance calculators.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/${locale}/products?q={search_term}`,
          'query-input': 'required name=search_term',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'AQURIVO',
        url: SITE_URL,
        email: 'soufshop.online@gmail.com',
        telephone: '+212684063908',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/icon`,
          contentUrl: `${SITE_URL}/icon.svg`,
          width: 192,
          height: 192,
        },
        image: `${SITE_URL}/icon`,
        description: isAr
          ? 'دليل تسوق ذكي وموثوق لأفضل المنتجات العالمية مع أدوات قرار شراء مجانية'
          : 'Curated e-commerce shopping guide, product comparisons, and free decision tools',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'soufshop.online@gmail.com',
          telephone: '+212684063908',
          availableLanguage: ['Arabic', 'English'],
        },
      },
      {
        '@type': 'ItemList',
        name: isAr ? 'أقسام موقع AQURIVO الرئيسية' : 'AQURIVO Main Navigation',
        itemListElement: [
          {
            '@type': 'SiteNavigationElement',
            position: 1,
            name: isAr ? 'دليل المنتجات المنتقاة' : 'Curated Products',
            url: `${SITE_URL}/${locale}/products`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 2,
            name: isAr ? 'أدلة الشراء والمراجعات' : 'Buying Guides & Reviews',
            url: `${SITE_URL}/${locale}/guides`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 3,
            name: isAr ? 'الأدوات الذكية المجانية (11 أداة)' : 'Free Smart Tools (11 Calculators)',
            url: `${SITE_URL}/${locale}/tools`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 4,
            name: isAr ? 'من نحن ومنهجيتنا' : 'About Our Methodology',
            url: `${SITE_URL}/${locale}/about`,
          },
          {
            '@type': 'SiteNavigationElement',
            position: 5,
            name: isAr ? 'اتصل بنا' : 'Contact Us',
            url: `${SITE_URL}/${locale}/contact`,
          },
        ],
      },
      ...(products.length > 0
        ? [
            {
              '@type': 'ItemList',
              name: isAr ? 'أبرز المنتجات المختارة' : 'Featured Curated Products',
              numberOfItems: Math.min(products.length, 12),
              itemListElement: products.slice(0, 12).map((prod, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                url: `${SITE_URL}/${locale}/products/${encodeURIComponent(
                  prod.slug
                )}`,
                name: isAr
                  ? prod.title?.ar || prod.title?.en || prod.slug
                  : prod.title?.en || prod.title?.ar || prod.slug,
              })),
            },
          ]
        : []),
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
