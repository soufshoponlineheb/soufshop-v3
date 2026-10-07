import React from 'react';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';
const SITE_URL_COM = process.env.NEXT_PUBLIC_SITE_URL_COM || 'https://aqurivo.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = locale === 'ar' ? 'ar' : 'en';

  return {
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}/${safeLocale}`,
      languages: {
        en: `${SITE_URL}/en`,
        ar: `${SITE_URL}/ar`,
        'x-default': `${SITE_URL}/en`,
      },
    },
  };
}

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
      <link rel="alternate" hrefLang="ar" href={`${SITE_URL}/ar`} />
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_URL}/en`}
      />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL_COM}/en`} />
      <link rel="alternate" hrefLang="ar" href={`${SITE_URL_COM}/ar`} />
      {children}
    </>
  );
}
