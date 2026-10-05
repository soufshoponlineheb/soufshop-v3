import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContactView } from '@/features/contact/ContactView';

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
  const canonicalUrl = `https://soufshop.store/${isEn ? 'en' : 'ar'}/contact`;

  return {
    metadataBase: new URL('https://soufshop.store'),
    title: isEn ? 'Contact Us - SoufShop' : 'اتصل بنا - SoufShop',
    description:
      'تواصل مع فريق SoufShop مباشرة عبر البريد الإلكتروني soufshop.online@gmail.com أو عبر واتساب WhatsApp: +212 684 063908.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: 'https://soufshop.store/ar/contact',
        en: 'https://soufshop.store/en/contact',
      },
    },
    openGraph: {
      title: isEn ? 'Contact Us - SoufShop' : 'اتصل بنا - SoufShop',
      description:
        'البريد الإلكتروني: soufshop.online@gmail.com | واتساب: +212 684 063908 — SoufShop.',
      url: canonicalUrl,
      siteName: 'SoufShop',
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
    name: 'اتصل بنا - SoufShop',
    url: `https://soufshop.store/${locale}/contact`,
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
