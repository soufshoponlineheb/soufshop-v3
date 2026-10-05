import 'server-only';
import { getAdminDb, getCloudFallbackDb } from '@/server/config/firebase-admin';
import type { Product } from '@/types';
import { validateProductInput } from '@/server/validators';
import { getSourceById } from './sources.repo';
import { getCategoryBySlug, listAllCategoriesAdmin } from './categories.repo';

const COLLECTION = 'products';

function normalizeProductDoc(id: string, raw: Record<string, any>): Product {
  const discountVal = raw.discountPercent ?? raw.discount ?? null;
  const nameObj = raw.name || raw.title || { ar: '', en: '' };
  const titleObj = raw.title || raw.name || { ar: '', en: '' };
  const shortSummaryObj = raw.shortSummary || raw.description || { ar: '', en: '' };
  const descriptionObj = raw.detailedDescription || raw.description || raw.shortSummary || { ar: '', en: '' };

  const parsedName =
    typeof nameObj === 'object' && nameObj !== null
      ? { ar: String(nameObj.ar || nameObj.en || ''), en: String(nameObj.en || nameObj.ar || '') }
      : { ar: String(nameObj || ''), en: String(nameObj || '') };

  const parsedTitle =
    typeof titleObj === 'object' && titleObj !== null
      ? { ar: String(titleObj.ar || titleObj.en || ''), en: String(titleObj.en || titleObj.ar || '') }
      : { ar: String(titleObj || ''), en: String(titleObj || '') };

  const parsedSummary =
    typeof shortSummaryObj === 'object' && shortSummaryObj !== null
      ? { ar: String(shortSummaryObj.ar || shortSummaryObj.en || ''), en: String(shortSummaryObj.en || shortSummaryObj.ar || '') }
      : { ar: String(shortSummaryObj || ''), en: String(shortSummaryObj || '') };

  const parsedDesc =
    typeof descriptionObj === 'object' && descriptionObj !== null
      ? { ar: String(descriptionObj.ar || descriptionObj.en || ''), en: String(descriptionObj.en || descriptionObj.ar || '') }
      : { ar: String(descriptionObj || ''), en: String(descriptionObj || '') };

  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const normalizedImages = rawImages.map((img: any) => {
    if (typeof img === 'string') {
      return { url: img, alt: parsedTitle, width: 800, height: 800 };
    }
    return {
      url: img.url || '',
      publicId: img.publicId,
      alt: img.alt || parsedTitle,
      width: img.width || 800,
      height: img.height || 800,
    };
  });

  return {
    id,
    ...raw,
    name: parsedName,
    title: parsedTitle,
    shortSummary: parsedSummary,
    description: parsedDesc,
    images: normalizedImages,
    priceAmount: typeof raw.priceAmount === 'number' ? raw.priceAmount : (raw.priceAmount ? Number(raw.priceAmount) : null),
    priceCurrency: raw.priceCurrency || 'USD',
    slug: raw.slug || id,
    discount: discountVal,
    discountPercent: discountVal ?? undefined,
  } as Product;
}

export async function listPublishedProducts(): Promise<Product[]> {
  const db = getAdminDb();
  if (!db) return [];

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      const snap = await client.collection(COLLECTION).where('status', '==', 'published').get();
      const items = snap.docs.map((doc) =>
        normalizeProductDoc(doc.id, doc.data() as Omit<Product, 'id'>)
      );
      return items.sort((a, b) =>
        String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      );
    } catch {
      // Try cloud REST fallback if primary client failed
    }
  }
  return [];
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const db = getAdminDb();
  if (!db) return null;

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      // 1. Check direct doc lookup
      const directDoc = await client.collection(COLLECTION).doc(slug).get();
      if (directDoc.exists) {
        const data = directDoc.data() as Omit<Product, 'id'>;
        if (data.status === 'published') {
          return normalizeProductDoc(directDoc.id, data);
        }
      }

      // 2. Query where slug == slug
      const snap = await client
        .collection(COLLECTION)
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (snap.empty) continue;
      const doc = snap.docs[0];
      const data = doc.data() as Omit<Product, 'id'>;
      if (data.status !== 'published') return null;
      return normalizeProductDoc(doc.id, data);
    } catch {
      // Try cloud REST fallback
    }
  }
  return null;
}

export const getProductBySlug = getPublishedProductBySlug;

export async function listSimilarProductsByCategory(
  categorySlug: string,
  currentSlug: string,
  currentId?: string,
  maxResults = 4
): Promise<Product[]> {
  const db = getAdminDb();
  if (!db || !categorySlug) return [];

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      const snap = await client
        .collection(COLLECTION)
        .where('categorySlug', '==', categorySlug)
        .limit(8)
        .get();

      if (!snap.empty) {
        const items = snap.docs
          .map((doc) =>
            normalizeProductDoc(doc.id, doc.data() as Omit<Product, 'id'>)
          )
          .filter(
            (item) =>
              item.status === 'published' &&
              item.slug !== currentSlug &&
              (!currentId || item.id !== currentId)
          )
          .slice(0, maxResults);

        if (items.length > 0) {
          return items;
        }
      }
    } catch {
      // Try cloud REST fallback
    }
  }

  const allPublished = await listPublishedProducts();
  return allPublished
    .filter(
      (item) =>
        item.categorySlug === categorySlug &&
        item.slug !== currentSlug &&
        (!currentId || item.id !== currentId)
    )
    .slice(0, maxResults);
}

/**
 * Looks up a product by slug regardless of status so `/go/[slug]` can distinguish
 * between a non-existent product (404) and a temporarily archived/draft product.
 */
export async function getProductBySlugAnyStatus(slug: string): Promise<Product | null> {
  const db = getAdminDb();
  if (!db) return null;

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      const snap = await client.collection(COLLECTION).where('slug', '==', slug).limit(1).get();
      if (snap.empty) continue;
      const doc = snap.docs[0];
      return normalizeProductDoc(doc.id, doc.data() as Omit<Product, 'id'>);
    } catch {
      // Try cloud REST fallback
    }
  }
  return null;
}

export async function listAllProductsAdmin(): Promise<Product[]> {
  const db = getAdminDb();
  if (!db) return [];

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      const snap = await client.collection(COLLECTION).get();
      const items = snap.docs.map((doc) =>
        normalizeProductDoc(doc.id, doc.data() as Omit<Product, 'id'>)
      );
      return items.sort((a, b) =>
        String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
      );
    } catch {
      // Try cloud REST fallback
    }
  }
  return [];
}

export async function getProductByIdAdmin(productId: string): Promise<Product | null> {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection(COLLECTION).doc(productId).get();
  if (!doc.exists) return null;
  return normalizeProductDoc(doc.id, doc.data() as Omit<Product, 'id'>);
}

export async function createOrUpdateProductAdmin(
  input: unknown,
  existingId?: string
): Promise<Product> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }

  const validated = validateProductInput(input);
  const source = await getSourceById(validated.sourceId);
  if (!source) {
    throw new Error('Selected partner source does not exist.');
  }

  const allCategories = await listAllCategoriesAdmin();
  const category =
    allCategories.find((c) => c.id === validated.categoryId || c.slug === validated.categoryId) ||
    (await getCategoryBySlug(validated.categoryId));

  const categoryName = category ? category.name : { en: 'General', ar: 'عام' };
  const categorySlug = category ? category.slug : validated.categoryId;

  const now = new Date().toISOString();
  const docId = existingId || validated.slug;
  const docRef = db.collection(COLLECTION).doc(docId);
  const existingDoc = await docRef.get();
  const existingData = existingDoc.exists ? (existingDoc.data() as Partial<Product>) : null;

  const record: Omit<Product, 'id'> = {
    ...validated,
    sourceId: source.id,
    sourceSlug: source.slug,
    sourceName: source.name,
    sourceDisclosure: source.disclosureText,
    categoryId: category ? category.id : validated.categoryId,
    categorySlug,
    categoryName,
    priceUpdatedAt: now,
    clicksCount: existingData?.clicksCount ?? 0,
    createdAt: existingData?.createdAt || now,
    updatedAt: now,
  };

  await docRef.set(record, { merge: true });
  return { id: docId, ...record };
}

export async function refreshProductPriceTimestampAdmin(productId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }
  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(productId).update({
    priceUpdatedAt: now,
    updatedAt: now,
  });
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database connection is not configured yet.');
  }
  await db.collection(COLLECTION).doc(productId).delete();
}
