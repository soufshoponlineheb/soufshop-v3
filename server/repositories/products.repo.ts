import 'server-only';
import { getAdminDb, getCloudFallbackDb } from '@/server/config/firebase-admin';
import type { Product } from '@/types';
import { validateProductInput } from '@/server/validators';
import { getSourceById } from './sources.repo';
import { getCategoryBySlug, listAllCategoriesAdmin, upsertCategoryAdmin } from './categories.repo';

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
  const normalizedImages = rawImages
    .map((img: any) => {
      if (typeof img === 'string') {
        return { url: img.trim(), alt: parsedTitle, width: 800, height: 800 };
      }
      return {
        url: String(img?.url || img?.src || img?.secure_url || '').trim(),
        publicId: img?.publicId,
        alt: img?.alt || parsedTitle,
        width: img?.width || 800,
        height: img?.height || 800,
      };
    })
    .filter((img) => Boolean(img.url));

  if (normalizedImages.length === 0) {
    const singleUrl = String(raw.imageUrl || raw.image || raw.thumbnail || '').trim();
    if (singleUrl) {
      normalizedImages.push({
        url: singleUrl,
        alt: parsedTitle,
        width: 800,
        height: 800,
      });
    }
  }

  const normalizedVideoUrls: string[] = [];
  if (Array.isArray(raw.videoUrls)) {
    for (const vu of raw.videoUrls) {
      if (typeof vu === 'string' && vu.trim() && !normalizedVideoUrls.includes(vu.trim())) {
        normalizedVideoUrls.push(vu.trim());
      }
    }
  }
  if (Array.isArray(raw.videos)) {
    for (const v of raw.videos) {
      const u = typeof v === 'string' ? v.trim() : String(v?.url || '').trim();
      if (u && !normalizedVideoUrls.includes(u)) {
        normalizedVideoUrls.push(u);
      }
    }
  }
  if (typeof raw.videoUrl === 'string' && raw.videoUrl.trim()) {
    if (!normalizedVideoUrls.includes(raw.videoUrl.trim())) {
      normalizedVideoUrls.unshift(raw.videoUrl.trim());
    }
  }

  return {
    id,
    ...raw,
    name: parsedName,
    title: parsedTitle,
    shortSummary: parsedSummary,
    description: parsedDesc,
    images: normalizedImages,
    videoUrl: normalizedVideoUrls[0] || undefined,
    videoUrls: normalizedVideoUrls.length > 0 ? normalizedVideoUrls : undefined,
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
  if (!db || !slug) return null;

  let cleanSlug = slug.trim();
  try {
    cleanSlug = decodeURIComponent(cleanSlug).trim();
  } catch {
    // keep trimmed slug
  }

  for (const client of [db, getCloudFallbackDb()]) {
    try {
      // 1. Check direct doc lookup
      for (const candidate of Array.from(new Set([cleanSlug, slug.trim()]))) {
        if (!candidate) continue;
        const directDoc = await client.collection(COLLECTION).doc(candidate).get();
        if (directDoc.exists) {
          const data = directDoc.data() as Omit<Product, 'id'>;
          if (data.status === 'published') {
            return normalizeProductDoc(directDoc.id, data);
          }
        }

        // 2. Query where slug == candidate
        const snap = await client
          .collection(COLLECTION)
          .where('slug', '==', candidate)
          .limit(1)
          .get();

        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as Omit<Product, 'id'>;
          if (data.status === 'published') {
            return normalizeProductDoc(doc.id, data);
          }
        }
      }
    } catch {
      // Try cloud REST fallback
    }
  }

  // 3. Resilient fallback: case-insensitive / decoded match against published catalog
  const allPublished = await listPublishedProducts();
  const targetLower = cleanSlug.toLowerCase();
  const matched = allPublished.find((item) => {
    const itemSlug = (item.slug || '').trim();
    let decodedItemSlug = itemSlug;
    try {
      decodedItemSlug = decodeURIComponent(itemSlug).trim();
    } catch {
      // ignore
    }
    return (
      item.id === cleanSlug ||
      itemSlug.toLowerCase() === targetLower ||
      decodedItemSlug.toLowerCase() === targetLower
    );
  });

  return matched || null;
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
  let category =
    allCategories.find((c) => c.id === validated.categoryId || c.slug === validated.categoryId) ||
    (await getCategoryBySlug(validated.categoryId));

  if (!category && validated.categoryId) {
    const fallbackEn = validated.newCategoryName?.en || validated.categoryId.replace(/-/g, ' ');
    const fallbackAr = validated.newCategoryName?.ar || fallbackEn;
    try {
      category = await upsertCategoryAdmin({
        slug: validated.categoryId,
        name: { ar: fallbackAr, en: fallbackEn },
        description: {
          ar: `منتجات مختارة بعناية في قسم ${fallbackAr}`,
          en: `Carefully curated picks in ${fallbackEn}`,
        },
        icon: validated.newCategoryIcon || '📦',
        order: allCategories.length + 1,
        isActive: true,
      });
    } catch {
      // Fallback if category creation fails
    }
  }

  const categoryName = category
    ? category.name
    : validated.newCategoryName || { en: 'General', ar: 'عام' };
  const categorySlug = category ? category.slug : validated.categoryId;

  const { newCategoryName: _ncName, newCategoryIcon: _ncIcon, ...cleanValidated } = validated;

  const now = new Date().toISOString();
  const docId = existingId || validated.slug;
  const docRef = db.collection(COLLECTION).doc(docId);
  const existingDoc = await docRef.get();
  const existingData = existingDoc.exists ? (existingDoc.data() as Partial<Product>) : null;

  const record: Omit<Product, 'id'> = {
    ...cleanValidated,
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
