import React from 'react';
import { listAllCategoriesAdmin } from '@/server/repositories/categories.repo';
import { listAllProductsAdmin } from '@/server/repositories/products.repo';
import { AdminArticleFormView } from '@/features/admin/AdminArticleFormView';

export const dynamic = 'force-dynamic';

export default async function AdminNewArticlePage() {
  const [categories, products] = await Promise.all([
    listAllCategoriesAdmin(),
    listAllProductsAdmin(),
  ]);

  return <AdminArticleFormView categories={categories} products={products} />;
}
