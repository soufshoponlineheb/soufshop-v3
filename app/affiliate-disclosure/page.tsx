import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description:
    'Transparent disclosure of how SoufShop earns commissions from Amazon Associates, Noon, Temu, and ClickBank.',
};

export default function AffiliateDisclosurePage() {
  return <LegalPageView docType="affiliate-disclosure" />;
}
