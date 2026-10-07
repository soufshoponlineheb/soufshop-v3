import React from 'react';
import type { Metadata } from 'next';
import { AboutView } from '@/features/editorial/AboutView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aqurivo.store';

export const metadata: Metadata = {
  title: 'من نحن وفريقنا — AQURIVO',
  description:
    'تعرف على فريق AQURIVO بقيادة المؤسس سفيان (مدير مشروع souftools ai)، سعيد، إلياس، خولة، وفراح. البريد: soufshop.online@gmail.com | واتساب: +212684063908.',
  alternates: {
    canonical: `${SITE_URL}/ar/about`,
  },
};

export default function ArabicAboutPage() {
  return <AboutView />;
}
