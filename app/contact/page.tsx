import React from 'react';
import type { Metadata } from 'next';
import { ContactView } from '@/features/contact/ContactView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'اتصل بنا - AQURIVO',
  description:
    'تواصل مع فريق AQURIVO مباشرة عبر البريد الإلكتروني soufshop.online@gmail.com أو عبر واتساب WhatsApp: +212 684 063908.',
  alternates: {
    canonical: `${SITE_URL}/ar/contact`,
    languages: {
      ar: `${SITE_URL}/ar/contact`,
      en: `${SITE_URL}/en/contact`,
      'x-default': `${SITE_URL}/en/contact`,
    },
  },
  openGraph: {
    title: 'اتصل بنا - AQURIVO',
    description:
      'البريد الإلكتروني: soufshop.online@gmail.com | واتساب: +212 684 063908 — AQURIVO.',
    url: `${SITE_URL}/ar/contact`,
    siteName: 'AQURIVO',
    type: 'website',
  },
};

const contactPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'اتصل بنا - AQURIVO',
  url: `${SITE_URL}/ar/contact`,
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
