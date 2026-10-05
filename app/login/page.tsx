import React from 'react';
import type { Metadata } from 'next';
import { AuthFormView } from '@/features/account/AuthFormView';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to SoufShop to sync your saved products across devices.',
};

export default function LoginPage() {
  return <AuthFormView mode="login" />;
}
