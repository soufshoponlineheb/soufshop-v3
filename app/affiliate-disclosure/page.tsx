import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description:
    'Transparent disclosure of how AQURIVO earns commissions from Amazon Associates, Noon, Temu, and ClickBank.',
  alternates: {
    canonical: `${SITE_URL}/affiliate-disclosure`,
  },
};

export default function AffiliateDisclosurePage() {
  return <LegalPageView docType="affiliate-disclosure" />;
}
