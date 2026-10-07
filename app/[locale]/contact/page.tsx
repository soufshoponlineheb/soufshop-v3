import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactView } from '@/features/contact/ContactView';

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
  const canonicalUrl = `${SITE_URL}/${isEn ? 'en' : 'ar'}/contact`;

  return {
    metadataBase: new URL(SITE_URL),
    title: isEn ? 'Contact Us - AQURIVO' : 'اتصل بنا - AQURIVO',
    description:
      'تواصل مع فريق AQURIVO مباشرة عبر البريد الإلكتروني soufshop.online@gmail.com أو عبر واتساب WhatsApp: +212 684 063908.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/contact`,
        en: `${SITE_URL}/en/contact`,
        'x-default': `${SITE_URL}/en/contact`,
      },
    },
    openGraph: {
      title: isEn ? 'Contact Us - AQURIVO' : 'اتصل بنا - AQURIVO',
      description:
        'البريد الإلكتروني: soufshop.online@gmail.com | واتساب: +212 684 063908 — AQURIVO.',
      url: canonicalUrl,
      siteName: 'AQURIVO',
      type: 'website',
    },
  };
}

export default async function LocalizedContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const contactPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'اتصل بنا - AQURIVO',
    url: `${SITE_URL}/${locale}/contact`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageJsonLd),
        }}
      />
      <ContactView />
    </>
  );
}
