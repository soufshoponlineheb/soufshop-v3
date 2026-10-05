import 'server-only';
import { getAdminDb, getCloudFallbackDb } from '@/server/config/firebase-admin';

export interface ReviewItem {
  id: string;
  productSlug: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
}

export interface ReviewsSummary {
  reviews: ReviewItem[];
  averageRating: number;
  totalCount: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

const COLLECTION = 'reviews';

export async function getReviewsByProductSlug(slug: string): Promise<ReviewsSummary> {
  const emptyResult: ReviewsSummary = {
    reviews: [],
    averageRating: 0,
    totalCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  if (!slug) return emptyResult;

  const db = getAdminDb();
  if (!db) return emptyResult;

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      const snap = await client
        .collection(COLLECTION)
        .where('productSlug', '==', slug)
        .get();

      const items: ReviewItem[] = [];
      const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sumRating = 0;

      for (const doc of snap.docs) {
        const data = doc.data() as Partial<ReviewItem>;
        if (data.approved === false) continue;

        const ratingVal = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5)));
        const item: ReviewItem = {
          id: doc.id,
          productSlug: String(data.productSlug || slug),
          userName: String(data.userName || '').trim() || 'زائر',
          rating: ratingVal,
          comment: String(data.comment || '').trim(),
          createdAt: String(data.createdAt || new Date().toISOString()),
          approved: true,
        };

        items.push(item);
        sumRating += item.rating;
        dist[item.rating as 1 | 2 | 3 | 4 | 5] = (dist[item.rating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
      }

      // Sort newest first
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const totalCount = items.length;
      const averageRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : 0;

      return {
        reviews: items,
        averageRating,
        totalCount,
        distribution: dist,
      };
    } catch {
      // try fallback client
    }
  }

  return emptyResult;
}

export async function createReview(input: {
  productSlug: string;
  userName: string;
  rating: number;
  comment?: string;
}): Promise<string> {
  const db = getAdminDb();
  if (!db) throw new Error('Database unavailable');

  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5)));
  const userName = (input.userName || '').trim().slice(0, 80);
  const comment = (input.comment || '').trim().slice(0, 300);
  const productSlug = (input.productSlug || '').trim();

  if (!userName) {
    throw new Error('User name is required');
  }
  if (!productSlug) {
    throw new Error('Product slug is required');
  }

  const reviewDoc = {
    productSlug,
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString(),
    approved: true, // Default: true as requested
  };

  const docRef = await db.collection(COLLECTION).add(reviewDoc);
  return docRef.id;
}
