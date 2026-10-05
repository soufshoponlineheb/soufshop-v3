'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Edit3, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { PartnerSource, Product, ProductStatus } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import { useSaved } from '@/features/saved/SavedProvider';
import { useToast } from '@/components/ui/Toast';
import {
  deleteAdminDocumentFromFirebaseClient,
  getFreshFirebaseIdToken,
  syncAdminDocumentToFirebaseClient,
} from '@/lib/firebase-client';
import { formatCalendarDate, formatProductPrice } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import styles from './AdminShell.module.css';

interface AdminProductsListViewProps {
  initialProducts: Product[];
  sources: PartnerSource[];
}

export function AdminProductsListView({
  initialProducts,
  sources,
}: AdminProductsListViewProps) {
  const { locale, t } = useI18n();
  const { csrfToken } = useSaved();
  const { showToast } = useToast();
  const isAr = locale === 'ar';

  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (sourceFilter !== 'all' && p.sourceSlug !== sourceFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.title.en} ${p.title.ar} ${p.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, sourceFilter, statusFilter]);

  const handleStatusChange = async (productId: string, nextStatus: ProductStatus) => {
    if (!csrfToken) return;
    const fbToken = await getFreshFirebaseIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    };
    if (fbToken) headers['x-firebase-id-token'] = fbToken;

    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        productId,
        action: 'toggle_status',
        status: nextStatus,
      }),
    });
    if (res.ok) {
      const updatedAt = new Date().toISOString();
      const target = products.find((p) => p.id === productId);
      if (target) {
        void syncAdminDocumentToFirebaseClient('products', productId, {
          ...target,
          status: nextStatus,
          updatedAt,
        });
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: nextStatus, updatedAt } : p))
      );
      showToast(
        isAr ? 'تم تحديث حالة نشر المنتج.' : 'Product status updated.',
        'success'
      );
    }
  };

  const handleConfirmPriceToday = async (productId: string) => {
    if (!csrfToken) return;
    const fbToken = await getFreshFirebaseIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    };
    if (fbToken) headers['x-firebase-id-token'] = fbToken;

    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        productId,
        action: 'refresh_price_timestamp',
      }),
    });
    if (res.ok) {
      const nowIso = new Date().toISOString();
      const target = products.find((p) => p.id === productId);
      if (target) {
        void syncAdminDocumentToFirebaseClient('products', productId, {
          ...target,
          priceUpdatedAt: nowIso,
          updatedAt: nowIso,
        });
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, priceUpdatedAt: nowIso } : p))
      );
      showToast(
        isAr ? 'تم تأكيد صحة السعر بتاريخ اليوم.' : 'Price check timestamp refreshed.',
        'success'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !csrfToken) return;
    setIsDeleting(true);
    try {
      const targetId = deleteTarget.id;
      const fbToken = await getFreshFirebaseIdToken();
      const headers: Record<string, string> = { 'x-csrf-token': csrfToken };
      if (fbToken) headers['x-firebase-id-token'] = fbToken;

      // Delete from Cloud Firestore & RTDB via authenticated client SDK first
      await deleteAdminDocumentFromFirebaseClient('products', targetId);

      // Then delete from server mirror & revalidate all storefront routes
      const res = await fetch(
        `/api/admin/products?id=${encodeURIComponent(targetId)}`,
        {
          method: 'DELETE',
          headers,
        }
      );
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== targetId));
        setDeleteTarget(null);
        showToast(
          isAr ? 'تم حذف المنتج بنجاح من جميع الأجهزة.' : 'Product deleted.',
          'info'
        );
      } else {
        const data = (await res.json()) as { error?: string };
        showToast(data.error || 'Error deleting product', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {isAr ? 'إدارة المنتجات' : 'Manage Products'}
          </h1>
          <p className={styles.pageSubtitle}>
            {isAr
              ? 'إضافة وتعديل المنتجات، تحديث أختام الأسعار، والتحكم في حالة النشر.'
              : 'Create, edit, refresh price timestamps, and control publication status.'}
          </p>
        </div>

        <Link href="/admin/products/new" className={styles.storefrontLink}>
          <Plus size={16} aria-hidden="true" />
          <span>{isAr ? 'إضافة منتج جديد' : 'Add New Product'}</span>
        </Link>
      </div>

      <section className={styles.card}>
        <div className={styles.actionRow}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو المعرّف...' : 'Search by title or slug...'}
            className={styles.selectInput}
          />

          <div className={styles.actionRow}>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">{isAr ? 'كل المتاجر' : 'All Stores'}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.slug}>
                  {t(s.name)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="all">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="published">{isAr ? 'منشور' : 'Published'}</option>
              <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
              <option value="archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className={styles.pageSubtitle}>
            {isAr ? 'لا توجد منتجات مطابقة حالياً.' : 'No matching products found.'}
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{isAr ? 'المنتج' : 'Product'}</th>
                  <th>{isAr ? 'المتجر' : 'Store'}</th>
                  <th>{isAr ? 'السعر' : 'Price'}</th>
                  <th>{isAr ? 'تحديث السعر' : 'Price Checked'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'النقرات' : 'Clicks'}</th>
                  <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{t(item.title)}</strong>
                      <div className={styles.kpiLabel}>/{item.slug}</div>
                    </td>
                    <td>{t(item.sourceName)}</td>
                    <td className="tabularNums">
                      {item.priceDisplayPolicy === 'show_with_timestamp' && item.priceAmount
                        ? formatProductPrice(item.priceAmount, item.priceCurrency, locale)
                        : isAr
                          ? 'يُفحص في المتجر'
                          : 'Live at store'}
                    </td>
                    <td className="tabularNums">
                      {formatCalendarDate(item.priceUpdatedAt, locale)}
                    </td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as ProductStatus)
                        }
                        className={styles.topBarBtn}
                      >
                        <option value="published">{isAr ? 'منشور' : 'Published'}</option>
                        <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
                        <option value="archived">{isAr ? 'مؤرشف' : 'Archived'}</option>
                      </select>
                    </td>
                    <td className="tabularNums">{item.clicksCount || 0}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <Link
                          href={`/admin/products/${encodeURIComponent(item.id)}`}
                          className={styles.topBarBtn}
                        >
                          <Edit3 size={14} aria-hidden="true" />
                          <span>{isAr ? 'تعديل' : 'Edit'}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleConfirmPriceToday(item.id)}
                          className={styles.topBarBtn}
                          title={isAr ? 'تأكيد صحة السعر اليوم' : 'Confirm price today'}
                        >
                          <RefreshCw size={14} aria-hidden="true" />
                          <span>{isAr ? 'تحديث الختم' : 'Stamp Today'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className={styles.topBarBtn}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>{isAr ? 'حذف' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={isAr ? 'تأكيد حذف المنتج' : 'Confirm Product Deletion'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              {isAr ? 'حذف نهائي' : 'Delete Permanently'}
            </Button>
          </>
        }
      >
        <p>
          {isAr
            ? `هل أنت متأكد من حذف المنتج «${deleteTarget ? t(deleteTarget.title) : ''}»؟`
            : `Are you sure you want to permanently delete "${
                deleteTarget ? t(deleteTarget.title) : ''
              }"?`}
        </p>
      </Modal>
    </>
  );
}
