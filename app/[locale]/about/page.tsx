import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/features/editorial/AboutView';

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
      title: '404 | AQURIVO',
      robots: 'noindex, nofollow',
    };
  }

  const isEn = locale === 'en';
  const canonicalUrl = `${SITE_URL}/${isEn ? 'en' : 'ar'}/about`;
  const title = isEn
    ? 'About AQURIVO — Independent Product Curation & Methodology | AQURIVO'
    : 'من نحن ومنهجيتنا في اختيار المنتجات — AQURIVO';
  const description = isEn
    ? 'Learn how AQURIVO independently researches, evaluates, and compares products across global stores with full transparency.'
    : 'تعرف على منصة AQURIVO ومنهجيتنا المستقلة في فحص ومقارنة أفضل المنتجات العالمية وتوجيهك للشراء المباشر بأمان وشفافية.';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/about`,
        en: `${SITE_URL}/en/about`,
        'x-default': `${SITE_URL}/en/about`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'AQURIVO',
      locale: isEn ? 'en_US' : 'ar_SA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LocalizedAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const isAr = locale === 'ar';

  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        name: isAr
          ? 'من نحن ومنهجيتنا — AQURIVO'
          : 'About AQURIVO & Our Methodology',
        url: `${SITE_URL}/${locale}/about`,
        inLanguage: isAr ? 'ar' : 'en',
        description: isAr
          ? 'AQURIVO منصة مستقلة لاختيار ومقارنة أفضل المنتجات وتوجيهك للمتجر الأصلي للشراء بأمان.'
          : 'AQURIVO is an independent product curation and comparison platform directing shoppers to official partner stores.',
        publisher: {
          '@type': 'Organization',
          name: 'AQURIVO',
          url: SITE_URL,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isAr ? 'الرئيسية' : 'Home',
            item: `${SITE_URL}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isAr ? 'من نحن' : 'About Us',
            item: `${SITE_URL}/${locale}/about`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutPageJsonLd),
        }}
      />
      <AboutView />
    </>
  );
}
