import React from 'react';
import type { Metadata } from 'next';
import { AboutView } from '@/features/editorial/AboutView';

export const metadata: Metadata = {
  metadataBase: new URL('https://soufshop.store'),
  title: 'من نحن - SoufShop',
  description:
    'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
  alternates: {
    canonical: 'https://soufshop.store/ar/about',
    languages: {
      ar: 'https://soufshop.store/ar/about',
      en: 'https://soufshop.store/en/about',
    },
  },
  openGraph: {
    title: 'من نحن - SoufShop',
    description:
      'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
    url: 'https://soufshop.store/ar/about',
    siteName: 'SoufShop',
    type: 'website',
  },
};

const aboutPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'من نحن - SoufShop',
  url: 'https://soufshop.store/ar/about',
  description:
    'SoufShop منصة لاختيار وعرض أفضل المنتجات، نوجهك مباشرة للمتجر الأصلي للشراء بأمان',
  publisher: {
    '@type': 'Organization',
    name: 'SoufShop',
    url: 'https://soufshop.store',
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
