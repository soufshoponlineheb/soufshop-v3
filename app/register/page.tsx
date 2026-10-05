import React from 'react';
import type { Metadata } from 'next';
import { AuthFormView } from '@/features/account/AuthFormView';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create an optional SoufShop account to keep your saved items synced.',
};

export default function RegisterPage() {
  return <AuthFormView mode="register" />;
}
