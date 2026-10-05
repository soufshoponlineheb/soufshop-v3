import React from 'react';
import type { Metadata } from 'next';
import { ContactView } from '@/features/contact/ContactView';

export const metadata: Metadata = {
  metadataBase: new URL('https://soufshop.store'),
  title: 'اتصل بنا - SoufShop',
  description:
    'تواصل مع فريق SoufShop مباشرة عبر البريد الإلكتروني soufshop.online@gmail.com أو عبر واتساب WhatsApp: +212 684 063908.',
  alternates: {
    canonical: 'https://soufshop.store/ar/contact',
    languages: {
      ar: 'https://soufshop.store/ar/contact',
      en: 'https://soufshop.store/en/contact',
    },
  },
  openGraph: {
    title: 'اتصل بنا - SoufShop',
    description:
      'البريد الإلكتروني: soufshop.online@gmail.com | واتساب: +212 684 063908 — SoufShop.',
    url: 'https://soufshop.store/ar/contact',
    siteName: 'SoufShop',
    type: 'website',
  },
};

const contactPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'اتصل بنا - SoufShop',
  url: 'https://soufshop.store/ar/contact',
};

export default function ContactPage() {
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
