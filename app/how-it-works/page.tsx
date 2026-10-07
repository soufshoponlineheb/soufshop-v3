import React from 'react';
import type { Metadata } from 'next';
import { HowItWorksView } from '@/features/editorial/HowItWorksView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  title: 'كيف يعمل AQURIVO — How AQURIVO Works',
  description:
    'تعرف على كيفية عمل AQURIVO في 3 خطوات بسيطة: نبحث ونختار، نعرض لك الأفضل، وتشتري من المتجر الأصلي مباشرة بأمان تام.',
  alternates: {
    canonical: `${SITE_URL}/how-it-works`,
  },
  openGraph: {
    title: 'كيف يعمل AQURIVO — How AQURIVO Works | AQURIVO',
    description:
      'نراجع آلاف المنتجات من Amazon و Noon و Temu و ClickBank ونختار الأفضل سعراً وجودةً.',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
