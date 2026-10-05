import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPageView } from '@/features/legal/LegalPageView';

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
  const canonicalUrl = `https://soufshop.store/${isEn ? 'en' : 'ar'}/terms`;

  return {
    metadataBase: new URL('https://soufshop.store'),
    title: isEn ? 'Terms of Use - SoufShop' : 'شروط الاستخدام - SoufShop',
    description: isEn
      ? 'Terms of use for browsing SoufShop and purchasing products through partner stores.'
      : 'شروط الاستخدام لتصفح منصة SoufShop والتسوق بأمان.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: 'https://soufshop.store/ar/terms',
        en: 'https://soufshop.store/en/terms',
      },
    },
    openGraph: {
      title: isEn ? 'Terms of Use - SoufShop' : 'شروط الاستخدام - SoufShop',
      url: canonicalUrl,
      siteName: 'SoufShop',
      type: 'website',
    },
  };
}

export default async function LocalizedTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const termsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'شروط الاستخدام - SoufShop',
    url: `https://soufshop.store/${locale}/terms`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termsJsonLd),
        }}
      />
      <LegalPageView docType="terms" />
    </>
  );
}
