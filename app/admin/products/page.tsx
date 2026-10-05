import React from 'react';
import { listAllProductsAdmin } from '@/server/repositories/products.repo';
import { listAllSourcesAdmin } from '@/server/repositories/sources.repo';
import { AdminProductsListView } from '@/features/admin/AdminProductsListView';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, sources] = await Promise.all([
    listAllProductsAdmin(),
    listAllSourcesAdmin(),
  ]);

  return <AdminProductsListView initialProducts={products} sources={sources} />;
}
