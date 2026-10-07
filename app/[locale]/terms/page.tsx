import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPageView } from '@/features/legal/LegalPageView';

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
  const canonicalUrl = `${SITE_URL}/${isEn ? 'en' : 'ar'}/terms`;

  return {
    metadataBase: new URL(SITE_URL),
    title: isEn ? 'Terms of Use - AQURIVO' : 'شروط الاستخدام - AQURIVO',
    description: isEn
      ? 'Terms of use for browsing AQURIVO and purchasing products through partner stores.'
      : 'شروط الاستخدام لتصفح منصة AQURIVO والتسوق بأمان.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/terms`,
        en: `${SITE_URL}/en/terms`,
        'x-default': `${SITE_URL}/en/terms`,
      },
    },
    openGraph: {
      title: isEn ? 'Terms of Use - AQURIVO' : 'شروط الاستخدام - AQURIVO',
      url: canonicalUrl,
      siteName: 'AQURIVO',
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
    name: 'شروط الاستخدام - AQURIVO',
    url: `${SITE_URL}/${locale}/terms`,
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
