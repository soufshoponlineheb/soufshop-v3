import React from 'react';
import type { Metadata } from 'next';
import { LegalPageView } from '@/features/legal/LegalPageView';

export const metadata: Metadata = {
  title: 'Cookie Policy & Preferences',
  description:
    'Manage your cookie preferences and learn how SoufShop uses essential and optional cookies.',
};

export default function CookiesPage() {
  return <LegalPageView docType="cookies" />;
}
