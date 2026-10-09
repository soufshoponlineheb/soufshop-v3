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
  const title = isEn
    ? 'Contact AQURIVO — Editorial Support & Inquiries | AQURIVO'
    : 'اتصل بنا — تواصل مع فريق AQURIVO مباشرة';
  const description = isEn
    ? 'Get in touch with the AQURIVO team via email (soufshop.online@gmail.com) or WhatsApp (+212 684 063908) for product questions and partnerships.'
    : 'تواصل مع فريق AQURIVO مباشرة عبر البريد الإلكتروني soufshop.online@gmail.com أو عبر واتساب WhatsApp: +212 684 063908 لأي استفسار.';

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ar: `${SITE_URL}/ar/contact`,
        en: `${SITE_URL}/en/contact`,
        'x-default': `${SITE_URL}/en/contact`,
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

export default async function LocalizedContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'ar' && locale !== 'en') {
    notFound();
  }

  const isAr = locale === 'ar';

  const contactPageJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        name: isAr ? 'اتصل بنا — AQURIVO' : 'Contact Us — AQURIVO',
        url: `${SITE_URL}/${locale}/contact`,
        inLanguage: isAr ? 'ar' : 'en',
        mainEntity: {
          '@type': 'Organization',
          name: 'AQURIVO',
          email: 'soufshop.online@gmail.com',
          telephone: '+212684063908',
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
            name: isAr ? 'اتصل بنا' : 'Contact Us',
            item: `${SITE_URL}/${locale}/contact`,
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
          __html: JSON.stringify(contactPageJsonLd),
        }}
      />
      <ContactView />
    </>
  );
}
