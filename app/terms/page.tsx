import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

export const metadata: Metadata = {
  metadataBase: new URL('https://soufshop.store'),
  title: 'شروط الاستخدام - SoufShop',
  description: 'شروط الاستخدام لتصفح منصة SoufShop والتسوق بأمان.',
  alternates: {
    canonical: 'https://soufshop.store/ar/terms',
    languages: {
      ar: 'https://soufshop.store/ar/terms',
      en: 'https://soufshop.store/en/terms',
    },
  },
};

const termsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'شروط الاستخدام - SoufShop',
  url: 'https://soufshop.store/ar/terms',
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(termsJsonLd),
        }}
      />
      <LegalPageView docType="terms" />
    </>
  );
}
