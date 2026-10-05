'use client';

import React, { useState } from 'react';
import type { SiteSettings } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './AdminShell.module.css';

export function AdminSettingsView({
  initialSettings,
}: {
  initialSettings: SiteSettings;
}) {
  const { locale } = useI18n();
  const { csrfToken } = useSaved();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [siteNameEn, setSiteNameEn] = useState(initialSettings.siteName.en);
  const [siteNameAr, setSiteNameAr] = useState(initialSettings.siteName.ar);
  const [topBarEn, setTopBarEn] = useState(initialSettings.topBarAnnouncement.en);
  const [topBarAr, setTopBarAr] = useState(initialSettings.topBarAnnouncement.ar);
  const [topBarEnabled, setTopBarEnabled] = useState(initialSettings.topBarEnabled);
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail);
  const [contactPhoneDisplay, setContactPhoneDisplay] = useState(
    initialSettings.contactPhoneDisplay
  );
  const [contactPhoneE164, setContactPhoneE164] = useState(
    initialSettings.contactPhoneE164
  );
  const [whatsappUrl, setWhatsappUrl] = useState(initialSettings.whatsappUrl);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          siteName: { en: siteNameEn, ar: siteNameAr },
          topBarAnnouncement: { en: topBarEn, ar: topBarAr },
          topBarEnabled,
          contactEmail,
          contactPhoneDisplay,
          contactPhoneE164,
          whatsappUrl,
        }),
      });
      if (res.ok) {
        showToast(
          isAr ? 'تم حفظ إعدادات الموقع بنجاح.' : 'Site settings updated.',
          'success'
        );
      } else {
        const data = (await res.json()) as { error?: string };
        showToast(data.error || 'Error saving settings', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {isAr ? 'إعدادات الموقع العامة' : 'General Site Settings'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'تحديث اسم الموقع، الشريط الترحيبي العلوي، وبيانات التواصل الرسمية.'
              : 'Update brand title, announcement bar, and official contact details.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.card}>
        <div className={styles.formGrid}>
          <Input
            label={isAr ? 'اسم الموقع (بالإنجليزية)' : 'Site Name (English)'}
            value={siteNameEn}
            onChange={(e) => setSiteNameEn(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'اسم الموقع (بالعربية)' : 'Site Name (Arabic)'}
            value={siteNameAr}
            onChange={(e) => setSiteNameAr(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'نص الشريط العلوي (بالإنجليزية)' : 'Announcement Text (English)'}
            value={topBarEn}
            onChange={(e) => setTopBarEn(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'نص الشريط العلوي (بالعربية)' : 'Announcement Text (Arabic)'}
            value={topBarAr}
            onChange={(e) => setTopBarAr(e.target.value)}
            required
          />
          <Input
            type="email"
            label={isAr ? 'البريد الإلكتروني الرسمي' : 'Official Contact Email'}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'رقم الهاتف المعروض' : 'Display Phone Number'}
            value={contactPhoneDisplay}
            onChange={(e) => setContactPhoneDisplay(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'رقم الهاتف بصيغة E.164' : 'Phone E.164 Format'}
            value={contactPhoneE164}
            onChange={(e) => setContactPhoneE164(e.target.value)}
            required
          />
          <Input
            label={isAr ? 'رابط واتساب الرسمي' : 'Official WhatsApp URL'}
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            required
          />
        </div>

        <label className={styles.actionRow}>
          <input
            type="checkbox"
            checked={topBarEnabled}
            onChange={(e) => setTopBarEnabled(e.target.checked)}
          />
          <span className={styles.fieldLabel}>
            {isAr ? 'تفعيل الشريط العلوي في المتجر' : 'Enable Top Announcement Bar'}
          </span>
        </label>

        <div className={styles.actionRow}>
          <Button type="submit" isLoading={saving}>
            {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </>
  );
}
