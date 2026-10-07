import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseClientFirestore } from '@/lib/firebase-client';

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
  approved: boolean;
  locale: 'ar' | 'en';
}

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 'default-1',
    name: 'أحمد م.',
    rating: 5,
    text: 'وجدت منتجاً كنت أبحث عنه من أسبوع في أقل من دقيقة عبر AQURIVO',
    createdAt: '2026-09-28T10:00:00.000Z',
    approved: true,
    locale: 'ar',
  },
  {
    id: 'default-2',
    name: 'Sarah K.',
    rating: 5,
    text: 'Great way to compare prices across multiple stores without switching tabs',
    createdAt: '2026-09-30T14:30:00.000Z',
    approved: true,
    locale: 'en',
  },
  {
    id: 'default-3',
    name: 'ليلى ح.',
    rating: 4,
    text: 'سهّل عليّ كثيراً مقارنة الأسعار بين المتاجر المختلفة',
    createdAt: '2026-10-02T09:15:00.000Z',
    approved: true,
    locale: 'ar',
  },
];

/**
 * Retrieves testimonials from Firestore `testimonials` collection.
 * When `onlyApproved` is true (default), returns only `approved == true` items.
 * When `onlyApproved` is false (admin view), returns all or unapproved items.
 */
export async function getTestimonials(
  onlyApproved = true
): Promise<Testimonial[]> {
  try {
    const db = getFirebaseClientFirestore();
    if (db) {
      const colRef = collection(db, 'testimonials');
      const q = onlyApproved
        ? query(colRef, where('approved', '==', true), limit(30))
        : query(colRef, limit(100));

      const snap = await getDocs(q);
      const items: Testimonial[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: String(data.name || ''),
          rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
          text: String(data.text || ''),
          createdAt: String(data.createdAt || new Date().toISOString()),
          approved: Boolean(data.approved),
          locale: data.locale === 'en' ? 'en' : 'ar',
        };
      });

      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      if (onlyApproved) {
        return items.length > 0
          ? [...items, ...FALLBACK_TESTIMONIALS]
          : FALLBACK_TESTIMONIALS;
      }
      return items;
    }
  } catch {
    // Fall back to API endpoint if client Firestore rules/network block direct query
  }

  try {
    const endpoint = onlyApproved
      ? '/api/testimonials'
      : '/api/admin/testimonials';
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { testimonials?: Testimonial[] };
      if (Array.isArray(data.testimonials)) {
        return data.testimonials;
      }
    }
  } catch {
    // Fallback below
  }

  return onlyApproved ? FALLBACK_TESTIMONIALS : [];
}

/**
 * Adds a new visitor testimonial to Firestore with `approved: false`.
 */
export async function addTestimonial(input: {
  name: string;
  rating: number;
  text: string;
  locale: 'ar' | 'en';
}): Promise<Testimonial> {
  const cleanName = input.name.trim().slice(0, 50);
  const cleanText = input.text.trim().slice(0, 300);
  const cleanRating = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));
  const cleanLocale: 'ar' | 'en' = input.locale === 'en' ? 'en' : 'ar';

  if (!cleanName || !cleanText) {
    throw new Error('Name and review text are required.');
  }

  const record = {
    name: cleanName,
    rating: cleanRating,
    text: cleanText,
    createdAt: new Date().toISOString(),
    approved: false,
    locale: cleanLocale,
  };

  const db = getFirebaseClientFirestore();
  if (db) {
    try {
      const docRef = await addDoc(collection(db, 'testimonials'), record);
      return { id: docRef.id, ...record };
    } catch {
      // Fallback to server API below
    }
  }

  const res = await fetch('/api/testimonials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });

  if (!res.ok) {
    throw new Error('Failed to submit testimonial');
  }

  const data = (await res.json()) as { testimonial: Testimonial };
  return data.testimonial;
}

/**
 * Approves a pending testimonial (`approved: true`) — Admin only.
 */
export async function approveTestimonial(id: string): Promise<void> {
  const db = getFirebaseClientFirestore();
  if (db) {
    try {
      await updateDoc(doc(db, 'testimonials', id), { approved: true });
      return;
    } catch {
      // Fallback to admin API route below
    }
  }

  const res = await fetch('/api/admin/testimonials', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    throw new Error('Failed to approve testimonial');
  }
}

/**
 * Deletes a testimonial document from Firestore — Admin only.
 */
export async function deleteTestimonial(id: string): Promise<void> {
  const db = getFirebaseClientFirestore();
  if (db) {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
      return;
    } catch {
      // Fallback to admin API route below
    }
  }

  const res = await fetch(
    `/api/admin/testimonials?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );

  if (!res.ok) {
    throw new Error('Failed to delete testimonial');
  }
}
