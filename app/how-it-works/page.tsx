import React from 'react';
import type { Metadata } from 'next';
import { HowItWorksView } from '@/features/editorial/HowItWorksView';

export const metadata: Metadata = {
  title: 'كيف يعمل SoufShop — How SoufShop Works',
  description:
    'تعرف على كيفية عمل SoufShop في 3 خطوات بسيطة: نبحث ونختار، نعرض لك الأفضل، وتشتري من المتجر الأصلي مباشرة بأمان تام.',
  openGraph: {
    title: 'كيف يعمل SoufShop — How SoufShop Works | SoufShop',
    description:
      'نراجع آلاف المنتجات من Amazon و Noon و Temu و ClickBank ونختار الأفضل سعراً وجودةً.',
  },
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
