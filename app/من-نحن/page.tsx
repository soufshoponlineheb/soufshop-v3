import React from 'react';
import type { Metadata } from 'next';
import { AboutView } from '@/features/editorial/AboutView';

export const metadata: Metadata = {
  title: 'من نحن وفريقنا — SoufShop',
  description:
    'تعرف على فريق SoufShop بقيادة المؤسس سفيان (مدير مشروع souftools ai)، سعيد، إلياس، خولة، وفراح. البريد: soufshop.online@gmail.com | واتساب: +212684063908.',
};

export default function ArabicAboutPage() {
  return <AboutView />;
}
