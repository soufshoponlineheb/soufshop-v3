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

  return {
    metadataBase: new URL(SITE_URL),
    title: isEn ? 'About Us - AQURIVO' : 'من نحن - AQURIVO',
    description:
      'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/about`,
        en: `${SITE_URL}/en/about`,
        'x-default': `${SITE_URL}/en/about`,
      },
    },
    openGraph: {
      title: isEn ? 'About Us - AQURIVO' : 'من نحن - AQURIVO',
      description:
        'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
      url: canonicalUrl,
      siteName: 'AQURIVO',
      type: 'website',
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

  const aboutPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'من نحن - AQURIVO',
    url: `${SITE_URL}/${locale}/about`,
    description:
      'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    publisher: {
      '@type': 'Organization',
      name: 'AQURIVO',
      url: SITE_URL,
    },
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
