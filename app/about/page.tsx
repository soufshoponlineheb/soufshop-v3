import React from 'react';
import type { Metadata } from 'next';
import { AboutView } from '@/features/editorial/AboutView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'من نحن - AQURIVO',
  description:
    'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
  alternates: {
    canonical: `${SITE_URL}/ar/about`,
    languages: {
      ar: `${SITE_URL}/ar/about`,
      en: `${SITE_URL}/en/about`,
      'x-default': `${SITE_URL}/en/about`,
    },
  },
  openGraph: {
    title: 'من نحن - AQURIVO',
    description:
      'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    url: `${SITE_URL}/ar/about`,
    siteName: 'AQURIVO',
    type: 'website',
  },
};

const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'من نحن - AQURIVO',
  url: `${SITE_URL}/ar/about`,
  description:
    'AQURIVO منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
  publisher: {
    '@type': 'Organization',
    name: 'AQURIVO',
    url: SITE_URL,
  },
};

export default function AboutPage() {
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
