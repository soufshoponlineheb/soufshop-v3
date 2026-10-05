import React from 'react';
import type { Metadata } from 'next';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { AccountView } from '@/features/account/AccountView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Saved Picks & Account',
  description: 'View and compare your saved curated products on SoufShop.',
};

export default async function AccountPage() {
  const products = await listPublishedProducts();
  return <AccountView allProducts={products} />;
}
