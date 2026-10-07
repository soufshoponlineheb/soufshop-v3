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
  const canonicalUrl = `${SITE_URL}/${isEn ? 'en' : 'ar'}/privacy-policy`;

  return {
    metadataBase: new URL(SITE_URL),
    title: isEn ? 'Privacy Policy - AQURIVO' : 'سياسة الخصوصية - AQURIVO',
    description: isEn
      ? 'Read how AQURIVO protects your privacy, minimizes data collection, and respects your rights.'
      : 'تعرف على سياسة الخصوصية في AQURIVO وكيف نحمي بياناتك ونحترم خصوصيتك.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/privacy-policy`,
        en: `${SITE_URL}/en/privacy-policy`,
        'x-default': `${SITE_URL}/en/privacy-policy`,
      },
    },
    openGraph: {
      title: isEn ? 'Privacy Policy - AQURIVO' : 'سياسة الخصوصية - AQURIVO',
      url: canonicalUrl,
      siteName: 'AQURIVO',
      type: 'website',
    },
  };
}

export default async function LocalizedPrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const privacyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'سياسة الخصوصية - AQURIVO',
    url: `${SITE_URL}/${locale}/privacy-policy`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(privacyJsonLd),
        }}
      />
      <LegalPageView docType="privacy" />
    </>
  );
}
