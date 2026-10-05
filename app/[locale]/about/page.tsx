import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutView } from '@/features/editorial/AboutView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    return {
      metadataBase: new URL('https://soufshop.store'),
      title: '404 | SoufShop',
      robots: 'noindex, nofollow',
    };
  }

  const isEn = locale === 'en';
  const canonicalUrl = `https://soufshop.store/${isEn ? 'en' : 'ar'}/about`;

  return {
    metadataBase: new URL('https://soufshop.store'),
    title: isEn ? 'About Us - SoufShop' : 'من نحن - SoufShop',
    description:
      'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: 'https://soufshop.store/ar/about',
        en: 'https://soufshop.store/en/about',
      },
    },
    openGraph: {
      title: isEn ? 'About Us - SoufShop' : 'من نحن - SoufShop',
      description:
        'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
      url: canonicalUrl,
      siteName: 'SoufShop',
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
    name: 'من نحن - SoufShop',
    url: `https://soufshop.store/${locale}/about`,
    description:
      'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    publisher: {
      '@type': 'Organization',
      name: 'SoufShop',
      url: 'https://soufshop.store',
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
