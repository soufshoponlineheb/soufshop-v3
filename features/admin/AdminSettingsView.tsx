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

  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<{
    checked: boolean;
    spfFound: boolean;
    spfValue: string;
    dmarcFound: boolean;
    dmarcValue: string;
  }>({
    checked: false,
    spfFound: false,
    spfValue: '',
    dmarcFound: false,
    dmarcValue: '',
  });

  const handleCopyRecord = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(
        isAr ? `تم نسخ سجل ${label} بنجاح.` : `Copied ${label} record to clipboard.`,
        'success'
      );
    } catch {
      showToast(
        isAr ? 'تعذر النسخ التلقائي، يرجى تحديد النص ونسخه.' : 'Could not copy automatically.',
        'error'
      );
    }
  };

  const handleVerifyDnsRecords = async () => {
    setDnsChecking(true);
    try {
      const [spfRes, dmarcRes] = await Promise.all([
        fetch('https://dns.google/resolve?name=aqurivo.store&type=TXT', { cache: 'no-store' }),
        fetch('https://dns.google/resolve?name=_dmarc.aqurivo.store&type=TXT', { cache: 'no-store' }),
      ]);
      const spfJson = (await spfRes.json()) as { Answer?: Array<{ data?: string }> };
      const dmarcJson = (await dmarcRes.json()) as { Answer?: Array<{ data?: string }> };

      const spfAnswers = (spfJson.Answer || []).map((a) => (a.data || '').replace(/^"|"$/g, ''));
      const dmarcAnswers = (dmarcJson.Answer || []).map((a) => (a.data || '').replace(/^"|"$/g, ''));

      const spfMatch = spfAnswers.find((txt) => txt.toLowerCase().includes('v=spf1')) || '';
      const dmarcMatch = dmarcAnswers.find((txt) => txt.toLowerCase().includes('v=dmarc1')) || '';

      setDnsStatus({
        checked: true,
        spfFound: Boolean(spfMatch),
        spfValue: spfMatch,
        dmarcFound: Boolean(dmarcMatch),
        dmarcValue: dmarcMatch,
      });

      if (spfMatch && dmarcMatch) {
        showToast(
          isAr
            ? 'تم التحقق! سجلا SPF و DMARC منشوران وفعالان على نطاق aqurivo.store.'
            : 'Verified! Both SPF and DMARC records are published on aqurivo.store.',
          'success'
        );
      } else {
        showToast(
          isAr
            ? 'تم فحص DNS: يرجى إضافة السجلات الموضحة أدناه في لوحة تحكم النطاق.'
            : 'DNS checked: Please add the missing TXT records at your DNS provider.',
          'info'
        );
      }
    } catch {
      showToast(
        isAr ? 'تعذر الاتصال بخادم فحص DNS حالياً.' : 'Unable to reach DNS resolver right now.',
        'error'
      );
    } finally {
      setDnsChecking(false);
    }
  };

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

  const spfRecordValue = 'v=spf1 -all';
  const dmarcObserveValue = 'v=DMARC1; p=none; sp=none; adkim=s; aspf=s; rua=mailto:soufshop.online@gmail.com';
  const dmarcRejectValue = 'v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s; rua=mailto:soufshop.online@gmail.com';

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

      {/* Domain Email Anti-Spoofing (SPF & DMARC) + Security Headers Verification */}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>
              {isAr
                ? 'حماية النطاق من انتحال البريد (SPF & DMARC) وترويسات الأمان'
                : 'Domain Email Anti-Spoofing (SPF & DMARC) & Security Headers'}
            </h2>
            <p className={styles.pageSubtitle}>
              {isAr
                ? 'أضف سجلات TXT التالية في لوحة تحكم DNS الخاصة بنطاق aqurivo.store لمنع أي جهة من إرسال بريد مزيف باسم موقعك.'
                : 'Add these TXT records in your DNS provider for aqurivo.store to prevent email spoofing.'}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={dnsChecking}
            onClick={handleVerifyDnsRecords}
          >
            {isAr ? 'فحص سجلات DNS الآن' : 'Verify DNS Records Live'}
          </Button>
        </div>

        {dnsStatus.checked && (
          <div className={styles.alertBanner} role="status">
            <strong>
              {isAr ? 'نتيجة الفحص المباشر لنطاق aqurivo.store:' : 'Live DNS Check Result for aqurivo.store:'}
            </strong>
            <p>
              • <strong>SPF (`aqurivo.store`):</strong>{' '}
              {dnsStatus.spfFound
                ? `${isAr ? 'مفعّل بنجاح' : 'Published'} (${dnsStatus.spfValue})`
                : isAr
                  ? 'غير منشور بعد في DNS — انسخ السجل الأول أدناه وأضفه في لوحة النطاق.'
                  : 'Not published in DNS yet — copy Record 1 below into your DNS panel.'}
            </p>
            <p>
              • <strong>DMARC (`_dmarc.aqurivo.store`):</strong>{' '}
              {dnsStatus.dmarcFound
                ? `${isAr ? 'مفعّل بنجاح' : 'Published'} (${dnsStatus.dmarcValue})`
                : isAr
                  ? 'غير منشور بعد في DNS — انسخ السجل الثاني أدناه وأضفه في لوحة النطاق.'
                  : 'Not published in DNS yet — copy Record 2 below into your DNS panel.'}
            </p>
          </div>
        )}

        <div className={styles.mobileAdminCards} style={{ display: 'flex' }}>
          <div className={styles.mobileAdminCard}>
            <div className={styles.mobileAdminCardHeader}>
              <div>
                <h3 className={styles.mobileAdminCardTitle}>
                  {isAr ? '1. سجل SPF (منع إرسال بريد مزيف باسم النطاق)' : '1. SPF Record (Prevent Spoofing)'}
                </h3>
                <p className={styles.mobileAdminCardSub}>
                  Type: <strong>TXT</strong> | Host / Name: <strong>@</strong> (aqurivo.store)
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCopyRecord('SPF', spfRecordValue)}
              >
                {isAr ? 'نسخ القيمة' : 'Copy Value'}
              </Button>
            </div>
            <div className={styles.mobileAdminCardMeta}>
              <div className={styles.mobileAdminMetaItem}>
                <span className={styles.mobileAdminMetaLabel}>TXT Value</span>
                <span className={styles.mobileAdminMetaValue} dir="ltr">
                  {spfRecordValue}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.mobileAdminCard}>
            <div className={styles.mobileAdminCardHeader}>
              <div>
                <h3 className={styles.mobileAdminCardTitle}>
                  {isAr
                    ? '2. سجل DMARC — وضع المراقبة الموصى به للبدء (p=none)'
                    : '2. DMARC Record — Observation Mode (p=none)'}
                </h3>
                <p className={styles.mobileAdminCardSub}>
                  Type: <strong>TXT</strong> | Host / Name: <strong>_dmarc</strong> (_dmarc.aqurivo.store)
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCopyRecord('DMARC (p=none)', dmarcObserveValue)}
              >
                {isAr ? 'نسخ القيمة' : 'Copy Value'}
              </Button>
            </div>
            <div className={styles.mobileAdminCardMeta}>
              <div className={styles.mobileAdminMetaItem}>
                <span className={styles.mobileAdminMetaLabel}>TXT Value</span>
                <span className={styles.mobileAdminMetaValue} dir="ltr">
                  {dmarcObserveValue}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.mobileAdminCard}>
            <div className={styles.mobileAdminCardHeader}>
              <div>
                <h3 className={styles.mobileAdminCardTitle}>
                  {isAr
                    ? '3. سجل DMARC — وضع الحظر الصارم (p=reject)'
                    : '3. DMARC Record — Strict Reject Mode (p=reject)'}
                </h3>
                <p className={styles.mobileAdminCardSub}>
                  Type: <strong>TXT</strong> | Host / Name: <strong>_dmarc</strong> (_dmarc.aqurivo.store)
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleCopyRecord('DMARC (p=reject)', dmarcRejectValue)}
              >
                {isAr ? 'نسخ القيمة' : 'Copy Value'}
              </Button>
            </div>
            <div className={styles.mobileAdminCardMeta}>
              <div className={styles.mobileAdminMetaItem}>
                <span className={styles.mobileAdminMetaLabel}>TXT Value</span>
                <span className={styles.mobileAdminMetaValue} dir="ltr">
                  {dmarcRejectValue}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
