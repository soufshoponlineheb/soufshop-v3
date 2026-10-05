import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

export const metadata: Metadata = {
  metadataBase: new URL('https://soufshop.store'),
  title: 'سياسة الخصوصية - SoufShop',
  description:
    'تعرف على سياسة الخصوصية في SoufShop وكيف نحمي بياناتك ونحترم خصوصيتك.',
  alternates: {
    canonical: 'https://soufshop.store/ar/privacy-policy',
    languages: {
      ar: 'https://soufshop.store/ar/privacy-policy',
      en: 'https://soufshop.store/en/privacy-policy',
    },
  },
};

const privacyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'سياسة الخصوصية - SoufShop',
  url: 'https://soufshop.store/ar/privacy-policy',
};

export default function PrivacyPolicyPage() {
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
