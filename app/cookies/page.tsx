import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  title: 'Cookie Policy & Preferences',
  description:
    'Manage your cookie preferences and learn how AQURIVO uses essential and optional cookies.',
  alternates: {
    canonical: `${SITE_URL}/cookies`,
  },
};

export default function CookiesPage() {
  return <LegalPageView docType="cookies" />;
}
