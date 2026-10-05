'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import type { ContactMessage, Product } from '@/types';
import type { OutboundClickRecord } from '@/server/repositories/clicks.repo';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { useToast } from '@/components/ui/Toast';
import { formatCalendarDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { AmazonImportSection } from './AmazonImportSection';
import styles from './AdminShell.module.css';

interface AdminOverviewViewProps {
  products: Product[];
  clicks: OutboundClickRecord[];
  messages: ContactMessage[];
  firebaseAdminReady: boolean;
  cloudinaryReady: boolean;
}

export function AdminOverviewView({
  products: initialProducts,
  clicks,
  messages,
  firebaseAdminReady,
  cloudinaryReady,
}: AdminOverviewViewProps) {
  const { locale, t } = useI18n();
  const { csrfToken } = useSaved();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [products, setProducts] = useState(initialProducts);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const clicksToday = clicks.filter(
    (c) => nowMs - new Date(c.createdAt).getTime() <= dayMs
  ).length;
  const clicks7d = clicks.filter(
    (c) => nowMs - new Date(c.createdAt).getTime() <= 7 * dayMs
  ).length;
  const clicks30d = clicks.filter(
    (c) => nowMs - new Date(c.createdAt).getTime() <= 30 * dayMs
  ).length;

  const stalePriceProducts = products.filter((p) => {
    const updatedMs = new Date(p.priceUpdatedAt).getTime();
    return Number.isFinite(updatedMs) && nowMs - updatedMs > 14 * dayMs;
  });

  const unreadMessages = messages.filter((m) => !m.isRead);
  const topProducts = [...products]
    .sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0))
    .slice(0, 5);

  const handleConfirmPriceToday = async (productId: string) => {
    if (!csrfToken) return;
    setRefreshingId(productId);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          productId,
          action: 'refresh_price_timestamp',
        }),
      });
      if (res.ok) {
        const nowIso = new Date().toISOString();
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, priceUpdatedAt: nowIso } : p))
        );
        showToast(
          isAr ? 'تم تحديث ختم تاريخ السعر إلى اليوم.' : 'Price check timestamp updated to today.',
          'success'
        );
      }
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {isAr ? 'لوحة المعلومات التشغيلية' : 'Operational Dashboard'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'متابعة أداء نقرات العمولة، حالة الأسعار، والرسائل الواردة.'
              : 'Monitor outbound affiliate clicks, price freshness, and reader messages.'}
          </p>
        </div>

        <Link href="/admin/products/new" className={styles.storefrontLink}>
          <Plus size={16} aria-hidden="true" />
          <span>{isAr ? 'إضافة منتج جديد' : 'Add New Product'}</span>
        </Link>
      </div>

      {/* Honest "Not Set Up Yet" Notice if Credentials Are Missing */}
      {(!firebaseAdminReady || !cloudinaryReady) && (
        <div className={styles.alertBanner} role="status">
          <strong>
            {isAr
              ? 'تنبيه إعداد الخدمات الخلفية (حالة صادقة)'
              : 'Backend Service Configuration Status'}
          </strong>
          {!firebaseAdminReady && (
            <p>
              {isAr
                ? '• قاعدة بيانات Firebase Admin غير متصلة بعد: يرجى إضافة FIREBASE_ADMIN_PROJECT_ID وFIREBASE_ADMIN_CLIENT_EMAIL وFIREBASE_ADMIN_PRIVATE_KEY في متغيرات البيئة لتفعيل الحفظ الدائم.'
                : '• Firebase Admin is not configured yet: Add FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in environment variables to enable persistent storage.'}
            </p>
          )}
          {!cloudinaryReady && (
            <p>
              {isAr
                ? '• خدمة Cloudinary لرفع الصور غير مفعّلة بعد: يمكنك حالياً إدخال روابط صور HTTPS مباشرة، أو إضافة CLOUDINARY_CLOUD_NAME وCLOUDINARY_API_KEY وCLOUDINARY_API_SECRET لتفعيل الرفع الموقّع.'
                : '• Cloudinary signed upload is not configured yet: You can enter HTTPS image URLs directly, or set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'}
            </p>
          )}
        </div>
      )}

      {/* KPI Metrics */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isAr ? 'نقرات اليوم (24 ساعة)' : 'Clicks Today (24h)'}
          </span>
          <span className={`${styles.kpiValue} tabularNums`}>{clicksToday}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isAr ? 'نقرات آخر 7 أيام' : 'Clicks (Last 7 Days)'}
          </span>
          <span className={`${styles.kpiValue} tabularNums`}>{clicks7d}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isAr ? 'نقرات آخر 30 يوماً' : 'Clicks (Last 30 Days)'}
          </span>
          <span className={`${styles.kpiValue} tabularNums`}>{clicks30d}</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            {isAr ? 'إجمالي المنتجات' : 'Total Products'}
          </span>
          <span className={`${styles.kpiValue} tabularNums`}>{products.length}</span>
        </div>
      </div>

      {/* Amazon PA-API 5.0 Import Section */}
      <AmazonImportSection />

      {/* Stale Price Alerts (>14 Days) */}
      {stalePriceProducts.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <AlertTriangle size={18} aria-hidden="true" />{' '}
            {isAr
              ? `منتجات مضى على مراجعة سعرها أكثر من 14 يوماً (${stalePriceProducts.length})`
              : `Products With Price Unchecked for >14 Days (${stalePriceProducts.length})`}
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المنتج' : 'Product'}</th>
                  <th>{isAr ? 'المتجر' : 'Store'}</th>
                  <th>{isAr ? 'آخر تحديث للسعر' : 'Last Checked'}</th>
                  <th>{isAr ? 'إجراء سريع' : 'Quick Action'}</th>
                </tr>
              </thead>
              <tbody>
                {stalePriceProducts.map((item) => (
                  <tr key={item.id}>
                    <td>{t(item.title)}</td>
                    <td>{t(item.sourceName)}</td>
                    <td className="tabularNums">
                      {formatCalendarDate(item.priceUpdatedAt, locale)}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirmPriceToday(item.id)}
                        isLoading={refreshingId === item.id}
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                        <span>
                          {isAr ? 'تأكيد صحة السعر اليوم' : 'Confirm Price Today'}
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Top Clicked Products */}
      <section className={styles.card}>
        <div className={styles.pageHeader}>
          <h2 className={styles.cardTitle}>
            {isAr ? 'أكثر المنتجات تحويلاً للشراء' : 'Top Performing Products'}
          </h2>
          <Link href="/admin/analytics" className={styles.topBarBtn}>
            {isAr ? 'عرض التقارير الكاملة' : 'Full Analytics'}
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'لا توجد منتجات مسجلة بعد. ابدأ بإضافة أول منتج من زر «إضافة منتج جديد».'
              : 'No products added yet. Start by adding your first curated product.'}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المنتج' : 'Product'}</th>
                  <th>{isAr ? 'المتجر الشريك' : 'Partner Store'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'إجمالي النقرات' : 'Total Clicks'}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <Link href={`/admin/products/${encodeURIComponent(product.id)}`}>
                        <strong>{t(product.title)}</strong>
                      </Link>
                    </td>
                    <td>{t(product.sourceName)}</td>
                    <td>
                      <span
                        className={
                          product.status === 'published'
                            ? styles.badgeSuccess
                            : styles.badgeNeutral
                        }
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="tabularNums">{product.clicksCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unread Messages Summary */}
      <section className={styles.card}>
        <div className={styles.pageHeader}>
          <h2 className={styles.cardTitle}>
            {isAr
              ? `أحدث الرسائل غير المقروءة (${unreadMessages.length})`
              : `Unread Reader Messages (${unreadMessages.length})`}
          </h2>
          <Link href="/admin/messages" className={styles.topBarBtn}>
            {isAr ? 'فتح صندوق الرسائل' : 'Open Inbox'}
          </Link>
        </div>

        {unreadMessages.length === 0 ? (
          <p className={styles.pageSubtitle}>
            <CheckCircle2 size={15} aria-hidden="true" />{' '}
            {isAr ? 'لا توجد رسائل غير مقروءة حالياً.' : 'All reader messages have been read.'}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المرسل' : 'Sender'}</th>
                  <th>{isAr ? 'الموضوع' : 'Subject'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {unreadMessages.slice(0, 5).map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      {msg.senderName} ({msg.senderEmail})
                    </td>
                    <td>{msg.subject}</td>
                    <td className="tabularNums">
                      {formatCalendarDate(msg.createdAt, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
