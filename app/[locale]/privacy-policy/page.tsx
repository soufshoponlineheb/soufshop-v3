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
  const canonicalUrl = `https://soufshop.store/${isEn ? 'en' : 'ar'}/privacy-policy`;

  return {
    metadataBase: new URL('https://soufshop.store'),
    title: isEn ? 'Privacy Policy - SoufShop' : 'سياسة الخصوصية - SoufShop',
    description: isEn
      ? 'Read how SoufShop protects your privacy, minimizes data collection, and respects your rights.'
      : 'تعرف على سياسة الخصوصية في SoufShop وكيف نحمي بياناتك ونحترم خصوصيتك.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: 'https://soufshop.store/ar/privacy-policy',
        en: 'https://soufshop.store/en/privacy-policy',
      },
    },
    openGraph: {
      title: isEn ? 'Privacy Policy - SoufShop' : 'سياسة الخصوصية - SoufShop',
      url: canonicalUrl,
      siteName: 'SoufShop',
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
    name: 'سياسة الخصوصية - SoufShop',
    url: `https://soufshop.store/${locale}/privacy-policy`,
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
