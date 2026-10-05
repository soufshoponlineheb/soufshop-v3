import React from 'react';
import type { Metadata } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';
import { listApprovedTestimonialsServer } from '@/server/repositories/testimonials.repo';
import { listPublishedArticles } from '@/server/repositories/articles.repo';
import { HomeClient } from '@/components/sections/HomeClient';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://soufshop.store';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SoufShop — أفضل المنتجات المختارة بعناية',
  description:
    'نختار لك أفضل المنتجات من الإنترنت بعناية. تسوق بأمان وثقة مع SoufShop.',
  keywords: 'تسوق اونلاين، منتجات مختارة، افضل اسعار، عروض مميزة',
  robots: 'index, follow',
  openGraph: {
    title: 'SoufShop — أفضل المنتجات المختارة',
    description: 'نختار لك أفضل المنتجات من الإنترنت بعناية.',
    url: siteUrl,
    siteName: 'SoufShop',
    images: [{ url: `${siteUrl}/images/hero-bg.jpg`, width: 1200, height: 630, alt: 'SoufShop' }],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoufShop — أفضل المنتجات المختارة',
    description: 'نختار لك أفضل المنتجات من الإنترنت بعناية.',
    images: [`${siteUrl}/images/hero-bg.jpg`],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      en: `${siteUrl}/en`,
      ar: `${siteUrl}/ar`,
      'x-default': `${siteUrl}/en`,
    },
  },
};

export default async function HomePage() {
  const [products, categories, sources, testimonials, articles] = await Promise.all([
    listPublishedProducts(),
    listActiveCategories(),
    listActiveSources(),
    listApprovedTestimonialsServer(),
    listPublishedArticles(),
  ]);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SoufShop',
    url: 'https://soufshop.store',
    description: 'Discover top curated products and compare prices',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://soufshop.store/en/products?q={search_term}',
      'query-input': 'required name=search_term',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeClient
        products={products}
        categories={categories}
        sources={sources}
        testimonials={testimonials}
        articles={articles}
        pageLocale="en"
      />
    </>
  );
}
