import 'server-only';
import { getAdminDb } from '@/server/config/firebase-admin';
import { sanitizeEmail, sanitizePlainText, ValidationError } from '@/server/validators';
import type { Locale, ReportReason, ReportRecord, ReportStatus, ReportType } from '@/types';

const COLLECTION = 'reports';

const VALID_PRODUCT_REASONS: ReportReason[] = [
  'broken_link',
  'price_mismatch',
  'wrong_info',
  'unavailable',
  'other',
];

const REASON_ALIASES: Record<string, ReportReason> = {
  broken_link: 'broken_link',
  'الرابط لا يعمل': 'broken_link',
  'link is not working': 'broken_link',
  price_mismatch: 'price_mismatch',
  'السعر مختلف': 'price_mismatch',
  'price is different': 'price_mismatch',
  wrong_info: 'wrong_info',
  'معلومات خاطئة': 'wrong_info',
  'incorrect information': 'wrong_info',
  unavailable: 'unavailable',
  'المنتج غير متوفر': 'unavailable',
  'غير متوفر': 'unavailable',
  'product is unavailable': 'unavailable',
  other: 'other',
  'أخرى': 'other',
  order_issue: 'order_issue',
  'مشكلة في طلبي': 'order_issue',
  'issue with my order': 'order_issue',
};

export function normalizeReportReason(rawReason: unknown, type: ReportType): ReportReason {
  if (type === 'order_issue') {
    return 'order_issue';
  }
  const key = typeof rawReason === 'string' ? rawReason.trim().toLowerCase() : '';
  const mapped = REASON_ALIASES[key] || REASON_ALIASES[typeof rawReason === 'string' ? rawReason.trim() : ''];
  if (mapped && VALID_PRODUCT_REASONS.includes(mapped)) {
    return mapped;
  }
  throw new ValidationError('يرجى اختيار نوع المشكلة بشكل صحيح.', 'reason');
}

export interface CreateReportInput {
  type?: unknown;
  reason?: unknown;
  productSlug?: unknown;
  productName?: unknown;
  email?: unknown;
  message?: unknown;
  orderRef?: unknown;
  locale?: unknown;
}

export async function createReportServer(
  input: CreateReportInput,
  ipHash: string
): Promise<{ id: string; type: ReportType; status: ReportStatus; createdAt: string }> {
  const rawType = typeof input.type === 'string' ? input.type.trim() : '';
  if (rawType !== 'product_issue' && rawType !== 'order_issue') {
    throw new ValidationError('يرجى تحديد نوع البلاغ.', 'type');
  }
  const type: ReportType = rawType;
  const reason: ReportReason = normalizeReportReason(input.reason, type);

  const email = sanitizeEmail(input.email);
  if (!email) {
    throw new ValidationError('يرجى إدخال بريد إلكتروني صحيح للتواصل.', 'email');
  }

  const rawMessage = typeof input.message === 'string' ? input.message.trim() : '';
  if (rawMessage.length < 10) {
    throw new ValidationError('يرجى كتابة وصف للمشكلة لا يقل عن 10 أحرف.', 'message');
  }
  if (rawMessage.length > 1000) {
    throw new ValidationError('وصف المشكلة يجب ألا يتجاوز 1000 حرف.', 'message');
  }
  const message = sanitizePlainText(rawMessage, 1000);
  if (message.length < 10) {
    throw new ValidationError('يرجى كتابة وصف للمشكلة لا يقل عن 10 أحرف.', 'message');
  }

  const productSlug = sanitizePlainText(input.productSlug, 160);
  const productName = sanitizePlainText(input.productName, 220);
  const orderRef =
    type === 'order_issue' ? sanitizePlainText(input.orderRef, 120) : '';
  const locale: Locale = input.locale === 'en' ? 'en' : 'ar';

  const db = getAdminDb();
  if (!db) {
    throw new Error('Report service is temporarily unavailable.');
  }

  const createdAt = new Date().toISOString();
  const docRef = db.collection(COLLECTION).doc();

  const recordToStore = {
    type,
    reason,
    productSlug,
    productName,
    email,
    message,
    orderRef,
    locale,
    status: 'new' as ReportStatus,
    createdAt,
    ipHash,
  };

  await docRef.set(recordToStore);

  return {
    id: docRef.id,
    type,
    status: 'new',
    createdAt,
  };
}

export async function listReportsAdmin(): Promise<ReportRecord[]> {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const snap = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    const items: ReportRecord[] = snap.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const type: ReportType =
        data.type === 'order_issue' ? 'order_issue' : 'product_issue';
      let reason: ReportReason = 'other';
      try {
        reason = normalizeReportReason(data.reason, type);
      } catch {
        reason = type === 'order_issue' ? 'order_issue' : 'other';
      }
      const status: ReportStatus =
        data.status === 'in_progress' || data.status === 'resolved'
          ? data.status
          : 'new';

      return {
        id: doc.id,
        type,
        reason,
        productSlug: String(data.productSlug || ''),
        productName: String(data.productName || ''),
        email: String(data.email || ''),
        message: String(data.message || ''),
        orderRef: String(data.orderRef || ''),
        locale: data.locale === 'en' ? 'en' : 'ar',
        status,
        createdAt: String(data.createdAt || new Date().toISOString()),
      };
    });

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  } catch {
    return [];
  }
}

export async function countNewReportsAdmin(): Promise<number> {
  const reports = await listReportsAdmin();
  return reports.filter((r) => r.status === 'new').length;
}

export interface ProductWarningStats {
  brokenLinkCount: number;
  unavailableCount: number;
  totalCriticalCount: number;
  hasWarning: boolean;
}

export function computeProductWarningMap(
  reports: ReportRecord[]
): Record<string, ProductWarningStats> {
  const map: Record<string, ProductWarningStats> = {};

  for (const r of reports) {
    const key = (r.productSlug || r.productName || '').trim().toLowerCase();
    if (!key) continue;

    if (!map[key]) {
      map[key] = {
        brokenLinkCount: 0,
        unavailableCount: 0,
        totalCriticalCount: 0,
        hasWarning: false,
      };
    }

    if (r.reason === 'broken_link') {
      map[key].brokenLinkCount += 1;
      map[key].totalCriticalCount += 1;
    } else if (r.reason === 'unavailable') {
      map[key].unavailableCount += 1;
      map[key].totalCriticalCount += 1;
    }

    if (
      map[key].brokenLinkCount >= 3 ||
      map[key].unavailableCount >= 3 ||
      map[key].totalCriticalCount >= 3
    ) {
      map[key].hasWarning = true;
    }
  }

  return map;
}

export async function updateReportStatusAdmin(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }
  if (status !== 'new' && status !== 'in_progress' && status !== 'resolved') {
    throw new ValidationError('Invalid report status.', 'status');
  }
  await db.collection(COLLECTION).doc(reportId).update({ status });
}
