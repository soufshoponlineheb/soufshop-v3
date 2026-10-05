import React from 'react';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = locale === 'ar' ? 'ar' : 'en';

  return {
    metadataBase: new URL('https://soufshop.store'),
    alternates: {
      canonical: `https://soufshop.store/${safeLocale}`,
      languages: {
        en: 'https://soufshop.store/en',
        ar: 'https://soufshop.store/ar',
        'x-default': 'https://soufshop.store/en',
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
      <link rel="alternate" hrefLang="en" href="https://soufshop.store/en" />
      <link rel="alternate" hrefLang="ar" href="https://soufshop.store/ar" />
      <link
        rel="alternate"
        hrefLang="x-default"
        href="https://soufshop.store/en"
      />
      {children}
    </>
  );
}
