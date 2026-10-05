import type { Product } from '@/types';

/**
 * Normalizes Arabic and Latin text for resilient single-letter, prefix,
 * and multi-word search matching:
 * - Removes Arabic tashkeel (diacritics) and tatweel
 * - Normalizes Alef variants (أ إ آ ٱ -> ا), Teh Marbuta (ة -> ه), Alef Maqsura (ى -> ي), Hamza (ؤ -> و, ئ -> ي)
 * - Lowercases Latin characters
 */
export function normalizeSearchText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Strip Arabic diacritics & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips the Arabic definite article "ال" from the start of a normalized word
 * so searching "ساعه" matches "الساعه" and vice-versa.
 */
function stripArabicDefiniteArticle(word: string): string {
  return word.startsWith('ال') && word.length > 2 ? word.slice(2) : word;
}

/**
 * Safely extracts text from a LocalizedText object, plain string, or undefined value.
 */
function extractLocalized(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const rec = val as { ar?: unknown; en?: unknown };
    const ar = typeof rec.ar === 'string' ? rec.ar : '';
    const en = typeof rec.en === 'string' ? rec.en : '';
    return `${ar} ${en}`;
  }
  return '';
}

/**
 * Builds weighted searchable fields for a product across all its Arabic & English attributes.
 */
function getProductSearchIndex(product: Product) {
  const titleNorm = normalizeSearchText(extractLocalized(product?.title));
  const titleWords = titleNorm
    .split(' ')
    .filter(Boolean)
    .flatMap((w) => [w, stripArabicDefiniteArticle(w)]);

  const taxNorm = normalizeSearchText(
    [
      extractLocalized(product?.categoryName),
      product?.categorySlug || '',
      extractLocalized(product?.sourceName),
      product?.sourceSlug || '',
      ...(Array.isArray(product?.tags) ? product.tags : []),
    ].join(' ')
  );

  const detailsNorm = normalizeSearchText(
    [
      extractLocalized(product?.shortSummary),
      extractLocalized(product?.whyWePickedIt),
      extractLocalized(product?.whatToConsider),
      extractLocalized(product?.description),
      product?.slug || '',
    ].join(' ')
  );

  const allText = `${titleNorm} ${taxNorm} ${detailsNorm}`;
  const allWords = allText
    .split(' ')
    .filter(Boolean)
    .flatMap((w) => [w, stripArabicDefiniteArticle(w)]);

  return {
    titleNorm,
    titleWords,
    taxNorm,
    detailsNorm,
    allText,
    allWords,
  };
}

/**
 * Scores a single product against a user search query.
 * Supports:
 * - Single-letter instant matching (e.g., "ك", "س", "a")
 * - Any word or partial word anywhere in title, category, store, tags, summary, or specs
 * - Multi-word queries in any order
 * Returns 0 if the product does not match.
 */
export function scoreProductMatch(product: Product, rawQuery: string): number {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return 1;

  const queryTokens = normalizedQuery
    .split(' ')
    .filter(Boolean)
    .map((token) => ({
      raw: token,
      stripped: stripArabicDefiniteArticle(token),
    }));

  if (queryTokens.length === 0) return 1;

  const idx = getProductSearchIndex(product);
  let totalScore = 0;
  let matchedTokensCount = 0;

  // Bonus if the entire phrase appears contiguously in the title
  if (idx.titleNorm.startsWith(normalizedQuery)) {
    totalScore += 140;
  } else if (idx.titleNorm.includes(normalizedQuery)) {
    totalScore += 95;
  } else if (idx.allText.includes(normalizedQuery)) {
    totalScore += 45;
  }

  for (const { raw, stripped } of queryTokens) {
    let tokenScore = 0;
    const candidates = raw === stripped ? [raw] : [raw, stripped];

    for (const term of candidates) {
      if (!term) continue;

      // 1. Exact word or word-start match in title (strongest signal, works great for 1st letter)
      if (idx.titleWords.some((w) => w === term)) {
        tokenScore = Math.max(tokenScore, 100);
      } else if (idx.titleWords.some((w) => w.startsWith(term))) {
        tokenScore = Math.max(tokenScore, 85);
      } else if (idx.titleNorm.includes(term)) {
        // 2. Substring anywhere inside title
        tokenScore = Math.max(tokenScore, 65);
      } else if (idx.allWords.some((w) => w.startsWith(term))) {
        // 3. Word-start in category, store, tags, or description
        tokenScore = Math.max(tokenScore, 45);
      } else if (idx.taxNorm.includes(term)) {
        // 4. Substring in category, store, or tags
        tokenScore = Math.max(tokenScore, 35);
      } else if (idx.detailsNorm.includes(term)) {
        // 5. Substring anywhere in summary, verdict, pros, cons, or specs
        tokenScore = Math.max(tokenScore, 22);
      }
    }

    if (tokenScore > 0) {
      matchedTokensCount += 1;
      totalScore += tokenScore;
    }
  }

  if (matchedTokensCount === 0) {
    return 0;
  }

  // Reward matching all words in a multi-word query
  if (matchedTokensCount === queryTokens.length && queryTokens.length > 1) {
    totalScore += 50;
  }

  return totalScore;
}

/**
 * Filters and ranks products by relevance for real-time search.
 */
export function searchAndRankProducts(products: Product[], rawQuery: string): Product[] {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return products;

  const scored: Array<{ product: Product; score: number }> = [];
  for (const product of products) {
    const score = scoreProductMatch(product, rawQuery);
    if (score > 0) {
      scored.push({ product, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.product.isFeatured !== b.product.isFeatured) {
      return a.product.isFeatured ? -1 : 1;
    }
    return b.product.createdAt.localeCompare(a.product.createdAt);
  });

  return scored.map((entry) => entry.product);
}
