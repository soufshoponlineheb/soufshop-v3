import React from 'react';
import { getServiceReadiness } from '@/server/config/env';
import { listAllProductsAdmin } from '@/server/repositories/products.repo';
import { listRecentClicksAdmin } from '@/server/repositories/clicks.repo';
import { listMessagesAdmin } from '@/server/repositories/messages.repo';
import { AdminOverviewView } from '@/features/admin/AdminOverviewView';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const readiness = getServiceReadiness();
  const [products, clicks, messages] = await Promise.all([
    listAllProductsAdmin(),
    listRecentClicksAdmin(500),
    listMessagesAdmin(),
  ]);

  return (
    <AdminOverviewView
      products={products}
      clicks={clicks}
      messages={messages}
      firebaseAdminReady={readiness.firebaseAdminConfigured}
      cloudinaryReady={readiness.cloudinaryConfigured}
    />
  );
}
