import React from 'react';
import { getSiteSettings } from '@/server/repositories/settings.repo';
import { AdminSettingsView } from '@/features/admin/AdminSettingsView';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  return <AdminSettingsView initialSettings={settings} />;
}
